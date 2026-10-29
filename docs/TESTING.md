# Testing Circle's real foundation

## Automated checks

```powershell
npm ci
npm run typecheck
npm test
npm run build
```

Tests cover profile/circle validation, timezone and availability errors, redirect attacks, expiry boundaries, SQL RLS, own-profile writes, membership-only reads, direct-write denial, invitation rotation/revocation/expiry, idempotent redemption, complete-profile requirement and six-member capacity. PostgreSQL tests use a disposable in-memory PGlite instance with a minimal test-only `auth.uid()`/roles contract, and rolled-back fictional principals. They never contact Supabase, create real accounts or supply the running app with data. They do not verify hosted Auth, PostgREST grants, Vercel callback/protection configuration or cross-connection concurrency. SQL locking is implemented, but load/race testing is not claimed.

A build alone verifies none of the real multi-user behavior below.

## Two-account hosted test

Prerequisites: apply the migration, configure GitHub OAuth and exact origins, redeploy Vercel with correct env scopes, and confirm deployment protection allows both browsers. Use the stable **branch Preview URL** in STATUS.md. The owner and another actual participant each create/sign into their own real account. Do not create test accounts automatically.

Use browser A (normal window) and browser B (a separate browser profile or private window). They must have independent cookie stores; two ordinary tabs do not count. With GitHub, ensure B is signed into its own provider account.

1. **Unauthenticated protection:** before sign-in, open `/profile`, `/circles`, and a circle URL once one exists. No profile or circle content should be returned; the user is redirected to sign-in. With missing env, expect setup instead of fake success.
2. **A signs in:** complete OAuth on the canonical host. No profile or circle should already exist. Submit a real display name, current goal, experience, skills, timezone and at least one availability window. Confirm save and persistence after hard refresh. Check validation with blank/short fields, invalid timezone and overlapping windows.
3. **A creates:** create a circle. The circle initially lists only A and shows `1 of 6 members`. Generate an invitation and copy its link and code. The link must use the stable Preview origin, not a temporary deployment host.
4. **B is a nonmember:** sign in and complete B's profile. Before joining, open A's `/circles/<id>` directly and request it with the browser's Network panel: no circle/member data, and a not-found response is expected. B's circle list must not show A's circle. Perform the SQL checks below before joining too.
5. **Invalid/revoked invitations:** in B, submit a syntactically invalid code, then a random 64-character hex code. Both must fail. In A, generate a second invitation; B must be unable to redeem the first. In A, use **Revoke existing invitations**; the second must fail too. Generating a code is not equivalent to adding B.
6. **Expiry:** create a fresh invitation. In the Supabase SQL Editor, as the project administrator, run `update public.invitations set expires_at = clock_timestamp() where circle_id = '<your-test-circle-uuid>' and revoked_at is null;` (substitute the actual circle UUID; never print the code/token). Attempt redemption in B; it must fail. This deliberately invalidates an invitation only; it does not delete/reset data. Generate another invitation for the successful path.
7. **Consent and joining:** opening B's new invitation link must not grant access until B presses **Join circle**. Join; both browsers should show the two actual profiles after refresh. B should see no invitation-management controls. Redeem that same still-valid code again: it should return the existing circle, with exactly two memberships and no duplicate/error. An expired/revoked code still fails even for members.
8. **Shared profile privacy:** confirm the circle shows goals, experience, skills, timezone and availability, but no account email or OAuth/authentication details. Edit B's own profile and verify A sees the update after refresh. Perform the cross-user update checks below; hidden UI alone is not sufficient.
9. **Persistence:** hard-refresh both sessions; reopen the stable URL in each browser after closing/reopening. Profiles and circle membership must persist. Repeat after the access-token refresh interval to exercise Proxy refresh. Cookies may be cleared by private-window closure; that is expected, not a persistence guarantee for incognito sessions.
10. **Sign-out:** sign out in B, then request `/circles/<id>` and `/profile` directly and hard-refresh. No protected data should be accessible. Browser back navigation must not yield a usable authenticated view; subsequent requests/actions must require sign-in. A remains signed in. Sign back in as B and confirm persistent membership.
11. **Responsive/errors:** test at 390px and desktop width; keyboard navigation, visible focus, labels, loading states and copy feedback. If a clipboard operation is blocked, the selected text remains manually copyable. Provider/network/database failures must show errors, not successful empty responses.

## Direct hosted database checks (real account IDs only)

Use the Supabase SQL Editor as project administrator. Copy the **existing** A/B IDs from Authentication → Users and A's circle UUID; substitute them below. Do not create users or edit `auth.users`. Run each block as a single transaction and retain `ROLLBACK`. Do not run against arbitrary production participants. These checks exercise the authenticated database role; additionally the browser steps exercise the real HTTP boundary.

Before B joins, run:

```sql
begin;
select set_config('request.jwt.claim.sub', '<B-user-uuid>', true);
set local role authenticated;
select * from public.circles where id = '<A-circle-uuid>'; -- zero rows
select * from public.memberships where circle_id = '<A-circle-uuid>'; -- zero rows
select * from public.profiles where user_id = '<A-user-uuid>'; -- zero rows
rollback;
```

After B joins, run:

```sql
begin;
select set_config('request.jwt.claim.sub', '<B-user-uuid>', true);
set local role authenticated;
select user_id, display_name from public.profiles where user_id = '<A-user-uuid>'; -- one row
update public.profiles set display_name = 'SHOULD NOT SAVE'
where user_id = '<A-user-uuid>' returning user_id; -- zero rows
rollback;
```

Run these denial attempts **separately**, each inside `BEGIN` + the same B role setup, followed by `ROLLBACK` after the expected error:

```sql
insert into public.memberships(circle_id, user_id)
values ('<A-circle-uuid>', '<B-user-uuid>'); -- permission denied, not a duplicate-key result
select * from public.invitations; -- permission denied
select * from auth.users; -- permission denied
select public.create_invitation('<A-circle-uuid>'); -- creator-only error
```

Direct POST/PATCH attempts from a participant's own Supabase REST client must have the same permissions: no membership inserts, no circle updates, no other-user profile edits. Use only that participant's current access token and the public publishable key in a private test client; never the SQL Editor's admin role/service key to claim an RLS test passed. Never save/log a JWT in this repository. Inspect the browser's direct circle requests as well as these database checks; the SQL Editor does not prove PostgREST configuration.

## Recording results and blockers

Update STATUS.md separately for automated, local browser, hosted and direct database results. Record date, commit, environment/URL and remaining failures. Do not mark unrun steps passed. No Supabase access/credentials is a setup blocker, not a tested network failure. If an operation fails due to a proxy/network restriction, record the exact operation, sanitized error and environment. Continue independent checks or authorized Vercel testing. Never disable TLS, weaken RLS, add fake data or redesign storage around an executor restriction.
