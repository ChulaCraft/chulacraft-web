-- Achievements + events catalog and the awards that link them to players.
--
-- Clients never touch these tables: every write and every read that needs an
-- email, a real name or another player's awards goes through a security
-- definer function with an explicit grant (principle 1 in the plan). The only
-- function a player can call is my_achievements(), keyed on auth.uid() so the
-- caller cannot choose whose awards to read.
--
-- Event dates are timestamptz (D8), displayed in Asia/Bangkok. An award still
-- stores a plain date, copied from the event at award time, so the badge stays
-- right if the event is later moved; admin_upsert_event re-syncs those copies
-- when the start moves. D8 is folded in here rather than a later ALTER, so
-- events never exist in the old shape.

-- ------------------------------------------------------------ default grants

-- Corrects 20261005000004. That migration ran
--   alter default privileges for role postgres revoke execute on functions
--     from public, anon, authenticated;
-- and its comment says the `in schema public` form is accepted but inert on
-- this database while the global form applies. Measured against the local stack
-- it is the other way round: the global form leaves a pg_default_acl row that
-- Postgres does not apply to CREATE FUNCTION in schema public, so a new
-- function still came out executable by PUBLIC, while the schema-scoped form
-- demonstrably blocks it. default_function_privileges.test.sql tests 3 and 4
-- failed on a clean tree for exactly this reason.
--
-- Additive: every function this migration creates already carries an explicit
-- grant or an explicit revoke, so nothing here changes its own ACLs. The point
-- is that the next RPC added by a later phase has to be granted on purpose.
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;

-- ------------------------------------------------------------------ tables

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  description text check (char_length(description) <= 500),
  image_path text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists achievements_updated_at on public.achievements;
create trigger achievements_updated_at
  before update on public.achievements
  for each row execute function public.set_updated_at();

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  description text check (char_length(description) <= 500),
  starts_at timestamptz not null,
  ends_at timestamptz check (ends_at is null or ends_at >= starts_at),
  location text check (char_length(location) <= 120),
  image_path text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create index if not exists events_starts_at_idx on public.events (starts_at);

-- awarded_on is denormalised on purpose: the badge reads it without joining
-- the event, and a deleted event (event_id -> null) keeps its date.
create table if not exists public.achievement_awards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  awarded_on date not null,
  awarded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists achievement_awards_user_achievement_idx
  on public.achievement_awards (user_id, achievement_id);
create index if not exists achievement_awards_event_idx
  on public.achievement_awards (event_id);

alter table public.achievements enable row level security;
alter table public.events enable row level security;
alter table public.achievement_awards enable row level security;
revoke all on public.achievements from anon, authenticated;
revoke all on public.events from anon, authenticated;
revoke all on public.achievement_awards from anon, authenticated;
grant select on public.achievements, public.events, public.achievement_awards to service_role;

-- ------------------------------------------------------------------- audit

alter table public.account_change_log drop constraint if exists account_change_log_entity_check;
alter table public.account_change_log add constraint account_change_log_entity_check
  check (entity in ('minecraft_registrations', 'profiles', 'cu_sso_identities', 'chula_claims', 'identities',
                    'achievements', 'events', 'achievement_awards'));

-- ------------------------------------------------------- admin: the catalog

create or replace function public.admin_upsert_achievement(
  p_id uuid, p_name text, p_description text, p_image_path text, p_status text
) returns uuid
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_actor uuid := auth.uid();
  v_old public.achievements%rowtype;
  v_id uuid;
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  select * into v_old from public.achievements a where a.id = p_id;
  if found then
    update public.achievements a
      set name = p_name, description = p_description, image_path = p_image_path, status = p_status
      where a.id = p_id
      returning a.id into v_id;
    if v_old.status is distinct from p_status then
      perform public.log_account_change(v_actor, v_actor, 'achievements', p_id, 'status', v_old.status, p_status, 'admin');
    end if;
  else
    -- Insert under the requested id: the save action uploads the image first and
    -- tells a successful create from a failed one by this id coming back.
    insert into public.achievements (id, name, description, image_path, status, created_by)
      values (coalesce(p_id, gen_random_uuid()), p_name, p_description, p_image_path, p_status, v_actor)
      returning id into v_id;
    perform public.log_account_change(v_actor, v_actor, 'achievements', v_id, 'created', null, p_name, 'admin');
  end if;

  return v_id;
end;
$$;
revoke all on function public.admin_upsert_achievement(uuid, text, text, text, text) from public, anon;
grant execute on function public.admin_upsert_achievement(uuid, text, text, text, text) to authenticated;

-- image_path comes back so the caller can delete the object it just replaced
-- (D5); PostgreSQL has no way to touch Storage.
create or replace function public.admin_delete_achievement(p_id uuid)
returns table (removed int, image_path text)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_actor uuid := auth.uid();
  v_row public.achievements%rowtype;
  v_removed int;
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  -- Counted before the delete: the cascade removes the awards with it.
  v_removed := (select count(*)::int from public.achievement_awards w where w.achievement_id = p_id);

  delete from public.achievements a where a.id = p_id returning * into v_row;
  if not found then raise exception 'NOT_FOUND'; end if;
  perform public.log_account_change(v_actor, v_actor, 'achievements', p_id, 'deleted', v_row.name, null, 'admin');

  return query select v_removed, v_row.image_path;
end;
$$;
revoke all on function public.admin_delete_achievement(uuid) from public, anon;
grant execute on function public.admin_delete_achievement(uuid) to authenticated;

create or replace function public.admin_upsert_event(
  p_id uuid, p_name text, p_description text, p_starts_at timestamptz, p_ends_at timestamptz,
  p_location text, p_image_path text, p_status text
) returns uuid
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_actor uuid := auth.uid();
  v_old public.events%rowtype;
  v_id uuid;
  v_new_date date;
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  select * into v_old from public.events e where e.id = p_id;
  if found then
    update public.events e
      set name = p_name, description = p_description, starts_at = p_starts_at, ends_at = p_ends_at,
          location = p_location, image_path = p_image_path, status = p_status
      where e.id = p_id
      returning e.id into v_id;
    if v_old.status is distinct from p_status then
      perform public.log_account_change(v_actor, v_actor, 'events', p_id, 'status', v_old.status, p_status, 'admin');
    end if;
    -- Moving the event moves its awards' dates, so a badge never disagrees
    -- with the event it came from. Only this event's rows are touched.
    v_new_date := (p_starts_at at time zone 'Asia/Bangkok')::date;
    if (v_old.starts_at at time zone 'Asia/Bangkok')::date is distinct from v_new_date then
      update public.achievement_awards w set awarded_on = v_new_date where w.event_id = p_id;
      perform public.log_account_change(v_actor, v_actor, 'events', p_id, 'starts_at',
        (v_old.starts_at at time zone 'Asia/Bangkok')::date::text, v_new_date::text, 'admin');
    end if;
  else
    -- Requested id, same reason as admin_upsert_achievement.
    insert into public.events (id, name, description, starts_at, ends_at, location, image_path, status, created_by)
      values (coalesce(p_id, gen_random_uuid()), p_name, p_description, p_starts_at, p_ends_at, p_location, p_image_path, p_status, v_actor)
      returning id into v_id;
    perform public.log_account_change(v_actor, v_actor, 'events', v_id, 'created', null, p_name, 'admin');
  end if;

  return v_id;
end;
$$;
revoke all on function public.admin_upsert_event(uuid, text, text, timestamptz, timestamptz, text, text, text) from public, anon;
grant execute on function public.admin_upsert_event(uuid, text, text, timestamptz, timestamptz, text, text, text) to authenticated;

create or replace function public.admin_delete_event(p_id uuid)
returns table (removed int, image_path text)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_actor uuid := auth.uid();
  v_row public.events%rowtype;
  v_removed int;
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  -- Counted before the delete: event_id is set null by the same statement.
  v_removed := (select count(*)::int from public.achievement_awards w where w.event_id = p_id);

  delete from public.events e where e.id = p_id returning * into v_row;
  if not found then raise exception 'NOT_FOUND'; end if;
  perform public.log_account_change(v_actor, v_actor, 'events', p_id, 'deleted', v_row.name, null, 'admin');

  -- event_id becomes null and awarded_on stays as copied: the award outlives
  -- the event it was earned at.
  return query select v_removed, v_row.image_path;
end;
$$;
revoke all on function public.admin_delete_event(uuid) from public, anon;
grant execute on function public.admin_delete_event(uuid) to authenticated;

-- ------------------------------------------------------- admin: the awards

-- p_event_id wins over p_awarded_on: an award made at an event takes that
-- event's Bangkok date, and the form can stop asking for one at all.
create or replace function public.admin_award(
  p_achievement_id uuid, p_event_id uuid, p_awarded_on date, p_user_ids uuid[]
) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_on date;
  v_inserted int;
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  if not exists (select 1 from public.achievements a where a.id = p_achievement_id) then raise exception 'NOT_FOUND'; end if;

  if p_event_id is not null then
    select (e.starts_at at time zone 'Asia/Bangkok')::date into v_on from public.events e where e.id = p_event_id;
    if v_on is null then raise exception 'NOT_FOUND'; end if;
  else
    v_on := coalesce(p_awarded_on, current_date);
  end if;

  -- distinct collapses a list that names the same player twice; joining
  -- auth.users drops ids that are not real accounts instead of failing the
  -- whole batch, which is what the CSV preview promises.
  --
  -- One audit row per recipient, so the award shows in that player's own
  -- history (20260923000001:58); the actor column is not readable by players,
  -- so this reveals who awarded it and nothing else.
  with targets as (
    select distinct u.id
    from unnest(p_user_ids) as t(user_id)
    join auth.users u on u.id = t.user_id
  ), ins as (
    insert into public.achievement_awards (user_id, achievement_id, event_id, awarded_on, awarded_by)
    select t.id, p_achievement_id, p_event_id, v_on, v_actor from targets t
    returning user_id, id
  )
  insert into public.account_change_log (actor_user_id, target_user_id, entity, entity_id, field, old_value, new_value, source)
  select v_actor, ins.user_id, 'achievement_awards', ins.id, 'awarded_on', null, v_on::text, 'admin' from ins;

  get diagnostics v_inserted = row_count;

  return v_inserted;
end;
$$;
revoke all on function public.admin_award(uuid, uuid, date, uuid[]) from public, anon;
grant execute on function public.admin_award(uuid, uuid, date, uuid[]) to authenticated;

create or replace function public.admin_revoke_award(p_award_id uuid) returns int
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_actor uuid := auth.uid();
  v_row public.achievement_awards%rowtype;
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  delete from public.achievement_awards w where w.id = p_award_id returning * into v_row;
  if not found then raise exception 'NOT_FOUND'; end if;
  -- Against the recipient, like the award itself, so their history reads as a
  -- pair rather than losing the removal.
  perform public.log_account_change(v_actor, v_row.user_id, 'achievement_awards', p_award_id, 'awarded_on',
    v_row.awarded_on::text, null, 'admin');

  return 1;
end;
$$;
revoke all on function public.admin_revoke_award(uuid) from public, anon;
grant execute on function public.admin_revoke_award(uuid) to authenticated;

-- ------------------------------------------------- admin: identifier lookup

-- Bulk award needs to turn a pasted list of names into accounts, and
-- admin_search_users stops at 50 rows (20261004000001:370). Every input value
-- comes back, matched or not, so the preview can show what did not resolve.
create or replace function public.admin_resolve_identifiers(p_kind text, p_values text[])
returns table (value text, user_id uuid)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_value text;
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;
  if coalesce(array_length(p_values, 1), 0) > 1000 then raise exception 'TOO_MANY'; end if;

  if p_kind not in ('discord', 'minecraft', 'chula') then raise exception 'INVALID_KIND'; end if;

  foreach v_value in array p_values loop
    if btrim(coalesce(v_value, '')) = '' then continue; end if;
    v_value := btrim(v_value);

    if p_kind = 'discord' then
      return query
      select v_value, (
        select (array_agg(i.user_id order by i.user_id))[1] from auth.identities i
        where i.provider = 'discord'
          and lower(coalesce(i.identity_data ->> 'full_name', i.identity_data ->> 'user_name', i.identity_data ->> 'name', '')) = lower(v_value)
      );
    elsif p_kind = 'minecraft' then
      return query
      select v_value, (
        select (array_agg(r.user_id order by r.user_id))[1] from public.minecraft_registrations r
        where r.is_active and lower(r.minecraft_username) = lower(v_value)
      );
    else
      return query
      select v_value, (
        select c.user_id from public.chula_claims c where lower(c.email) = lower(v_value)
      );
    end if;
  end loop;
end;
$$;
revoke all on function public.admin_resolve_identifiers(text, text[]) from public, anon;
grant execute on function public.admin_resolve_identifiers(text, text[]) to authenticated;

-- ---------------------------------------------------- admin: catalog reads

create or replace function public.admin_list_achievements()
returns table (
  id uuid, name text, description text, image_path text, status text,
  award_count bigint, created_at timestamptz, updated_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  return query
  select a.id, a.name, a.description, a.image_path, a.status,
    (select count(*) from public.achievement_awards w where w.achievement_id = a.id),
    a.created_at, a.updated_at
  from public.achievements a
  order by a.created_at desc, a.id;
end;
$$;
revoke all on function public.admin_list_achievements() from public, anon;
grant execute on function public.admin_list_achievements() to authenticated;

create or replace function public.admin_list_events()
returns table (
  id uuid, name text, description text, starts_at timestamptz, ends_at timestamptz,
  location text, image_path text, status text, award_count bigint,
  created_at timestamptz, updated_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  return query
  select e.id, e.name, e.description, e.starts_at, e.ends_at, e.location, e.image_path, e.status,
    (select count(*) from public.achievement_awards w where w.event_id = e.id),
    e.created_at, e.updated_at
  from public.events e
  order by e.starts_at desc, e.id;
end;
$$;
revoke all on function public.admin_list_events() from public, anon;
grant execute on function public.admin_list_events() to authenticated;

-- admin_display_name may fall back to the login email; that is admin-only
-- surface and the alternative is an anonymous row in the awards table.
create or replace function public.admin_list_awards(p_achievement_id uuid)
returns table (
  id uuid, user_id uuid, display_name text, event_id uuid, event_name text,
  awarded_on date, awarded_by uuid, created_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  return query
  select w.id, w.user_id, public.admin_display_name(w.user_id), w.event_id, e.name,
    w.awarded_on, w.awarded_by, w.created_at
  from public.achievement_awards w
  left join public.events e on e.id = w.event_id
  where w.achievement_id = p_achievement_id
  order by w.awarded_on desc, w.created_at desc, w.id;
end;
$$;
revoke all on function public.admin_list_awards(uuid) from public, anon;
grant execute on function public.admin_list_awards(uuid) to authenticated;

-- --------------------------------------------------------- player read path

-- The one place a player's awards are turned into a shape, so the whitelist in
-- player_card (Phase B) and this function cannot drift apart. Draft
-- achievements are absent entirely; an entry names its event only when that
-- event is published, so an unpublished event title never reaches a player.
create or replace function public.achievement_groups(p_user_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(g order by g.last_on desc, g.achievement_id), '[]'::jsonb)
  from (
    select a.id as achievement_id, a.name, a.description, a.image_path,
      count(*)::int as count,
      min(w.awarded_on) as first_on,
      max(w.awarded_on) as last_on,
      jsonb_agg(jsonb_build_object('awarded_on', w.awarded_on, 'event_name', e.name)
                order by w.awarded_on, w.id) as entries
    from public.achievement_awards w
    join public.achievements a on a.id = w.achievement_id and a.status = 'published'
    left join public.events e on e.id = w.event_id and e.status = 'published'
    where w.user_id = p_user_id
    group by a.id, a.name, a.description, a.image_path
  ) g;
$$;
-- Ungranted on purpose: the caller must not choose the user.
revoke all on function public.achievement_groups(uuid) from public, anon, authenticated;

create or replace function public.my_achievements() returns jsonb
language sql stable security definer set search_path = '' as $$
  select public.achievement_groups((select auth.uid()));
$$;
revoke all on function public.my_achievements() from public, anon;
grant execute on function public.my_achievements() to authenticated;

-- ------------------------------------------------------------------ storage

-- Public bucket: the images are read by <img> from the dashboard and by the
-- admin UI, and they are not personal data. The 2 MB / MIME limits are the real
-- guard (AC 4) and are enforced by the Storage API, not by Postgres, so the
-- form checks them again server side.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('achievements', 'achievements', true, 2097152, '{image/png,image/jpeg,image/webp,image/gif}')
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Writes are admin-only in the database as well as in the form: a player who
-- calls the Storage API directly with their own JWT still fails the role check.
drop policy if exists "admins upload achievement images" on storage.objects;
create policy "admins upload achievement images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'achievements' and (select public.current_app_role()) in ('owner', 'admin'));

drop policy if exists "admins update achievement images" on storage.objects;
create policy "admins update achievement images" on storage.objects
  for update to authenticated
  using (bucket_id = 'achievements' and (select public.current_app_role()) in ('owner', 'admin'))
  with check (bucket_id = 'achievements' and (select public.current_app_role()) in ('owner', 'admin'));

drop policy if exists "admins delete achievement images" on storage.objects;
create policy "admins delete achievement images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'achievements' and (select public.current_app_role()) in ('owner', 'admin'));

-- Reads are open because the bucket is public; Storage serves them through its
-- own public endpoint, so no SELECT policy is needed here.
