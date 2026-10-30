# Foundation validation status

Date: 2026-10-30. See final handoff and Git history for the implementation commit.

## Service addresses

- Production origin: **not assigned / not deployed**.
- Stable `foundation` Preview origin: **not assigned / not deployed**.
- Supabase MCP: **connected and verified**, scoped to Circle (`livhiraqhphjccnfllgs`). API URL retrieved through MCP: `https://livhiraqhphjccnfllgs.supabase.co`.
- Local environment: **configured** in ignored `.env.local`, with `APP_ORIGIN=http://localhost:3000` and the active modern publishable key retrieved through MCP. Key values are not included in this document or Git.
- This is the one connected Supabase project. No preview/production database isolation has been established.
- Provider: **Google OAuth**, confirmed by the owner and implemented as primary sign-in, but **disabled in the live Auth settings** when checked. Google client credentials must be entered directly in Supabase. Email/password shares the identity/session architecture but has no enabled application UI.

Do not substitute invented deployment addresses. Once assigned, record the exact origins here and use SETUP.md to set APP_ORIGIN, Site URL, redirect entries and provider callback.

## Verification

- Clean lockfile install (`npm ci`): **passed**, 0 reported vulnerabilities. An initial attempt encountered a Windows native-module file lock while the local dev server was running; stopping that owned server and retrying resolved it.
- `npm run typecheck`: **passed** on 2026-10-30.
- `npm test`: **53 tests passed**, four files. Includes Google options/callbacks and all migrations executed in disposable PostgreSQL/PGlite, including restricted public RPC wrappers and private implementations.
- `npm run build`: **passed** with the MCP-configured `.env.local`.
- Local production HTTP smoke: **passed** with real connection settings. Home/login return 200, login offers Google, protected pages redirect to sign-in, invitation navigation is preserved, and a malicious callback destination is ignored. Responses use no-store.
- Local browser/visual checks: **blocked**. Browser inventory was empty; both Edge and the in-app browser reported unavailable. No authenticated or responsive visual rendering is claimed.
- Live Supabase checks: **passed** for migration history, RLS on all four tables, own-profile policies, no direct membership/circle insertion privileges, no anonymous function execution, no profile email columns, and missing-identity rejection in the authenticated-role RPC wrappers. Anonymous HTTP reads against each table return 401/42501.
- Hosted sign-in and user-specific two-account checks: **awaiting Google credentials and real participant accounts**. Metadata/anonymous checks do not establish that two real users can complete the full flow.
- Inference calls: **none**; AI is outside this milestone.

## Applied migrations and advisors

Applied through MCP after confirming the project had no application tables, migrations or users:

- `20261030164802_foundation`: the existing foundation schema, policies and guarded invitation operations.
- `20261030165100_private_access`: moves privileged implementations to the non-exposed `circle_private` schema, retains authenticated invoker RPC wrappers, and adds the circle-owner foreign-key index. Identity checks and concurrency locks are preserved.

Local filenames match the MCP-assigned history; the older `202610290001_foundation.sql` planning name was renamed, not applied as a second foundation. Tests load the full migration chain in order. No database resets or seeds were used. Live users, profiles, circles, memberships and invitations remain empty.

Security advisor: **no warnings/errors** after hardening. Its remaining [RLS-without-policy information notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) is intentional for invitations: no direct table grants/policies, access through guarded operations only. Performance advisor reports only [unused-index information notices](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index), expected before any real activity; required indexes are retained. Do not expose `circle_private` through the Data API.

## Remaining external setup

Only Google OAuth credential setup requires owner interaction now: create a Google Web application OAuth client with local origin `http://localhost:3000` and authorized redirect URI `https://livhiraqhphjccnfllgs.supabase.co/auth/v1/callback`, then enter its Client ID/Secret directly in Circle's Supabase Google provider settings and enable Google. Do not send the secret to the agent. The connected MCP toolset does not expose an Auth-configuration update tool; SQL cannot substitute for managed Auth settings. No credential-store extraction or privileged-key workaround is used.

Vercel is not deployed/configured here; exact stable Preview/Production URLs remain unknown. Once available, configure their environment scopes and exact Auth redirect entries without changing source code. No services were purchased and no real accounts were created by the agent.
