-- Run AFTER migrations/202610280001_hrms.sql, in the Supabase SQL Editor.
-- First create a confirmed email/password user under Authentication > Users.
-- Change only admin_email below. Never put a password or API secret in this file.
begin;
do $$
declare
  admin_email text := 'wingscorporate1504@gmail.com';
  admin_auth_id uuid;
  cid uuid := gen_random_uuid();
  eid text := 'emp-' || gen_random_uuid()::text;
  hr_dept text := 'dept-' || gen_random_uuid()::text;
  sales_dept text := 'dept-' || gen_random_uuid()::text;
begin
  select id into admin_auth_id from auth.users where lower(email)=lower(admin_email);
  if admin_auth_id is null then raise exception 'Create the confirmed Auth user first, and replace REPLACE_WITH_ADMIN_EMAIL.'; end if;
  if exists(select 1 from public.user_profiles where id=admin_auth_id) then raise exception 'This user is already provisioned. No data changed.'; end if;

  insert into public.companies(id,name) values(cid,'Wings Corporation');
  insert into public.departments(company_id,id,data) values
    (cid,hr_dept,jsonb_build_object('id',hr_dept,'name','HR','code','HR','description','Human Resources','isActive',true,'createdAt',current_date::text)),
    (cid,sales_dept,jsonb_build_object('id',sales_dept,'name','Sales','code','SALES','description','Sales','isActive',true,'createdAt',current_date::text));
  insert into public.employees(company_id,id,data) values(cid,eid,jsonb_build_object(
    'id',eid,'employeeCode','WC-001','firstName','Wings','lastName','Administrator','fullName','Wings Administrator',
    'avatarUrl','','dateOfBirth','','gender','Other','personalEmail',admin_email,'workEmail',admin_email,
    'phone','','emergencyContact',jsonb_build_object('name','','relationship','','phone',''),
    'currentAddress','','permanentAddress','','departmentId',hr_dept,'designation','HR Org Admin',
    'joiningDate',current_date::text,'employmentType','Full Time','workLocation','',
    'probationPeriodMonths',0,'status','Active','companyRole','Org. Admin',
    'salary','{"basic":0,"hra":0,"allowances":0,"incentives":0,"bonus":0,"pf":0,"esi":0,"professionalTax":0,"tds":0,"otherDeductions":0}'::jsonb,
    'bankDetails','{"accountHolderName":"","bankName":"","accountNumber":"","ifscCode":""}'::jsonb));
  insert into public.user_profiles(id,company_id,employee_id,department_id,email,full_name,role)
    values(admin_auth_id,cid,eid,hr_dept,admin_email,'Wings Administrator','super_admin');
  insert into public.company_settings(company_id,id,data) values(cid,cid::text,'{
    "companyName":"Wings Corporation","tagline":"Manage your workforce. Simplify your workplace.",
    "logoUrl":"","address":"","email":"","phone":"","officeStartTime":"11:00","officeEndTime":"20:00",
    "gracePeriodMinutes":15,"workingHoursPerDay":9,"minFullDayHours":8,"minHalfDayHours":4,
    "weeklyOffDays":["Sunday"],"financialYear":"2026-2027","currencySymbol":"₹"
  }');
  raise notice 'Company: %, administrator employee: %, auth user: %',cid,eid,admin_auth_id;
end $$;
commit;

select id,company_id,employee_id,email,role from public.user_profiles where id in
  (select id from auth.users where email is not null);
