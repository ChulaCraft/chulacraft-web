-- Admin player search also matches the Discord user id (provider_id, e.g.
-- 864372561897848852) and every Discord name field, not just the first one
-- present. 20261004000001 only compared coalesce(full_name, user_name, name),
-- so a player whose display name was set could not be found by @username.
-- Same signature and columns, so create or replace is enough.
create or replace function public.admin_search_users(p_query text)
returns table (user_id uuid, role text, email text, discord_username text, chula_email text, minecraft_usernames text, verification_kind text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_query text := coalesce(trim(p_query), '');
  v_pattern text := '%' || replace(replace(replace(v_query, '\', '\\'), '%', '\%'), '_', '\_') || '%';
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
    or u.email ilike v_pattern or c.email ilike v_pattern
    -- Discord: exact id, or any of the name fields Supabase stores.
    or exists (
      select 1 from auth.identities i
      where i.user_id = u.id and i.provider = 'discord'
        and (i.provider_id = v_query
          or i.identity_data ->> 'full_name' ilike v_pattern
          or i.identity_data ->> 'user_name' ilike v_pattern
          or i.identity_data ->> 'name' ilike v_pattern
          or i.identity_data ->> 'preferred_username' ilike v_pattern
          or i.identity_data -> 'custom_claims' ->> 'global_name' ilike v_pattern))
    or exists (select 1 from auth.identities g where g.user_id = u.id and g.provider = 'google' and g.identity_data ->> 'email' ilike v_pattern)
    or exists (select 1 from public.minecraft_registrations r where r.user_id = u.id and r.minecraft_username ilike v_pattern)
  order by u.created_at desc
  limit 50;
end;
$$;
revoke all on function public.admin_search_users(text) from public, anon;
grant execute on function public.admin_search_users(text) to authenticated;
