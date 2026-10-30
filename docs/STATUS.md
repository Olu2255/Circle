# Foundation validation status

Date: 2026-10-30. See final handoff and Git history for the implementation commit.

## Service addresses

- Production origin: **not assigned / not deployed**.
- Stable `foundation` Preview origin: **not assigned / not deployed**.
- Supabase project(s): **not configured**. No preview/production isolation has been established.
- Provider: **Google OAuth**, confirmed by the owner and implemented as the primary sign-in method. Supabase/Google dashboard setup remains pending. Email/password uses the same identity/session architecture but is not enabled in the UI.

Do not substitute invented deployment addresses. Once assigned, record the exact origins here and use SETUP.md to set APP_ORIGIN, Site URL, redirect entries and provider callback.

## Verification

- Clean lockfile install (`npm ci`): **passed**, 0 reported vulnerabilities. An initial attempt encountered a Windows native-module file lock while the local dev server was running; stopping that owned server and retrying resolved it.
- `npm run typecheck`: **passed**, Google OAuth update on 2026-10-30.
- `npm test`: **52 tests passed**, four files. Includes Google provider/minimum-scope/callback configuration across local, Preview and Production origins, plus SQL policy execution in disposable PostgreSQL/PGlite.
- `npm run build`: **passed** (Next.js production build), Google OAuth update on 2026-10-30.
- Local production HTTP smoke: **passed on the previous foundation commit (2026-10-29)**. Home/setup returned 200; unconfigured login/profile/circle/join routes redirected to setup; unconfigured callback returned a clear 503. Responses had no-store and security headers. Not rerun for this provider change.
- Local browser/visual checks: **blocked**. Browser inventory was empty; both Edge and the in-app browser reported unavailable. No authenticated or responsive visual rendering is claimed.
- Hosted sign-in and two-account checks: **awaiting configured services and real participant accounts**.
- Hosted direct database/RLS checks: **not run**. Local SQL tests do not establish hosted migration state.
- Inference calls: **none**; AI is outside this milestone.

No Supabase operation has been attempted without project configuration, so no Supabase network/proxy failure is claimed.

## Remaining external setup

The Supabase and Vercel integrations are still not connected, and no local service configuration or credentials were present. No hosted project/deployment or real authentication accounts were created. Connect/configure those services or complete the single dashboard checklist in SETUP.md, configure the Google OAuth client/provider, then run TESTING.md with two actual participant accounts. No services were purchased.
