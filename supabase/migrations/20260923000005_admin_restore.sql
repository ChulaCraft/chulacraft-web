-- Admin restore brings an account fully back: visible to the player
-- (is_active) and whitelisted, whether the player or an admin removed it.

create or replace function public.admin_set_whitelisted(p_registration_id uuid, p_value boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_actor_role text := public.current_app_role();
  v_row public.minecraft_registrations%rowtype;
  v_target_role text;
begin
  if v_actor_role is null or v_actor_role not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  select * into v_row from public.minecraft_registrations r where r.id = p_registration_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  select p.role into v_target_role from public.profiles p where p.user_id = v_row.user_id;
  if v_actor_role = 'admin' and coalesce(v_target_role, 'user') <> 'user' then raise exception 'FORBIDDEN'; end if;
  if v_row.desired_whitelisted = p_value and (not p_value or v_row.is_active) then return; end if;

  if p_value and not v_row.is_active
    and (select count(*) from public.minecraft_registrations r where r.user_id = v_row.user_id and r.is_active) >= 5 then
    raise exception 'LIMIT_REACHED';
  end if;

  update public.minecraft_registrations r
    set desired_whitelisted = p_value, is_active = r.is_active or p_value
    where r.id = p_registration_id;
  if v_row.desired_whitelisted <> p_value then
    perform public.log_account_change(v_actor, v_row.user_id, 'minecraft_registrations', v_row.id, 'desired_whitelisted', (not p_value)::text, p_value::text, 'admin');
  end if;
  if p_value and not v_row.is_active then
    perform public.log_account_change(v_actor, v_row.user_id, 'minecraft_registrations', v_row.id, 'is_active', 'false', 'true', 'admin');
  end if;
end;
$$;

-- Restore page: every account that is hidden or off the whitelist, newest first.
create or replace function public.admin_removed_accounts()
returns table (id uuid, user_id uuid, minecraft_username text, discord_username text, is_active boolean, removed_by text, removed_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  return query
  select r.id, r.user_id, r.minecraft_username, r.discord_username, r.is_active, l.source, coalesce(l.created_at, r.updated_at)
  from public.minecraft_registrations r
  left join lateral (
    select x.source, x.created_at from public.account_change_log x
    where x.entity = 'minecraft_registrations' and x.entity_id = r.id and x.new_value = 'false'
    order by x.created_at desc limit 1
  ) l on true
  where not r.is_active or not r.desired_whitelisted
  order by coalesce(l.created_at, r.updated_at) desc
  limit 200;
end;
$$;
revoke all on function public.admin_removed_accounts() from public, anon;
grant execute on function public.admin_removed_accounts() to authenticated;

-- Same as before, plus is_active so the detail page can tell player deletes apart.
create or replace function public.admin_get_user(p_user_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  return jsonb_build_object(
    'user', (select jsonb_build_object('id', u.id, 'email', u.email, 'created_at', u.created_at, 'role', coalesce(p.role, 'user'))
             from auth.users u left join public.profiles p on p.user_id = u.id where u.id = p_user_id),
    'discord', (select jsonb_build_object('id', i.provider_id, 'username',
                  coalesce(i.identity_data ->> 'full_name', i.identity_data ->> 'user_name', i.identity_data ->> 'name'))
                from auth.identities i where i.user_id = p_user_id and i.provider = 'discord' limit 1),
    'chula', (select to_jsonb(c) - 'user_id' from public.cu_sso_identities c where c.user_id = p_user_id),
    'registrations', coalesce((
      select jsonb_agg(jsonb_build_object('id', r.id, 'minecraft_username', r.minecraft_username, 'minecraft_uuid', r.minecraft_uuid,
               'desired_whitelisted', r.desired_whitelisted, 'is_active', r.is_active, 'sync_status', r.sync_status, 'updated_at', r.updated_at) order by r.created_at)
      from public.minecraft_registrations r where r.user_id = p_user_id), '[]'::jsonb),
    'log', coalesce((
      select jsonb_agg(to_jsonb(l) order by l.created_at desc)
      from (select * from public.account_change_log x where x.target_user_id = p_user_id order by x.created_at desc limit 100) l), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.admin_get_user(uuid) from public, anon;
grant execute on function public.admin_get_user(uuid) to authenticated;
