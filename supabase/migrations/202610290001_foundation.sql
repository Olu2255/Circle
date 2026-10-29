-- Apply once through migration history. No seeds, auth-user creation, or destructive resets.
begin;

create function public.valid_availability(value jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare item jsonb; other jsonb; i int; j int;
begin
  if jsonb_typeof(value) <> 'array' or jsonb_array_length(value) not between 1 and 14 then return false; end if;
  for i in 0..jsonb_array_length(value)-1 loop
    item := value->i;
    if jsonb_typeof(item) <> 'object' or not (item ?& array['day','start','end']) then return false; end if;
    if jsonb_typeof(item->'day') <> 'number' or (item->>'day') !~ '^[0-6]$' then return false; end if;
    if jsonb_typeof(item->'start') <> 'string' or jsonb_typeof(item->'end') <> 'string' then return false; end if;
    if (item->>'start') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or (item->>'end') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then return false; end if;
    if item->>'start' >= item->>'end' then return false; end if;
    if i > 0 then
      for j in 0..i-1 loop
        other := value->j;
        if item->>'day' = other->>'day' and item->>'start' < other->>'end' and other->>'start' < item->>'end' then return false; end if;
      end loop;
    end if;
  end loop;
  return true;
exception when others then return false;
end;
$$;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 60),
  goal text not null check (char_length(btrim(goal)) between 10 and 500),
  experience text not null check (char_length(btrim(experience)) between 10 and 1000),
  skills text not null check (char_length(btrim(skills)) between 2 and 500),
  timezone text not null check (char_length(timezone) between 1 and 100),
  availability jsonb not null check (public.valid_availability(availability)),
  updated_at timestamptz not null default now()
);

create function public.check_profile() returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'Choose a valid timezone.' using errcode = '22023';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger check_profile before insert or update on public.profiles for each row execute function public.check_profile();

create table public.circles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 3 and 60),
  description text not null check (char_length(btrim(description)) between 10 and 500),
  owner_id uuid not null references public.profiles(user_id),
  created_at timestamptz not null default now()
);
create table public.memberships (
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id),
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);
create index memberships_user_idx on public.memberships(user_id);
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  token_hash bytea not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index invitations_circle_idx on public.invitations(circle_id);

-- These helpers avoid recursive membership policies. They reveal only access booleans.
create function public.is_circle_member(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.memberships where circle_id = target and user_id = auth.uid());
$$;
create function public.can_view_profile(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select target = auth.uid() or exists (
    select 1 from public.memberships mine join public.memberships theirs using (circle_id)
    where mine.user_id = auth.uid() and theirs.user_id = target
  );
$$;

alter table public.profiles enable row level security;
alter table public.circles enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;

create policy profiles_read on public.profiles for select to authenticated using (public.can_view_profile(user_id));
create policy profiles_insert_own on public.profiles for insert to authenticated with check (user_id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy circles_members_only on public.circles for select to authenticated using (public.is_circle_member(id));
create policy memberships_members_only on public.memberships for select to authenticated using (public.is_circle_member(circle_id));
-- No client policy or table grant permits invitation reads or membership/circle writes.

create function public.create_circle(circle_name text, circle_description text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); result uuid;
begin
  if actor is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if not exists (select 1 from public.profiles where user_id = actor) then
    raise exception 'Complete your profile first.' using errcode = '22023';
  end if;
  insert into public.circles(name, description, owner_id) values (btrim(circle_name), btrim(circle_description), actor) returning id into result;
  insert into public.memberships(circle_id, user_id) values (result, actor);
  return result;
end;
$$;

create function public.create_invitation(target_circle uuid) returns table (code text, expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare raw_token text; expiry timestamptz := now() + interval '7 days';
begin
  -- Lock the circle to serialize generation, revocation, and redemption.
  perform 1 from public.circles where id = target_circle and owner_id = auth.uid() for update;
  if not found then raise exception 'Only the circle creator can manage invitations.' using errcode = '42501'; end if;
  if (select count(*) from public.memberships where circle_id = target_circle) >= 6 then
    raise exception 'This circle is full (six members).' using errcode = '22023';
  end if;
  update public.invitations set revoked_at = now() where circle_id = target_circle and revoked_at is null;
  raw_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into public.invitations(circle_id, token_hash, expires_at) values (target_circle, sha256(convert_to(raw_token, 'UTF8')), expiry);
  return query select raw_token, expiry;
end;
$$;

create function public.revoke_invitations(target_circle uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.circles where id = target_circle and owner_id = auth.uid() for update;
  if not found then raise exception 'Only the circle creator can manage invitations.' using errcode = '42501'; end if;
  update public.invitations set revoked_at = now() where circle_id = target_circle and revoked_at is null;
end;
$$;

create function public.redeem_invitation(invitation_code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); invitation public.invitations; target uuid;
begin
  if actor is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if not exists (select 1 from public.profiles where user_id = actor) then
    raise exception 'Complete your profile first.' using errcode = '22023';
  end if;
  if invitation_code is null or invitation_code !~ '^[0-9a-f]{64}$' then
    raise exception 'Invitation is invalid, expired or revoked.' using errcode = '22023';
  end if;
  select circle_id into target from public.invitations where token_hash = sha256(convert_to(invitation_code, 'UTF8'));
  if target is null then raise exception 'Invitation is invalid, expired or revoked.' using errcode = '22023'; end if;
  perform 1 from public.circles where id = target for update;
  select * into invitation from public.invitations where token_hash = sha256(convert_to(invitation_code, 'UTF8'));
  if invitation.revoked_at is not null or invitation.expires_at <= clock_timestamp() then
    raise exception 'Invitation is invalid, expired or revoked.' using errcode = '22023';
  end if;
  if exists (select 1 from public.memberships where circle_id = target and user_id = actor) then return target; end if;
  if (select count(*) from public.memberships where circle_id = target) >= 6 then
    raise exception 'This circle is full (six members).' using errcode = '22023';
  end if;
  insert into public.memberships(circle_id, user_id) values (target, actor);
  return target;
end;
$$;

-- Supabase defaults may grant more than needed: reset table and function access explicitly.
revoke all on public.profiles, public.circles, public.memberships, public.invitations from public, anon, authenticated;
grant select, insert on public.profiles to authenticated;
grant update (display_name, goal, experience, skills, timezone, availability) on public.profiles to authenticated;
grant select on public.circles, public.memberships to authenticated;
revoke all on function public.valid_availability(jsonb), public.check_profile(), public.is_circle_member(uuid), public.can_view_profile(uuid), public.create_circle(text,text), public.create_invitation(uuid), public.revoke_invitations(uuid), public.redeem_invitation(text) from public, anon, authenticated;
grant execute on function public.valid_availability(jsonb), public.is_circle_member(uuid), public.can_view_profile(uuid), public.create_circle(text,text), public.create_invitation(uuid), public.revoke_invitations(uuid), public.redeem_invitation(text) to authenticated;

commit;
