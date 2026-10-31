-- v1.1 Phase 5 A: badge rarity, the Discord roles a badge may give, and the
-- three badges a player picks to show first.
--
--   * achievements.tier: common | rare | epic | legendary. Existing badges
--     become common through the column default.
--   * discord_assignable_roles: the allowlist. Only owner/admin edit it
--     (staff_can('admin')); community staff can only pick from it on the badge
--     form, so event staff can't map a badge to a moderator role and award it
--     to themselves. The bot also refuses roles it manages itself (contract).
--   * achievement_showcase: up to three picks per player. Empty picks fall back
--     to highest tier, then newest, in TS (achievement_groups carries both
--     fields), so player_card is not rewritten.
--
-- Same data pattern as every table so far: RLS on, no policies, definer RPCs.

alter table public.account_change_log drop constraint if exists account_change_log_entity_check;
alter table public.account_change_log add constraint account_change_log_entity_check check (entity in (
  'minecraft_registrations', 'profiles', 'cu_sso_identities', 'chula_claims', 'identities', 'achievements', 'events',
  'achievement_awards', 'announcements', 'server_console', 'bans', 'appeals', 'reports', 'banner_grants', 'banners',
  'gallery_groups', 'gallery_images', 'team_generations', 'team_members', 'site_pages', 'site_settings',
  'discord_assignable_roles'));

-- --------------------------------------------------------------------- tier

alter table public.achievements add column if not exists tier text not null default 'common'
  check (tier in ('common', 'rare', 'epic', 'legendary'));

-- --------------------------------------------------------- Discord roles

create table if not exists public.discord_assignable_roles (
  role_id text primary key check (role_id ~ '^[0-9]{17,20}$'),
  label text not null check (char_length(label) between 1 and 60),
  added_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.discord_assignable_roles enable row level security;
revoke all on public.discord_assignable_roles from anon, authenticated;

-- No cascade: a mapped role can't be removed from the list (IN_USE below).
alter table public.achievements add column if not exists discord_role_id text
  references public.discord_assignable_roles (role_id);

-- For the badge form's select, so community staff read it too.
create or replace function public.admin_list_discord_roles()
returns table (role_id text, label text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  return query select r.role_id, r.label, r.created_at from public.discord_assignable_roles r order by r.label, r.role_id;
end;
$$;
revoke all on function public.admin_list_discord_roles() from public, anon;
grant execute on function public.admin_list_discord_roles() to authenticated;

-- Adds a role or renames it. The audit row has no entity_id: role ids are
-- Discord snowflakes, not uuids, so the id goes in the value.
create or replace function public.admin_save_discord_role(p_role_id text, p_label text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_role text := btrim(coalesce(p_role_id, ''));
  v_label text := btrim(coalesce(p_label, ''));
  v_old text;
begin
  if not public.staff_can('admin') then raise exception 'FORBIDDEN'; end if;
  if v_role !~ '^[0-9]{17,20}$' or char_length(v_label) not between 1 and 60 then raise exception 'INVALID'; end if;
  select r.label into v_old from public.discord_assignable_roles r where r.role_id = v_role for update;
  if not found then
    insert into public.discord_assignable_roles (role_id, label, added_by) values (v_role, v_label, auth.uid());
    perform public.log_account_change(auth.uid(), auth.uid(), 'discord_assignable_roles', null, 'created', null, v_role || ' ' || v_label, 'admin');
  elsif v_old is distinct from v_label then
    update public.discord_assignable_roles r set label = v_label where r.role_id = v_role;
    perform public.log_account_change(auth.uid(), auth.uid(), 'discord_assignable_roles', null, 'label', v_old, v_label, 'admin');
  end if;
end;
$$;
revoke all on function public.admin_save_discord_role(text, text) from public, anon;
grant execute on function public.admin_save_discord_role(text, text) to authenticated;

create or replace function public.admin_delete_discord_role(p_role_id text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_label text;
begin
  if not public.staff_can('admin') then raise exception 'FORBIDDEN'; end if;
  if exists (select 1 from public.achievements a where a.discord_role_id = p_role_id) then raise exception 'IN_USE'; end if;
  delete from public.discord_assignable_roles r where r.role_id = p_role_id returning r.label into v_label;
  if not found then raise exception 'NOT_FOUND'; end if;
  perform public.log_account_change(auth.uid(), auth.uid(), 'discord_assignable_roles', null, 'deleted', p_role_id || ' ' || v_label, null, 'admin');
end;
$$;
revoke all on function public.admin_delete_discord_role(text) from public, anon;
grant execute on function public.admin_delete_discord_role(text) to authenticated;

-- ------------------------------------------------------ badge: tier + role

-- Called right after admin_upsert_achievement, like admin_set_event_category,
-- so the upsert's signature stays put. Null/blank role clears the mapping.
create or replace function public.admin_set_achievement_meta(p_id uuid, p_tier text, p_discord_role_id text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_role text := nullif(btrim(coalesce(p_discord_role_id, '')), '');
  v_old public.achievements%rowtype;
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  if p_tier is null or p_tier not in ('common', 'rare', 'epic', 'legendary') then raise exception 'INVALID'; end if;
  if v_role is not null and not exists (select 1 from public.discord_assignable_roles r where r.role_id = v_role) then
    raise exception 'ROLE_NOT_ALLOWED';
  end if;
  select * into v_old from public.achievements a where a.id = p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;

  update public.achievements a set tier = p_tier, discord_role_id = v_role where a.id = p_id;
  if v_old.tier is distinct from p_tier then
    perform public.log_account_change(auth.uid(), auth.uid(), 'achievements', p_id, 'tier', v_old.tier, p_tier, 'admin');
  end if;
  if v_old.discord_role_id is distinct from v_role then
    perform public.log_account_change(auth.uid(), auth.uid(), 'achievements', p_id, 'discord_role', v_old.discord_role_id, v_role, 'admin');
  end if;
end;
$$;
revoke all on function public.admin_set_achievement_meta(uuid, text, text) from public, anon;
grant execute on function public.admin_set_achievement_meta(uuid, text, text) to authenticated;

-- Same as 20261006000001 (with the 20261019000001 role check) plus tier and
-- discord_role_id.
drop function if exists public.admin_list_achievements();
create function public.admin_list_achievements()
returns table (
  id uuid, name text, description text, image_path text, status text,
  award_count bigint, created_at timestamptz, updated_at timestamptz,
  tier text, discord_role_id text
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;

  return query
  select a.id, a.name, a.description, a.image_path, a.status,
    (select count(*) from public.achievement_awards w where w.achievement_id = a.id),
    a.created_at, a.updated_at, a.tier, a.discord_role_id
  from public.achievements a
  order by a.created_at desc, a.id;
end;
$$;
revoke all on function public.admin_list_achievements() from public, anon;
grant execute on function public.admin_list_achievements() to authenticated;

-- ---------------------------------------------------------------- showcase

create table if not exists public.achievement_showcase (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  position smallint not null check (position between 1 and 3),
  primary key (user_id, position),
  unique (user_id, achievement_id)
);
alter table public.achievement_showcase enable row level security;
revoke all on public.achievement_showcase from anon, authenticated;

-- Replaces the caller's whole set, in the order given. A pick that later goes
-- draft or is revoked just stops showing (achievement_groups only lists held,
-- published badges); the row is harmless and the next save drops it.
create or replace function public.set_my_showcase(p_achievement_ids uuid[])
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_ids uuid[] := coalesce(p_achievement_ids, '{}');
begin
  if v_uid is null then raise exception 'FORBIDDEN'; end if;
  if cardinality(v_ids) > 3 or array_position(v_ids, null) is not null
    or cardinality(v_ids) <> (select count(distinct x) from unnest(v_ids) x) then
    raise exception 'INVALID';
  end if;
  if exists (
    select 1 from unnest(v_ids) x
    where not exists (
      select 1 from public.achievement_awards w
      join public.achievements a on a.id = w.achievement_id and a.status = 'published'
      where w.user_id = v_uid and w.achievement_id = x)
  ) then
    raise exception 'NOT_OWNED';
  end if;

  delete from public.achievement_showcase s where s.user_id = v_uid;
  insert into public.achievement_showcase (user_id, achievement_id, position)
    select v_uid, t.id, t.n from unnest(v_ids) with ordinality t(id, n);
end;
$$;
revoke all on function public.set_my_showcase(uuid[]) from public, anon;
grant execute on function public.set_my_showcase(uuid[]) to authenticated;

-- Same as 20261006000001 plus tier and showcase_position (null when not
-- picked). Signature and the ungranted revoke are unchanged.
create or replace function public.achievement_groups(p_user_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(g order by g.last_on desc, g.achievement_id), '[]'::jsonb)
  from (
    select a.id as achievement_id, a.name, a.description, a.image_path,
      count(*)::int as count,
      min(w.awarded_on) as first_on,
      max(w.awarded_on) as last_on,
      jsonb_agg(jsonb_build_object('awarded_on', w.awarded_on, 'event_name', e.name)
                order by w.awarded_on, w.id) as entries,
      a.tier,
      s.position as showcase_position
    from public.achievement_awards w
    join public.achievements a on a.id = w.achievement_id and a.status = 'published'
    left join public.events e on e.id = w.event_id and e.status = 'published'
    left join public.achievement_showcase s on s.user_id = p_user_id and s.achievement_id = a.id
    where w.user_id = p_user_id
    group by a.id, a.name, a.description, a.image_path, a.tier, s.position
  ) g;
$$;
-- Ungranted on purpose: the caller must not choose the user.
revoke all on function public.achievement_groups(uuid) from public, anon, authenticated;
