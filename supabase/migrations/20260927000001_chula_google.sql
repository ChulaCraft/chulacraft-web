-- Chula membership is now proven by linking a Chula Google account (Supabase
-- linkIdentity) instead of CU SSO. Identities live in auth.identities; this
-- table pins which Google AND Discord account a user claimed, and survives
-- unlinking, so a Chula account can't be swapped or passed to another Discord account.
-- Additive only: cu_sso_identities is dropped in the next migration, after deploy.

create table if not exists public.chula_claims (
  user_id uuid primary key references auth.users(id) on delete cascade,
  google_sub text not null unique,
  email text not null unique check (email = lower(email)),
  discord_id text not null unique,
  claimed_at timestamptz not null default now()
);

alter table public.chula_claims enable row level security;
revoke all on public.chula_claims from anon, authenticated;
grant select (user_id, email, claimed_at) on public.chula_claims to authenticated;
grant select on public.chula_claims to service_role;
create policy "users can read own chula claim" on public.chula_claims for select to authenticated using ((select auth.uid()) = user_id);

alter table public.account_change_log drop constraint if exists account_change_log_entity_check;
alter table public.account_change_log add constraint account_change_log_entity_check
  check (entity in ('minecraft_registrations', 'profiles', 'cu_sso_identities', 'chula_claims', 'identities'));

create or replace function public.is_chula_email(p_email text)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(lower(p_email) ~ '^[^@\s]+@(student\.)?chula\.ac\.th$', false);
$$;
grant execute on function public.is_chula_email(text) to authenticated, service_role;

-- Verified = the claim's Discord and Google identities are both still linked,
-- no other Discord identity is linked, and at most one other (personal) Google
-- account. Enforced here, not only in the callback, because linkIdentity can be
-- called from the browser console with a redirect that skips /auth/callback.
create or replace function public.is_chula_verified(p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.chula_claims c
    where c.user_id = p_user_id
      and exists (select 1 from auth.identities i where i.user_id = c.user_id and i.provider = 'google' and i.provider_id = c.google_sub)
      and exists (select 1 from auth.identities i where i.user_id = c.user_id and i.provider = 'discord' and i.provider_id = c.discord_id)
      and (select count(*) from auth.identities i where i.user_id = c.user_id and i.provider = 'discord') = 1
      and (select count(*) from auth.identities i where i.user_id = c.user_id and i.provider = 'google' and i.provider_id <> c.google_sub) <= 1);
$$;
revoke all on function public.is_chula_verified(uuid) from public, anon, authenticated;
grant execute on function public.is_chula_verified(uuid) to service_role;

create or replace function public.am_i_chula_verified()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_chula_verified((select auth.uid()));
$$;
revoke all on function public.am_i_chula_verified() from public, anon;
grant execute on function public.am_i_chula_verified() to authenticated;

-- Server-only: the auth callback calls this with the secret key after reading
-- the session's own identities and checking the domain + email_verified.
create or replace function public.claim_chula(p_user_id uuid, p_google_sub text, p_email text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(p_email);
  v_existing public.chula_claims%rowtype;
  v_discord_id text;
begin
  if not public.is_chula_email(v_email) then raise exception 'CU_WRONG_DOMAIN'; end if;
  if not exists (select 1 from auth.identities i where i.user_id = p_user_id and i.provider = 'google' and i.provider_id = p_google_sub) then
    raise exception 'CU_IDENTITY_MISSING';
  end if;
  if (select count(*) from auth.identities i where i.user_id = p_user_id and i.provider = 'discord') <> 1 then
    raise exception 'DISCORD_IDENTITY_REQUIRED';
  end if;
  select i.provider_id into v_discord_id from auth.identities i where i.user_id = p_user_id and i.provider = 'discord';

  select * into v_existing from public.chula_claims c where c.user_id = p_user_id;
  if found then
    if v_existing.google_sub = p_google_sub then return; end if;
    raise exception 'CU_SWAP_FORBIDDEN';
  end if;

  begin
    insert into public.chula_claims (user_id, google_sub, email, discord_id) values (p_user_id, p_google_sub, v_email, v_discord_id);
  exception when unique_violation then
    raise exception 'CU_ALREADY_LINKED';
  end;
  perform public.log_account_change(p_user_id, p_user_id, 'chula_claims', p_user_id, 'email', null, v_email, 'self');
end;
$$;
revoke all on function public.claim_chula(uuid, text, text) from public, anon, authenticated;
grant execute on function public.claim_chula(uuid, text, text) to service_role;

-- Server-only audit for Google link/unlink the callback or dashboard performs.
create or replace function public.log_identity_change(p_user_id uuid, p_identity_id uuid, p_field text, p_old text, p_new text)
returns void language sql security definer set search_path = '' as $$
  select public.log_account_change(p_user_id, p_user_id, 'identities', p_identity_id, p_field, p_old, p_new, 'self');
$$;
revoke all on function public.log_identity_change(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.log_identity_change(uuid, uuid, text, text, text) to service_role;

-- Before User Created hook: only Discord may create accounts. Google only
-- signs in to (or links onto) an existing one.
create or replace function public.hook_only_discord_signups(event jsonb)
returns jsonb language plpgsql as $$
begin
  if event -> 'user' -> 'app_metadata' ->> 'provider' = 'discord' then return '{}'::jsonb; end if;
  return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'REGISTER_DISCORD_FIRST'));
end;
$$;
grant execute on function public.hook_only_discord_signups(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_only_discord_signups(jsonb) from public, anon, authenticated;

-- Admin reset: frees the Chula account and removes its Google identity, so the
-- user is gated to /verify and can claim again.
create or replace function public.admin_reset_chula(p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_actor_role text := public.current_app_role();
  v_target_role text;
  v_claim public.chula_claims%rowtype;
begin
  if v_actor_role is null or v_actor_role not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;
  select p.role into v_target_role from public.profiles p where p.user_id = p_user_id;
  if v_actor_role = 'admin' and coalesce(v_target_role, 'user') <> 'user' then raise exception 'FORBIDDEN'; end if;

  delete from public.chula_claims c where c.user_id = p_user_id returning * into v_claim;
  if not found then raise exception 'NOT_FOUND'; end if;
  delete from auth.identities i where i.user_id = p_user_id and i.provider = 'google' and i.provider_id = v_claim.google_sub;
  perform public.log_account_change(v_actor, p_user_id, 'chula_claims', p_user_id, 'email', v_claim.email, null, 'admin');
end;
$$;
revoke all on function public.admin_reset_chula(uuid) from public, anon;
grant execute on function public.admin_reset_chula(uuid) to authenticated;

-- Registration: same function as 20260924000001, only the Chula check changed.
-- Existing whitelist rows are untouched; only new adds need verification.
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
revoke all on function public.add_minecraft_account(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.add_minecraft_account(uuid, uuid, text) to service_role;

-- Admin views read Chula from chula_claims. Return column renamed, so drop first.
drop function if exists public.admin_search_users(text);
create function public.admin_search_users(p_query text)
returns table (user_id uuid, role text, email text, discord_username text, chula_email text, minecraft_usernames text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_pattern text := '%' || replace(replace(replace(coalesce(trim(p_query), ''), '\', '\\'), '%', '\%'), '_', '\_') || '%';
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  return query
  select u.id, coalesce(p.role, 'user'), u.email::text, d.name, c.email,
    (select string_agg(r.minecraft_username, ', ' order by r.created_at)
       from public.minecraft_registrations r where r.user_id = u.id and r.desired_whitelisted),
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
    'chula', (select jsonb_build_object('email', c.email, 'claimed_at', c.claimed_at, 'verified', public.is_chula_verified(p_user_id))
              from public.chula_claims c where c.user_id = p_user_id),
    'google', coalesce((
      select jsonb_agg(jsonb_build_object('email', i.identity_data ->> 'email', 'linked_at', i.created_at) order by i.created_at)
      from auth.identities i where i.user_id = p_user_id and i.provider = 'google'), '[]'::jsonb),
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
