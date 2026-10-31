-- v1.1 Phase 5 C: event attendance by QR.
--
-- Two ways in, both verified players only:
--   * the player scans the event's rotating QR (check_in), or
--   * staff scan the player's personal code (admin_check_in_player).
-- Check-in records attendance only; staff award attendees in one click
-- (admin_award_attendees).
--
-- Token = '<window>.<mac>', window = floor(epoch / 30), mac = first 16 bytes
-- of HMAC-SHA256('token:<event>:<window>', per-event secret), base64url. The
-- current and previous window are accepted (max life 60 s). The QR points at
-- a route handler that trades the token for a proof 'p.<expires>.<mac>' over
-- 'proof:<event>:<expires>', valid 5 minutes, kept in a cookie while the
-- player signs in. Different prefixes, so a token mac never passes as a proof
-- or the reverse. Rotating the secret kills both at once.
--
-- Check-in is open from starts_at - 15 min to coalesce(ends_at, starts_at)
-- + 15 min (checkin_open), the same rule for every path.

do $$
begin
  if (select n.nspname from pg_extension e join pg_namespace n on n.oid = e.extnamespace where e.extname = 'pgcrypto')
     is distinct from 'extensions' then
    raise exception 'pgcrypto must be in schema extensions';
  end if;
end;
$$;

alter table public.account_change_log drop constraint if exists account_change_log_entity_check;
alter table public.account_change_log add constraint account_change_log_entity_check check (entity in (
  'minecraft_registrations', 'profiles', 'cu_sso_identities', 'chula_claims', 'identities', 'achievements', 'events',
  'achievement_awards', 'announcements', 'server_console', 'bans', 'appeals', 'reports', 'banner_grants', 'banners',
  'gallery_groups', 'gallery_images', 'team_generations', 'team_members', 'site_pages', 'site_settings',
  'discord_assignable_roles', 'event_attendance'));

-- ------------------------------------------------------------------ tables

create table if not exists public.event_attendance (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  method text not null check (method in ('self', 'staff', 'backfill')),
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
create index if not exists event_attendance_user_idx on public.event_attendance (user_id);
alter table public.event_attendance enable row level security;
revoke all on public.event_attendance from anon, authenticated;

-- Secrets and codes: not even the bot's key reads them.
create table if not exists public.event_checkin_secrets (
  event_id uuid primary key references public.events(id) on delete cascade,
  secret bytea not null default extensions.gen_random_bytes(32),
  rotated_at timestamptz
);
alter table public.event_checkin_secrets enable row level security;
revoke all on public.event_checkin_secrets from anon, authenticated, service_role;

create table if not exists public.player_checkin_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique check (code ~ '^CC-[A-Z2-9]{10}$'),
  created_at timestamptz not null default now()
);
alter table public.player_checkin_codes enable row level security;
revoke all on public.player_checkin_codes from anon, authenticated, service_role;

-- Awards made at a published event count as having been there, so event
-- history and the dashboard's Events stat keep their values. A function only
-- so the test can run it against its own rows; ungranted.
create or replace function public.event_attendance_backfill() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_count integer;
begin
  insert into public.event_attendance (event_id, user_id, method)
  select distinct w.event_id, w.user_id, 'backfill'
  from public.achievement_awards w
  join public.events e on e.id = w.event_id and e.status = 'published'
  on conflict do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.event_attendance_backfill() from public, anon, authenticated;
select public.event_attendance_backfill();

-- ----------------------------------------------------------------- helpers

-- Internal helpers: no grants, called only from the definer RPCs below.
create or replace function public.checkin_open(p_event public.events) returns boolean
language sql stable set search_path = '' as $$
  select now() between p_event.starts_at - interval '15 minutes'
                   and coalesce(p_event.ends_at, p_event.starts_at) + interval '15 minutes';
$$;
revoke all on function public.checkin_open(public.events) from public, anon, authenticated;

-- Null when the event has no secret yet.
create or replace function public.checkin_mac(p_event_id uuid, p_message text) returns text
language sql stable security definer set search_path = '' as $$
  select translate(encode(substring(extensions.hmac(convert_to(p_message, 'UTF8'), s.secret, 'sha256') from 1 for 16), 'base64'), '+/=', '-_')
  from public.event_checkin_secrets s where s.event_id = p_event_id;
$$;
revoke all on function public.checkin_mac(uuid, text) from public, anon, authenticated;

-- Token or proof. Anything malformed is just false (never 22P02), so every bad
-- input reads as TOKEN_EXPIRED. The macs are compared through a second hash, so
-- the timing of the compare says nothing about the expected mac.
create or replace function public.checkin_verify(p_event_id uuid, p_token text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  v_window bigint := floor(extract(epoch from now()) / 30)::bigint;
  v_n bigint;
  v_mac text;
  v_expected text;
begin
  if p_token ~ '^[0-9]{1,15}\.[A-Za-z0-9_-]{22}$' then
    v_n := split_part(p_token, '.', 1)::bigint;
    v_mac := split_part(p_token, '.', 2);
    if v_n not in (v_window, v_window - 1) then return false; end if;
    v_expected := public.checkin_mac(p_event_id, 'token:' || p_event_id || ':' || v_n);
  elsif p_token ~ '^p\.[0-9]{1,15}\.[A-Za-z0-9_-]{22}$' then
    v_n := split_part(p_token, '.', 2)::bigint;
    v_mac := split_part(p_token, '.', 3);
    if v_n < extract(epoch from now()) then return false; end if;
    v_expected := public.checkin_mac(p_event_id, 'proof:' || p_event_id || ':' || v_n);
  else
    return false;
  end if;
  if v_expected is null then return false; end if;
  return extensions.digest(v_mac, 'sha256') = extensions.digest(v_expected, 'sha256');
exception when others then
  return false;
end;
$$;
revoke all on function public.checkin_verify(uuid, text) from public, anon, authenticated;

-- ------------------------------------------------------------ staff: the QR

-- expires_at is the end of the current window: the screen asks for the next
-- token then. The token itself is accepted for one window more.
create or replace function public.admin_checkin_token(p_event_id uuid)
returns table (token text, expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  v_event public.events%rowtype;
  v_window bigint := floor(extract(epoch from now()) / 30)::bigint;
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  select * into v_event from public.events e where e.id = p_event_id and e.status = 'published';
  if not found then raise exception 'NOT_FOUND'; end if;
  if not public.checkin_open(v_event) then raise exception 'CHECKIN_CLOSED'; end if;
  insert into public.event_checkin_secrets (event_id) values (p_event_id) on conflict do nothing;
  return query select v_window || '.' || public.checkin_mac(p_event_id, 'token:' || p_event_id || ':' || v_window),
    to_timestamp((v_window + 1) * 30);
end;
$$;
revoke all on function public.admin_checkin_token(uuid) from public, anon;
grant execute on function public.admin_checkin_token(uuid) to authenticated;

-- "Reset code": every token and proof already handed out stops working.
create or replace function public.admin_rotate_checkin_secret(p_event_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  if not exists (select 1 from public.events e where e.id = p_event_id) then raise exception 'NOT_FOUND'; end if;
  insert into public.event_checkin_secrets (event_id, rotated_at) values (p_event_id, now())
  on conflict (event_id) do update set secret = extensions.gen_random_bytes(32), rotated_at = now();
  perform public.log_account_change(auth.uid(), auth.uid(), 'events', p_event_id, 'checkin_secret', null, 'rotated', 'admin');
end;
$$;
revoke all on function public.admin_rotate_checkin_secret(uuid) from public, anon;
grant execute on function public.admin_rotate_checkin_secret(uuid) to authenticated;

-- ---------------------------------------------------------- player: scan

-- Called by the QR's route handler before the player may even have an account,
-- so it binds to the event, not a user. Token form only: a proof can't mint a
-- fresh proof. Null on anything wrong; the handler shows "scan again".
create or replace function public.checkin_proof(p_event_id uuid, p_token text) returns text
language plpgsql stable security definer set search_path = '' as $$
declare
  v_event public.events%rowtype;
  v_expires bigint := floor(extract(epoch from now()))::bigint + 300;
begin
  select * into v_event from public.events e where e.id = p_event_id and e.status = 'published';
  if not found or not public.checkin_open(v_event) then return null; end if;
  if coalesce(p_token, '') !~ '^[0-9]+\.[A-Za-z0-9_-]{22}$' or not public.checkin_verify(p_event_id, p_token) then return null; end if;
  return 'p.' || v_expires || '.' || public.checkin_mac(p_event_id, 'proof:' || p_event_id || ':' || v_expires);
end;
$$;
revoke all on function public.checkin_proof(uuid, text) from public, anon;
grant execute on function public.checkin_proof(uuid, text) to anon, authenticated;

-- Token or proof. 'recorded' the first time, 'already' after.
create or replace function public.check_in(p_event_id uuid, p_token text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_event public.events%rowtype;
begin
  if v_uid is null then raise exception 'FORBIDDEN'; end if;
  select * into v_event from public.events e where e.id = p_event_id and e.status = 'published';
  if not found then raise exception 'NOT_FOUND'; end if;
  if not public.checkin_open(v_event) then raise exception 'CHECKIN_CLOSED'; end if;
  if not public.checkin_verify(p_event_id, p_token) then raise exception 'TOKEN_EXPIRED'; end if;
  if public.is_banned(v_uid) then raise exception 'BANNED'; end if;
  if not public.is_player_verified(v_uid) then raise exception 'NOT_VERIFIED'; end if;
  insert into public.event_attendance (event_id, user_id, method, recorded_by) values (p_event_id, v_uid, 'self', v_uid)
  on conflict do nothing;
  return case when found then 'recorded' else 'already' end;
end;
$$;
revoke all on function public.check_in(uuid, text) from public, anon;
grant execute on function public.check_in(uuid, text) to authenticated;

-- The player's personal code, made on first read. 'CC-' + 10 characters from
-- a 32-letter alphabet (no I, O, 0, 1); byte % 32 keeps it unbiased.
create or replace function public.my_checkin_code() returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
begin
  if v_uid is null then raise exception 'FORBIDDEN'; end if;
  for i in 1..5 loop
    begin
      insert into public.player_checkin_codes (user_id, code)
        select v_uid, 'CC-' || string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', get_byte(b.r, n) % 32 + 1, 1), '' order by n)
        from (select extensions.gen_random_bytes(10) as r) b, generate_series(0, 9) n
        group by b.r
      on conflict (user_id) do nothing;
      exit;
    exception when unique_violation then
      -- Another player already has this code; draw again.
      null;
    end;
  end loop;
  select c.code into v_code from public.player_checkin_codes c where c.user_id = v_uid;
  return v_code;
end;
$$;
revoke all on function public.my_checkin_code() from public, anon;
grant execute on function public.my_checkin_code() to authenticated;

-- ------------------------------------------------------ staff: scan players

-- Returns the player's name and avatar so staff can eyeball a shared screenshot.
create or replace function public.admin_check_in_player(p_event_id uuid, p_code text)
returns table (status text, user_id uuid, display_name text, avatar_url text)
language plpgsql security definer set search_path = '' as $$
declare
  v_event public.events%rowtype;
  v_user uuid;
  v_status text;
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  select * into v_event from public.events e where e.id = p_event_id and e.status = 'published';
  if not found then raise exception 'NOT_FOUND'; end if;
  if not public.checkin_open(v_event) then raise exception 'CHECKIN_CLOSED'; end if;
  select c.user_id into v_user from public.player_checkin_codes c where c.code = upper(btrim(coalesce(p_code, '')));
  if not found then raise exception 'UNKNOWN_CODE'; end if;
  if public.is_banned(v_user) then raise exception 'BANNED'; end if;
  if not public.is_player_verified(v_user) then raise exception 'NOT_VERIFIED'; end if;

  insert into public.event_attendance (event_id, user_id, method, recorded_by) values (p_event_id, v_user, 'staff', auth.uid())
  on conflict do nothing;
  if found then
    v_status := 'recorded';
    perform public.log_account_change(auth.uid(), v_user, 'event_attendance', p_event_id, 'checked_in', null, 'staff', 'admin');
  else
    v_status := 'already';
  end if;
  return query select v_status, v_user, public.player_display_name(v_user), public.player_avatar(v_user);
end;
$$;
revoke all on function public.admin_check_in_player(uuid, text) from public, anon;
grant execute on function public.admin_check_in_player(uuid, text) to authenticated;

create or replace function public.admin_list_attendance(p_event_id uuid)
returns table (user_id uuid, display_name text, avatar_url text, method text, recorded_by_name text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  return query
  select t.user_id, public.player_display_name(t.user_id), public.player_avatar(t.user_id), t.method,
    case when t.recorded_by is distinct from t.user_id then public.admin_display_name(t.recorded_by) end, t.created_at
  from public.event_attendance t
  where t.event_id = p_event_id
  order by t.created_at desc, t.user_id;
end;
$$;
revoke all on function public.admin_list_attendance(uuid) from public, anon;
grant execute on function public.admin_list_attendance(uuid) to authenticated;

create or replace function public.admin_remove_attendance(p_event_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_method text;
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  delete from public.event_attendance t where t.event_id = p_event_id and t.user_id = p_user_id returning t.method into v_method;
  if not found then raise exception 'NOT_FOUND'; end if;
  perform public.log_account_change(auth.uid(), p_user_id, 'event_attendance', p_event_id, 'checked_in', v_method, null, 'admin');
end;
$$;
revoke all on function public.admin_remove_attendance(uuid, uuid) from public, anon;
grant execute on function public.admin_remove_attendance(uuid, uuid) to authenticated;

-- Awards the badge to every attendee who doesn't hold it yet, through
-- admin_award (one audit row per recipient), plus one row on the event with
-- the count. achievement_awards has no unique key, so the lock is what keeps
-- two clicks from awarding twice.
create or replace function public.admin_award_attendees(p_event_id uuid, p_achievement_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_users uuid[];
  v_count integer;
  v_name text;
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  if not exists (select 1 from public.events e where e.id = p_event_id) then raise exception 'NOT_FOUND'; end if;
  select a.name into v_name from public.achievements a where a.id = p_achievement_id and a.status = 'published';
  if not found then raise exception 'NOT_FOUND'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_event_id::text || p_achievement_id::text, 0));

  v_users := array(
    select t.user_id from public.event_attendance t
    where t.event_id = p_event_id
      and not exists (select 1 from public.achievement_awards w where w.user_id = t.user_id and w.achievement_id = p_achievement_id));
  if cardinality(v_users) = 0 then return 0; end if;

  v_count := public.admin_award(p_achievement_id, p_event_id, null, v_users);
  perform public.log_account_change(auth.uid(), auth.uid(), 'events', p_event_id, 'award_attendees', null,
    v_name || ' x' || v_count, 'admin');
  return v_count;
end;
$$;
revoke all on function public.admin_award_attendees(uuid, uuid) from public, anon;
grant execute on function public.admin_award_attendees(uuid, uuid) to authenticated;

-- ------------------------------------------------------- player: history

-- Internal. Published events only, newest first, each with the published
-- badges the player earned there.
create or replace function public.event_history(p_user_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'event_id', e.id, 'name', e.name, 'starts_at', e.starts_at,
      'badges', coalesce((
        select jsonb_agg(jsonb_build_object('achievement_id', a.id, 'name', a.name, 'image_path', a.image_path, 'tier', a.tier)
                         order by a.name, a.id)
        from public.achievements a
        where a.status = 'published'
          and exists (select 1 from public.achievement_awards w
                      where w.user_id = p_user_id and w.event_id = e.id and w.achievement_id = a.id)), '[]'::jsonb))
    order by e.starts_at desc, e.id), '[]'::jsonb)
  from public.event_attendance t
  join public.events e on e.id = t.event_id and e.status = 'published'
  where t.user_id = p_user_id;
$$;
revoke all on function public.event_history(uuid) from public, anon, authenticated;

create or replace function public.my_event_history() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'FORBIDDEN'; end if;
  return public.event_history(auth.uid());
end;
$$;
revoke all on function public.my_event_history() from public, anon;
grant execute on function public.my_event_history() to authenticated;

-- Same gate as get_player_profile; history counts as achievements for privacy.
create or replace function public.get_player_event_history(p_user_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_viewer uuid := auth.uid();
begin
  if v_viewer is null then raise exception 'FORBIDDEN'; end if;
  if not exists (select 1 from auth.users u where u.id = p_user_id) then raise exception 'NOT_FOUND'; end if;
  if public.is_blocked_either(v_viewer, p_user_id) then raise exception 'NOT_FOUND'; end if;
  if not public.can_view(v_viewer, p_user_id, 'achievements') then return '[]'::jsonb; end if;
  return public.event_history(p_user_id);
end;
$$;
revoke all on function public.get_player_event_history(uuid) from public, anon;
grant execute on function public.get_player_event_history(uuid) to authenticated;
