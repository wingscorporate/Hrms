-- Enable notifications for existing Wings HRMS tables.
-- Safe and additive: this migration does not INSERT, UPDATE or DELETE HRMS data.
-- Existing RLS SELECT policies continue to control visibility.
begin;

do $$
declare table_name text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise exception 'Supabase Realtime publication is missing; enable Realtime for this project first';
  end if;

  foreach table_name in array array[
    'departments', 'employees', 'attendance', 'leave_records',
    'leave_balances', 'tasks', 'performance_reviews', 'payroll',
    'documents', 'holidays', 'announcements', 'notifications',
    'company_settings', 'audit_logs', 'user_profiles'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end;
$$;

commit;
