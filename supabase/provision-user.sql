-- Run in SQL Editor after adding an employee in Wings HRMS and creating their
-- confirmed email/password account under Supabase Authentication > Users.
-- Match by the employee's real work email. Set desired_role deliberately.
do $$
declare
  account_email text := 'REPLACE_WITH_EMPLOYEE_WORK_EMAIL';
  desired_role text := 'employee'; -- employee, manager, hr, or super_admin
  eid text; cid uuid; dept text; employee_name text; auth_id uuid;
begin
  select id into auth_id from auth.users where lower(email)=lower(account_email);
  if auth_id is null then raise exception 'Create the Auth account first'; end if;
  if (select count(*) from public.employees where work_email=lower(account_email))<>1 then
    raise exception 'Exactly one employee must have that email. For duplicate emails across companies, filter by company_id explicitly.';
  end if;
  select id,company_id,department_id,data->>'fullName' into eid,cid,dept,employee_name
    from public.employees where work_email=lower(account_email);
  insert into public.user_profiles(id,company_id,employee_id,department_id,email,full_name,role)
    values(auth_id,cid,eid,dept,account_email,employee_name,desired_role);
end $$;
