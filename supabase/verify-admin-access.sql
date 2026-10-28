-- Run the ENTIRE file in Supabase SQL Editor as the project administrator.
-- Read-only: no user, company, profile, policy, or business record is changed.
-- This simulates the named account's database identity, NOT its password login.
begin transaction read only;

-- Result 1: saved Auth account and company/profile/employee association.
select u.email,
  u.email_confirmed_at is not null as email_confirmed,
  coalesce(u.banned_until > now(),false) as currently_banned,
  u.last_sign_in_at,
  p.id as profile_user_id, p.role, p.is_active as profile_active,
  p.company_id, c.name as company_name, p.employee_id,
  e.data->>'status' as employee_status,
  p.department_id, d.data->>'name' as department_name,
  e.department_id is not distinct from p.department_id as department_matches,
  lower(p.email)=lower(u.email) as profile_email_matches,
  exists(select 1 from public.company_settings s where s.company_id=p.company_id and s.id=p.company_id::text) as company_settings_exist,
  exists(select 1 from public.leave_balances b where b.company_id=p.company_id and b.id=p.employee_id) as leave_balance_exists
from auth.users u
left join public.user_profiles p on p.id=u.id
left join public.companies c on c.id=p.company_id
left join public.employees e on e.company_id=p.company_id and e.id=p.employee_id
left join public.departments d on d.company_id=p.company_id and d.id=p.department_id
where lower(u.email)='wingscorporate1504@gmail.com';

-- Stop with a specific error if provisioning is incomplete or ambiguous.
do $$
declare u record; p public.user_profiles; e public.employees;
begin
  if (select count(*) from auth.users where lower(email)='wingscorporate1504@gmail.com')<>1 then
    raise exception 'Expected exactly one Auth account for the administrator email';
  end if;
  select * into u from auth.users where lower(email)='wingscorporate1504@gmail.com';
  if u.email_confirmed_at is null then raise exception 'Administrator email is not confirmed. Confirm it in Authentication > Users'; end if;
  if u.banned_until > now() then raise exception 'Administrator Auth account is currently banned. Review the account in Authentication > Users'; end if;
  select * into p from public.user_profiles where id=u.id;
  if p.id is null then raise exception 'Administrator user_profiles row is missing'; end if;
  if p.role<>'super_admin' then raise exception 'Administrator role is %, expected super_admin',p.role; end if;
  if not p.is_active then raise exception 'Administrator profile is inactive. Review why before reactivating'; end if;
  if not exists(select 1 from public.companies where id=p.company_id and name='Wings Corporation') then raise exception 'Profile is not associated with an existing Wings Corporation company'; end if;
  select * into e from public.employees where company_id=p.company_id and id=p.employee_id;
  if e.id is null then raise exception 'Linked administrator employee is missing'; end if;
  if e.data->>'status' is null or e.data->>'status' in ('Deactivated','Inactive','Terminated','Resigned') then raise exception 'Linked employee status prevents HRMS access'; end if;
  if e.department_id is distinct from p.department_id then raise exception 'Profile and employee departments do not match'; end if;
  if not exists(select 1 from public.departments where company_id=p.company_id and id=p.department_id) then raise exception 'Administrator department is missing'; end if;
  if lower(p.email) is distinct from lower(u.email) then raise exception 'Profile email does not match the Auth email'; end if;
  if not exists(select 1 from public.company_settings where company_id=p.company_id and id=p.company_id::text) then raise exception 'Company settings are missing'; end if;
  if not exists(select 1 from public.leave_balances where company_id=p.company_id and id=p.employee_id) then raise exception 'Administrator leave balance is missing'; end if;
  perform set_config('hrms.verify.company',p.company_id::text,true);
  perform set_config('hrms.verify.employee',p.employee_id,true);
  perform set_config('request.jwt.claim.sub',u.id::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',u.id,'role','authenticated')::text,true);
end $$;

-- Result 2: RLS and policy inventory. Every listed table must have RLS enabled.
select c.relname as table_name,c.relrowsecurity as rls_enabled,
  (select count(*) from pg_policies p where p.schemaname='public' and p.tablename=c.relname) as policy_count
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('companies','user_profiles','departments','employees','attendance',
 'leave_records','leave_balances','tasks','performance_reviews','payroll','documents','holidays',
 'announcements','notifications','company_settings','audit_logs')
order by c.relname;

do $$
declare t text;
begin
  foreach t in array array['companies','user_profiles','departments','employees','attendance','leave_records',
    'leave_balances','tasks','performance_reviews','payroll','documents','holidays','announcements',
    'notifications','company_settings','audit_logs'] loop
    if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname=t and c.relrowsecurity) then raise exception 'Missing table or RLS disabled: %',t; end if;
    if not exists(select 1 from pg_policies where schemaname='public' and tablename=t) then raise exception 'RLS policies missing: %',t; end if;
    if has_table_privilege('anon','public.'||t,'SELECT') then raise exception 'Unexpected anonymous SELECT grant on %',t; end if;
  end loop;
  if (select prosecdef from pg_proc where oid='public.apply_hrms_changes(uuid,jsonb)'::regprocedure) then
    raise exception 'Save RPC must run as security invoker';
  end if;
  if has_function_privilege('anon','public.apply_hrms_changes(uuid,jsonb)','EXECUTE') then raise exception 'Anonymous save RPC execution is allowed'; end if;
  if not exists(select 1 from storage.buckets where id='hrms-documents' and not public) then raise exception 'Private document bucket missing or public'; end if;
end $$;

-- Exercise actual RLS/grants as this account, not the SQL Editor's privileged role.
set local role authenticated;
do $$
declare t text; total bigint; target uuid := current_setting('hrms.verify.company')::uuid;
begin
  if auth.uid() is null or private.actor_role() is distinct from 'super_admin'
    or private.actor_company() is distinct from target or not private.is_hr() then
    raise exception 'Database identity helpers do not recognize the Super Admin';
  end if;
  foreach t in array array['departments','employees','attendance','leave_records','leave_balances','tasks',
    'performance_reviews','payroll','documents','holidays','announcements','notifications','company_settings','audit_logs'] loop
    execute format('select count(*) from public.%I where company_id<>$1',t) into total using target;
    if total<>0 then raise exception 'Cross-company records visible in %',t; end if;
    execute format('select count(*) from public.%I where company_id=$1',t) into total using target;
    if t<>'audit_logs' and not (has_table_privilege(current_user,'public.'||t,'INSERT')
      and has_table_privilege(current_user,'public.'||t,'UPDATE') and has_table_privilege(current_user,'public.'||t,'DELETE')) then
      raise exception 'Missing CRUD grants on %',t;
    end if;
    if t<>'audit_logs' and (not private.can_read(t,'{}'::jsonb,'verification') or not private.can_write(t,'{}'::jsonb,'verification')) then
      raise exception 'Super Admin authorization helper denied %',t;
    end if;
  end loop;
  if (select count(*) from public.user_profiles)<>1 then raise exception 'Expected only the signed-in user profile to be visible'; end if;
  if (select count(*) from public.companies)<>1 then raise exception 'Expected only the associated company to be visible'; end if;
  if not exists(select 1 from public.employees where id=current_setting('hrms.verify.employee') and company_id=target) then raise exception 'RLS hides the administrator employee'; end if;
  if not exists(select 1 from public.company_settings where company_id=target) then raise exception 'RLS hides company settings'; end if;
  if has_table_privilege(current_user,'public.user_profiles','UPDATE') or has_table_privilege(current_user,'public.user_profiles','INSERT')
    or has_table_privilege(current_user,'public.user_profiles','DELETE') then raise exception 'Browser role/profile modification is allowed'; end if;
  if has_table_privilege(current_user,'public.audit_logs','INSERT') or has_table_privilege(current_user,'public.audit_logs','UPDATE')
    or has_table_privilege(current_user,'public.audit_logs','DELETE') then raise exception 'Browser audit-log modification is allowed'; end if;
  perform public.apply_hrms_changes(target,'[]'::jsonb); -- Empty batch: no records are written.
end $$;

-- Result 3: this row appears only if every preceding assertion passed.
select 'PASS: administrator profile, company binding, Super Admin permissions, RLS and save RPC checks passed' as verification_result,
  auth.uid() as authenticated_user_id,private.actor_role() as hrms_role,private.actor_company() as company_id,
  'Password sign-in must still be tested locally; SQL identity simulation does not validate a password.' as authentication_note;
rollback;
