# Wings HRMS password recovery

The existing login/dashboard interface stays unchanged. A dedicated static recovery page is provided at:

`https://wingscorporate.github.io/Hrms/reset-password.html`

This is a real built HTML file, compatible with GitHub Pages. A path such as `/auth/reset-password` would require routing/fallback configuration; it is not used here. The app's normal session is separate from the memory-only recovery session.

## Supabase configuration (project administrator)

Open https://supabase.com/dashboard/project/whotvuliqochowggkqol/auth/url-configuration.

Set **Site URL**:

```text
https://wingscorporate.github.io/Hrms/
```

Add these exact **Redirect URLs** without removing other legitimate URLs used by your project:

```text
https://wingscorporate.github.io/Hrms/
https://wingscorporate.github.io/Hrms/reset-password.html
```

Save. No wildcard or localhost production default is necessary. A publishable key cannot read/change these management settings; they must be verified through the dashboard or an authorized project-management connection. These are Auth configuration settings, not SQL table/RLS changes.

Under **Authentication → Email Templates → Reset Password**, retain the default action link using `{{ .ConfirmationURL }}`. The app explicitly sends the recovery page as `redirectTo`. A custom template that hardcodes the homepage or points to an unimplemented `/auth/confirm` route can override/break that flow; review the actual template before changing it. Never paste the full recovery link or its tokens into chat, logs or source files.

Official references: https://supabase.com/docs/guides/auth/redirect-urls and https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail.

## Reset the existing administrator password

After the recovery page is deployed and the URLs above are saved:

1. Open the recovery page directly. Enter `wingscorporate1504@gmail.com` and click **Send reset email**. This is an explicit user-initiated Auth request; the assistant does not send an email automatically.
2. Open the newest email's reset link. It should resolve through Supabase to `/Hrms/reset-password.html`. Expired/used links require a fresh request. A generic request success message does not prove delivery or disclose whether an account exists. If mail does not arrive, check spam and the project's actual Auth/email delivery logs/settings.
3. The page validates the signed-in recovery identity and active HRMS profile, then removes URL token fragments. Enter and confirm a new password with at least 12 characters; keep it private. Supabase may impose additional password/security requirements.
4. The page calls only `auth.updateUser({ password })`. It verifies that the returned UID and profile binding match the recovery identity, clears the recovery session, and links back to the original sign-in page.
5. Sign in with the same email and the new password. The existing UID shown in your Supabase Auth account must remain unchanged. Run `npm run verify:admin` privately to verify a real password sign-in, or inspect the user/profile in Supabase and check the roster in the app.

No Auth user is created/recreated, and no profile, company, employee, RLS or role is modified by the recovery page. Updating a password necessarily changes that existing user's Auth credential/session state; it does not replace their identity. The page does not touch existing main-app browser session storage. Recovery tokens are memory-only; refreshing the recovery page after its URL has been cleared may require requesting a new link.

## Verification boundaries

Unit tests cover callback classification, password validation and the fixed redirect. Browser tests (`node scripts/test-password-recovery.mjs`, with a production preview running on port 4173) use **mock** Auth/Data API responses to verify request redirects, password-only updates, UID/profile preservation, token-fragment removal, isolation from main-app storage, sign-out and expired-link rejection. They send no real email or password update.

Live URL allowlisting, email delivery, the real administrator password change, and subsequent password sign-in must be confirmed against the actual project/account. Do not claim a successful password reset based solely on local mocks or SQL role checks. Do not set passwords by editing Auth tables, copy a service-role key to the frontend, rerun first-admin provisioning, re-import the roster, or weaken RLS.
