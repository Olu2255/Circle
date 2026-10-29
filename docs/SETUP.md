# One-time setup and repeatable hosted testing

No service project or deployment has been created by this checkout. Complete this checklist once; then use the same workflow for each change. Do not purchase services. If free allowances/access are insufficient, stop and report rather than silently upgrading.

## 1. Choose authentication and projects

Confirm **GitHub OAuth** (the implemented, proposed provider). Every participant needs their own GitHub account. Email sign-in instead is a separate setup decision and requires application changes; it is not silently offered as a fallback.

In Supabase, create/select a Postgres project. Copy its **Project URL** and **publishable** key from Connect/API Keys into local configuration and Vercel later. Keep database passwords and privileged keys out of the app. Do not disable email verification or enable anonymous sign-ins.

Recommended: separate preview and production Supabase projects. Apply migrations independently and configure one GitHub OAuth app per Supabase project. If using a single project for hackathon speed, set both Vercel scopes to that same project: **Preview, Production and local development then share accounts, circles and data. They are not isolated.** Avoid experimental/destructive migrations against shared data. Separate Vercel deployments alone provide no database isolation.

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

Alternative without CLI: in **Supabase → SQL Editor**, review and run `202610290001_foundation.sql` once, within its transaction. Record the applied version in your deployment log. Do not rerun it: it deliberately fails on existing objects instead of silently skipping schema drift. Before later adopting CLI deployment, reconcile migration history using the official `supabase migration repair` workflow after verifying the schema, not by reapplying the file.

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
| `AUTH_PROVIDER`                        | `github`, after provider setup        | `github`, after provider setup                           | `github`, after provider setup        |

Set Preview variables specifically for `foundation`. If testing another branch, give it its own stable canonical origin rather than inheriting the wrong branch override. No `VERCEL_URL`/forwarded host fallback exists. URLs have no path; HTTPS is required except for localhost. The key must be a current `sb_publishable_...` key, not a legacy JWT or any privileged key.

Redeploy after environment changes; public variables are build-time values. `APP_ORIGIN` is server-only. Opening a hash-specific URL redirects to the canonical branch origin; start and finish login on that same origin in the same browser. `APP_ORIGIN` does not create a DNS alias: copy an actual assigned Vercel branch domain.

## 5. Configure exact authentication URLs

For **each Supabase project → Authentication → URL Configuration**:

- **Site URL:** the exact canonical origin of its primary environment. With separate projects: Production project = Production origin; Preview project = Preview branch origin. With a shared project: Site URL = Production origin.
- **Redirect URLs:** add exact entries `<production-origin>/auth/callback`, `<preview-branch-origin>/auth/callback` and `http://localhost:3000/auth/callback` only in the projects serving those environments. With separate projects, do not add unrelated environments. Do not use broad `*.vercel.app` wildcard redirects. The outbound callback is this exact path with no application query parameters; an allowlisted return destination is held in a ten-minute HttpOnly cookie and consumed after the PKCE exchange.

For **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**:

- Homepage URL: the corresponding project's primary application origin.
- **Authorization callback URL:** copy the URL shown in **Supabase → Authentication → Sign In / Providers → GitHub**, usually `https://<project-ref>.supabase.co/auth/v1/callback`. This is the **Supabase** callback, not Circle's `/auth/callback`.
- Copy the OAuth Client ID and Client Secret directly into that Supabase GitHub provider's fields and enable the provider. The secret belongs only in Supabase, not Vercel, source, or `NEXT_PUBLIC` variables. Leave provider permissions at sign-in requirements; no repository access is needed.

The route is GitHub → Supabase callback → Circle `/auth/callback` → allowlisted app destination. Supabase handles provider verification; Circle exchanges the PKCE code for a real cookie session. No account is pre-created by the app, and no profile is created until that person submits it.

**Email restrictions:** Supabase's hosted default SMTP restricts delivery to project-team addresses and has low rate limits. If email sign-in is later chosen for external participants, configure verified custom SMTP and its sender in Supabase and implement the appropriate verified flow first. Never disable verification or rely on unrestricted default delivery. GitHub OAuth avoids auth-email delivery for this milestone.

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
- [Supabase GitHub provider](https://supabase.com/docs/guides/auth/social-sign-in/auth-github)
- [Supabase SMTP restrictions](https://supabase.com/docs/guides/auth/auth-smtp)
- [Vercel generated branch URLs](https://vercel.com/docs/deployments/generated-urls)
- [Supabase migration workflow](https://supabase.com/docs/guides/deployment/database-migrations)
