-- Two limited staff roles next to owner and admin:
--
--   area          owner admin moderator event_staff
--   players_read    ✓     ✓      ✓          ✓       view players and their details
--   moderation      ✓     ✓      ✓                  reports, appeals, bans
--   community       ✓     ✓                 ✓       achievements, events, announcements, awards
--   everything else (player edits, server, audit log, removed accounts) stays owner/admin;
--   role changes stay owner-only (admin_set_role).
--
-- Staff count as "not a player" everywhere a check reads role <> 'user', so
-- admins can't act on them and nobody can ban them; only an owner manages staff.
--
-- The functions listed in staff_area_functions() each start with the same
-- owner/admin check. Instead of copying ~30 function bodies, the DO block
-- below rewrites that one check in place to staff_can('<area>'), and fails the
-- migration if a function doesn't have it. tests/staff_roles.test.sql checks
-- every listed function afterwards.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('owner', 'admin', 'moderator', 'event_staff', 'user'));

create or replace function public.staff_can(p_area text) returns boolean
language sql stable security definer set search_path = '' as $$
  select case coalesce(public.current_app_role(), '')
    when 'owner' then true
    when 'admin' then true
    when 'moderator' then p_area in ('players_read', 'moderation')
    when 'event_staff' then p_area in ('players_read', 'community')
    else false end;
$$;
revoke all on function public.staff_can(text) from public, anon;
grant execute on function public.staff_can(text) to authenticated;

-- Which function opens to which area. Read by the DO block and by the test.
create or replace function public.staff_area_functions() returns text[]
language sql immutable set search_path = '' as $$
  select array[
    'admin_list_players', 'admin_get_user', 'admin_search_users', 'admin_overview_stats',
    'admin_user_profile', 'admin_user_bans', 'admin_stats_daily',
    'admin_list_reports', 'admin_handle_report', 'admin_list_appeals', 'admin_decide_appeal',
    'admin_ban_user', 'admin_lift_ban',
    'admin_list_achievements', 'admin_upsert_achievement', 'admin_delete_achievement',
    'admin_list_events', 'admin_upsert_event', 'admin_delete_event',
    'admin_list_announcements', 'admin_upsert_announcement', 'admin_delete_announcement',
    'admin_award', 'admin_revoke_award', 'admin_list_awards', 'admin_list_event_interests',
    'admin_resolve_identifiers'];
$$;
revoke all on function public.staff_area_functions() from public, anon, authenticated;

-- replace() that fails the migration when the text isn't there, so a later
-- change to a function body can't make a rewrite silently do nothing.
create or replace function public.staff_roles_replace(p_src text, p_from text, p_to text) returns text
language plpgsql immutable set search_path = '' as $$
begin
  if position(p_from in p_src) = 0 then raise exception 'staff_roles: expected text not found: %', p_from; end if;
  return replace(p_src, p_from, p_to);
end;
$$;
revoke all on function public.staff_roles_replace(text, text, text) from public, anon, authenticated;

do $$
declare
  v_area jsonb := jsonb_build_object(
    'admin_list_players', 'players_read', 'admin_get_user', 'players_read', 'admin_search_users', 'players_read',
    'admin_overview_stats', 'players_read', 'admin_user_profile', 'players_read', 'admin_user_bans', 'players_read',
    'admin_stats_daily', 'players_read',
    'admin_list_reports', 'moderation', 'admin_handle_report', 'moderation', 'admin_list_appeals', 'moderation',
    'admin_decide_appeal', 'moderation', 'admin_ban_user', 'moderation', 'admin_lift_ban', 'moderation',
    'admin_list_achievements', 'community', 'admin_upsert_achievement', 'community', 'admin_delete_achievement', 'community',
    'admin_list_events', 'community', 'admin_upsert_event', 'community', 'admin_delete_event', 'community',
    'admin_list_announcements', 'community', 'admin_upsert_announcement', 'community', 'admin_delete_announcement', 'community',
    'admin_award', 'community', 'admin_revoke_award', 'community', 'admin_list_awards', 'community',
    'admin_list_event_interests', 'community', 'admin_resolve_identifiers', 'community');
  r record;
  v_def text;
  v_new text;
begin
  if (select count(*) from jsonb_object_keys(v_area)) <> cardinality(public.staff_area_functions()) then
    raise exception 'staff_roles: area map and staff_area_functions() disagree';
  end if;
  for r in
    select p.oid, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any (public.staff_area_functions())
  loop
    v_def := pg_get_functiondef(r.oid);
    v_new := replace(v_def, 'coalesce(public.current_app_role(), '''') not in (''owner'', ''admin'')',
      format('not public.staff_can(%L)', v_area ->> r.proname));
    v_new := replace(v_new, 'v_actor_role not in (''owner'', ''admin'')',
      format('not public.staff_can(%L)', v_area ->> r.proname));
    if v_new = v_def then raise exception 'staff_roles: % has no owner/admin check to rewrite', r.proname; end if;
    -- The players table's role filter must accept the new roles too, and
    -- "view only" leaves out emails and per-player history: those stay with
    -- owner/admin (staff_can('admin')), like the audit log and the CSV export.
    if r.proname = 'admin_list_players' then
      v_new := public.staff_roles_replace(v_new, 'array[''user'', ''admin'', ''owner'']', 'array[''user'', ''admin'', ''owner'', ''moderator'', ''event_staff'']');
      v_new := public.staff_roles_replace(v_new, 'u.email::text as email, c.email as chula_email',
        'case when public.staff_can(''admin'') then u.email::text end as email, case when public.staff_can(''admin'') then c.email end as chula_email');
      v_new := public.staff_roles_replace(v_new, 'coalesce(d.name, u.email::text) as handle',
        'coalesce(d.name, case when public.staff_can(''admin'') then u.email::text end, ''(no Discord)'') as handle');
    elsif r.proname = 'admin_get_user' then
      v_new := public.staff_roles_replace(v_new, '''email'', u.email,', '''email'', case when public.staff_can(''admin'') then u.email end,');
      v_new := public.staff_roles_replace(v_new, 'jsonb_build_object(''email'', c.email,', 'jsonb_build_object(''email'', case when public.staff_can(''admin'') then c.email end,');
      v_new := public.staff_roles_replace(v_new, '''google'', coalesce((', '''google'', case when not public.staff_can(''admin'') then ''[]''::jsonb else coalesce((');
      v_new := public.staff_roles_replace(v_new, 'and i.provider = ''google''), ''[]''::jsonb),', 'and i.provider = ''google''), ''[]''::jsonb) end,');
      v_new := public.staff_roles_replace(v_new, '''log'', coalesce((', '''log'', case when not public.staff_can(''admin'') then ''[]''::jsonb else coalesce((');
      v_new := public.staff_roles_replace(v_new, 'limit 100) l), ''[]''::jsonb)', 'limit 100) l), ''[]''::jsonb) end');
    end if;
    execute v_new;
  end loop;
end;
$$;

-- Achievement and event images: community staff upload them.
drop policy if exists "admins upload achievement images" on storage.objects;
create policy "admins upload achievement images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'achievements' and (select public.staff_can('community')));

drop policy if exists "admins update achievement images" on storage.objects;
create policy "admins update achievement images" on storage.objects
  for update to authenticated
  using (bucket_id = 'achievements' and (select public.staff_can('community')))
  with check (bucket_id = 'achievements' and (select public.staff_can('community')));

drop policy if exists "admins delete achievement images" on storage.objects;
create policy "admins delete achievement images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'achievements' and (select public.staff_can('community')));

-- Same as 20261003000002, plus the two new roles. Admins may also take a staff
-- role away (never give one), so a rogue moderator doesn't need an owner.
create or replace function public.admin_set_role(p_user_id uuid, p_role text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_old text;
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;
  if p_user_id = v_actor then raise exception 'SELF_ROLE_CHANGE'; end if;
  if p_role is null or p_role not in ('owner', 'admin', 'moderator', 'event_staff', 'user') then raise exception 'INVALID_ROLE'; end if;

  select p.role into v_old from public.profiles p where p.user_id = p_user_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if public.current_app_role() = 'admin' and not (v_old in ('moderator', 'event_staff') and p_role = 'user') then raise exception 'FORBIDDEN'; end if;
  if v_old = p_role then return; end if;
  if v_old = 'owner' then raise exception 'OWNER_ROLE_PROTECTED'; end if;

  update public.profiles p set role = p_role where p.user_id = p_user_id;
  perform public.log_account_change(v_actor, p_user_id, 'profiles', p_user_id, 'role', v_old, p_role, 'admin');
end;
$$;
revoke all on function public.admin_set_role(uuid, text) from public, anon;
grant execute on function public.admin_set_role(uuid, text) to authenticated;
