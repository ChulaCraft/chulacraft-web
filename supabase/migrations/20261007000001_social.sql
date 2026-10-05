-- Phase B: privacy settings, friendships, blocks, and the search that finds
-- players (AC 14, 16-22).
--
-- Two ideas carry the whole file.
--
-- 1. player_card(viewer, target) is the ONLY place public output is built. It
--    is ungranted, so a caller can never hand it to itself: search_players and
--    get_player_profile both funnel through it. Every key is decided by one
--    can_view() check, which is why a column cannot appear by accident — adding
--    one to this function is the only way to leak it, and social.test.sql pins
--    the key set and scans the values.
--
-- 2. Nothing here is derived from profiles.nickname, first_name, last_name,
--    faculty, chula_claims.email or any auth.users field. player_display_name
--    reads the Discord identity and falls back to the literal 'Player'. That
--    is a PDPA decision (AC 21), not a display preference.

-- ------------------------------------------------------------ default grants

-- Re-applied verbatim from 20261006000001:31 and 20261006000002:20 on purpose:
-- the schema-scoped form is the one this database applies, so a fresh reset
-- starts from the same footing the allowlist test describes.
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;

-- ------------------------------------------------------------------ tables

-- No row means "all public" (AC 19), which is why the defaults live in the
-- checks rather than in an insert here.
create table if not exists public.privacy_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile text not null default 'public' check (profile in ('public', 'friends', 'private')),
  minecraft text not null default 'public' check (minecraft in ('public', 'friends', 'private')),
  achievements text not null default 'public' check (achievements in ('public', 'friends', 'private')),
  friends text not null default 'public' check (friends in ('public', 'friends', 'private')),
  updated_at timestamptz not null default now()
);

-- One row per ordered pair; the unique unordered index below is what stops a
-- pending request and its reverse from existing at once, so D4 (mutual request)
-- has to update the existing row rather than insert a second one.
create table if not exists public.friendships (
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  constraint friendships_not_self check (requester_id <> addressee_id)
);

create unique index if not exists friendships_unordered_pair_idx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create table if not exists public.blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);

alter table public.privacy_settings enable row level security;
alter table public.friendships enable row level security;
alter table public.blocks enable row level security;
-- No policies on purpose: the definer functions below are the only path in, and
-- a policy here would be a second place to get privacy wrong.
revoke all on public.privacy_settings from anon, authenticated;
revoke all on public.friendships from anon, authenticated;
revoke all on public.blocks from anon, authenticated;
grant select on public.privacy_settings, public.friendships, public.blocks to service_role;

-- ---------------------------------------------------------- the name source

-- Discord identity only. nickname / first_name / last_name / faculty / email
-- are deliberately unreachable from here: they are what a PDPA complaint would
-- be about, and the fallback is an honest 'Player' rather than a leak.
create or replace function public.player_display_name(p_user uuid) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select nullif(btrim(coalesce(i.identity_data ->> 'full_name', i.identity_data ->> 'user_name', i.identity_data ->> 'name', '')), '')
    from auth.identities i
    where i.user_id = p_user and i.provider = 'discord'
    order by i.created_at
    limit 1
  ), 'Player');
$$;
revoke all on function public.player_display_name(uuid) from public, anon, authenticated;

create or replace function public.player_avatar(p_user uuid) returns text
language sql stable security definer set search_path = '' as $$
  select (
    select i.identity_data ->> 'avatar_url'
    from auth.identities i
    where i.user_id = p_user and i.provider = 'discord'
    order by i.created_at
    limit 1
  );
$$;
revoke all on function public.player_avatar(uuid) from public, anon, authenticated;

-- --------------------------------------------------------------- the graph

-- Symmetric: a block hides you from the blocker exactly as it hides the blocker
-- from you, and search/profile/requests all ask this one question.
create or replace function public.is_blocked_either(p_a uuid, p_b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_a is not null and p_b is not null and exists (
    select 1 from public.blocks b
    where (b.blocker_id = p_a and b.blocked_id = p_b)
       or (b.blocker_id = p_b and b.blocked_id = p_a)
  );
$$;
revoke all on function public.is_blocked_either(uuid, uuid) from public, anon, authenticated;

-- Accepted only: a pending request is not friendship yet, which is why a
-- friends-only field stays hidden from somebody you have merely asked.
create or replace function public.are_friends(p_a uuid, p_b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_a is not null and p_b is not null and p_a <> p_b and exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = p_a and f.addressee_id = p_b)
        or (f.requester_id = p_b and f.addressee_id = p_a))
  );
$$;
revoke all on function public.are_friends(uuid, uuid) from public, anon, authenticated;

-- The most restrictive of the profile-level setting and the field's own
-- setting: 'private' profile hides the Minecraft names even when the field is
-- public, and a friends-only field is still hidden from strangers behind a
-- public profile.
--
-- An unknown field name resolves to 'private' so that a typo in a future
-- caller cannot open a field by accident (fail closed, AC 22).
create or replace function public.privacy_level(p_user uuid, p_field text) returns text
language plpgsql stable security definer set search_path = '' as $$
declare
  v_settings public.privacy_settings%rowtype;
  v_field text;
begin
  select * into v_settings from public.privacy_settings s where s.user_id = p_user;
  if not found then return 'public'; end if;

  v_field := case p_field
    when 'profile' then 'public'
    when 'minecraft' then v_settings.minecraft
    when 'achievements' then v_settings.achievements
    when 'friends' then v_settings.friends
    else 'private'
  end;

  if v_settings.profile = 'private' or v_field = 'private' then return 'private'; end if;
  if v_settings.profile = 'friends' or v_field = 'friends' then return 'friends'; end if;
  return 'public';
end;
$$;
revoke all on function public.privacy_level(uuid, text) from public, anon, authenticated;

-- Self always sees everything, even a private profile: it is their own data.
create or replace function public.can_view(p_viewer uuid, p_target uuid, p_field text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  v_level text;
begin
  if p_target is null then return false; end if;
  if p_viewer is not null and p_viewer = p_target then return true; end if;
  if p_viewer is null then return false; end if;

  v_level := public.privacy_level(p_target, p_field);
  if v_level = 'public' then return true; end if;
  if v_level = 'friends' then return public.are_friends(p_viewer, p_target); end if;
  return false;
end;
$$;
revoke all on function public.can_view(uuid, uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------- the card

-- THE whitelist. Nothing else in the database builds output for another player.
--
-- Always: user_id, display_name, avatar_url, hidden, relationship — enough for
-- AC 20's hidden view (avatar + name + Add/Block) and nothing more. Each
-- optional section is behind its own can_view() and is omitted entirely rather
-- than nulled, so "absent" and "empty" stay distinguishable in the key-set test.
create or replace function public.player_card(p_viewer uuid, p_target uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_card jsonb;
  v_friends jsonb;
  v_relationship text;
begin
  v_relationship := case
    when p_viewer is not null and p_viewer = p_target then 'self'
    when public.is_blocked_either(p_viewer, p_target) then case
      when exists (select 1 from public.blocks b where b.blocker_id = p_target and b.blocked_id = p_viewer)
        then 'blocked_me' else 'blocked_by_me' end
    when public.are_friends(p_viewer, p_target) then 'friend'
    when exists (select 1 from public.friendships f
                 where f.requester_id = p_viewer and f.addressee_id = p_target and f.status = 'pending')
      then 'outgoing'
    when exists (select 1 from public.friendships f
                 where f.requester_id = p_target and f.addressee_id = p_viewer and f.status = 'pending')
      then 'incoming'
    else 'none'
  end;

  v_card := jsonb_build_object(
    'user_id', p_target,
    'display_name', public.player_display_name(p_target),
    'avatar_url', public.player_avatar(p_target),
    -- Hidden means the profile itself is out of reach; the name and avatar are
    -- what AC 20 asks for and are not personal data on their own.
    'hidden', not public.can_view(p_viewer, p_target, 'profile'),
    'relationship', v_relationship
  );

  if (v_card ->> 'hidden') = 'true' then return v_card; end if;

  if public.can_view(p_viewer, p_target, 'minecraft') then
    v_card := v_card || jsonb_build_object('minecraft_names', coalesce((
      select jsonb_agg(r.minecraft_username order by r.created_at, r.minecraft_username)
      from public.minecraft_registrations r
      where r.user_id = p_target and r.is_active
    ), '[]'::jsonb));
  end if;

  -- Reused from Phase A rather than reimplemented: published achievements only,
  -- and an entry names its event only when that event is published.
  if public.can_view(p_viewer, p_target, 'achievements') then
    v_card := v_card || jsonb_build_object('achievements', public.achievement_groups(p_target));
  end if;

  if public.can_view(p_viewer, p_target, 'friends') then
    -- A friend the viewer cannot see is not listed at all, and neither is
    -- anybody blocked either way. friend_count is the length of this same
    -- filtered list, so the number can never disagree with the names.
    select coalesce(jsonb_agg(jsonb_build_object(
             'user_id', f.other,
             'display_name', public.player_display_name(f.other),
             'avatar_url', public.player_avatar(f.other))
           order by public.player_display_name(f.other), f.other), '[]'::jsonb)
    into v_friends
    from (
      select case when x.requester_id = p_target then x.addressee_id else x.requester_id end as other
      from public.friendships x
      where x.status = 'accepted' and (x.requester_id = p_target or x.addressee_id = p_target)
    ) f
    where public.can_view(p_viewer, f.other, 'profile')
      and not public.is_blocked_either(p_viewer, f.other);

    v_card := v_card || jsonb_build_object(
      'friends', v_friends,
      'friend_count', jsonb_array_length(v_friends)
    );
  end if;

  return v_card;
end;
$$;
-- Ungranted on purpose: only the functions below may call it, so a caller can
-- never choose a pair (viewer, target) that bypasses their own search.
revoke all on function public.player_card(uuid, uuid) from public, anon, authenticated;

-- ------------------------------------------------------------------ search

-- AC 16, D2. Two matching rules, and the difference between them is the point:
--
--   public profile  -> display name or active Minecraft name ILIKE (2 chars+)
--   hidden profile  -> an exact case-insensitive Minecraft name only
--
-- Somebody who hides their profile can still be found by someone who already
-- knows their Minecraft name, which is how you keep a public identity reachable
-- without letting a stranger sweep the Discord-name list. Accepted friends match
-- either way, since they have already cleared the gate.
create or replace function public.search_players(p_q text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_viewer uuid := auth.uid();
  v_exact text := lower(btrim(coalesce(p_q, '')));
  v_pattern text;
begin
  if v_viewer is null then raise exception 'FORBIDDEN'; end if;
  if char_length(v_exact) < 2 then return '[]'::jsonb; end if;

  -- % and _ are wildcards in ILIKE, so a query containing them is escaped: a
  -- search for "a_b" must not match "aXb".
  v_pattern := '%' || replace(replace(replace(v_exact, '\', '\\'), '%', '\%'), '_', '\_') || '%';

  -- The heavy keys (minecraft_names, achievements, friends) are stripped: a
  -- result row needs a name and an avatar to render, and the profile page
  -- re-reads the card under a full permission check anyway.
  return coalesce((
    select jsonb_agg(hits.row_c order by hits.row_c ->> 'display_name', hits.row_c ->> 'user_id')
    from (
      select public.player_card(v_viewer, u.id)
               - 'minecraft_names' - 'achievements' - 'friends' - 'friend_count' as row_c
      from auth.users u
      where u.id <> v_viewer
        and not public.is_blocked_either(v_viewer, u.id)
        -- (a) a public profile matches loosely, or
        -- (b) somebody you are already friends with matches loosely, or
        -- (c) any profile matches an exact, case-insensitive Minecraft username.
        and (
          (
            (public.privacy_level(u.id, 'profile') = 'public'
              or public.are_friends(v_viewer, u.id))
            and (
              public.player_display_name(u.id) ilike v_pattern
              -- A loose match on Minecraft names only when the viewer may see
              -- them; otherwise substring probes would reveal hidden names.
              or (public.can_view(v_viewer, u.id, 'minecraft') and exists (
                    select 1 from public.minecraft_registrations r
                    where r.user_id = u.id and r.is_active
                      and r.minecraft_username ilike v_pattern))
            )
          )
          or exists (select 1 from public.minecraft_registrations r
                     where r.user_id = u.id and r.is_active
                       and lower(r.minecraft_username) = v_exact)
        )
      order by public.player_display_name(u.id), u.id
      limit 20
    ) hits
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.search_players(text) from public, anon;
grant execute on function public.search_players(text) to authenticated;

-- ------------------------------------------------------------- the profile

-- AC 18: a profile that does not exist and a profile you are blocked from (or
-- that blocks you) raise the same NOT_FOUND, so the address cannot be probed
-- for existence. The card itself still decides what the caller may see.
create or replace function public.get_player_profile(p_user_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_viewer uuid := auth.uid();
begin
  if v_viewer is null then raise exception 'FORBIDDEN'; end if;
  if not exists (select 1 from auth.users u where u.id = p_user_id) then raise exception 'NOT_FOUND'; end if;
  if public.is_blocked_either(v_viewer, p_user_id) then raise exception 'NOT_FOUND'; end if;

  return public.player_card(v_viewer, p_user_id);
end;
$$;
revoke all on function public.get_player_profile(uuid) from public, anon;
grant execute on function public.get_player_profile(uuid) to authenticated;

-- ------------------------------------------------------- friendship writes

-- The actor always comes from the JWT, so nobody can send a request, accept a
-- request or block on somebody else's behalf.
create or replace function public.send_friend_request(p_other uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_viewer uuid := auth.uid();
  v_status text;
begin
  if v_viewer is null then raise exception 'FORBIDDEN'; end if;
  if p_other is null or p_other = v_viewer then raise exception 'INVALID_TARGET'; end if;
  if not exists (select 1 from auth.users u where u.id = p_other) then raise exception 'NOT_FOUND'; end if;
  -- Same NOT_FOUND as a missing account: a block must not confirm that the
  -- blocked user exists.
  if public.is_blocked_either(v_viewer, p_other) then raise exception 'NOT_FOUND'; end if;
  if public.are_friends(v_viewer, p_other) then raise exception 'ALREADY_FRIENDS'; end if;

  -- D4: the other side already asked, so this is an accept, not a second
  -- request. The unordered unique index would otherwise reject the insert.
  update public.friendships f
    set status = 'accepted'
    where f.requester_id = p_other and f.addressee_id = v_viewer and f.status = 'pending';
  if found then return 'accepted'; end if;

  -- Already waiting on our own request: idempotent, so a double click does not
  -- produce an error page.
  select f.status into v_status from public.friendships f
    where f.requester_id = v_viewer and f.addressee_id = p_other and f.status = 'pending';
  if found then return 'pending'; end if;

  if (select count(*)::int from public.friendships f
      where f.requester_id = v_viewer and f.addressee_id <> p_other and f.status = 'pending') >= 50 then
    raise exception 'TOO_MANY_REQUESTS';
  end if;

  insert into public.friendships (requester_id, addressee_id, status)
  values (v_viewer, p_other, 'pending');

  return 'pending';
end;
$$;
revoke all on function public.send_friend_request(uuid) from public, anon;
grant execute on function public.send_friend_request(uuid) to authenticated;

-- Only the addressee can answer, and only a request that is still pending:
-- a request answered twice, or one already accepted by D4, is NOT_FOUND rather
-- than a silent second write.
create or replace function public.respond_friend_request(p_requester uuid, p_accept boolean)
returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_viewer uuid := auth.uid();
  v_changed int;
begin
  if v_viewer is null then raise exception 'FORBIDDEN'; end if;
  if p_requester is null or p_requester = v_viewer then raise exception 'INVALID_TARGET'; end if;
  if public.is_blocked_either(v_viewer, p_requester) then raise exception 'NOT_FOUND'; end if;

  if p_accept then
    update public.friendships f set status = 'accepted'
      where f.requester_id = p_requester and f.addressee_id = v_viewer and f.status = 'pending';
  else
    delete from public.friendships f
      where f.requester_id = p_requester and f.addressee_id = v_viewer;
  end if;
  get diagnostics v_changed = row_count;
  if v_changed = 0 then raise exception 'NOT_FOUND'; end if;

  return v_changed;
end;
$$;
revoke all on function public.respond_friend_request(uuid, boolean) from public, anon;
grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;

-- Cancels a request, declines an incoming one, or unfriends: one action for
-- all three, because in each case one row goes away. Both directions, since
-- the caller may be either side of the pair.
create or replace function public.remove_friend(p_other uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_viewer uuid := auth.uid();
  v_changed int;
begin
  if v_viewer is null then raise exception 'FORBIDDEN'; end if;
  if p_other is null or p_other = v_viewer then raise exception 'INVALID_TARGET'; end if;

  delete from public.friendships f
    where (f.requester_id = v_viewer and f.addressee_id = p_other)
       or (f.requester_id = p_other and f.addressee_id = v_viewer);
  get diagnostics v_changed = row_count;

  return v_changed;
end;
$$;
revoke all on function public.remove_friend(uuid) from public, anon;
grant execute on function public.remove_friend(uuid) to authenticated;

-- AC 18: blocking cuts the friendship, in either direction and whatever its
-- status, so the blocked player cannot keep reading a profile they just lost
-- access to.
create or replace function public.block_player(p_other uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_viewer uuid := auth.uid();
begin
  if v_viewer is null then raise exception 'FORBIDDEN'; end if;
  if p_other is null or p_other = v_viewer then raise exception 'INVALID_TARGET'; end if;
  if not exists (select 1 from auth.users u where u.id = p_other) then raise exception 'NOT_FOUND'; end if;

  insert into public.blocks (blocker_id, blocked_id) values (v_viewer, p_other)
    on conflict (blocker_id, blocked_id) do nothing;

  delete from public.friendships f
    where (f.requester_id = v_viewer and f.addressee_id = p_other)
       or (f.requester_id = p_other and f.addressee_id = v_viewer);

  return 1;
end;
$$;
revoke all on function public.block_player(uuid) from public, anon;
grant execute on function public.block_player(uuid) to authenticated;

create or replace function public.unblock_player(p_other uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_viewer uuid := auth.uid();
  v_changed int;
begin
  if v_viewer is null then raise exception 'FORBIDDEN'; end if;
  if p_other is null or p_other = v_viewer then raise exception 'INVALID_TARGET'; end if;

  delete from public.blocks b where b.blocker_id = v_viewer and b.blocked_id = p_other;
  get diagnostics v_changed = row_count;

  return v_changed;
end;
$$;
revoke all on function public.unblock_player(uuid) from public, anon;
grant execute on function public.unblock_player(uuid) to authenticated;

-- ------------------------------------------------------------ the social list

-- The dashboard's own graph. Every entry is the caller's own relationship, and
-- every name comes from player_display_name, so no email or real name can ride
-- along here either.
create or replace function public.my_social() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'incoming', coalesce((
      select jsonb_agg(jsonb_build_object(
               'user_id', f.requester_id,
               'display_name', public.player_display_name(f.requester_id),
               'avatar_url', public.player_avatar(f.requester_id),
               'created_at', f.created_at)
             order by f.created_at, f.requester_id)
      from public.friendships f
      where f.addressee_id = auth.uid() and f.status = 'pending'
    ), '[]'::jsonb),
    'outgoing', coalesce((
      select jsonb_agg(jsonb_build_object(
               'user_id', f.addressee_id,
               'display_name', public.player_display_name(f.addressee_id),
               'avatar_url', public.player_avatar(f.addressee_id),
               'created_at', f.created_at)
             order by f.created_at, f.addressee_id)
      from public.friendships f
      where f.requester_id = auth.uid() and f.status = 'pending'
    ), '[]'::jsonb),
    'friends', coalesce((
      select jsonb_agg(jsonb_build_object(
               'user_id', f.other,
               'display_name', public.player_display_name(f.other),
               'avatar_url', public.player_avatar(f.other))
             order by public.player_display_name(f.other), f.other)
      from (
        select case when x.requester_id = auth.uid() then x.addressee_id else x.requester_id end as other
        from public.friendships x
        where x.status = 'accepted' and (x.requester_id = auth.uid() or x.addressee_id = auth.uid())
      ) f
    ), '[]'::jsonb),
    'blocked', coalesce((
      select jsonb_agg(jsonb_build_object(
               'user_id', b.blocked_id,
               'display_name', public.player_display_name(b.blocked_id),
               'avatar_url', public.player_avatar(b.blocked_id),
               'created_at', b.created_at)
             order by b.created_at, b.blocked_id)
      from public.blocks b where b.blocker_id = auth.uid()
    ), '[]'::jsonb)
  );
$$;
revoke all on function public.my_social() from public, anon;
grant execute on function public.my_social() to authenticated;

-- --------------------------------------------------------------- the settings

-- Level names are checked here as well as by the column constraint, so a
-- tampered form gets INVALID_LEVEL rather than a 23514 the page cannot read.
create or replace function public.update_privacy(
  p_profile text, p_minecraft text, p_achievements text, p_friends text
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'FORBIDDEN'; end if;
  if coalesce(p_profile, '') not in ('public', 'friends', 'private')
     or coalesce(p_minecraft, '') not in ('public', 'friends', 'private')
     or coalesce(p_achievements, '') not in ('public', 'friends', 'private')
     or coalesce(p_friends, '') not in ('public', 'friends', 'private') then
    raise exception 'INVALID_LEVEL';
  end if;

  insert into public.privacy_settings as s (user_id, profile, minecraft, achievements, friends, updated_at)
  values (v_user, p_profile, p_minecraft, p_achievements, p_friends, now())
  on conflict (user_id) do update
    set profile = excluded.profile,
        minecraft = excluded.minecraft,
        achievements = excluded.achievements,
        friends = excluded.friends,
        updated_at = now();
end;
$$;
revoke all on function public.update_privacy(text, text, text, text) from public, anon;
grant execute on function public.update_privacy(text, text, text, text) to authenticated;

-- A missing row reads back as all-public, which is what the page shows before
-- the player has ever touched a setting.
create or replace function public.my_privacy() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'profile', coalesce((select s.profile from public.privacy_settings s where s.user_id = auth.uid()), 'public'),
    'minecraft', coalesce((select s.minecraft from public.privacy_settings s where s.user_id = auth.uid()), 'public'),
    'achievements', coalesce((select s.achievements from public.privacy_settings s where s.user_id = auth.uid()), 'public'),
    'friends', coalesce((select s.friends from public.privacy_settings s where s.user_id = auth.uid()), 'public')
  );
$$;
revoke all on function public.my_privacy() from public, anon;
grant execute on function public.my_privacy() to authenticated;