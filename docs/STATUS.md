# Foundation validation status

Date: 2026-11-02. See final handoff and Git history for the implementation commit.

## Service addresses

- Production origin: **not assigned / not deployed**.
- Stable `foundation` Preview origin: **not assigned / not deployed**.
- Supabase MCP: scoped to Circle (`livhiraqhphjccnfllgs`); project access and API URL were verified on 2026-10-30. On 2026-11-02, `search_docs` and `get_project_url` both failed with `OAuth token refresh failed: Failed to parse server response`. This administrative connection error is separate from app Auth; public Auth settings and OAuth initiation requests succeed. API URL retrieved through MCP: `https://livhiraqhphjccnfllgs.supabase.co`.
- Local environment: **configured** in ignored `.env.local`, with `APP_ORIGIN=http://localhost:3000` and the active modern publishable key retrieved through MCP. Key values are not included in this document or Git.
- This is the one connected Supabase project. No preview/production database isolation has been established.
- Provider: **Google OAuth enabled**, independently confirmed through the public Auth settings endpoint on 2026-11-02 after the owner entered credentials directly in Supabase. Email/password shares the identity/session architecture but has no enabled application UI.

Do not substitute invented deployment addresses. Once assigned, record the exact origins here and use SETUP.md to set APP_ORIGIN, Site URL, redirect entries and provider callback.

## Verification

- Clean lockfile install (`npm ci`): **passed**, 0 reported vulnerabilities. An initial attempt encountered a Windows native-module file lock while the local dev server was running; stopping that owned server and retrying resolved it.
- `npm run typecheck`: **passed** on 2026-10-30.
- `npm test`: **53 tests passed**, four files. Includes Google options/callbacks and all migrations executed in disposable PostgreSQL/PGlite, including restricted public RPC wrappers and private implementations.
- `npm run build`: **passed** with the MCP-configured `.env.local`.
- Local production HTTP smoke: **passed** with real connection settings. Home/login return 200, login offers Google, protected pages redirect to sign-in, invitation navigation is preserved, and a malicious callback destination is ignored. Responses use no-store.
- Local browser/visual checks: **blocked**. Browser inventory was empty; both Edge and the in-app browser reported unavailable. No authenticated or responsive visual rendering is claimed.
- Live Supabase checks: **passed** for migration history, RLS on all four tables, own-profile policies, no direct membership/circle insertion privileges, no anonymous function execution, no profile email columns, and missing-identity rejection in the authenticated-role RPC wrappers. Anonymous HTTP reads against each table return 401/42501.
- Google sign-in initiation: **passed on 2026-11-02** using the actual local login form and server action. It returns 303, sets a PKCE verifier cookie and HttpOnly navigation cookie, and selects Google with S256 and `http://localhost:3000/auth/callback`. Supabase returns 302 to `accounts.google.com` with its own expected `/auth/v1/callback`, authorization-code response type, client ID and state. No cookie/state/token values were logged and no account was created.
- Google request validation: **blocked by `redirect_uri_mismatch`**, reported by the owner and independently reproduced by following the authorization redirect to Google's error page. The actual Google-bound `redirect_uri` is `https://livhiraqhphjccnfllgs.supabase.co/auth/v1/callback`. Register this exact URI in Google Auth Platform → Clients → the Web client whose ID is configured in Supabase → Authorized redirect URIs. Provider enablement and a redirect to Google alone do not establish that Google accepts the client configuration.
- Real Google account → callback → persisted application session and user-specific two-account checks: **awaiting real participant sign-in**. Initiation alone does not verify Google credential exchange, callback completion or authenticated RLS.
- Inference calls: **none**; AI is outside this milestone.

## Applied migrations and advisors

Applied through MCP after confirming the project had no application tables, migrations or users:

- `20261030164802_foundation`: the existing foundation schema, policies and guarded invitation operations.
- `20261030165100_private_access`: moves privileged implementations to the non-exposed `circle_private` schema, retains authenticated invoker RPC wrappers, and adds the circle-owner foreign-key index. Identity checks and concurrency locks are preserved.

Local filenames match the MCP-assigned history; the older `202610290001_foundation.sql` planning name was renamed, not applied as a second foundation. Tests load the full migration chain in order. No database resets or seeds were used. Live users, profiles, circles, memberships and invitations were empty when checked on 2026-10-30; no current row-count claim is made while MCP access is unavailable.

Security advisor: **no warnings/errors** after hardening. Its remaining [RLS-without-policy information notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) is intentional for invitations: no direct table grants/policies, access through guarded operations only. Performance advisor reports only [unused-index information notices](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index), expected before any real activity; required indexes are retained. Do not expose `circle_private` through the Data API.

## Remaining external setup

Google credential entry is complete, but the Google client registration must first accept the exact Supabase callback above. Correct the Authorized redirect URIs entry on the same OAuth client used in Supabase, save, and start a fresh sign-in at `http://localhost:3000/login`. Keep `http://localhost:3000` in Authorized JavaScript origins. Once Google accepts the request, the owner should sign in with their own account and confirm the profile page opens, then run the two-account checklist. Keep credentials in Supabase; do not send secrets to the agent. Restart with `npm run dev` if the local server is no longer running.

Administrative Supabase work will need the MCP OAuth connection recovered before further project reads/changes. No credential-store extraction or privileged-key workaround is used. No manual database or migration action is requested from the owner.

Vercel is not deployed/configured here; exact stable Preview/Production URLs remain unknown. Once available, configure their environment scopes and exact Auth redirect entries without changing source code. No services were purchased and no real accounts were created by the agent.
