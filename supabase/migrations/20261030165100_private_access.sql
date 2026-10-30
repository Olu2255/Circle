-- Forward-only hardening. Move privileged implementations out of exposed API schemas.
begin;

create schema circle_private;
revoke all on schema circle_private from public, anon, authenticated;
grant usage on schema circle_private to authenticated;

-- Existing policy dependencies follow these function OIDs into the private schema.
alter function public.is_circle_member(uuid) set schema circle_private;
alter function public.can_view_profile(uuid) set schema circle_private;
alter function public.create_circle(text, text) set schema circle_private;
alter function public.create_invitation(uuid) set schema circle_private;
alter function public.revoke_invitations(uuid) set schema circle_private;
alter function public.redeem_invitation(text) set schema circle_private;

-- The public API exposes invoker wrappers only. Identity checks and row locks
-- remain in the private implementations; direct table-write grants stay denied.
create function public.create_circle(circle_name text, circle_description text) returns uuid
language sql security invoker set search_path = '' as $$
  select circle_private.create_circle(circle_name, circle_description);
$$;
create function public.create_invitation(target_circle uuid) returns table (code text, expires_at timestamptz)
language sql security invoker set search_path = '' as $$
  select * from circle_private.create_invitation(target_circle);
$$;
create function public.revoke_invitations(target_circle uuid) returns void
language sql security invoker set search_path = '' as $$
  select circle_private.revoke_invitations(target_circle);
$$;
create function public.redeem_invitation(invitation_code text) returns uuid
language sql security invoker set search_path = '' as $$
  select circle_private.redeem_invitation(invitation_code);
$$;

revoke all on all functions in schema circle_private from public, anon, authenticated;
grant execute on all functions in schema circle_private to authenticated;
revoke all on function public.create_circle(text,text), public.create_invitation(uuid), public.revoke_invitations(uuid), public.redeem_invitation(text) from public, anon, authenticated;
grant execute on function public.create_circle(text,text), public.create_invitation(uuid), public.revoke_invitations(uuid), public.redeem_invitation(text) to authenticated;

create index circles_owner_idx on public.circles(owner_id);

commit;
