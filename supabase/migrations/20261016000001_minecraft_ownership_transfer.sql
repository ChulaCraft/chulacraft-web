-- A removed (is_active = false) Minecraft account can be linked by another
-- player. The table keeps one row per Minecraft account, so the row is handed
-- to the new player and the previous owner is copied into
-- minecraft_ownership_history first. Nothing else about the table changes.

create table if not exists public.minecraft_ownership_history (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null,
  minecraft_uuid uuid not null,
  minecraft_username text not null,
  user_id uuid not null,
  discord_user_id text not null,
  discord_username text,
  linked_at timestamptz not null,
  transferred_to uuid not null,
  transferred_at timestamptz not null default now()
);
create index if not exists minecraft_ownership_history_uuid_idx
  on public.minecraft_ownership_history (minecraft_uuid, transferred_at desc);
-- Server-only: readable by the service role and the Supabase dashboard.
alter table public.minecraft_ownership_history enable row level security;
revoke all on public.minecraft_ownership_history from anon, authenticated;

-- Unchanged from 20261012000001 except a removed row owned by someone else is
-- handed over instead of raising REGISTRATION_CONFLICT.
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
  if not public.is_player_verified(v_user_id) then raise exception 'CU_SSO_REQUIRED'; end if;
  if public.is_banned(v_user_id) then raise exception 'BANNED'; end if;

  -- Serialize this user's adds so two tabs can't both take the last slot.
  insert into public.profiles (user_id) values (v_user_id) on conflict do nothing;
  perform 1 from public.profiles p where p.user_id = v_user_id for update;

  select * into v_row from public.minecraft_registrations r where r.minecraft_uuid = p_minecraft_uuid for update;
  if found then
    -- Never reveal more than "conflict" about accounts someone else still owns.
    if v_row.user_id <> v_user_id and v_row.is_active then raise exception 'REGISTRATION_CONFLICT'; end if;
    if v_row.is_active then
      return query select v_row.id, v_row.minecraft_username, v_row.desired_whitelisted, v_row.sync_status, v_row.updated_at, false;
      return;
    end if;
    -- An admin removal sticks to the Minecraft account, whoever asks for it.
    if public.revoked_by_admin(v_row.id) then raise exception 'REGISTRATION_BLOCKED'; end if;
  end if;

  if (select count(*) from public.minecraft_registrations r where r.user_id = v_user_id and r.is_active) >= 5 then
    raise exception 'LIMIT_REACHED';
  end if;

  begin
    if v_row.id is not null and v_row.user_id <> v_user_id then
      insert into public.minecraft_ownership_history
        (registration_id, minecraft_uuid, minecraft_username, user_id, discord_user_id, discord_username, linked_at, transferred_to)
        values (v_row.id, v_row.minecraft_uuid, v_row.minecraft_username, v_row.user_id, v_row.discord_user_id, v_row.discord_username, v_row.created_at, v_user_id);
      update public.minecraft_registrations r
        set user_id = v_user_id, discord_user_id = v_discord_id, discord_username = v_discord_username, created_at = now(),
            is_active = true, desired_whitelisted = true, minecraft_username = p_minecraft_username, minecraft_username_key = lower(p_minecraft_username)
        where r.id = v_row.id returning * into v_row;
      perform public.log_account_change(v_user_id, v_user_id, 'minecraft_registrations', v_row.id, 'minecraft_username', null, p_minecraft_username, 'self');
    elsif v_row.id is not null then
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
revoke all on function public.add_minecraft_account(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.add_minecraft_account(uuid, uuid, text) to service_role;
