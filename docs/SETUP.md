# One-time setup and repeatable hosted testing

The owner has connected a project-scoped Supabase MCP for Circle. Use MCP first for inspection, existing migration history, database changes, debugging and retrieving the project URL/publishable key. The agent should write those public connection settings into ignored `.env.local` itself, using `APP_ORIGIN=http://localhost:3000` locally. Do not print keys or request privileged credentials. Keep Google OAuth credentials in the Supabase provider dashboard.

The dashboard/CLI instructions below are reference alternatives, not tasks to hand back to the owner when MCP can safely perform them. First inspect what already exists; do not create a duplicate project or reapply migrations. If a specific setting is not supported by the connected MCP toolset, identify that limitation precisely before requesting the minimal remaining interaction. Do not purchase services or silently upgrade.

**Circle's current state:** MCP connection and local `.env.local` are configured; `foundation` and `private_access` migrations are applied with local/history versions aligned (see STATUS.md). No users or application rows were seeded. The remaining immediate action is Google OAuth client setup/secret entry in step 5; Vercel settings apply when its actual deployment URLs are available. The current Supabase MCP tools support database operations and public settings retrieval but have no managed Auth-configuration update endpoint, so do not attempt to change Auth settings through SQL.

## 1. Create the required accounts and projects

Google OAuth is confirmed as Circle's primary sign-in method. You need accounts with [Supabase](https://supabase.com/dashboard), [Vercel](https://vercel.com/new) and [Google Cloud Console](https://console.cloud.google.com/). Use your existing GitHub account only to connect the repository to Vercel. Participants sign in with their own Google accounts; they do not need GitHub accounts. Do not create dummy accounts.

In Supabase, create/select a Postgres project. Copy its **Project URL** and **publishable** key from Connect/API Keys into local configuration and Vercel later. Keep database passwords and privileged keys out of the app. Do not disable email verification or enable anonymous sign-ins.

Recommended: separate preview and production Supabase projects; local development can use the preview project. Apply migrations independently and configure Google for each project. For quickest hackathon setup, a single Supabase project is acceptable: set all environments to that project and register its one Supabase callback in Google. **Preview, Production and local development then share accounts, circles and data. They are not isolated.** Avoid experimental/destructive migrations against shared data. Separate Vercel deployments alone provide no database isolation. No Google Cloud compute deployment or service-account key is needed.

## 2. Apply the versioned migration

Use a supported Supabase CLI in a secure local terminal or authenticated deployment environment. The CLI is not required by the application and is not installed automatically. Log in interactively; never pass credentials as logged command-line arguments.

```powershell
supabase login
supabase init
supabase link --project-ref YOUR_PROJECT_REF
supabase migration list
supabase db push --dry-run
supabase db push
supabase migration list
```

`supabase init` creates optional local CLI configuration; review it before committing. The application does not require a local Docker stack. The migration file is already versioned in `supabase/migrations/`; do not generate a second copy. `db push` records successful versions and subsequent runs apply only unapplied migrations. Review the dry-run and back up existing valuable data before schema changes. Apply the same history to each project. Never use `db reset` on a populated project, delete history to rerun a migration, or edit an already applied migration; add a new forward migration for changes.

For Circle, prefer MCP `list_migrations` and `apply_migration`, and keep local filenames aligned with the versions it assigns. Apply only missing versions. The foundation was first applied as `20261030164802_foundation.sql`; the original planning timestamp was renamed to match that actual history. Never apply both names as different migrations.

Alternative without MCP/CLI: in **Supabase → SQL Editor**, review and run only unapplied files in `supabase/migrations/` in order, within their transactions. Record applied versions in your deployment log. Do not rerun them: they deliberately fail on existing objects instead of silently skipping schema drift. Before later adopting migration-history deployment, reconcile history using the official repair workflow after verifying the schema, not by reapplying files.

## 3. Import the existing repository in Vercel

1. Ensure the implementation is pushed to `Olu2255/Circle`. In **Vercel → Add New → Project**, import that repository. Framework: Next.js; root: repository root; Node: **24.x**; install: `npm ci`; build: `npm run build`. No custom output directory.
2. Set the Production branch to `main`. Use `foundation` for Preview testing. Open the Preview deployment's Domains/details and copy the **branch URL**, not the hash-specific deployment URL. It normally resembles `https://<project>-git-foundation-<scope>.vercel.app`; copy the actual value because Vercel may normalize/truncate it. This branch alias updates as `foundation` changes.
3. Initial deployment can show `/setup` until variables are supplied. Do not advertise it as working authentication.
4. Copy the Production project's stable domain and the Preview branch domain. Record exact origins in `docs/STATUS.md` once available. No current URL is assumed.

## 4. Set environment variables and origins

In **Vercel → Project → Settings → Environment Variables**, set:

| Variable                               | Production scope                      | Preview scope, branch `foundation`                       | Local `.env.local`                    |
| -------------------------------------- | ------------------------------------- | -------------------------------------------------------- | ------------------------------------- |
| `APP_ORIGIN`                           | Exact stable Production HTTPS origin  | Exact stable branch Preview HTTPS origin                 | `http://localhost:3000`               |
| `NEXT_PUBLIC_SUPABASE_URL`             | Production project's API URL          | Preview project's API URL (or explicitly shared project) | Chosen project's API URL              |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | That project's public publishable key | That project's public publishable key                    | That project's public publishable key |

Those are the only three app variables required. Remove any legacy `AUTH_PROVIDER=github` entry; the primary provider is Google in code, identical across environments. Set Preview variables specifically for `foundation`. If testing another branch, give it its own stable canonical origin rather than inheriting the wrong branch override. No `VERCEL_URL`/forwarded host fallback exists. URLs have no path; HTTPS is required except for localhost. The key must be a current `sb_publishable_...` key, not a legacy JWT or any privileged key.

Redeploy after environment changes; public variables are build-time values. `APP_ORIGIN` is server-only. Opening a hash-specific URL redirects to the canonical branch origin; start and finish login on that same origin in the same browser. `APP_ORIGIN` does not create a DNS alias: copy an actual assigned Vercel branch domain.

## 5. Configure exact authentication URLs

For **each Supabase project → Authentication → URL Configuration**:

- **Site URL:** the exact canonical origin of its primary environment. With separate projects: Production project = Production origin; Preview project = Preview branch origin. With a shared project: Site URL = Production origin.
- **Redirect URLs:** add exact entries `<production-origin>/auth/callback`, `<preview-branch-origin>/auth/callback` and `http://localhost:3000/auth/callback` only in the projects serving those environments. With separate projects, do not add unrelated environments. Do not use broad `*.vercel.app` wildcard redirects. The outbound callback is this exact path with no application query parameters; an allowlisted return destination is held in a ten-minute HttpOnly cookie and consumed after the PKCE exchange.

For **Google Cloud Console → select/create a project → Google Auth Platform**:

1. Configure **Branding** with the app name Circle, a support email and developer contact. Choose **External** audience for a consumer app. If the consent configuration restricts access while in Testing, authorize your own and the actual participant's Google email in Audience → Test users. This is an OAuth allowlist of real people, not creation of Circle or Google test accounts. Do not publish an unrestricted production audience until its consent/branding requirements are satisfied.
2. In **Data Access**, use only `openid`, `userinfo.email` and `userinfo.profile`. No Gmail, Drive or Calendar permissions. Circle requests only `openid email profile`; it does not request offline Google access or store provider tokens for integrations.
3. In **Clients → Create client**, choose **Web application**. For **Authorized JavaScript origins**, add `http://localhost:3000` and the actual stable Preview/Production origins that this client serves, without paths. You can create the client with localhost and add the Vercel origins after they are assigned.
4. For **Authorized redirect URIs**, copy the callback shown in **Supabase → Authentication → Sign In / Providers → Google**, usually `https://<project-ref>.supabase.co/auth/v1/callback`. Add one URI per Supabase project served by this client, or use separate OAuth clients per environment. This is the **Supabase** callback, not Circle's `/auth/callback` and not the Vercel URL. Local Next.js also uses this hosted Supabase callback; no local Supabase/Docker callback is needed.
5. Copy the OAuth **Client ID and Client Secret** directly into that Supabase project's **Google provider** fields and enable the provider. The secret belongs only in Supabase, not Vercel, `.env.local`, source, or `NEXT_PUBLIC` variables. Keep nonce/email-verification protections enabled. If GitHub was configured previously, it is no longer offered by Circle; it can be disabled in the Supabase dashboard without deleting existing users.

The route is Google → Supabase callback → Circle `/auth/callback` → allowlisted app destination. Supabase handles provider verification; Circle exchanges the PKCE code for a real cookie session. No account is pre-created by the app, and no profile is created until that person submits it. Credentials and callback origins differ by configuration only; no source edits are required between local, Preview and Production.

### Email/password readiness

`src/app/auth/actions.ts` owns the authentication entry points; all methods use the same `createClient`, verified sessions, `auth.users.id`, profiles and RLS. No database changes or alternative password store are needed to add Supabase `signInWithPassword` and verified signup. Google OAuth is the only visible sign-in method today. Do not add inert email buttons.

Before enabling email/password publicly, add real signup, sign-in, email confirmation and password-reset flows with validated origins, configure a verified SMTP sender in Supabase, and retain email verification. The default hosted SMTP restricts recipients to project-team addresses and has low rate limits. Passwords belong only in Supabase Auth, never profiles. Avoid custom identity merging/linking by email. Google OAuth currently needs no SMTP setup.

## 6. Allow real participants through Vercel protection

Check **Vercel → Project → Settings → Deployment Protection** for Preview. A participant and the OAuth return browser must both be able to reach the canonical Preview URL. Use available Vercel authentication access or an authorized shareable link/protection exception that covers the branch alias and callback. Confirm behavior in a fresh private browser before the real test. If necessary, deliberately configure the test deployment to be accessible to invited testers while application authentication and RLS remain enabled. Do not expose bypass tokens in code, URLs stored in the repository, or application variables. Do not assume a protection cookie from your main browser exists in an incognito session.

If the current plan does not support the required sharing controls, report that limitation; do not purchase an upgrade. Do not treat an unrelated Vercel login/protection screen as a Circle authentication failure.

## 7. Normal change/test cycle

1. Make changes on `foundation`; run typecheck, tests and build; review forward-only migrations.
2. Apply pending migrations to the preview database, then push `foundation`; Vercel updates its stable branch alias. Redeploy if env changes.
3. Run the two-account checklist in TESTING.md using the stable alias. Record results and exact URL.
4. Promote/merge tested work to `main` only when requested. Apply compatible migrations to the production project first and verify Production-scoped variables/URLs. Database schema changes are not automatically rolled back by a Vercel rollback.

For this initial empty repository, `main` and `foundation` may start at the same foundation commit. Once connected to Vercel they represent Production and Preview separately; shared Supabase settings still mean shared data.

## Reference documentation

- [Supabase SSR client and Proxy](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs)
- [Supabase Google provider](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)
- [Google web OAuth client setup](https://developers.google.com/identity/protocols/oauth2/web-server#creatingcred)
- [Supabase SMTP restrictions](https://supabase.com/docs/guides/auth/auth-smtp)
- [Vercel generated branch URLs](https://vercel.com/docs/deployments/generated-urls)
- [Supabase migration workflow](https://supabase.com/docs/guides/deployment/database-migrations)
