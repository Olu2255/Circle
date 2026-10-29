# Foundation validation status

Date: 2026-10-29. See final handoff and Git history for the implementation commit.

## Service addresses

- Production origin: **not assigned / not deployed**.
- Stable `foundation` Preview origin: **not assigned / not deployed**.
- Supabase project(s): **not configured**. No preview/production isolation has been established.
- Provider: GitHub OAuth implementation prepared; owner confirmation and provider setup pending.

Do not substitute invented deployment addresses. Once assigned, record the exact origins here and use SETUP.md to set APP_ORIGIN, Site URL, redirect entries and provider callback.

## Verification

- Clean lockfile install (`npm ci`): **passed**, 0 reported vulnerabilities. An initial attempt encountered a Windows native-module file lock while the local dev server was running; stopping that owned server and retrying resolved it.
- `npm run typecheck`: **passed**.
- `npm test`: **48 tests passed**, three files, including real SQL policy execution in disposable PostgreSQL/PGlite.
- `npm run build`: **passed** (Next.js production build).
- Local production HTTP smoke: **passed**. Home/setup return 200; unconfigured login/profile/circle/join routes redirect to setup; unconfigured callback returns a clear 503. Responses have no-store and security headers.
- Local browser/visual checks: **blocked**. Browser inventory was empty; both Edge and the in-app browser reported unavailable. No authenticated or responsive visual rendering is claimed.
- Hosted sign-in and two-account checks: **awaiting configured services and real participant accounts**.
- Hosted direct database/RLS checks: **not run**. Local SQL tests do not establish hosted migration state.
- Inference calls: **none**; AI is outside this milestone.

No Supabase operation has been attempted without project configuration, so no Supabase network/proxy failure is claimed.

## Remaining external setup

The Supabase and Vercel integrations were found but are not connected, and no local service configuration or credentials were present. No hosted project/deployment or real authentication accounts were created. Confirm the provider choice, connect/configure those services or complete the single dashboard checklist in SETUP.md, then run TESTING.md with two actual participant accounts. No services were purchased.
