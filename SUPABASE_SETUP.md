# Wings HRMS — Supabase setup

The existing React interface and GitHub Pages URL are retained. The browser talks directly to Supabase Auth, PostgreSQL through its Data API, and a private Supabase Storage bucket. No application server is required.

## 1. Apply the migration

1. Open https://supabase.com/dashboard/project/whotvuliqochowggkqol/sql/new.
2. Open `supabase/migrations/202610280001_hrms.sql` in VS Code.
3. Copy the **entire file** into a new SQL Editor query and click **Run** once.
4. Expect `Success. No rows returned`. The script runs in a transaction: if it fails, its changes roll back. Paste the error before retrying. Do not disable RLS to work around a failure.

The migration creates companies, user profiles, departments, employees, attendance, leave records and balances, tasks (including comments), performance reviews, payroll, documents, holidays, announcements, notifications, company settings, and audit logs. Nested UI structures stay in JSONB; generated indexed columns provide company/employee/department foreign keys, employee code/email uniqueness, and one attendance/payroll record per employee/date or month. Every application table has RLS.

## 2. Create the first administrator

1. In **Authentication → Users → Add user → Create new user**, create your real administrator email/password account. Use a confirmed email. Keep the password private.
2. Open `supabase/provision-first-admin.sql`.
3. Replace `REPLACE_WITH_ADMIN_EMAIL` with that exact email address.
4. Run the entire file in a **new SQL Editor query**.

This creates one isolated Wings company, HR and Sales departments, an administrator employee, company settings, and a protected `super_admin` user profile. The administrator's unknown salary, bank, and identity fields are empty/zero so they can be filled with real values. Re-running provisioning for an existing profile is rejected without changing data.

Sign in using the administrator's **email and Supabase Auth password** in the existing login form. The former first-name/`name123` demo login and browser role impersonation no longer authorize access.

To verify `wingscorporate1504@gmail.com`, run the entire `supabase/verify-admin-access.sql` file in SQL Editor. It is a read-only transaction that checks the confirmed/unbanned Auth account, active `super_admin` profile, Wings company and employee/department links, required settings/balances, RLS/grants, private storage bucket, protected profiles/audit history, and access under the actual `authenticated` database role. It finishes with a `PASS` result and rolls back all session-local settings. It does not test the account password. Share its final result or first error to identify a targeted correction; do not rerun provisioning or grant broad access as a workaround.

For a real password-authentication check, run `npm run verify:admin` in your own terminal. The password prompt is hidden. This mode changes no HRMS business records: it verifies the named account, confirmed identity, role/company binding, module reads, company isolation, an empty save RPC, and logout/re-login. Passwords and tokens are never printed. Read-only queries returning no cross-company rows are one check; the SQL policy/grant diagnostic and PostgreSQL isolation tests provide additional coverage.

## 3. Configure the frontend

The supplied project URL and publishable key have been saved in the git-ignored `.env.local` file. For another checkout, copy `.env.example` to `.env.local` and set:

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

Only a **publishable** key is accepted. Never put a secret key, service-role key, Auth password, or PostgreSQL connection password in any `VITE_` variable. Frontend variables are public in the built JavaScript; RLS and authenticated identities protect records.

Run `npm ci`, then `npm run dev`. In Supabase **Authentication → URL Configuration**, set the Site URL to `https://wingscorporate.github.io/Hrms/`. Password login does not require an OAuth callback. If you later add recovery or invitation links, configure their redirect URLs before using them; that UI is not part of this change.

## 4. Add employees and grant accounts

Add real employees using the existing employee form. The database creates their initial leave balances (12 casual, 10 sick, 18 paid, 24 WFH, with zero usage). Change your allocation policy in the SQL migration before first applying it, or adjust allocations in SQL Editor afterward if company policy differs.

Adding an employee record does **not** automatically create a login account or grant privileges:

1. Create the employee's confirmed account in **Authentication → Users** using their work email.
2. In `supabase/provision-user.sql`, replace `REPLACE_WITH_EMPLOYEE_WORK_EMAIL` and deliberately choose `desired_role`.
3. Run that script in SQL Editor. Roles are `employee`, `manager`, `hr`, and `super_admin`.

Profiles can only be provisioned/changed by the project administrator through trusted SQL, not through browser requests or editable Auth metadata. Employee department/name/email changes synchronize the profile's display fields, but changing the login email itself also requires an Auth account email update. Deactivated employees immediately lose database access. Deleting an employee removes their profile binding while leaving their Auth identity unable to access HRMS.

The existing mock dataset and browser HRMS records are **not automatically imported**. Verify and back up any real records in the old browser before replacing the deployed app; never import synthetic attendance, payroll, bank numbers, or identity documents as real records. The old `mockData.ts` file is retained as unused source material and is absent from the runtime import graph. Demo reset remains inert and explains that production records were not changed.

## 5. Access rules

| Role | Access |
| --- | --- |
| Unauthenticated/unprovisioned | No HRMS records |
| Employee | Own employee, attendance, leave, payroll, assigned tasks, reviews, documents, notifications; company holidays/settings and announcements targeted to them |
| Manager | Department-scoped employee, attendance, leave, task, payroll and review access; own documents; cannot grant roles, edit their own salary, approve their own leave, or change company settings |
| HR / super admin | HRMS operations within their own company; no access to another company |

Employees can apply for and cancel their own pending leave, punch today's attendance, update assigned task status/add authentic comments, upload their own documents, and mark their own notifications read. They cannot approve leave or modify payroll, leave allocations, notification contents, existing comments, or audit history. A server trigger writes append-only audit records and generates notifications. Leave approval and its balance update commit together.

Company and employee ownership are enforced in PostgreSQL, including same-company foreign keys. Saves use optimistic row revisions and one transaction: stale edits fail instead of silently overwriting newer records. A failed save keeps the form open and does not report success. Saved records reload on sign-in/refresh; the open app also refreshes on focus and every minute. Browser storage is used only by Supabase for its Auth session, not for HRMS records.

The document bucket is private, limited to PDF/PNG/JPEG/DOCX and 25 MB per file. Files use company/employee paths and authenticated downloads. Metadata is committed after upload; failed metadata saves attempt upload cleanup. Document deletion removes metadata first, then file objects; a storage cleanup failure is explicitly reported for administrator cleanup because Storage and PostgreSQL do not share a transaction. Employee deletion also cleans up their loaded personal document objects. Administrators should review orphan files after failed network requests.

## 6. GitHub Pages

In repository **Settings → Secrets and variables → Actions → Variables**, add these **repository variables**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Use the same frontend-safe values as `.env.local`. The existing Pages workflow passes them to Vite at build time. GitHub Pages cannot read a local `.env.local` file at runtime. `vite.config.ts` keeps `base: '/Hrms/'`. Deploy after the migration and administrator provisioning have succeeded; future pushes retain the same build/deploy flow.

## 7. Verification

```sh
npm run lint
npm test
npm run build
npm run test:connection
```

`npm run test:site` opens the published site in a headless browser, verifies the existing login renders without runtime/asset errors, checks browser-origin connectivity to Supabase Auth and anonymous employee denial, then reloads the page. On Windows it uses installed Microsoft Edge; on other platforms install Playwright Chromium first with `npx playwright install chromium`. Set `HRMS_CHECK_URL` to a local production preview URL to check a build before publication. This smoke test does not claim that password login or authenticated business-data persistence has been verified.

`npm test` runs the actual migration, RLS, grants, triggers, transactional RPC, admin provisioning, CRUD, conflict/rollback checks, storage path policies, and persisted-database reopen in an embedded PostgreSQL engine. Managed Supabase Auth and Storage schemas are shimmed for these local tests. They do not substitute for testing the live service.

`test:connection` verifies the live Auth endpoint and rejects anonymous employee access. Before applying the migration it reports that tables are pending. It does not create accounts or weaken security. To verify live persistence with an authenticated account:

Run `npm run test:live` in your local terminal after provisioning. Enter the administrator email and password at its prompts; the password is hidden, stays only in process memory, and is never sent to this chat or written to a file. The script creates, updates, retrieves, and deletes a clearly labelled temporary holiday through the real Supabase JavaScript client, including logging out and signing into a new client before verifying persistence. It leaves the server-generated audit history. Then check the browser behavior:

1. Sign in as the provisioned administrator.
2. Add a temporary company holiday in the existing Holidays page.
3. Refresh, log out/in, and reopen the browser: confirm the holiday remains.
4. Delete it, refresh, and confirm it is gone. Check the resulting rows in Audit Log.
5. Add and edit an employee, submit/review leave from distinct accounts, and verify the balance and payroll/document flows relevant to your company.
6. Sign in as an employee and a second-company account to verify each can only see permitted records.

No paid Supabase features or separate backend are required. Storage and database usage count toward your Supabase Free project's limits; persistent storage is not a replacement for your own backup policy.
