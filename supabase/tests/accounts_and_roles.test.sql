begin;

select plan(80);

-- Users: 1 owner, 2 admin, 3 second admin, 4 player with Chula Google, 5 player without.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'owner@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'admin@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'admin2@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'player@test.local'),
  ('00000000-0000-0000-0000-000000000005', 'nocu@test.local');

insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at) values
  ('d-1', '00000000-0000-0000-0000-000000000001', '{"full_name":"Owner"}', 'discord', now(), now()),
  ('d-2', '00000000-0000-0000-0000-000000000002', '{"full_name":"Admin"}', 'discord', now(), now()),
  ('d-3', '00000000-0000-0000-0000-000000000003', '{"full_name":"Admin Two"}', 'discord', now(), now()),
  ('d-4', '00000000-0000-0000-0000-000000000004', '{"full_name":"Player"}', 'discord', now(), now()),
  ('d-5', '00000000-0000-0000-0000-000000000005', '{"full_name":"No Chula"}', 'discord', now(), now()),
  ('g-4', '00000000-0000-0000-0000-000000000004', '{"email":"P4@student.chula.ac.th","email_verified":true}', 'google', now(), now()),
  ('g-4b', '00000000-0000-0000-0000-000000000004', '{"email":"other4@chula.ac.th","email_verified":true}', 'google', now(), now()),
  ('g-5', '00000000-0000-0000-0000-000000000005', '{"email":"p5@chula.ac.th","email_verified":true}', 'google', now(), now()),
  ('g-5x', '00000000-0000-0000-0000-000000000005', '{"email":"p4@student.chula.ac.th","email_verified":true}', 'google', now(), now());

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

-- Schema and privileges
select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'chula_claims', 'chula claims table exists');
select hasnt_table('public', 'cu_sso_identities', 'the CU SSO table is gone');
select has_table('public', 'account_change_log', 'change log table exists');
select ok((select bool_and(relrowsecurity) from pg_catalog.pg_class
  where oid in ('public.profiles'::regclass, 'public.chula_claims'::regclass, 'public.account_change_log'::regclass)),
  'new tables have row-level security enabled');
select ok(not has_table_privilege('authenticated', 'public.profiles', 'UPDATE'), 'players cannot update profiles directly');
select ok(not has_table_privilege('authenticated', 'public.chula_claims', 'INSERT'), 'players cannot insert chula claims directly');
select ok(not has_table_privilege('authenticated', 'public.chula_claims', 'DELETE'), 'players cannot delete their chula claim');
select ok(not has_table_privilege('authenticated', 'public.account_change_log', 'INSERT'), 'players cannot forge change log rows');
select ok(not has_column_privilege('authenticated', 'public.account_change_log', 'actor_user_id', 'SELECT'), 'players cannot see which admin changed their account');
select ok(not has_table_privilege('authenticated', 'public.minecraft_registrations', 'UPDATE'), 'players cannot update registrations directly');
select ok(not has_function_privilege('authenticated', 'public.claim_chula(uuid,text,text)', 'EXECUTE'), 'players cannot claim arbitrary chula accounts');
select ok(not has_function_privilege('authenticated', 'public.log_identity_change(uuid,uuid,text,text,text)', 'EXECUTE'), 'players cannot forge identity log rows');
select ok(not has_function_privilege('authenticated', 'public.is_chula_verified(uuid)', 'EXECUTE'), 'players cannot probe other users'' verification');
select ok(not has_function_privilege('authenticated', 'public.hook_only_discord_signups(jsonb)', 'EXECUTE'), 'players cannot call the signup hook');
select ok(has_function_privilege('supabase_auth_admin', 'public.hook_only_discord_signups(jsonb)', 'EXECUTE'), 'auth can call the signup hook');
select ok(not has_function_privilege('anon', 'public.admin_set_role(uuid,text)', 'EXECUTE'), 'anonymous users cannot change roles');
select ok(not has_function_privilege('authenticated', 'public.log_account_change(uuid,uuid,text,uuid,text,text,text,text)', 'EXECUTE'), 'players cannot call the log writer');

select is((select role from public.profiles where user_id = '00000000-0000-0000-0000-000000000004'), 'user', 'new users get a user profile');
select ok(has_column_privilege('authenticated', 'public.minecraft_registrations', 'user_id', 'SELECT'), 'players can filter their own registrations by user_id');

update public.profiles set role = 'owner' where user_id = '00000000-0000-0000-0000-000000000001';
update public.profiles set role = 'admin' where user_id in ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003');

-- Signup hook
select is(public.hook_only_discord_signups('{"user":{"app_metadata":{"provider":"discord"}}}'), '{}'::jsonb, 'discord signups are allowed');
select is(public.hook_only_discord_signups('{"user":{"app_metadata":{"provider":"google"}}}') -> 'error' ->> 'message', 'REGISTER_DISCORD_FIRST', 'google signups are refused');
select is(public.hook_only_discord_signups('{"user":{}}') -> 'error' ->> 'http_code', '403', 'signups without a provider are refused');

-- Chula email check
select ok(public.is_chula_email('A@CHULA.AC.TH') and public.is_chula_email('x@student.chula.ac.th'), 'both chula domains match, any case');
select ok(not public.is_chula_email('x@notchula.ac.th') and not public.is_chula_email('x@chula.ac.th.evil.com') and not public.is_chula_email(null),
  'look-alike domains and null do not match');

-- Chula claims
select is(public.is_chula_verified('00000000-0000-0000-0000-000000000004'), false, 'a linked but unclaimed google account is not verified');
select throws_ok($$ select public.claim_chula('00000000-0000-0000-0000-000000000004', 'g-4', 'me@gmail.com') $$, 'P0001', 'CU_WRONG_DOMAIN', 'only chula emails can be claimed');
select throws_ok($$ select public.claim_chula('00000000-0000-0000-0000-000000000004', 'g-5', 'p5@chula.ac.th') $$, 'P0001', 'CU_IDENTITY_MISSING', 'a user can only claim their own google identity');
select public.claim_chula('00000000-0000-0000-0000-000000000004', 'g-4', 'P4@student.chula.ac.th');
select is((select email || ' ' || discord_id from public.chula_claims where user_id = '00000000-0000-0000-0000-000000000004'), 'p4@student.chula.ac.th d-4', 'claims store the lower-cased email and pin the discord account');
select is(public.is_chula_verified('00000000-0000-0000-0000-000000000004'), true, 'a claimed, linked chula account is verified');
select lives_ok($$ select public.claim_chula('00000000-0000-0000-0000-000000000004', 'g-4', 'p4@student.chula.ac.th') $$, 'reclaiming the same account is a no-op');
insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
  values ('d-4b', '00000000-0000-0000-0000-000000000004', '{}', 'discord', now(), now());
select is(public.is_chula_verified('00000000-0000-0000-0000-000000000004'), false, 'a second discord account un-verifies the user');
delete from auth.identities where provider_id = 'd-4b';
insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
  values ('g-4p', '00000000-0000-0000-0000-000000000004', '{"email":"extra@gmail.com"}', 'google', now(), now());
select is(public.is_chula_verified('00000000-0000-0000-0000-000000000004'), false, 'more than one extra google account un-verifies the user');
delete from auth.identities where provider_id = 'g-4p';
select throws_ok($$ select public.claim_chula('00000000-0000-0000-0000-000000000004', 'g-4b', 'other4@chula.ac.th') $$, 'P0001', 'CU_SWAP_FORBIDDEN', 'a user cannot swap to another chula account');
select throws_ok($$ select public.claim_chula('00000000-0000-0000-0000-000000000005', 'g-5x', 'p4@student.chula.ac.th') $$, 'P0001', 'CU_ALREADY_LINKED', 'a chula email belongs to one user');
select pg_temp.login('00000000-0000-0000-0000-000000000004');
select is(public.am_i_chula_verified(), true, 'players can check their own verification');

select ok(not has_function_privilege('authenticated', 'public.add_minecraft_account(uuid,uuid,text)', 'EXECUTE'), 'players cannot call add_minecraft_account directly');
select ok(not has_function_privilege('authenticated', 'public.change_minecraft_account(uuid,uuid,uuid,text)', 'EXECUTE'), 'players cannot call change_minecraft_account directly');
select ok(not has_function_privilege('authenticated', 'public.remove_minecraft_account(uuid,uuid)', 'EXECUTE'), 'players cannot call remove_minecraft_account directly');

-- Adding Minecraft accounts
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select throws_ok($$ select * from public.add_minecraft_account('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'NoChula') $$, 'P0001', 'CU_SSO_REQUIRED', 'adding requires a linked chula account');

select pg_temp.login('00000000-0000-0000-0000-000000000004');
select lives_ok($$
  select public.add_minecraft_account('00000000-0000-0000-0000-000000000004', ('10000000-0000-0000-0000-00000000000' || n)::uuid, 'Player_' || n) from generate_series(1, 5) n
$$, 'a player can add 5 accounts');
select throws_ok($$ select * from public.add_minecraft_account('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000006', 'Player_6') $$, 'P0001', 'LIMIT_REACHED', 'the 6th account is rejected');
select is((select created from public.add_minecraft_account('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Player_1')), false, 're-adding an active account is idempotent');

select public.claim_chula('00000000-0000-0000-0000-000000000005', 'g-5', 'p5@chula.ac.th');
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select throws_ok($$ select * from public.add_minecraft_account('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Stolen') $$, 'P0001', 'REGISTRATION_CONFLICT', 'another user''s account cannot be claimed');

-- Changing Minecraft accounts
select pg_temp.login('00000000-0000-0000-0000-000000000004');
select is(
  (select minecraft_username from public.change_minecraft_account('00000000-0000-0000-0000-000000000004',
    (select id from public.minecraft_registrations where minecraft_uuid = '10000000-0000-0000-0000-000000000001'),
    '10000000-0000-0000-0000-000000000001', 'Renamed_1')),
  'Renamed_1', 'same UUID renames in place');
select is(
  (select created from public.change_minecraft_account('00000000-0000-0000-0000-000000000004',
    (select id from public.minecraft_registrations where minecraft_uuid = '10000000-0000-0000-0000-000000000002'),
    '10000000-0000-0000-0000-000000000009', 'Player_9')),
  true, 'a different UUID adds a new account');
select is((select desired_whitelisted from public.minecraft_registrations where minecraft_uuid = '10000000-0000-0000-0000-000000000002'),
  false, 'the replaced account is revoked');
select is((select count(*)::int from public.account_change_log
  where target_user_id = '00000000-0000-0000-0000-000000000004' and entity = 'minecraft_registrations' and source = 'self'),
  8, 'every player change is logged (5 adds, 1 rename, 1 revoke, 1 add)');

-- Admin rules
select pg_temp.login('00000000-0000-0000-0000-000000000004');
select throws_ok($$ select * from public.admin_search_users('') $$, 'P0001', 'FORBIDDEN', 'players cannot search users');

select pg_temp.login('00000000-0000-0000-0000-000000000002');
select lives_ok($$ select public.admin_set_whitelisted(
  (select id from public.minecraft_registrations where minecraft_uuid = '10000000-0000-0000-0000-000000000003'), false) $$,
  'an admin can revoke a player account');
select is((select source from public.account_change_log where field = 'desired_whitelisted' and actor_user_id = '00000000-0000-0000-0000-000000000002'),
  'admin', 'admin changes are logged as admin');
select is((select count(*)::int from public.admin_search_users('player_')), 1, 'search matches minecraft names with a literal underscore');

insert into public.minecraft_registrations (user_id, discord_user_id, minecraft_uuid, minecraft_username, minecraft_username_key)
  values ('00000000-0000-0000-0000-000000000003', 'd-3', '10000000-0000-0000-0000-000000000030', 'AdminTwo', 'admintwo');
select throws_ok($$ select public.admin_set_whitelisted(
  (select id from public.minecraft_registrations where minecraft_uuid = '10000000-0000-0000-0000-000000000030'), false) $$,
  'P0001', 'FORBIDDEN', 'an admin cannot manage another admin');
select throws_ok($$ select public.admin_set_role('00000000-0000-0000-0000-000000000004', 'admin') $$, 'P0001', 'FORBIDDEN', 'an admin cannot change roles');

select pg_temp.login('00000000-0000-0000-0000-000000000004');
select is((select desired_whitelisted from public.add_minecraft_account('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 'Player_3')),
  false, 're-adding an admin-revoked account does not re-whitelist it');
select throws_ok($$ select * from public.change_minecraft_account('00000000-0000-0000-0000-000000000004',
    (select id from public.minecraft_registrations where minecraft_uuid = '10000000-0000-0000-0000-000000000003'),
    '10000000-0000-0000-0000-000000000031', 'Player_31') $$,
  'P0001', 'REGISTRATION_BLOCKED', 'an admin-revoked account cannot be swapped for a new one');
select lives_ok($$ select public.remove_minecraft_account('00000000-0000-0000-0000-000000000004',
  (select id from public.minecraft_registrations where minecraft_uuid = '10000000-0000-0000-0000-000000000003')) $$,
  'a player can remove an account');
select throws_ok($$ select * from public.add_minecraft_account('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 'Player_3') $$,
  'P0001', 'REGISTRATION_BLOCKED', 'remove then re-add cannot undo an admin revoke');
select lives_ok($$ select public.remove_minecraft_account('00000000-0000-0000-0000-000000000004',
  (select id from public.minecraft_registrations where minecraft_uuid = '10000000-0000-0000-0000-000000000004')) $$,
  'a player can remove a whitelisted account');
select is((select (is_active, desired_whitelisted)::text from public.minecraft_registrations where minecraft_uuid = '10000000-0000-0000-0000-000000000004'),
  '(f,f)', 'removed accounts are hidden and un-whitelisted');
select is((select (desired_whitelisted, created)::text from public.add_minecraft_account('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'Player_4')),
  '(t,t)', 're-adding a removed account re-whitelists it');
select is((select is_active from public.minecraft_registrations where minecraft_uuid = '10000000-0000-0000-0000-000000000004'),
  true, 're-adding a removed account shows it again');
select throws_ok($$ select public.remove_minecraft_account('00000000-0000-0000-0000-000000000004', gen_random_uuid()) $$, 'P0001', 'NOT_FOUND', 'unknown accounts cannot be removed');

select throws_ok($$ select * from public.admin_removed_accounts() $$, 'P0001', 'FORBIDDEN', 'players cannot list removed accounts');
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select is((select (is_active, removed_by is not null)::text from public.admin_removed_accounts() where minecraft_username = 'Player_3'),
  '(f,t)', 'restore list shows player-deleted accounts and who removed them');
select lives_ok($$ select public.admin_set_whitelisted(
  (select id from public.minecraft_registrations where minecraft_uuid = '10000000-0000-0000-0000-000000000003'), true) $$,
  'an admin can restore a player-deleted account');
select is((select (is_active, desired_whitelisted)::text from public.minecraft_registrations where minecraft_uuid = '10000000-0000-0000-0000-000000000003'),
  '(t,t)', 'admin restore makes the account visible and whitelisted again');
select is((select count(*)::int from public.admin_removed_accounts() where minecraft_username = 'Player_3'), 0, 'restored accounts leave the restore list');

select pg_temp.login('00000000-0000-0000-0000-000000000001');
select throws_ok($$ select public.admin_set_role('00000000-0000-0000-0000-000000000001', 'user') $$, 'P0001', 'SELF_ROLE_CHANGE', 'an owner cannot change their own role');
select lives_ok($$ select public.admin_set_role('00000000-0000-0000-0000-000000000004', 'owner') $$, 'an owner can promote another owner');

-- Admin reset and unlink resilience (user 4 is an owner by now, so use user 5 as the player)
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select throws_ok($$ select public.admin_reset_chula('00000000-0000-0000-0000-000000000005') $$, 'P0001', 'FORBIDDEN', 'players cannot reset chula links');
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select lives_ok($$ select public.admin_reset_chula('00000000-0000-0000-0000-000000000005') $$, 'an admin can reset a player''s chula link');
select is((select count(*)::int from public.chula_claims where user_id = '00000000-0000-0000-0000-000000000005'), 0, 'reset removes the claim');
select is((select count(*)::int from auth.identities where provider_id = 'g-5'), 0, 'reset removes the claimed google identity');
select is((select jsonb_array_length(public.admin_get_user('00000000-0000-0000-0000-000000000004') -> 'google')), 2, 'admin detail lists linked google accounts');

delete from auth.identities where provider_id = 'g-4';
select is(public.is_chula_verified('00000000-0000-0000-0000-000000000004'), false, 'unlinking the claimed google account un-verifies the user');
select is((select count(*)::int from public.chula_claims where user_id = '00000000-0000-0000-0000-000000000004'), 1, 'the claim survives an unlink');
select throws_ok($$ select public.claim_chula('00000000-0000-0000-0000-000000000005', 'g-5x', 'p4@student.chula.ac.th') $$, 'P0001', 'CU_ALREADY_LINKED', 'an unlinked chula account still cannot move to another user');
insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
  values ('g-4', '00000000-0000-0000-0000-000000000004', '{"email":"p4@student.chula.ac.th"}', 'google', now(), now());
update auth.identities set provider_id = 'd-new' where provider_id = 'd-4';
select is(public.is_chula_verified('00000000-0000-0000-0000-000000000004'), false, 'a claim does not follow a swapped discord account');
delete from auth.identities where provider_id = 'd-new';
select is(public.is_chula_verified('00000000-0000-0000-0000-000000000004'), false, 'a user without discord is not verified');

select * from finish();

rollback;
