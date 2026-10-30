# Circle

A real, invitation-only web app for young adults pursuing career and learning goals. Milestone 1 includes Supabase sign-in, editable profiles, small circles, expiring invitations and member profiles. No demo members, seeded application data, AI features or inference calls.

## Stack and decisions

- Next.js 16, TypeScript, Tailwind; Node **24.x**, npm lockfile committed.
- Supabase Postgres + Auth using `@supabase/ssr`, cookie sessions, PKCE and verified claims. RLS enforces access independently of the UI.
- Vercel hosting: `main` for Production; `foundation` for repeatable Preview testing.
- Google OAuth is the primary sign-in method, configured in Supabase. Provider-specific entry points are separate from shared cookie sessions, profiles and RLS. Email/password can use the same Supabase identities later; signup, confirmation, reset UI and SMTP setup are not enabled in this milestone.
- Future AI: **Meta Model API directly**, using the owner's hackathon credits. No Together AI, Modal, AI placeholders or provider credentials in this milestone.

## Local development

```powershell
npm ci
Copy-Item .env.example .env.local
# Fill the three application values; configure Google in Supabase.
npm run dev
```

Use `APP_ORIGIN=http://localhost:3000` locally. The same code runs on Vercel with environment-specific variables. Missing/invalid values show `/setup`; no database/authentication fallback exists. Use a public `sb_publishable_...` key from Supabase's Connect/API Keys page. No service-role or secret key is needed by the app.

```powershell
npm run typecheck
npm test
npm run build
npm start
```

`npm test` includes isolated PostgreSQL policy tests through PGlite. The disposable fixtures exist only inside rolled-back test transactions, never in the application or a hosted Supabase project. Tests create no real authentication accounts. Passing these tests does **not** establish that a hosted project has the migration, provider or redirect configuration applied.

## Set up real services

Follow the **single dashboard checklist in [docs/SETUP.md](docs/SETUP.md)** for Supabase, Google OAuth, Vercel scopes, canonical URLs and migrations. The [.env.example](.env.example) has names and descriptions but no values. Do not commit `.env.local` or paste credentials into issues/chat. `AUTH_PROVIDER` is no longer required; remove any old `AUTH_PROVIDER=github` entry. Google client credentials are entered only in the Supabase dashboard.

Apply `supabase/migrations/202610290001_foundation.sql` once to each intended project. Prefer migration-history deployment with the Supabase CLI as described in the setup guide. Never reset a populated database. The migration creates no users or initial circles.

## Access model

All profile fields are shared with members of the same circle; this is disclosed before saving/joining. Authentication emails and OAuth data stay in Supabase Auth, outside shared profiles. Only the profile owner can insert/edit their profile. Only actual members can read a circle or its memberships. A user may belong to multiple circles, each capped at six members.

Circle/membership writes are restricted to narrowly scoped security-definer functions with a fixed search path. Circle creation and creator membership are atomic. Only the creator can generate/revoke invitations. Tokens contain two random UUIDs, are stored only as SHA-256 hashes, expire after seven days and grant membership only on explicit redemption by a signed-in user with a completed profile. New invitations revoke previous ones. Redemption is idempotent while the invitation is valid; expired/revoked codes fail even for existing members. Circle row locks serialize capacity checks and invite changes.

Authentication callbacks use a configured canonical origin, never a forwarded-host header. Navigation targets are allowlisted. Vercel aliases redirect to the environment's canonical origin so PKCE cookies stay on the callback host. Server Actions require that exact origin. Protected routes and every mutation verify authentication independently; authenticated responses are not cached. Cookie-based access is removed on local sign-out; Supabase-issued JWTs already copied elsewhere retain their normal expiry semantics.

## Test and handoff

See [docs/TESTING.md](docs/TESTING.md) for the repeatable two-account workflow and direct database authorization checks. Hosted tests require accounts created by the owner/participants. No accounts are created automatically.

Deployment addresses and live checks are recorded in [docs/STATUS.md](docs/STATUS.md). Do not call hosted authentication or permissions verified until the two-account checks pass.
