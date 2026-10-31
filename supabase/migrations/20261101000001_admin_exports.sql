-- v1.1 T1.2: export RPCs with no row cap, and the player-filter refactor.
--
-- admin_list_reports / admin_list_appeals stop at 100 rows with no offset, so
-- exports get their own functions. Callers page them with .range() because
-- PostgREST max_rows (1000) cuts a set-returning RPC without any error.

create or replace function public.admin_export_reports(p_status text default null, p_ids uuid[] default null)
returns table (id uuid, created_at timestamptz, category text, details text, evidence_url text, status text,
  admin_note text, handled_at timestamptz, handled_by_name text, reporter_id uuid, reporter_name text,
  target_user_id uuid, target_name text, target_banned boolean, target_open_reports bigint)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if not public.staff_can('admin') then raise exception 'FORBIDDEN'; end if;
  return query
  select r.id, r.created_at, r.category, r.details, r.evidence_url, r.status,
    r.admin_note, r.handled_at, public.admin_display_name(r.handled_by),
    r.reporter_id, public.admin_display_name(r.reporter_id), r.target_user_id, public.admin_display_name(r.target_user_id),
    public.is_banned(r.target_user_id),
    (select count(*) from public.reports o where o.target_user_id = r.target_user_id and o.status = 'open')
  from public.reports r
  where (p_status is null or r.status = p_status)
    and (p_ids is null or r.id = any (p_ids))
  order by case when r.status = 'open' then r.created_at end asc, r.handled_at desc, r.id;
end;
$$;

create or replace function public.admin_export_appeals(p_status text default null, p_ids uuid[] default null)
returns table (id uuid, created_at timestamptz, status text, message text, admin_response text, decided_at timestamptz,
  decided_by_name text, ban_id uuid, user_id uuid, user_name text, reason text, public_note text,
  banned_at timestamptz, expires_at timestamptz, banned_by_name text)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if not public.staff_can('admin') then raise exception 'FORBIDDEN'; end if;
  return query
  select a.id, a.created_at, a.status, a.message, a.admin_response, a.decided_at,
    public.admin_display_name(a.decided_by), b.id, a.user_id, public.admin_display_name(a.user_id),
    b.reason, b.public_note, b.created_at, b.expires_at, public.admin_display_name(b.created_by)
  from public.appeals a join public.bans b on b.id = a.ban_id
  where (p_status is null or a.status = p_status)
    and (p_ids is null or a.id = any (p_ids))
  order by case when a.status = 'open' then a.created_at end asc, a.decided_at desc, a.id;
end;
$$;

-- Keyset like admin_audit_log, but p_limit is capped at 1000 (one PostgREST page)
-- and p_ids restricts to chosen rows.
create or replace function public.admin_export_audit(
  p_actor uuid default null, p_target uuid default null, p_entity text default null,
  p_from timestamptz default null, p_to timestamptz default null, p_ids uuid[] default null,
  p_before_at timestamptz default null, p_before_id uuid default null, p_limit int default 1000)
returns table (id uuid, created_at timestamptz, actor_user_id uuid, actor_name text, target_user_id uuid,
  target_name text, entity text, entity_id uuid, field text, old_value text, new_value text)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if not public.staff_can('admin') then raise exception 'FORBIDDEN'; end if;
  return query
  select l.id, l.created_at, l.actor_user_id, public.admin_display_name(l.actor_user_id),
    l.target_user_id, public.admin_display_name(l.target_user_id),
    l.entity, l.entity_id, l.field, l.old_value, l.new_value
  from public.account_change_log l
  where l.source = 'admin'
    and (p_actor is null or l.actor_user_id = p_actor)
    and (p_target is null or l.target_user_id = p_target)
    and (p_entity is null or l.entity = p_entity)
    and (p_from is null or l.created_at >= p_from)
    and (p_to is null or l.created_at < p_to)
    and (p_ids is null or l.id = any (p_ids))
    and (p_before_at is null or (l.created_at, l.id) < (p_before_at, p_before_id))
  order by l.created_at desc, l.id desc
  limit least(greatest(coalesce(p_limit, 1000), 1), 1000);
end;
$$;

-- Filter logic moved out of admin_list_players. Internal: no grants, only the
-- security-definer wrappers below reach it.
create or replace function public.admin_players_filtered(p_filters jsonb, p_query text)
returns table (id uuid, display_name text, handle text, role text, email text, chula_email text, mc text,
  wl text, kind text, banned boolean, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_f jsonb := coalesce(p_filters, '{}');
  v_like text := '%' || replace(replace(replace(coalesce(trim(p_query), ''), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  v_player text := '%' || replace(replace(replace(coalesce(v_f ->> 'player', ''), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  v_mc text := '%' || replace(replace(replace(coalesce(v_f ->> 'minecraft', ''), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  v_status text[];
  v_role text[];
  v_banned text[];
  v_whitelist text[];
  v_from date;
  v_to date;
  k text;
begin
  if not public.staff_can('players_read') then raise exception 'FORBIDDEN'; end if;
  if jsonb_typeof(v_f) <> 'object' then raise exception 'INVALID'; end if;

  for k in select jsonb_object_keys(v_f) loop
    if k in ('status', 'role', 'banned', 'whitelist') then
      if jsonb_typeof(v_f -> k) <> 'array' then raise exception 'INVALID'; end if;
    elsif k in ('player', 'minecraft', 'joined_from', 'joined_to') then
      if jsonb_typeof(v_f -> k) <> 'string' then raise exception 'INVALID'; end if;
    else
      raise exception 'INVALID';
    end if;
  end loop;

  v_status := array(select jsonb_array_elements_text(v_f -> 'status'));
  v_role := array(select jsonb_array_elements_text(v_f -> 'role'));
  v_banned := array(select jsonb_array_elements_text(v_f -> 'banned'));
  v_whitelist := array(select jsonb_array_elements_text(v_f -> 'whitelist'));
  if not v_status <@ array['verified', 'guest', 'unverified']
     or not v_role <@ array['user', 'admin', 'owner', 'moderator', 'event_staff']
     or not v_banned <@ array['yes', 'no']
     or not v_whitelist <@ array['whitelisted', 'pending', 'retrying', 'none'] then raise exception 'INVALID'; end if;
  begin
    v_from := (v_f ->> 'joined_from')::date;
    v_to := (v_f ->> 'joined_to')::date;
  exception when others then raise exception 'INVALID';
  end;

  return query
  with base as (
    select u.id, coalesce(p.role, 'user') as role, case when public.staff_can('admin') then u.email::text end as email, case when public.staff_can('admin') then c.email end as chula_email,
      public.admin_display_name(u.id) as display_name,
      coalesce(d.name, case when public.staff_can('admin') then u.email::text end, '(no Discord)') as handle,
      case when public.is_chula_verified(u.id) then 'verified'
           when p.guest_verified_at is not null then 'guest'
           else 'unverified' end as kind,
      public.is_banned(u.id) as banned,
      (select string_agg(r.minecraft_username, ', ' order by r.created_at)
         from public.minecraft_registrations r where r.user_id = u.id and r.is_active) as mc,
      exists (select 1 from public.minecraft_registrations r where r.user_id = u.id and r.is_active and r.desired_whitelisted and r.sync_status = 'failed') as wl_failed,
      exists (select 1 from public.minecraft_registrations r where r.user_id = u.id and r.is_active and r.desired_whitelisted and r.sync_status = 'pending') as wl_pending,
      exists (select 1 from public.minecraft_registrations r where r.user_id = u.id and r.is_active and r.desired_whitelisted and r.sync_status = 'synced') as wl_synced,
      u.created_at
    from auth.users u
    left join public.profiles p on p.user_id = u.id
    left join public.chula_claims c on c.user_id = u.id
    left join lateral (
      select coalesce(i.identity_data ->> 'full_name', i.identity_data ->> 'user_name', i.identity_data ->> 'name') as name
      from auth.identities i where i.user_id = u.id and i.provider = 'discord' limit 1
    ) d on true
    where coalesce(trim(p_query), '') = ''
      or u.email ilike v_like or c.email ilike v_like
      or exists (
        select 1 from auth.identities i
        where i.user_id = u.id and i.provider = 'discord'
          and (i.provider_id = trim(p_query)
            or i.identity_data ->> 'full_name' ilike v_like
            or i.identity_data ->> 'user_name' ilike v_like
            or i.identity_data ->> 'name' ilike v_like
            or i.identity_data -> 'custom_claims' ->> 'global_name' ilike v_like))
      or exists (select 1 from auth.identities g where g.user_id = u.id and g.provider = 'google' and g.identity_data ->> 'email' ilike v_like)
      or exists (select 1 from public.minecraft_registrations r where r.user_id = u.id and r.minecraft_username ilike v_like)
  ),
  shaped as (
    select b.*,
      case when b.wl_failed then 'retrying' when b.wl_pending then 'pending' when b.wl_synced then 'whitelisted' else 'none' end as wl
    from base b
  )
  select s.id, s.display_name, s.handle, s.role, s.email, s.chula_email, s.mc, s.wl, s.kind, s.banned, s.created_at
  from shaped s
  where (v_f ->> 'player' is null or s.display_name ilike v_player or s.handle ilike v_player or s.email ilike v_player)
    and (v_f ->> 'minecraft' is null or exists (select 1 from public.minecraft_registrations r where r.user_id = s.id and r.minecraft_username ilike v_mc))
    and (cardinality(v_status) = 0 or s.kind = any (v_status))
    and (cardinality(v_role) = 0 or s.role = any (v_role))
    and (cardinality(v_banned) = 0 or (case when s.banned then 'yes' else 'no' end) = any (v_banned))
    and (cardinality(v_whitelist) = 0
      or ('retrying' = any (v_whitelist) and s.wl_failed)
      or ('pending' = any (v_whitelist) and s.wl_pending)
      or ('whitelisted' = any (v_whitelist) and s.wl_synced)
      or ('none' = any (v_whitelist) and s.wl = 'none'))
    and (v_from is null or (s.created_at at time zone 'Asia/Bangkok')::date >= v_from)
    and (v_to is null or (s.created_at at time zone 'Asia/Bangkok')::date <= v_to);
end;
$$;
revoke all on function public.admin_players_filtered(jsonb, text) from public, anon, authenticated;

create or replace function public.admin_list_players(
  p_filters jsonb default '{}', p_query text default '', p_sort text default 'joined',
  p_desc boolean default true, p_offset integer default 0, p_limit integer default 50)
returns table (user_id uuid, display_name text, handle text, role text, email text, chula_email text,
  minecraft_usernames text, whitelist text, verification_kind text, banned boolean, created_at timestamptz, total bigint)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if not public.staff_can('players_read') then raise exception 'FORBIDDEN'; end if;
  if coalesce(p_sort, '') not in ('player', 'minecraft', 'whitelist', 'status', 'role', 'banned', 'joined')
     or p_desc is null then raise exception 'INVALID'; end if;

  return query
  select s.id, s.display_name, s.handle, s.role, s.email, s.chula_email, s.mc, s.wl, s.kind, s.banned, s.created_at, count(*) over ()
  from public.admin_players_filtered(p_filters, p_query) s
  order by
    case when not p_desc then case p_sort
      when 'player' then lower(s.display_name) when 'minecraft' then lower(s.mc) when 'whitelist' then s.wl
      when 'status' then s.kind when 'role' then s.role when 'banned' then s.banned::text end end asc nulls last,
    case when p_desc then case p_sort
      when 'player' then lower(s.display_name) when 'minecraft' then lower(s.mc) when 'whitelist' then s.wl
      when 'status' then s.kind when 'role' then s.role when 'banned' then s.banned::text end end desc nulls last,
    case when p_sort = 'joined' and not p_desc then s.created_at end asc,
    s.created_at desc,
    s.id
  offset greatest(coalesce(p_offset, 0), 0)
  limit least(greatest(coalesce(p_limit, 50), 1), 1000);
end;
$$;

-- Every id the filter matches, newest first, capped at 5000.
create or replace function public.admin_list_player_ids(p_filters jsonb default '{}', p_query text default '')
returns uuid[]
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.staff_can('players_read') then raise exception 'FORBIDDEN'; end if;
  return coalesce((select array_agg(x.id) from (
    select s.id from public.admin_players_filtered(p_filters, p_query) s
    order by s.created_at desc, s.id limit 5000) x), '{}');
end;
$$;

revoke all on function public.admin_export_reports(text, uuid[]) from public, anon;
revoke all on function public.admin_export_appeals(text, uuid[]) from public, anon;
revoke all on function public.admin_export_audit(uuid, uuid, text, timestamptz, timestamptz, uuid[], timestamptz, uuid, int) from public, anon;
revoke all on function public.admin_list_player_ids(jsonb, text) from public, anon;
grant execute on function public.admin_export_reports(text, uuid[]) to authenticated;
grant execute on function public.admin_export_appeals(text, uuid[]) to authenticated;
grant execute on function public.admin_export_audit(uuid, uuid, text, timestamptz, timestamptz, uuid[], timestamptz, uuid, int) to authenticated;
grant execute on function public.admin_list_player_ids(jsonb, text) to authenticated;
