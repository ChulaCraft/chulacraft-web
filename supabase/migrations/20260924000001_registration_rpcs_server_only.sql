-- The Minecraft account RPCs were callable by any signed-in player through
-- PostgREST, skipping the server's Mojang lookup (so any UUID/name pair could
-- be stored) and its rate limits. They now take the user id from the server,
-- which verifies the session first, and only the service role may call them.

drop function if exists public.add_minecraft_account(uuid, text);
drop function if exists public.change_minecraft_account(uuid, uuid, text);
drop function if exists public.remove_minecraft_account(uuid);

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
  if not exists (select 1 from public.cu_sso_identities c where c.user_id = v_user_id) then raise exception 'CU_SSO_REQUIRED'; end if;

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

create or replace function public.remove_minecraft_account(p_user_id uuid, p_registration_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := p_user_id;
begin
  if v_user_id is null then raise exception 'UNAUTHENTICATED'; end if;
  update public.minecraft_registrations r set is_active = false, desired_whitelisted = false
    where r.id = p_registration_id and r.user_id = v_user_id and r.is_active;
  if not found then raise exception 'NOT_FOUND'; end if;
  perform public.log_account_change(v_user_id, v_user_id, 'minecraft_registrations', p_registration_id, 'is_active', 'true', 'false', 'self');
end;
$$;

create or replace function public.change_minecraft_account(p_user_id uuid, p_registration_id uuid, p_minecraft_uuid uuid, p_minecraft_username text)
returns table (id uuid, minecraft_username text, desired_whitelisted boolean, sync_status text, updated_at timestamptz, created boolean)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_user_id uuid := p_user_id;
  v_row public.minecraft_registrations%rowtype;
  v_old_username text;
begin
  if v_user_id is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_minecraft_username !~ '^[A-Za-z0-9_]{3,16}$' then raise exception 'INVALID_USERNAME'; end if;

  select * into v_row from public.minecraft_registrations r
    where r.id = p_registration_id and r.user_id = v_user_id and r.is_active for update;
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

  -- An admin-removed account can't be swapped for a fresh one to dodge the removal.
  if not v_row.desired_whitelisted then raise exception 'REGISTRATION_BLOCKED'; end if;
  perform public.remove_minecraft_account(p_user_id, v_row.id);
  return query select * from public.add_minecraft_account(p_user_id, p_minecraft_uuid, p_minecraft_username);
end;
$$;

revoke all on function public.add_minecraft_account(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.remove_minecraft_account(uuid, uuid) from public, anon, authenticated;
revoke all on function public.change_minecraft_account(uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.add_minecraft_account(uuid, uuid, text) to service_role;
grant execute on function public.remove_minecraft_account(uuid, uuid) to service_role;
grant execute on function public.change_minecraft_account(uuid, uuid, uuid, text) to service_role;
