begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Existing typed UI payloads (including nested salary, bank details, comments and
-- break sessions) stay lossless in JSONB. Indexed generated columns below enforce
-- real relational keys; JSONB does not replace tenant or employee relationships.
do $$
declare t text;
begin
  foreach t in array array['departments','employees','attendance','leave_records','leave_balances',
    'tasks','performance_reviews','payroll','documents','holidays','announcements','notifications',
    'company_settings','audit_logs'] loop
    execute format('create table public.%I (
      company_id uuid not null references public.companies(id),
      id text not null check (length(id) between 1 and 200),
      data jsonb not null check (jsonb_typeof(data) = ''object''),
      revision bigint not null default 1,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      primary key(company_id, id)
    )', t);
    if t not in ('leave_balances','company_settings') then
      execute format('alter table public.%I add constraint payload_id check (data->>''id'' is not null and data->>''id'' = id)',t);
    end if;
  end loop;
end $$;

alter table public.departments add column manager_id text generated always as (nullif(data->>'managerId','')) stored;
alter table public.departments add column code text generated always as (data->>'code') stored not null;
alter table public.departments add unique(company_id,code);
alter table public.employees add column department_id text generated always as (nullif(data->>'departmentId','')) stored;
alter table public.employees add column manager_id text generated always as (nullif(data->>'managerId','')) stored;
alter table public.employees add column employee_code text generated always as (data->>'employeeCode') stored not null;
alter table public.employees add column work_email text generated always as (lower(data->>'workEmail')) stored not null;
alter table public.employees add unique(company_id,employee_code);
alter table public.employees add unique(company_id,work_email);
alter table public.employees add foreign key(company_id,department_id) references public.departments(company_id,id) deferrable initially deferred;
alter table public.employees add foreign key(company_id,manager_id) references public.employees(company_id,id) deferrable initially deferred;
alter table public.departments add foreign key(company_id,manager_id) references public.employees(company_id,id) deferrable initially deferred;

do $$
declare t text;
begin
  foreach t in array array['attendance','leave_records','performance_reviews','payroll','documents'] loop
    execute format('alter table public.%I add column employee_id text generated always as (nullif(data->>''employeeId'','''')) stored',t);
    execute format('alter table public.%I add foreign key(company_id,employee_id) references public.employees(company_id,id) deferrable initially deferred',t);
    execute format('create index on public.%I(company_id,employee_id)',t);
    if t <> 'documents' then execute format('alter table public.%I alter column employee_id set not null',t); end if;
  end loop;
end $$;
alter table public.leave_balances add foreign key(company_id,id) references public.employees(company_id,id) deferrable initially deferred;
-- Dates remain ISO text to avoid timezone-dependent generated date casts.
alter table public.attendance add column attendance_date text generated always as (data->>'date') stored not null;
alter table public.attendance add unique(company_id,employee_id,attendance_date);
alter table public.payroll add column month_year text generated always as (data->>'monthYear') stored not null;
alter table public.payroll add unique(company_id,employee_id,month_year);
alter table public.tasks add column employee_id text generated always as (data->>'assignedToId') stored not null;
alter table public.tasks add column department_id text generated always as (nullif(data->>'departmentId','')) stored;
alter table public.tasks add foreign key(company_id,employee_id) references public.employees(company_id,id) deferrable initially deferred;
alter table public.tasks add foreign key(company_id,department_id) references public.departments(company_id,id) deferrable initially deferred;
alter table public.performance_reviews add column reviewer_id text generated always as (nullif(data->>'reviewerId','')) stored;
alter table public.performance_reviews add foreign key(company_id,reviewer_id) references public.employees(company_id,id) deferrable initially deferred;
alter table public.announcements add column target_department_id text generated always as (nullif(data->>'targetDepartmentId','')) stored;
alter table public.announcements add column target_employee_id text generated always as (nullif(data->>'targetEmployeeId','')) stored;
alter table public.announcements add foreign key(company_id,target_department_id) references public.departments(company_id,id) deferrable initially deferred;
alter table public.announcements add foreign key(company_id,target_employee_id) references public.employees(company_id,id) deferrable initially deferred;
alter table public.company_settings add check (id=company_id::text);
alter table public.documents add check (data->>'fileUrl' is not null and data->>'fileUrl' like company_id::text || '/' || coalesce(employee_id,'company') || '/%');
alter table public.leave_records add check (data->>'status' in ('Pending','Approved','Rejected','Cancelled'));
alter table public.leave_records add check ((data->>'totalDays')::numeric > 0 and (data->>'endDate')::date >= (data->>'startDate')::date);
alter table public.tasks add check (data->>'status' in ('To Do','In Progress','In Review','Completed'));
alter table public.payroll add check (data->>'status' in ('Draft','Under Review','Approved','Paid'));

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id),
  employee_id text not null,
  department_id text,
  email text not null,
  full_name text not null,
  avatar_url text not null default '',
  role text not null check (role in ('super_admin','hr','manager','employee')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id,employee_id),
  foreign key(company_id,employee_id) references public.employees(company_id,id) on delete cascade deferrable initially deferred,
  foreign key(company_id,department_id) references public.departments(company_id,id) deferrable initially deferred
);

-- No role/company is ever taken from editable auth user_metadata or the browser.
create function private.actor_profile() returns public.user_profiles
language sql stable security definer set search_path = '' as $$
  select p from public.user_profiles p join public.employees e
    on e.company_id=p.company_id and e.id=p.employee_id
  where p.id=auth.uid() and p.is_active and e.data->>'status' not in ('Deactivated','Inactive','Terminated','Resigned')
$$;
create function private.actor_company() returns uuid language sql stable security definer set search_path='' as $$ select (private.actor_profile()).company_id $$;
create function private.actor_employee() returns text language sql stable security definer set search_path='' as $$ select (private.actor_profile()).employee_id $$;
create function private.actor_role() returns text language sql stable security definer set search_path='' as $$ select (private.actor_profile()).role $$;
create function private.is_hr() returns boolean language sql stable security definer set search_path='' as $$ select coalesce(private.actor_role() in ('super_admin','hr'),false) $$;
create function private.manages(emp text) returns boolean language sql stable security definer set search_path='' as $$
  select private.is_hr() or (private.actor_role()='manager' and exists (
    select 1 from public.employees e where e.company_id=private.actor_company() and e.id=emp
      and e.department_id=(private.actor_profile()).department_id))
$$;

create function private.can_read(t text, d jsonb, row_id text) returns boolean
language sql stable security definer set search_path='' as $$
  select coalesce(case
    when private.is_hr() then true
    when t='company_settings' or t='holidays' then true
    when t='departments' then row_id=(private.actor_profile()).department_id
    when t='employees' then row_id=private.actor_employee() or private.manages(row_id)
    when t='leave_balances' then row_id=private.actor_employee() or private.manages(row_id)
    when t in ('attendance','leave_records','payroll','performance_reviews') then d->>'employeeId'=private.actor_employee() or private.manages(d->>'employeeId')
    when t='tasks' then d->>'assignedToId'=private.actor_employee() or private.manages(d->>'assignedToId')
    when t='documents' then d->>'employeeId'=private.actor_employee() or d->>'isCompanyWide'='true'
    when t='announcements' then d->>'audience'='Everyone'
      or (d->>'audience'='Managers Only' and private.actor_role()='manager')
      or (d->>'audience'='Specific Department' and d->>'targetDepartmentId'=(private.actor_profile()).department_id)
      or (d->>'audience'='Individual Employees' and d->>'targetEmployeeId'=private.actor_employee())
    when t='notifications' then d->>'userId'=private.actor_employee()
    else false end, false)
$$;

create function private.can_write(t text, d jsonb, row_id text) returns boolean
language sql stable security definer set search_path='' as $$
  select coalesce(case
    when t='audit_logs' then false
    when private.is_hr() then true
    when t='employees' then private.manages(row_id) and row_id<>private.actor_employee()
    when t in ('attendance','leave_records') then d->>'employeeId'=private.actor_employee() or private.manages(d->>'employeeId')
    when t='leave_balances' then false
    when t in ('payroll','performance_reviews') then private.manages(d->>'employeeId') and d->>'employeeId'<>private.actor_employee()
    when t='tasks' then d->>'assignedToId'=private.actor_employee() or private.manages(d->>'assignedToId')
    when t='documents' then d->>'employeeId'=private.actor_employee() and coalesce(d->>'isCompanyWide','false')='false'
    when t='notifications' then d->>'userId'=private.actor_employee()
    else false end, false)
$$;

-- RLS applies to direct REST requests AND the atomic RPC (security invoker).
do $$
declare t text;
begin
  foreach t in array array['departments','employees','attendance','leave_records','leave_balances','tasks',
    'performance_reviews','payroll','documents','holidays','announcements','notifications','company_settings','audit_logs'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public,anon,authenticated',t);
    execute format('create policy tenant_read on public.%I for select to authenticated using (company_id=private.actor_company() and private.can_read(%L,data,id))',t,t);
    if t <> 'audit_logs' then
      execute format('create policy tenant_insert on public.%I for insert to authenticated with check (company_id=private.actor_company() and private.can_write(%L,data,id))',t,t);
      execute format('create policy tenant_update on public.%I for update to authenticated using (company_id=private.actor_company() and private.can_write(%L,data,id)) with check (company_id=private.actor_company() and private.can_write(%L,data,id))',t,t,t);
      execute format('create policy tenant_delete on public.%I for delete to authenticated using (company_id=private.actor_company() and private.is_hr())',t);
      execute format('grant select,insert,update,delete on public.%I to authenticated',t);
    else execute format('grant select on public.%I to authenticated',t);
    end if;
    execute format('revoke all on public.%I from anon',t);
  end loop;
end $$;
alter table public.companies enable row level security;
revoke all on public.companies from public,anon,authenticated;
create policy company_read on public.companies for select to authenticated using(id=private.actor_company());
grant select on public.companies to authenticated;
alter table public.user_profiles enable row level security;
revoke all on public.user_profiles from public,anon,authenticated;
create policy profile_read on public.user_profiles for select to authenticated using(id=auth.uid());
grant select on public.user_profiles to authenticated;
revoke insert,update,delete on public.user_profiles from authenticated,anon;
revoke all on public.companies from anon;

-- Enforce field-level permissions as well as row ownership. RLS alone cannot stop
-- an employee from changing the approval status of their own leave record.
create function private.guard_record() returns trigger language plpgsql security definer set search_path='' as $$
declare actor public.user_profiles; old_data jsonb; new_data jsonb; old_comments jsonb; new_comments jsonb; c jsonb;
begin
  if tg_op='UPDATE' then
    if new.company_id<>old.company_id or new.id<>old.id then raise exception 'Record identity is immutable'; end if;
    new.revision=old.revision+1; new.created_at=old.created_at;
  else new.revision=1;
  end if;
  new.updated_at=now();
  if auth.uid() is null then return new; end if; -- Trusted SQL Editor migrations/provisioning.
  actor=private.actor_profile();
  if actor.id is null then raise exception 'Inactive or unprovisioned account'; end if;
  if private.is_hr() then return new; end if;
  new_data=new.data; if tg_op='UPDATE' then old_data=old.data; end if;
  if tg_table_name='employees' and new_data->>'departmentId' is distinct from actor.department_id then
    raise exception 'Managers may only edit employees in their department';
  elsif tg_table_name='notifications' and pg_trigger_depth()=1 then
    if tg_op<>'UPDATE' or new_data-'isRead' is distinct from old_data-'isRead' then raise exception 'Only notification read status may be changed'; end if;
  elsif tg_table_name='attendance' and new_data->>'employeeId'=actor.employee_id then
    if new_data->>'date'<>to_char(now() at time zone 'Asia/Kolkata','YYYY-MM-DD') then raise exception 'You may only punch attendance for today'; end if;
    if tg_op='INSERT' and (new_data->>'isManualCorrection'='true' or new_data ? 'correctedBy') then raise exception 'Manual corrections require an approver'; end if;
    if tg_op='UPDATE' and new_data-array['checkIn','checkOut','workingHours','breakMinutes','breakSessions','overtimeHours','status'] is distinct from old_data-array['checkIn','checkOut','workingHours','breakMinutes','breakSessions','overtimeHours','status'] then raise exception 'Attendance correction requires an approver'; end if;
  elsif tg_table_name='leave_records' then
    if tg_op='INSERT' then
      if new_data->>'employeeId'<>actor.employee_id or new_data->>'status'<>'Pending' or new_data ? 'reviewedBy' or new_data ? 'reviewerComment' then raise exception 'Leave applications must be your own and pending'; end if;
    elsif new_data->>'employeeId'=actor.employee_id then
      if old_data->>'status'<>'Pending' or new_data->>'status'<>'Cancelled' or new_data-'status' is distinct from old_data-'status' then raise exception 'Only pending own leave may be cancelled'; end if;
    else
      if old_data->>'status'<>'Pending' or new_data->>'status' not in ('Approved','Rejected') or new_data-array['status','reviewedBy','reviewerComment'] is distinct from old_data-array['status','reviewedBy','reviewerComment'] then raise exception 'Invalid leave review'; end if;
    end if;
  elsif tg_table_name='tasks' then
    if tg_op='INSERT' then
      if actor.role<>'manager' or new_data->>'createdById'<>actor.employee_id then raise exception 'Only managers and HR may assign tasks'; end if;
    elsif not (actor.role='manager' and private.manages(new_data->>'assignedToId') and new_data->>'assignedToId'<>actor.employee_id) then
      if new_data-array['status','comments','updatedAt'] is distinct from old_data-array['status','comments','updatedAt'] then raise exception 'Only task status and comments may be changed'; end if;
      old_comments=coalesce(old_data->'comments','[]'::jsonb); new_comments=coalesce(new_data->'comments','[]'::jsonb);
      if new_comments is distinct from old_comments then
        if jsonb_array_length(new_comments)<>jsonb_array_length(old_comments)+1 or (new_comments-(jsonb_array_length(new_comments)-1))<>old_comments then raise exception 'Existing comments are immutable'; end if;
        c=new_comments->(jsonb_array_length(new_comments)-1);
        if c->>'authorId'<>actor.employee_id or c->>'taskId'<>new.id or c->>'authorName'<>actor.full_name then raise exception 'Comment author must be the signed-in user'; end if;
      end if;
    end if;
  elsif tg_table_name='documents' then
    if new_data->>'uploadedById'<>actor.employee_id then raise exception 'Document uploader must be the signed-in user'; end if;
  end if;
  return new;
end $$;

-- Side effects are generated on the server, never supplied by an employee's browser.
create function private.module_side_effects() returns trigger language plpgsql security definer set search_path='' as $$
declare balance jsonb; cat text; delta numeric; recipient record; nid text; msg text; title text; target text;
begin
  if tg_table_name='employees' then
    if tg_op='INSERT' then
      balance='{"casual":{"allocated":12,"used":0},"sick":{"allocated":10,"used":0},"paid":{"allocated":18,"used":0},"wfh":{"allocated":24,"used":0}}';
      insert into public.leave_balances(company_id,id,data) values(new.company_id,new.id,balance);
    else
      update public.user_profiles set department_id=new.department_id,full_name=new.data->>'fullName',
        email=new.data->>'workEmail',avatar_url=coalesce(new.data->>'avatarUrl',''),updated_at=now()
        where company_id=new.company_id and employee_id=new.id;
    end if;
  elsif tg_table_name='leave_records' then
    if tg_op='UPDATE' and new.data->>'employeeId' is distinct from old.data->>'employeeId' then raise exception 'Leave owner is immutable'; end if;
    delta=case when new.data->>'status'='Approved' then (new.data->>'totalDays')::numeric else 0 end;
    if tg_op='UPDATE' and old.data->>'status'='Approved' then delta=delta-(old.data->>'totalDays')::numeric; end if;
    cat=case new.data->>'leaveType' when 'Sick Leave' then 'sick' when 'Paid Leave' then 'paid' when 'Work From Home' then 'wfh' else 'casual' end;
    if new.data->>'leaveType'='Unpaid Leave' then delta=0; end if;
    if delta<>0 then
      update public.leave_balances set data=jsonb_set(data,array[cat,'used'],to_jsonb(greatest(0,(data#>>array[cat,'used'])::numeric+delta)))
        where company_id=new.company_id and id=new.data->>'employeeId';
      if not found then raise exception 'Leave balance missing for employee'; end if;
    end if;
    title=case when tg_op='INSERT' then 'New Leave Request' else 'Leave '||(new.data->>'status') end;
    msg=coalesce(new.data->>'reason','Leave status updated');
    target=new.data->>'employeeId';
    for recipient in select p.employee_id from public.user_profiles p where p.company_id=new.company_id and p.is_active
      and ((tg_op='INSERT' and p.role in ('super_admin','hr')) or (tg_op='UPDATE' and p.employee_id=target)) loop
      nid='notif-'||gen_random_uuid()::text;
      insert into public.notifications(company_id,id,data) values(new.company_id,nid,jsonb_build_object(
        'id',nid,'userId',recipient.employee_id,'title',title,'message',msg,'type','leave','isRead',false,'linkUrl','leave','createdAt',now()::text));
    end loop;
  elsif tg_table_name='tasks' and tg_op='INSERT' then
    nid='notif-'||gen_random_uuid()::text;
    insert into public.notifications(company_id,id,data) values(new.company_id,nid,jsonb_build_object(
      'id',nid,'userId',new.data->>'assignedToId','title','New Task Assigned','message',new.data->>'title',
      'type','task','isRead',false,'linkUrl','tasks','createdAt',now()::text));
  elsif tg_table_name='announcements' and tg_op='INSERT' then
    for recipient in select p.employee_id from public.user_profiles p where p.company_id=new.company_id and p.is_active and (
      new.data->>'audience'='Everyone' or (new.data->>'audience'='Managers Only' and p.role in ('manager','hr','super_admin'))
      or (new.data->>'audience'='Specific Department' and p.department_id=new.data->>'targetDepartmentId')
      or (new.data->>'audience'='Individual Employees' and p.employee_id=new.data->>'targetEmployeeId')) loop
      nid='notif-'||gen_random_uuid()::text;
      insert into public.notifications(company_id,id,data) values(new.company_id,nid,jsonb_build_object(
        'id',nid,'userId',recipient.employee_id,'title','New Announcement','message',new.data->>'title',
        'type','announcement','isRead',false,'linkUrl','announcements','createdAt',now()::text));
    end loop;
  end if;
  return null;
end $$;
create trigger module_side_effects after insert or update on public.employees for each row execute function private.module_side_effects();
create trigger module_side_effects after insert or update on public.leave_records for each row execute function private.module_side_effects();
create trigger module_side_effects after insert on public.tasks for each row execute function private.module_side_effects();
create trigger module_side_effects after insert on public.announcements for each row execute function private.module_side_effects();

-- Server-only append-only audit log. Do not copy payroll/bank/identity payloads.
create function private.audit_record() returns trigger language plpgsql security definer set search_path='' as $$
declare actor public.user_profiles; cid uuid; rid text; audit_id text;
begin
  if auth.uid() is null then return null; end if;
  actor=private.actor_profile();
  if tg_op='DELETE' then cid=old.company_id; rid=old.id; else cid=new.company_id; rid=new.id; end if;
  audit_id='aud-'||gen_random_uuid()::text;
  insert into public.audit_logs(company_id,id,data) values(cid,audit_id,jsonb_build_object(
    'id',audit_id,'performedById',actor.employee_id,'performedByName',actor.full_name,
    'performedByRole',actor.role,'action',tg_op||' '||tg_table_name,
    'details',tg_op||' record '||rid||' in '||tg_table_name,'ipAddress','',
    'timestamp',now()::text));
  return null;
end $$;

do $$
declare t text;
begin
  foreach t in array array['departments','employees','attendance','leave_records','leave_balances','tasks',
    'performance_reviews','payroll','documents','holidays','announcements','notifications','company_settings'] loop
    execute format('create trigger guard_record before insert or update on public.%I for each row execute function private.guard_record()',t);
    execute format('create trigger audit_record after insert or update or delete on public.%I for each row execute function private.audit_record()',t);
  end loop;
end $$;

create function public.apply_hrms_changes(target_company uuid, changes jsonb) returns void
language plpgsql security invoker set search_path='' as $$
declare change jsonb; t text; affected integer;
begin
  if target_company is distinct from private.actor_company() then raise exception 'Unauthorized company'; end if;
  if jsonb_typeof(changes)<>'array' or jsonb_array_length(changes)>5000 then raise exception 'Invalid change batch'; end if;
  -- Serialize a company batch so related changes and optimistic revisions are atomic.
  perform pg_advisory_xact_lock(hashtextextended(target_company::text,0));
  for change in select value from jsonb_array_elements(changes) loop
    t=change->>'table';
    if t is null or t not in ('departments','employees','attendance','leave_records','leave_balances','tasks',
      'performance_reviews','payroll','documents','holidays','announcements','notifications','company_settings') then raise exception 'Invalid table'; end if;
    if change->>'operation'='insert' then
      execute format('insert into public.%I(company_id,id,data) values($1,$2,$3)',t)
        using target_company,change->>'id',change->'data';
    elsif change->>'operation'='update' then
      execute format('update public.%I set data=$3 where company_id=$1 and id=$2 and revision=$4',t)
        using target_company,change->>'id',change->'data',(change->>'revision')::bigint;
      get diagnostics affected=row_count;
      if affected<>1 then raise exception 'Record changed or access denied. Refresh the page before retrying.'; end if;
    elsif change->>'operation'='delete' then
      execute format('delete from public.%I where company_id=$1 and id=$2 and revision=$3',t)
        using target_company,change->>'id',(change->>'revision')::bigint;
      get diagnostics affected=row_count;
      if affected<>1 then raise exception 'Record changed or access denied. Refresh the page before retrying.'; end if;
    else raise exception 'Invalid operation'; end if;
  end loop;
end $$;
revoke all on function public.apply_hrms_changes(uuid,jsonb) from public,anon;
grant execute on function public.apply_hrms_changes(uuid,jsonb) to authenticated;
revoke all on all functions in schema private from public,anon;
grant execute on all functions in schema private to authenticated;

-- Private document objects: company/employee/random-id/filename.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('hrms-documents','hrms-documents',false,26214400,
  array['application/pdf','image/png','image/jpeg','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict(id) do nothing;
create policy hrms_file_read on storage.objects for select to authenticated using (
  bucket_id='hrms-documents' and split_part(name,'/',1)=private.actor_company()::text
  and (private.is_hr() or split_part(name,'/',2) in (private.actor_employee(),'company')));
create policy hrms_file_insert on storage.objects for insert to authenticated with check (
  bucket_id='hrms-documents' and split_part(name,'/',1)=private.actor_company()::text
  and (private.is_hr() or split_part(name,'/',2)=private.actor_employee()));
create policy hrms_file_delete on storage.objects for delete to authenticated using (
  bucket_id='hrms-documents' and split_part(name,'/',1)=private.actor_company()::text
  and (private.is_hr() or split_part(name,'/',2)=private.actor_employee()));

commit;
