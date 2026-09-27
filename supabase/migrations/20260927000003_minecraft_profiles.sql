-- Normalize: a Minecraft account (Mojang UUID + current name) lives in
-- minecraft_profiles; minecraft_registrations keeps only who claimed it and the
-- whitelist/sync state, pointing at the profile by minecraft_uuid.
-- The whitelist worker reads usernames from minecraft_whitelist (view below)
-- and keeps writing sync fields to minecraft_registrations.

create table if not exists public.minecraft_profiles (
  minecraft_uuid uuid primary key,
  minecraft_username text not null,
  minecraft_username_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint minecraft_username_format check (minecraft_username ~ '^[A-Za-z0-9_]{3,16}$'),
  constraint minecraft_username_key_lower check (minecraft_username_key = lower(minecraft_username))
);

insert into public.minecraft_profiles (minecraft_uuid, minecraft_username, minecraft_username_key, created_at)
  select r.minecraft_uuid, r.minecraft_username, r.minecraft_username_key, r.created_at from public.minecraft_registrations r
  on conflict do nothing;

alter table public.minecraft_registrations
  add constraint minecraft_registrations_minecraft_uuid_fkey
  foreign key (minecraft_uuid) references public.minecraft_profiles (minecraft_uuid) on update cascade on delete restrict;
alter table public.minecraft_registrations
  drop constraint if exists minecraft_username_format,
  drop constraint if exists minecraft_username_key_lower,
  drop column minecraft_username,
  drop column minecraft_username_key;

drop trigger if exists minecraft_profiles_updated_at on public.minecraft_profiles;
create trigger minecraft_profiles_updated_at before update on public.minecraft_profiles for each row execute function public.set_updated_at();

-- Players read the name of their own accounts (the dashboard embeds it); all
-- writes go through the RPCs below.
alter table public.minecraft_profiles enable row level security;
revoke all on public.minecraft_profiles from anon, authenticated;
grant select (minecraft_uuid, minecraft_username) on public.minecraft_profiles to authenticated;
grant select (minecraft_uuid) on public.minecraft_registrations to authenticated;
grant select on public.minecraft_profiles to service_role;
create policy "players can read own minecraft profiles" on public.minecraft_profiles for select to authenticated
  using (exists (select 1 from public.minecraft_registrations r where r.minecraft_uuid = minecraft_profiles.minecraft_uuid and r.user_id = (select auth.uid())));

-- Worker read model: the old flat row shape. Service role only.
create or replace view public.minecraft_whitelist with (security_invoker = true) as
  select r.*, p.minecraft_username, p.minecraft_username_key
  from public.minecraft_registrations r join public.minecraft_profiles p using (minecraft_uuid);
revoke all on public.minecraft_whitelist from public, anon, authenticated;
grant select on public.minecraft_whitelist to service_role;

-- Upserts the Mojang name for a UUID. Name taken by another UUID → conflict.
create or replace function public.upsert_minecraft_profile(p_minecraft_uuid uuid, p_minecraft_username text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.minecraft_profiles (minecraft_uuid, minecraft_username, minecraft_username_key)
    values (p_minecraft_uuid, p_minecraft_username, lower(p_minecraft_username))
    on conflict (minecraft_uuid) do update
      set minecraft_username = excluded.minecraft_username, minecraft_username_key = excluded.minecraft_username_key
      where public.minecraft_profiles.minecraft_username is distinct from excluded.minecraft_username;
exception when unique_violation then
  raise exception 'REGISTRATION_CONFLICT';
end;
$$;
revoke all on function public.upsert_minecraft_profile(uuid, text) from public, anon, authenticated;

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
  if not public.is_chula_verified(v_user_id) then raise exception 'CU_SSO_REQUIRED'; end if;

  -- Serialize this user's adds so two tabs can't both take the last slot.
  insert into public.profiles (user_id) values (v_user_id) on conflict do nothing;
  perform 1 from public.profiles p where p.user_id = v_user_id for update;

  select * into v_row from public.minecraft_registrations r where r.minecraft_uuid = p_minecraft_uuid;
  if found then
    -- Never reveal more than "conflict" about accounts owned by someone else.
    if v_row.user_id <> v_user_id then raise exception 'REGISTRATION_CONFLICT'; end if;
    if v_row.is_active then
      return query select v_row.id, mp.minecraft_username, v_row.desired_whitelisted, v_row.sync_status, v_row.updated_at, false
        from public.minecraft_profiles mp where mp.minecraft_uuid = v_row.minecraft_uuid;
      return;
    end if;
    if public.revoked_by_admin(v_row.id) then raise exception 'REGISTRATION_BLOCKED'; end if;
  end if;

  if (select count(*) from public.minecraft_registrations r where r.user_id = v_user_id and r.is_active) >= 5 then
    raise exception 'LIMIT_REACHED';
  end if;

  perform public.upsert_minecraft_profile(p_minecraft_uuid, p_minecraft_username);
  begin
    if v_row.id is not null then
      update public.minecraft_registrations r set is_active = true, desired_whitelisted = true
        where r.id = v_row.id returning * into v_row;
      perform public.log_account_change(v_user_id, v_user_id, 'minecraft_registrations', v_row.id, 'is_active', 'false', 'true', 'self');
    else
      insert into public.minecraft_registrations (user_id, discord_user_id, discord_username, minecraft_uuid)
        values (v_user_id, v_discord_id, v_discord_username, p_minecraft_uuid)
        returning * into v_row;
      perform public.log_account_change(v_user_id, v_user_id, 'minecraft_registrations', v_row.id, 'minecraft_username', null, p_minecraft_username, 'self');
    end if;
  exception when unique_violation then
    raise exception 'REGISTRATION_CONFLICT';
  end;

  return query select v_row.id, p_minecraft_username, v_row.desired_whitelisted, v_row.sync_status, v_row.updated_at, true;
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
    select mp.minecraft_username into v_old_username from public.minecraft_profiles mp where mp.minecraft_uuid = v_row.minecraft_uuid;
    if v_old_username <> p_minecraft_username then
      perform public.upsert_minecraft_profile(p_minecraft_uuid, p_minecraft_username);
      -- Bumps updated_at so the player sees the rename land.
      update public.minecraft_registrations r set updated_at = now() where r.id = v_row.id returning * into v_row;
      perform public.log_account_change(v_user_id, v_user_id, 'minecraft_registrations', v_row.id, 'minecraft_username', v_old_username, p_minecraft_username, 'self');
    end if;
    return query select v_row.id, p_minecraft_username, v_row.desired_whitelisted, v_row.sync_status, v_row.updated_at, false;
    return;
  end if;

  -- An admin-removed account can't be swapped for a fresh one to dodge the removal.
  if not v_row.desired_whitelisted then raise exception 'REGISTRATION_BLOCKED'; end if;
  perform public.remove_minecraft_account(p_user_id, v_row.id);
  return query select * from public.add_minecraft_account(p_user_id, p_minecraft_uuid, p_minecraft_username);
end;
$$;

create or replace function public.admin_removed_accounts()
returns table (id uuid, user_id uuid, minecraft_username text, discord_username text, is_active boolean, removed_by text, removed_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  return query
  select r.id, r.user_id, mp.minecraft_username, r.discord_username, r.is_active, l.source, coalesce(l.created_at, r.updated_at)
  from public.minecraft_registrations r
  join public.minecraft_profiles mp on mp.minecraft_uuid = r.minecraft_uuid
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

create or replace function public.admin_search_users(p_query text)
returns table (user_id uuid, role text, email text, discord_username text, chula_email text, minecraft_usernames text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_pattern text := '%' || replace(replace(replace(coalesce(trim(p_query), ''), '\', '\\'), '%', '\%'), '_', '\_') || '%';
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  return query
  select u.id, coalesce(p.role, 'user'), u.email::text, d.name, c.email,
    (select string_agg(mp.minecraft_username, ', ' order by r.created_at)
       from public.minecraft_registrations r join public.minecraft_profiles mp on mp.minecraft_uuid = r.minecraft_uuid
       where r.user_id = u.id and r.desired_whitelisted),
    u.created_at
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  left join public.chula_claims c on c.user_id = u.id
  left join lateral (
    select coalesce(i.identity_data ->> 'full_name', i.identity_data ->> 'user_name', i.identity_data ->> 'name') as name
    from auth.identities i where i.user_id = u.id and i.provider = 'discord' limit 1
  ) d on true
  where v_pattern = '%%'
    or u.email ilike v_pattern or d.name ilike v_pattern or c.email ilike v_pattern
    or exists (select 1 from auth.identities g where g.user_id = u.id and g.provider = 'google' and g.identity_data ->> 'email' ilike v_pattern)
    or exists (select 1 from public.minecraft_registrations r join public.minecraft_profiles mp on mp.minecraft_uuid = r.minecraft_uuid
               where r.user_id = u.id and mp.minecraft_username ilike v_pattern)
  order by u.created_at desc
  limit 50;
end;
$$;

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
    'chula', (select jsonb_build_object('email', c.email, 'claimed_at', c.claimed_at, 'verified', public.is_chula_verified(p_user_id))
              from public.chula_claims c where c.user_id = p_user_id),
    'google', coalesce((
      select jsonb_agg(jsonb_build_object('email', i.identity_data ->> 'email', 'linked_at', i.created_at) order by i.created_at)
      from auth.identities i where i.user_id = p_user_id and i.provider = 'google'), '[]'::jsonb),
    'registrations', coalesce((
      select jsonb_agg(jsonb_build_object('id', r.id, 'minecraft_username', mp.minecraft_username, 'minecraft_uuid', r.minecraft_uuid,
               'desired_whitelisted', r.desired_whitelisted, 'is_active', r.is_active, 'sync_status', r.sync_status, 'updated_at', r.updated_at) order by r.created_at)
      from public.minecraft_registrations r join public.minecraft_profiles mp on mp.minecraft_uuid = r.minecraft_uuid
      where r.user_id = p_user_id), '[]'::jsonb),
    'log', coalesce((
      select jsonb_agg(to_jsonb(l) order by l.created_at desc)
      from (select * from public.account_change_log x where x.target_user_id = p_user_id order by x.created_at desc limit 100) l), '[]'::jsonb)
  );
end;
$$;
