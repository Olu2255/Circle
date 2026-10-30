# Repository instructions

Circle's current authorized scope is milestone 1 only: real multi-user foundation and repeatable Vercel testing. Preserve existing work and inspect Git/remote state before changes.

- Use Next.js, TypeScript, Tailwind, Supabase Postgres/Auth and Vercel. Keep source in this GitHub repository.
- Future AI uses Meta Model API directly with hackathon credits; no Together AI or Modal. Do not implement AI planning, evidence assessment or facilitator behavior in milestone 1.
- Never seed application users/data, auto-create accounts, offer demo login/mock auth, add fallback storage, or show simulated AI. Use honest empty/loading/error/setup states.
- Follow current Supabase server-side auth guidance (`@supabase/ssr`, PKCE, cookie refresh in `proxy.ts`, verified claims). Never trust unverified `getSession()` server-side.
- Google OAuth is the primary sign-in method, confirmed by the owner. Configure it in Supabase; Google credentials never belong in the browser/app environment. Keep provider-specific entry points in `src/app/auth/actions.ts` and options in `src/lib/auth-options.ts`; session checks, profiles and RLS use Supabase user IDs so future email/password sign-in needs no identity schema changes. Email/password UI/flows are not enabled yet; verified signup, password reset and custom SMTP are required before external email testing. Never weaken verification or seed accounts.
- Database authorization is mandatory: migrations checked in, RLS alongside server checks, own-profile writes only, members-only circle reads, no direct membership grants. Keep auth emails private. Do not add auth metadata to shared profiles.
- Circle creation/redemption must be atomic and invitation expiry/idempotency enforced in SQL. Preserve database concurrency locks and function grants/search paths.
- Keep credentials server-side. Only Supabase's public publishable key may use `NEXT_PUBLIC`; never a service-role/secret/Meta key. Do not print credentials, cookies or invitation codes in logs.
- Use the Circle project-scoped Supabase MCP directly for project configuration, database work, migrations, debugging and retrieving public connection settings when supported. Inspect live schema/history before changes; configure ignored `.env.local` with the retrieved project URL/publishable key without logging values. Do not ask the owner to perform Supabase steps available safely through MCP. Ask only for genuinely required interaction, including external Google OAuth setup or entering secrets directly in the provider dashboard. If MCP tools are absent from a running session, report that tool-availability blocker; do not mistake local server registration for successful project access or request privileged credentials as a workaround.
- Same code locally and on Vercel. Centralize origins/callbacks. Use exact environment origins and allowlisted internal redirects; do not trust forwarded-host headers for destinations.
- Document Preview/Production env scopes and actual URLs once known. Shared Supabase project means shared data, not isolation. Prefer a dedicated preview project when available. Never reset a populated database.
- No paid purchases, no automatic test accounts, no disabling TLS/permissions for sandbox network failures.
- Run `npm run typecheck`, `npm test`, `npm run build` for relevant changes. SQL policy tests are disposable tests, never a runtime alternative. Keep tests focused on validation, redirects and authorization.
- Update README/setup/testing/status when relevant. Separate automated, local browser, hosted and blocked checks. A build is not evidence of real login or hosted RLS.
- Do not proceed to milestone 2 unless requested.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
