-- Admin redesign data: the guest verification model, the admin overview
-- aggregates, and the sync-failure clock the overview reads.
--
-- Verification now has three kinds:
--   verified   is_chula_verified(user)                     -- unchanged logic
--   guest      profiles.guest_verified_at is not null       -- an admin let them in
--   unverified neither
--
-- Only add_minecraft_account gates on it, so the sync worker is untouched.
-- Deploy order: apply this while the old app still calls am_i_c...fied(); that
-- function stays in place here and is dropped in the follow-up migration
-- 20261004000002_drop_am_i_chula_verified.sql, after the app deploys.

-- ---------------------------------------------------------------- columns

alter table public.profiles
  add column if not exists guest_verified_at timestamptz,
  add column if not exists guest_verified_by uuid references auth.users(id) on delete set null;

-- The two columns only make sense together: a guest is somebody, marked at a
-- time. guest_verified_by is set null when that admin's account is deleted,
-- which leaves a valid guest (at is set, by is null).
alter table public.profiles drop constraint if exists profiles_guest_verified_consistent;
alter table public.profiles add constraint profiles_guest_verified_consistent
  check (guest_verified_by is null or guest_verified_at is not null);

-- New columns are deliberately not granted to authenticated; they are read
-- through the admin RPCs below, like every other admin-only field.

alter table public.minecraft_registrations add column if not exists sync_failing_since timestamptz;

-- "Oldest waiting" for the admin overview. A trigger keeps it instead of the
-- sync worker, so the worker keeps its current contract (it writes sync_status
-- and nothing else). The zz_ prefix matters: Postgres fires BEFORE triggers in
-- alphabetical name order, and this one must run *after*
-- minecraft_registrations_reset_sync_on_desired_change, which rewrites a
-- 'failed' row back to 'pending' when an admin toggles the whitelist. Without
-- the prefix, the row would be read as 'failed' and the streak would start
-- even though the worker is about to retry it.
create or replace function public.set_sync_failing_since()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.sync_status is distinct from 'failed' then
    new.sync_failing_since := null;
  elsif old.sync_status is distinct from 'failed' then
    -- First failure of this streak.
    new.sync_failing_since := now();
  end if;
  return new;
end;
$$;

drop trigger if exists minecraft_registrations_zz_failing_since on public.minecraft_registrations;
create trigger minecraft_registrations_zz_failing_since
  before update on public.minecraft_registrations
  for each row execute function public.set_sync_failing_since();

-- One-time backfill for rows that are already failing. last_sync_error_at is
-- when the worker last saw the error, not when the streak began, so this is
-- approximate for those rows only; it corrects itself on the next sync.
update public.minecraft_registrations r
  set sync_failing_since = coalesce(r.last_sync_error_at, r.updated_at)
  where r.sync_status = 'failed' and r.sync_failing_since is null;

-- ------------------------------------------------------- verification kinds

create or replace function public.is_player_verified(p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_chula_verified(p_user_id)
    or exists (select 1 from public.profiles p where p.user_id = p_user_id and p.guest_verified_at is not null);
$$;
revoke all on function public.is_player_verified(uuid) from public, anon, authenticated;
grant execute on function public.is_player_verified(uuid) to service_role;

-- Replaces am_i_c...fied(), which would now be a lie about what it checks.
create or replace function public.am_i_player_verified()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_player_verified((select auth.uid()));
$$;
revoke all on function public.am_i_player_verified() from public, anon;
grant execute on function public.am_i_player_verified() to authenticated;

-- ------------------------------------------------------------ player gate

create or replace function public.add_minecraft_account(p_user_id uuid, p_minecraft_uuid uuid, p_minecraft_username text)
returns table (id uuid, minecraft_username text, desired_whitelisted boolean, sync_status text, updated_at timestamptz, created boolean)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_user_id uuid := p_user_id;
  v_discord_id text;
  v_discord_username text;
  v_row public.minecraft_registrations%rowtype;
begin
  if v_user_id is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_minecraft_username !~ '^[A-Za-z0-9_]{3,16}$' then raise exception 'INVALID_USERNAME'; end if;

  select i.provider_id, coalesce(i.identity_data ->> 'full_name', i.identity_data ->> 'user_name', i.identity_data ->> 'name')
    into v_discord_id, v_discord_username
    from auth.identities i where i.user_id = v_user_id and i.provider = 'discord' limit 1;
  if v_discord_id is null then raise exception 'DISCORD_IDENTITY_REQUIRED'; end if;
  -- Chula-verified or a guest an admin admitted. Guests are gated by
  -- profiles.guest_verified_at, not by a claim, so they have no chula_claims row.
  if not public.is_player_verified(v_user_id) then raise exception 'CU_SSO_REQUIRED'; end if;

  -- Serialize this user's adds so two tabs can't both take the last slot.
  insert into public.profiles (user_id) values (v_user_id) on conflict do nothing;
  perform 1 from public.profiles p where p.user_id = v_user_id for update;

  select * into v_row from public.minecraft_registrations r where r.minecraft_uuid = p_minecraft_uuid;
  if found then
    -- Never reveal more than "conflict" about accounts owned by someone else.
    if v_row.user_id <> v_user_id then raise exception 'REGISTRATION_CONFLICT'; end if;
    if v_row.is_active then
      return query select v_row.id, v_row.minecraft_username, v_row.desired_whitelisted, v_row.sync_status, v_row.updated_at, false;
      return;
    end if;
    if public.revoked_by_admin(v_row.id) then raise exception 'REGISTRATION_BLOCKED'; end if;
  end if;

  if (select count(*) from public.minecraft_registrations r where r.user_id = v_user_id and r.is_active) >= 5 then
    raise exception 'LIMIT_REACHED';
  end if;

  begin
    if v_row.id is not null then
      update public.minecraft_registrations r
        set is_active = true, desired_whitelisted = true, minecraft_username = p_minecraft_username, minecraft_username_key = lower(p_minecraft_username)
        where r.id = v_row.id returning * into v_row;
      perform public.log_account_change(v_user_id, v_user_id, 'minecraft_registrations', v_row.id, 'is_active', 'false', 'true', 'self');
    else
      insert into public.minecraft_registrations (user_id, discord_user_id, discord_username, minecraft_uuid, minecraft_username, minecraft_username_key)
        values (v_user_id, v_discord_id, v_discord_username, p_minecraft_uuid, p_minecraft_username, lower(p_minecraft_username))
        returning * into v_row;
      perform public.log_account_change(v_user_id, v_user_id, 'minecraft_registrations', v_row.id, 'minecraft_username', null, p_minecraft_username, 'self');
    end if;
  exception when unique_violation then
    raise exception 'REGISTRATION_CONFLICT';
  end;

  return query select v_row.id, v_row.minecraft_username, v_row.desired_whitelisted, v_row.sync_status, v_row.updated_at, true;
end;
$$;

-- ------------------------------------------------------- admin: mark guest

-- Admins manage plain users; owners manage everyone's (same rule as
-- admin_set_whitelisted and admin_reset_chula).
create or replace function public.admin_mark_guest(p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_actor_role text := public.current_app_role();
  v_target_role text;
begin
  if v_actor_role is null or v_actor_role not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;
  select p.role into v_target_role from public.profiles p where p.user_id = p_user_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_actor_role = 'admin' and coalesce(v_target_role, 'user') <> 'user' then raise exception 'FORBIDDEN'; end if;
  -- Chula-verified already, so there is nothing to admit.
  if public.is_chula_verified(p_user_id) then raise exception 'ALREADY_VERIFIED'; end if;

  insert into public.profiles (user_id, guest_verified_at, guest_verified_by)
    values (p_user_id, now(), v_actor)
    on conflict (user_id) do update
      set guest_verified_at = excluded.guest_verified_at, guest_verified_by = excluded.guest_verified_by;

  perform public.log_account_change(v_actor, p_user_id, 'profiles', p_user_id, 'guest_verified', null, 'true', 'admin');
end;
$$;
revoke all on function public.admin_mark_guest(uuid) from public, anon;
grant execute on function public.admin_mark_guest(uuid) to authenticated;

-- Resetting the Chula link must also drop guest status, otherwise the user
-- stays verified (as a guest) and the reset silently does nothing.
create or replace function public.admin_reset_chula(p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_actor_role text := public.current_app_role();
  v_target_role text;
  v_claim public.chula_claims%rowtype;
  v_guest public.profiles%rowtype;
begin
  if v_actor_role is null or v_actor_role not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;
  select p.role into v_target_role from public.profiles p where p.user_id = p_user_id;
  if v_actor_role = 'admin' and coalesce(v_target_role, 'user') <> 'user' then raise exception 'FORBIDDEN'; end if;

  select * into v_guest from public.profiles p where p.user_id = p_user_id for update;

  delete from public.chula_claims c where c.user_id = p_user_id returning * into v_claim;
  if found then
    delete from auth.identities i where i.user_id = p_user_id and i.provider = 'google' and i.provider_id = v_claim.google_sub;
    perform public.log_account_change(v_actor, p_user_id, 'chula_claims', p_user_id, 'email', v_claim.email, null, 'admin');
  end if;

  if v_guest.guest_verified_at is not null then
    update public.profiles p set guest_verified_at = null, guest_verified_by = null where p.user_id = p_user_id;
    perform public.log_account_change(v_actor, p_user_id, 'profiles', p_user_id, 'guest_verified', 'true', null, 'admin');
  end if;

  -- A guest-only user has no claim to delete, so only raise when the reset
  -- really had nothing to act on.
  if not found and v_guest.guest_verified_at is null then raise exception 'NOT_FOUND'; end if;
end;
$$;
revoke all on function public.admin_reset_chula(uuid) from public, anon;
grant execute on function public.admin_reset_chula(uuid) to authenticated;

-- ------------------------------------------------------ admin: aggregates

-- One place to render a person for the admin UI, so the overview, the activity
-- feed and the detail page can't disagree. nickname, else first + last, else the
-- Discord display name, else the login email. Each step is nullif'd so an empty
-- string falls through to the next instead of rendering as blank.
create or replace function public.admin_display_name(p_user_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  select nullif(btrim(coalesce(
    (select p.nickname from public.profiles p where p.user_id = p_user_id),
    (select nullif(btrim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), '')
       from public.profiles p where p.user_id = p_user_id),
    (select coalesce(nullif(btrim(coalesce(i.identity_data ->> 'full_name', i.identity_data ->> 'user_name', i.identity_data ->> 'name')), ''), nullif(btrim(i.identity_data ->> 'email'), ''))
       from auth.identities i where i.user_id = p_user_id and i.provider = 'discord' limit 1),
    (select nullif(btrim(u.email::text), '') from auth.users u where u.id = p_user_id),
    '')), '');
$$;
-- Called only from the admin RPCs below (which run as the definer), so no
-- grant: a direct call would let any player read any user's name or email.
revoke all on function public.admin_display_name(uuid) from public, anon, authenticated;

-- Counts for the /admin overview. "Players" means users whose role is plain
-- 'user' (owners and admins are staff, not players), and verified / guests /
-- unverified partition exactly those players, so the three always add up.
-- ponytail: is_chula_verified runs once per player and each call does several
-- auth.identities lookups. Fine at ~200 players; if the overview ever gets
-- slow, replace it with one set-based join over auth.identities.
create or replace function public.admin_overview_stats()
returns table (
  players bigint, verified bigint, guests bigint, unverified bigint,
  whitelisted_accounts bigint, pending_sync bigint, retrying_sync bigint,
  oldest_failing_since timestamptz, removed_accounts bigint
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  return query
  with users as (
    select u.id, p.role, p.guest_verified_at, public.is_chula_verified(u.id) as chula
    from auth.users u
    left join public.profiles p on p.user_id = u.id
  ),
  regs as (
    select
      count(*) filter (where is_active and desired_whitelisted) as whitelisted,
      count(*) filter (where is_active and desired_whitelisted and sync_status = 'pending') as pending,
      count(*) filter (where is_active and desired_whitelisted and sync_status = 'failed') as retrying,
      count(*) filter (where not is_active or not desired_whitelisted) as removed,
      min(sync_failing_since) as oldest_failing
    from public.minecraft_registrations
  )
  select
    count(*) filter (where coalesce(role, 'user') = 'user'),
    count(*) filter (where coalesce(role, 'user') = 'user' and chula),
    count(*) filter (where coalesce(role, 'user') = 'user' and not chula and guest_verified_at is not null),
    count(*) filter (where coalesce(role, 'user') = 'user' and not chula and guest_verified_at is null),
    (select whitelisted from regs),
    (select pending from regs),
    (select retrying from regs),
    (select oldest_failing from regs),
    (select removed from regs)
  from users;
end;
$$;
revoke all on function public.admin_overview_stats() from public, anon;
grant execute on function public.admin_overview_stats() to authenticated;

-- Admin actions only (source = 'admin'), newest first. actor_user_id is not
-- exposed to players at all, so this RPC is the only way the UI learns who did
-- what, and it resolves the names here rather than in the browser.
create or replace function public.admin_recent_activity(p_limit int default 5)
returns table (
  created_at timestamptz, actor_name text, field text, entity text,
  old_value text, new_value text, target_user_id uuid, target_name text
)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  return query
  select l.created_at, public.admin_display_name(l.actor_user_id),
    l.field, l.entity, l.old_value, l.new_value, l.target_user_id,
    public.admin_display_name(l.target_user_id)
  from public.account_change_log l
  where l.source = 'admin'
  order by l.created_at desc, l.id desc
  limit least(greatest(coalesce(p_limit, 5), 1), 50);
end;
$$;
revoke all on function public.admin_recent_activity(int) from public, anon;
grant execute on function public.admin_recent_activity(int) to authenticated;

-- Newest players for the hub, so an admin sees arrivals without searching.
create or replace function public.admin_newest_players(p_limit int default 5)
returns table (
  user_id uuid, display_name text, handle text, verification_kind text, created_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_limit int := least(greatest(coalesce(p_limit, 5), 1), 50);
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  return query
  select u.id, public.admin_display_name(u.id),
    coalesce(d.name, u.email::text),
    case when public.is_chula_verified(u.id) then 'verified'
         when p.guest_verified_at is not null then 'guest'
         else 'unverified' end,
    u.created_at
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  left join lateral (
    select coalesce(i.identity_data ->> 'full_name', i.identity_data ->> 'user_name', i.identity_data ->> 'name') as name
    from auth.identities i where i.user_id = u.id and i.provider = 'discord' limit 1
  ) d on true
  where coalesce(p.role, 'user') = 'user'
  order by u.created_at desc, u.id
  limit v_limit;
end;
$$;
revoke all on function public.admin_newest_players(int) from public, anon;
grant execute on function public.admin_newest_players(int) to authenticated;

-- ----------------------------------------------------- admin: reads updated

-- Return column added, so drop first (same as 20260927000001).
drop function if exists public.admin_search_users(text);
create function public.admin_search_users(p_query text)
returns table (user_id uuid, role text, email text, discord_username text, chula_email text, minecraft_usernames text, verification_kind text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_pattern text := '%' || replace(replace(replace(coalesce(trim(p_query), ''), '\\', '\\\\'), '%', '\%'), '_', '\_') || '%';
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  return query
  select u.id, coalesce(p.role, 'user'), u.email::text, d.name, c.email,
    (select string_agg(r.minecraft_username, ', ' order by r.created_at)
       from public.minecraft_registrations r where r.user_id = u.id and r.is_active),
    case when public.is_chula_verified(u.id) then 'verified'
         when p.guest_verified_at is not null then 'guest'
         else 'unverified' end,
    u.created_at
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  left join public.chula_claims c on c.user_id = u.id
  left join lateral (
    select coalesce(i.identity_data ->> 'full_name', i.identity_data ->> 'user_name', i.identity_data ->> 'name') as name
    from auth.identities i where i.user_id = u.id and i.provider = 'discord' limit 1
  ) d on true
  where v_pattern = '%%'
    or u.email ilike v_pattern or d.name ilike v_pattern or c.email ilike v_pattern
    or exists (select 1 from auth.identities g where g.user_id = u.id and g.provider = 'google' and g.identity_data ->> 'email' ilike v_pattern)
    or exists (select 1 from public.minecraft_registrations r where r.user_id = u.id and r.minecraft_username ilike v_pattern)
  order by u.created_at desc
  limit 50;
end;
$$;
revoke all on function public.admin_search_users(text) from public, anon;
grant execute on function public.admin_search_users(text) to authenticated;

create or replace function public.admin_get_user(p_user_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  return jsonb_build_object(
    'user', (select jsonb_build_object('id', u.id, 'email', u.email, 'created_at', u.created_at, 'role', coalesce(p.role, 'user'))
             from auth.users u left join public.profiles p on p.user_id = u.id where u.id = p_user_id),
    -- Scalar subqueries, not bare column references: this function has no FROM.
    'verification_kind', case
      when public.is_chula_verified(p_user_id) then 'verified'
      when exists (select 1 from public.profiles p
                   where p.user_id = p_user_id and p.guest_verified_at is not null) then 'guest'
      else 'unverified' end,
    'discord', (select jsonb_build_object('id', i.provider_id, 'username',
                  coalesce(i.identity_data ->> 'full_name', i.identity_data ->> 'user_name', i.identity_data ->> 'name'))
                from auth.identities i where i.user_id = p_user_id and i.provider = 'discord' limit 1),
    'chula', (select jsonb_build_object('email', c.email, 'claimed_at', c.claimed_at)
              from public.chula_claims c where c.user_id = p_user_id),
    'guest', (select jsonb_build_object('verified_at', p.guest_verified_at, 'verified_by_name', public.admin_display_name(p.guest_verified_by))
              from public.profiles p
              where p.user_id = p_user_id and p.guest_verified_at is not null),
    'google', coalesce((
      select jsonb_agg(jsonb_build_object('email', i.identity_data ->> 'email', 'linked_at', i.created_at) order by i.created_at)
      from auth.identities i where i.user_id = p_user_id and i.provider = 'google'), '[]'::jsonb),
    'registrations', coalesce((
      select jsonb_agg(jsonb_build_object('id', r.id, 'minecraft_username', r.minecraft_username, 'minecraft_uuid', r.minecraft_uuid,
               'desired_whitelisted', r.desired_whitelisted, 'is_active', r.is_active, 'sync_status', r.sync_status,
               'sync_failing_since', r.sync_failing_since, 'updated_at', r.updated_at) order by r.created_at)
      from public.minecraft_registrations r where r.user_id = p_user_id), '[]'::jsonb),
    'log', coalesce((
      select jsonb_agg(to_jsonb(l) order by l.created_at desc)
      from (select * from public.account_change_log x where x.target_user_id = p_user_id order by x.created_at desc limit 100) l), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.admin_get_user(uuid) from public, anon;
grant execute on function public.admin_get_user(uuid) to authenticated;

-- ponytail: guest_verified_by is readable only through admin_get_user, so no
-- new grant on profiles. Deliberately not indexed: at ~200 players the
-- sequential scans behind admin_overview_stats are instant.