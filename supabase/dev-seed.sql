-- LOCAL DEV ONLY: password users (Chula-verified admin + owner, one Chula-verified player,
-- one guest, one unverified and one with a failing Minecraft account) with fake
-- Discord + Chula Google identities so /api/dev-login can sign in without OAuth.
-- Every admin state in the redesign is reachable: /admin overview stats, the
-- newest-players list and the guest badge all have rows to read.
-- Never run against a hosted project. Re-runnable.
--
-- Run after supabase/migrations (guest_verified_at must exist).

do $$
declare
  u record;
begin
  for u in select * from (values
    ('00000000-0000-4000-8000-000000000001'::uuid, 'guest@dev.local', 'Dev Guest', 'dev-discord-guest', null, null, 'user'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'admin@dev.local', 'Dev Admin', 'dev-discord-admin', 'dev-google-admin', 'admin.dev@chula.ac.th', 'admin'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'owner@dev.local', 'Dev Owner', 'dev-discord-owner', 'dev-google-owner', 'owner.dev@chula.ac.th', 'owner'),
    ('00000000-0000-4000-8000-000000000004'::uuid, 'unverified@dev.local', 'Dev Unverified', 'dev-discord-unverified', null, null, 'user'),
    ('00000000-0000-4000-8000-000000000005'::uuid, 'verified@dev.local', 'Dev Verified', 'dev-discord-verified', 'dev-google-verified', 'verified.dev@student.chula.ac.th', 'user'),
    ('00000000-0000-4000-8000-000000000006'::uuid, 'retrying@dev.local', 'Dev Retrying', 'dev-discord-retrying', 'dev-google-retrying', 'retrying.dev@student.chula.ac.th', 'user')
  ) as t(id, email, name, discord_id, google_sub, chula_email, role) loop
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new)
    values ('00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
      extensions.crypt('dev-password', extensions.gen_salt('bf')), now(),
      jsonb_build_object('provider', 'discord', 'providers', case when u.google_sub is null then '["discord"]'::jsonb else '["discord","google"]'::jsonb end), jsonb_build_object('full_name', u.name), now(), now(),
      '', '', '', '')
    on conflict (id) do nothing;

    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) values
      (u.discord_id, u.id, jsonb_build_object('sub', u.discord_id, 'full_name', u.name, 'email', u.email), 'discord', now(), now(), now())
    on conflict do nothing;

    if u.google_sub is not null then
      insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) values
        (u.google_sub, u.id, jsonb_build_object('sub', u.google_sub, 'email', u.chula_email, 'email_verified', true), 'google', now(), now(), now())
      on conflict do nothing;
      insert into public.chula_claims (user_id, google_sub, email, discord_id)
        values (u.id, u.google_sub, u.chula_email, u.discord_id) on conflict do nothing;
    end if;
    insert into public.profiles (user_id, role) values (u.id, u.role)
      on conflict (user_id) do update set role = excluded.role;
  end loop;

  -- Personal details, so the dashboard and the admin detail page are not empty.
  update public.profiles set
    first_name = split_part(au.raw_user_meta_data ->> 'full_name', ' ', 1),
    last_name  = coalesce(nullif(substr(au.raw_user_meta_data ->> 'full_name', strpos(au.raw_user_meta_data ->> 'full_name', ' ') + 1), ''), 'Player'),
    faculty = 'Faculty of Science', major = 'Computer Science'
  from auth.users au where au.id = public.profiles.user_id;

  -- The guest was admitted by the admin (decided at the migration: guests carry
  -- no chula_claims row, only these two profile columns).
  update public.profiles p set
    guest_verified_at = now() - interval '2 days',
    guest_verified_by = (select user_id from public.profiles where role = 'admin' order by user_id limit 1)
  where p.user_id = '00000000-0000-4000-8000-000000000001'
    and p.guest_verified_at is null;

  -- Minecraft accounts: one synced (verified player), one waiting (guest), one
  -- failing (retrying player) so the overview shows each sync state.
  insert into public.minecraft_registrations
    (user_id, discord_user_id, discord_username, minecraft_uuid, minecraft_username, minecraft_username_key, sync_status, sync_attempts, whitelisted_at)
  values
    ('00000000-0000-4000-8000-000000000005', 'dev-discord-verified', 'Dev Verified',
     '20000000-0000-0000-0000-000000000001', 'VerifiedOne', 'verifiedone', 'synced', 1, now() - interval '10 days'),
    ('00000000-0000-4000-8000-000000000001', 'dev-discord-guest', 'Dev Guest',
     '20000000-0000-0000-0000-000000000002', 'GuestOne', 'guestone', 'pending', 0, null)
  on conflict (minecraft_uuid) do nothing;

  -- Retrying: written the way the worker leaves a failing row, so the trigger's
  -- streak clock is already running when the app reads it.
  insert into public.minecraft_registrations
    (user_id, discord_user_id, discord_username, minecraft_uuid, minecraft_username, minecraft_username_key,
     sync_status, sync_attempts, next_sync_at, last_sync_error_code, last_sync_error_at, sync_failing_since)
  values
    ('00000000-0000-4000-8000-000000000006', 'dev-discord-retrying', 'Dev Retrying',
     '20000000-0000-0000-0000-000000000003', 'RetryingOne', 'retryingone',
     'failed', 6, now() + interval '10 minutes', 'MCAPI_TIMEOUT', now() - interval '9 hours', now() - interval '9 hours')
  on conflict (minecraft_uuid) do nothing;

  -- One removed account, so /admin/restore and the "removed" stat are non-empty.
  insert into public.minecraft_registrations
    (user_id, discord_user_id, discord_username, minecraft_uuid, minecraft_username, minecraft_username_key,
     is_active, desired_whitelisted, sync_status)
  values
    ('00000000-0000-4000-8000-000000000006', 'dev-discord-retrying', 'Dev Retrying',
     '20000000-0000-0000-0000-000000000004', 'RemovedOne', 'removedone',
     false, false, 'pending')
  on conflict (minecraft_uuid) do nothing;

  -- account_change_log has no natural key, so guard on the row instead.
  insert into public.account_change_log (actor_user_id, target_user_id, entity, entity_id, field, old_value, new_value, source, created_at)
  select (select user_id from public.profiles where role = 'admin' order by user_id limit 1),
     '00000000-0000-4000-8000-000000000001', 'profiles', '00000000-0000-4000-8000-000000000001',
     'guest_verified', null, 'true', 'admin', now() - interval '2 days'
  where not exists (
    select 1 from public.account_change_log
    where field = 'guest_verified' and target_user_id = '00000000-0000-4000-8000-000000000001'
  );
end $$;