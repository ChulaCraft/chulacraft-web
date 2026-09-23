-- One user can own up to 5 active Minecraft accounts. Every write goes through
-- the security-definer RPCs below and is recorded in account_change_log.

alter table public.minecraft_registrations drop constraint if exists minecraft_registrations_user_id_key;
alter table public.minecraft_registrations drop constraint if exists minecraft_registrations_discord_user_id_key;
create index if not exists minecraft_registrations_user_idx on public.minecraft_registrations (user_id);
-- user_id is readable so clients can filter explicitly; RLS still limits rows to their own.
grant select (id, user_id, created_at) on public.minecraft_registrations to authenticated;

drop function if exists public.register_minecraft_profile(uuid, text);

-- True when the latest whitelist change on a registration was an admin revoke,
-- so a player can't undo an admin removal by re-adding the same account.
create or replace function public.revoked_by_admin(p_registration_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((
    select l.source = 'admin' and l.new_value = 'false'
    from public.account_change_log l
    where l.entity = 'minecraft_registrations' and l.entity_id = p_registration_id and l.field = 'desired_whitelisted'
    order by l.created_at desc limit 1
  ), false);
$$;
revoke all on function public.revoked_by_admin(uuid) from public, anon, authenticated;

create or replace function public.add_minecraft_account(p_minecraft_uuid uuid, p_minecraft_username text)
returns table (id uuid, minecraft_username text, desired_whitelisted boolean, sync_status text, updated_at timestamptz, created boolean)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_user_id uuid := auth.uid();
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
  if not exists (select 1 from public.cu_sso_identities c where c.user_id = v_user_id) then raise exception 'CU_SSO_REQUIRED'; end if;

  -- Serialize this user's adds so two tabs can't both take the last slot.
  insert into public.profiles (user_id) values (v_user_id) on conflict do nothing;
  perform 1 from public.profiles p where p.user_id = v_user_id for update;

  select * into v_row from public.minecraft_registrations r where r.minecraft_uuid = p_minecraft_uuid;
  if found then
    -- Never reveal more than "conflict" about accounts owned by someone else.
    if v_row.user_id <> v_user_id then raise exception 'REGISTRATION_CONFLICT'; end if;
    if v_row.desired_whitelisted then
      return query select v_row.id, v_row.minecraft_username, v_row.desired_whitelisted, v_row.sync_status, v_row.updated_at, false;
      return;
    end if;
    if public.revoked_by_admin(v_row.id) then raise exception 'REGISTRATION_BLOCKED'; end if;
  end if;

  if (select count(*) from public.minecraft_registrations r where r.user_id = v_user_id and r.desired_whitelisted) >= 5 then
    raise exception 'LIMIT_REACHED';
  end if;

  begin
    if v_row.id is not null then
      update public.minecraft_registrations r
        set desired_whitelisted = true, minecraft_username = p_minecraft_username, minecraft_username_key = lower(p_minecraft_username)
        where r.id = v_row.id returning * into v_row;
      perform public.log_account_change(v_user_id, v_user_id, 'minecraft_registrations', v_row.id, 'desired_whitelisted', 'false', 'true', 'self');
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
revoke all on function public.add_minecraft_account(uuid, text) from public, anon;
grant execute on function public.add_minecraft_account(uuid, text) to authenticated;

-- Pen → Save. Same Mojang UUID renames in place; a different UUID revokes the
-- old slot and adds the new account in the same transaction (PRD D4/D5).
create or replace function public.change_minecraft_account(p_registration_id uuid, p_minecraft_uuid uuid, p_minecraft_username text)
returns table (id uuid, minecraft_username text, desired_whitelisted boolean, sync_status text, updated_at timestamptz, created boolean)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_user_id uuid := auth.uid();
  v_row public.minecraft_registrations%rowtype;
  v_old_username text;
begin
  if v_user_id is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_minecraft_username !~ '^[A-Za-z0-9_]{3,16}$' then raise exception 'INVALID_USERNAME'; end if;

  select * into v_row from public.minecraft_registrations r
    where r.id = p_registration_id and r.user_id = v_user_id and r.desired_whitelisted for update;
  if not found then raise exception 'NOT_FOUND'; end if;

  if v_row.minecraft_uuid = p_minecraft_uuid then
    if v_row.minecraft_username <> p_minecraft_username then
      v_old_username := v_row.minecraft_username;
      begin
        update public.minecraft_registrations r
          set minecraft_username = p_minecraft_username, minecraft_username_key = lower(p_minecraft_username)
          where r.id = v_row.id returning * into v_row;
      exception when unique_violation then
        raise exception 'REGISTRATION_CONFLICT';
      end;
      perform public.log_account_change(v_user_id, v_user_id, 'minecraft_registrations', v_row.id, 'minecraft_username', v_old_username, p_minecraft_username, 'self');
    end if;
    return query select v_row.id, v_row.minecraft_username, v_row.desired_whitelisted, v_row.sync_status, v_row.updated_at, false;
    return;
  end if;

  update public.minecraft_registrations r set desired_whitelisted = false where r.id = v_row.id;
  perform public.log_account_change(v_user_id, v_user_id, 'minecraft_registrations', v_row.id, 'desired_whitelisted', 'true', 'false', 'self');
  return query select * from public.add_minecraft_account(p_minecraft_uuid, p_minecraft_username);
end;
$$;
revoke all on function public.change_minecraft_account(uuid, uuid, text) from public, anon;
grant execute on function public.change_minecraft_account(uuid, uuid, text) to authenticated;

-- Admins manage accounts of plain users; owners manage everyone's (PRD D6).
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
  if v_row.desired_whitelisted = p_value then return; end if;

  if p_value and (select count(*) from public.minecraft_registrations r where r.user_id = v_row.user_id and r.desired_whitelisted) >= 5 then
    raise exception 'LIMIT_REACHED';
  end if;

  update public.minecraft_registrations r set desired_whitelisted = p_value where r.id = p_registration_id;
  perform public.log_account_change(v_actor, v_row.user_id, 'minecraft_registrations', v_row.id, 'desired_whitelisted', (not p_value)::text, p_value::text, 'admin');
end;
$$;
revoke all on function public.admin_set_whitelisted(uuid, boolean) from public, anon;
grant execute on function public.admin_set_whitelisted(uuid, boolean) to authenticated;

-- ponytail: no explicit last-owner guard; owners can't change their own role,
-- so the caller always stays an owner.
create or replace function public.admin_set_role(p_user_id uuid, p_role text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_old text;
begin
  if public.current_app_role() is distinct from 'owner' then raise exception 'FORBIDDEN'; end if;
  if p_user_id = v_actor then raise exception 'SELF_ROLE_CHANGE'; end if;
  if p_role is null or p_role not in ('owner', 'admin', 'user') then raise exception 'INVALID_ROLE'; end if;

  select p.role into v_old from public.profiles p where p.user_id = p_user_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_old = p_role then return; end if;

  update public.profiles p set role = p_role where p.user_id = p_user_id;
  perform public.log_account_change(v_actor, p_user_id, 'profiles', p_user_id, 'role', v_old, p_role, 'admin');
end;
$$;
revoke all on function public.admin_set_role(uuid, text) from public, anon;
grant execute on function public.admin_set_role(uuid, text) to authenticated;

-- ponytail: ilike scan capped at 50 rows; add trigram indexes if users reach the thousands.
create or replace function public.admin_search_users(p_query text)
returns table (user_id uuid, role text, email text, discord_username text, chula_username text, minecraft_usernames text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_pattern text := '%' || replace(replace(replace(coalesce(trim(p_query), ''), '\', '\\'), '%', '\%'), '_', '\_') || '%';
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  return query
  select u.id, coalesce(p.role, 'user'), u.email::text, d.name, c.chula_username,
    (select string_agg(r.minecraft_username, ', ' order by r.created_at)
       from public.minecraft_registrations r where r.user_id = u.id and r.desired_whitelisted),
    u.created_at
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  left join public.cu_sso_identities c on c.user_id = u.id
  left join lateral (
    select coalesce(i.identity_data ->> 'full_name', i.identity_data ->> 'user_name', i.identity_data ->> 'name') as name
    from auth.identities i where i.user_id = u.id and i.provider = 'discord' limit 1
  ) d on true
  where v_pattern = '%%'
    or u.email ilike v_pattern or d.name ilike v_pattern or c.chula_username ilike v_pattern or c.email ilike v_pattern
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
    'discord', (select jsonb_build_object('id', i.provider_id, 'username',
                  coalesce(i.identity_data ->> 'full_name', i.identity_data ->> 'user_name', i.identity_data ->> 'name'))
                from auth.identities i where i.user_id = p_user_id and i.provider = 'discord' limit 1),
    'chula', (select to_jsonb(c) - 'user_id' from public.cu_sso_identities c where c.user_id = p_user_id),
    'registrations', coalesce((
      select jsonb_agg(jsonb_build_object('id', r.id, 'minecraft_username', r.minecraft_username, 'minecraft_uuid', r.minecraft_uuid,
               'desired_whitelisted', r.desired_whitelisted, 'sync_status', r.sync_status, 'updated_at', r.updated_at) order by r.created_at)
      from public.minecraft_registrations r where r.user_id = p_user_id), '[]'::jsonb),
    'log', coalesce((
      select jsonb_agg(to_jsonb(l) order by l.created_at desc)
      from (select * from public.account_change_log x where x.target_user_id = p_user_id order by x.created_at desc limit 100) l), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.admin_get_user(uuid) from public, anon;
grant execute on function public.admin_get_user(uuid) to authenticated;
