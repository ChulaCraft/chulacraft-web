-- One list behind the admin players table, its column filters, infinite scroll,
-- CSV export and the dashboard number links. Follows docs/admin-tables.md:
-- p_filters is {column: text} for text, {column: [values]} for enums (any of)
-- and {joined_from, joined_to} as Bangkok days. Filters combine with AND.
--
-- ponytail: offset paging and per-row status functions. Fine for a few
-- thousand players; precompute status or switch to keyset paging if it slows.
create or replace function public.admin_list_players(
  p_filters jsonb default '{}', p_query text default '', p_sort text default 'joined',
  p_desc boolean default true, p_offset int default 0, p_limit int default 50)
returns table (
  user_id uuid, display_name text, handle text, role text, email text, chula_email text,
  minecraft_usernames text, whitelist text, verification_kind text, banned boolean,
  created_at timestamptz, total bigint)
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
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;
  if jsonb_typeof(v_f) <> 'object'
     or coalesce(p_sort, '') not in ('player', 'minecraft', 'whitelist', 'status', 'role', 'banned', 'joined')
     or p_desc is null then raise exception 'INVALID'; end if;

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
     or not v_role <@ array['user', 'admin', 'owner']
     or not v_banned <@ array['yes', 'no']
     or not v_whitelist <@ array['whitelisted', 'pending', 'retrying', 'none'] then raise exception 'INVALID'; end if;
  begin
    v_from := (v_f ->> 'joined_from')::date;
    v_to := (v_f ->> 'joined_to')::date;
  exception when others then raise exception 'INVALID';
  end;

  return query
  with base as (
    select u.id, coalesce(p.role, 'user') as role, u.email::text as email, c.email as chula_email,
      public.admin_display_name(u.id) as display_name,
      coalesce(d.name, u.email::text) as handle,
      case when public.is_chula_verified(u.id) then 'verified'
           when p.guest_verified_at is not null then 'guest'
           else 'unverified' end as kind,
      public.is_banned(u.id) as banned,
      (select string_agg(r.minecraft_username, ', ' order by r.created_at)
         from public.minecraft_registrations r where r.user_id = u.id and r.is_active) as mc,
      -- Per state: does the player have an active, whitelisted account in it?
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
  select s.id, s.display_name, s.handle, s.role, s.email, s.chula_email, s.mc, s.wl, s.kind, s.banned, s.created_at, count(*) over ()
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
    and (v_to is null or (s.created_at at time zone 'Asia/Bangkok')::date <= v_to)
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
revoke all on function public.admin_list_players(jsonb, text, text, boolean, int, int) from public, anon;
grant execute on function public.admin_list_players(jsonb, text, text, boolean, int, int) to authenticated;
