# Wings HRMS: live Supabase synchronization

The frontend continues to use Supabase Auth: login uses a registered email/password,
then requires an active `user_profiles` record linked to an employee.
There are no default passwords.

## Setup

1. Make a verified backup and check that the existing production RLS policies match
   `supabase/migrations/202610280001_hrms.sql`. Do **not** reapply that
   initial migration to an existing database.
2. Run only `supabase/migrations/202611030001_hrms_realtime.sql` in the
   correct Supabase project (`whotvuliqochowggkqol`) via its SQL Editor,
   or through a controlled migration pipeline.
3. Ensure Realtime is enabled for that project.
4. Deploy the frontend with `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_PUBLISHABLE_KEY` configured as GitHub Actions variables.
   Never use a secret or service-role key in the browser.

The SQL adds tables to the `supabase_realtime` publication. It doesn't
change any existing employee fields, attendance rows, or passwords.
The frontend handles INSERT and UPDATE notifications by re-reading the
authenticated user's allowed records. It never trusts a Realtime event
payload as an employee record. RLS limits who can read records.

**Deletes:** Postgres Changes DELETE events are not RLS filtered.
To avoid leaking delete events from other companies, this client doesn't
subscribe to DELETE. Existing polling every 60 seconds and window-focus
refresh continue to reconcile removals and missed events.

**Realtime does not create Auth accounts.** Each employee still needs a
registered Auth account and an active company/employee-linked `user_profiles`
row, provisioned by an administrator. Do not fabricate missing employees.

## Verification without changing existing employee data

- Sign in with two existing authorized accounts in separate browsers.
- Confirm both can read only records permitted by their roles.
- In a staging project, create or edit a test employee and confirm another
  permitted session refreshes without reloading. Test another module,
  for example attendance or leave.
- In a staging project, delete a test record and verify it disappears within
  the fallback poll interval or after refocusing the tab.
- Disconnect the network, reconnect, and verify refresh on focus.
- Ensure role/profile changes trigger revalidation, and login/logout
  correctly starts and removes subscriptions.
- Verify no unauthorized employee, payroll, or bank data is visible.
- Check subscription errors and RLS permissions if updates aren't received.

The publication migration must be deployed before expecting live notifications.
A successful frontend build alone does **not** establish database Realtime delivery.
