-- PR 2 / Phase 7: the guest model, the admin overview aggregates and the
-- sync-failure clock from 20261004000001_redesign_admin.sql.
--
-- Plain asserts only (no pgTAP dependency beyond ok/is/throws_ok), one script as
-- the plan asks.

begin;

select plan(69);

-- Counts below assume no other rows; clear any dev seed (rolled back at the end).
delete from public.account_change_log;
delete from public.minecraft_registrations;
delete from public.chula_claims;
delete from public.profiles;
delete from auth.users;

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

-- 1 owner, 2 admin, 3 admin2, 4 plain player, 5 chula-verified player,
-- 6 guest (no claim), 7 player with a failing Minecraft account.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'owner@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'admin@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'admin2@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'player@test.local'),
  ('00000000-0000-0000-0000-000000000005', 'cu@test.local'),
  ('00000000-0000-0000-0000-000000000006', 'guest@test.local'),
  ('00000000-0000-0000-0000-000000000007', 'fail@test.local');

insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at) values
  ('d-1', '00000000-0000-0000-0000-000000000001', '{"full_name":"Owner"}', 'discord', now(), now()),
  ('d-2', '00000000-0000-0000-0000-000000000002', '{"full_name":"Admin"}', 'discord', now(), now()),
  ('d-3', '00000000-0000-0000-0000-000000000003', '{"full_name":"Admin Two"}', 'discord', now(), now()),
  ('864372561897848852', '00000000-0000-0000-0000-000000000004', '{"full_name":"Player","name":"blockfan"}', 'discord', now(), now()),
  ('d-5', '00000000-0000-0000-0000-000000000005', '{"full_name":"CU Player"}', 'discord', now(), now()),
  ('d-6', '00000000-0000-0000-0000-000000000006', '{"full_name":"Guest Player"}', 'discord', now(), now()),
  ('d-7', '00000000-0000-0000-0000-000000000007', '{"full_name":"Fail Player"}', 'discord', now(), now()),
  ('g-5', '00000000-0000-0000-0000-000000000005', '{"email":"cu@student.chula.ac.th","email_verified":true}', 'google', now(), now());

update public.profiles set role = 'owner' where user_id = '00000000-0000-0000-0000-000000000001';
update public.profiles set role = 'admin' where user_id in ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003');
update public.profiles set
  first_name = 'P', last_name = 'One', nickname = 'pony'
  where user_id in ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000006');

select public.claim_chula('00000000-0000-0000-0000-000000000005', 'g-5', 'cu@student.chula.ac.th');

-- ------------------------------------------------------------- privileges
select ok(not has_column_privilege('authenticated', 'public.profiles', 'guest_verified_at', 'SELECT'),
  'players cannot read guest columns directly');
select ok(not has_column_privilege('authenticated', 'public.minecraft_registrations', 'sync_failing_since', 'SELECT'),
  'players cannot read the sync failure clock directly');
select ok(not has_function_privilege('authenticated', 'public.is_player_verified(uuid)', 'EXECUTE'),
  'players cannot probe another user''s verification');
select ok(not has_function_privilege('authenticated', 'public.admin_display_name(uuid)', 'EXECUTE'),
  'players cannot look up another user''s name or email');
select ok(not has_function_privilege('anon', 'public.admin_overview_stats()', 'EXECUTE'),
  'anonymous users cannot read the overview stats');
select ok(not has_function_privilege('anon', 'public.admin_recent_activity(int)', 'EXECUTE'),
  'anonymous users cannot read the activity log');
select ok(not has_function_privilege('anon', 'public.admin_newest_players(int)', 'EXECUTE'),
  'anonymous users cannot read newest players');
select ok(has_function_privilege('authenticated', 'public.admin_mark_guest(uuid)', 'EXECUTE'),
  'the guest action is reachable to admins (the role check lives inside the function)');
select ok(has_function_privilege('service_role', 'public.is_player_verified(uuid)', 'EXECUTE'),
  'the server can read the wider verification check');

-- ------------------------------------------------- non-admins are refused
select pg_temp.login('00000000-0000-0000-0000-000000000004');
select throws_ok($$ select public.admin_overview_stats() $$, 'P0001', 'FORBIDDEN', 'players cannot read overview stats');
select throws_ok($$ select public.admin_recent_activity(5) $$, 'P0001', 'FORBIDDEN', 'players cannot read admin activity');
select throws_ok($$ select public.admin_newest_players(5) $$, 'P0001', 'FORBIDDEN', 'players cannot list newest players');
select throws_ok($$ select public.admin_mark_guest('00000000-0000-0000-0000-000000000006') $$, 'P0001', 'FORBIDDEN',
  'players cannot mark a guest');
select throws_ok($$ select public.admin_search_users('') $$, 'P0001', 'FORBIDDEN', 'players cannot search users');

-- --------------------------------------------------- the guest model works
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select throws_ok($$ select public.admin_mark_guest('00000000-0000-0000-0000-000000000005') $$, 'P0001', 'ALREADY_VERIFIED',
  'a chula-verified player cannot be admitted as a guest');
select throws_ok($$ select public.admin_mark_guest('00000000-0000-0000-0000-000000000003') $$, 'P0001', 'FORBIDDEN',
  'an admin cannot mark another admin');
select throws_ok($$ select public.admin_mark_guest('00000000-0000-0000-0000-999999999999') $$, 'P0001', 'NOT_FOUND',
  'marking an unknown player fails');
select lives_ok($$ select public.admin_mark_guest('00000000-0000-0000-0000-000000000006') $$, 'an admin can mark a guest');
select ok((select guest_verified_at is not null and guest_verified_by = '00000000-0000-0000-0000-000000000002'
  from public.profiles where user_id = '00000000-0000-0000-0000-000000000006'), 'the guest rows record who and when');
select is((select count(*)::int from public.account_change_log
  where field = 'guest_verified' and target_user_id = '00000000-0000-0000-0000-000000000006' and source = 'admin'), 1,
  'marking a guest is logged as an admin change');
select is(public.is_player_verified('00000000-0000-0000-0000-000000000006'), true, 'a guest counts as a verified player');
select is(public.is_chula_verified('00000000-0000-0000-0000-000000000006'), false, 'a guest is not chula-verified');
select is(public.am_i_player_verified(), false, 'an admin is not a verified player');
select pg_temp.login('00000000-0000-0000-0000-000000000006');
select is(public.am_i_player_verified(), true, 'a guest can check their own verification');

-- ------------------------------------------- the guest gate lets them play
select lives_ok($$ select * from public.add_minecraft_account('00000000-0000-0000-0000-000000000006',
  '30000000-0000-0000-0000-000000000001', 'GuestOne') $$, 'a guest can add a Minecraft account');
select pg_temp.login('00000000-0000-0000-0000-000000000004');
select throws_ok($$ select * from public.add_minecraft_account('00000000-0000-0000-0000-000000000004',
  '30000000-0000-0000-0000-000000000002', 'NoVerify') $$, 'P0001', 'CU_SSO_REQUIRED',
  'an unverified player still cannot add an account');

-- ------------------------------------------------------ the verification kind
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select is((select verification_kind from public.admin_search_users('cu@student') limit 1), 'verified',
  'search reports a chula player as verified');
select is((select verification_kind from public.admin_search_users('guest@test') limit 1), 'guest',
  'search reports a guest as guest');
select is((select verification_kind from public.admin_search_users('player@test') limit 1), 'unverified',
  'search reports an unverified player as unverified');
select is(public.admin_get_user('00000000-0000-0000-0000-000000000006') ->> 'verification_kind', 'guest',
  'the detail page reports the guest kind');
select is(public.admin_get_user('00000000-0000-0000-0000-000000000006') -> 'guest' ->> 'verified_by_name', 'Admin',
  'the detail page names the admin who admitted the guest');

-- ------------------------------------------------------------ the stats row
select is((select players::int from public.admin_overview_stats()), 4,
  'players counts plain users only (owner, admin and admin2 are staff)');
select is((select verified::int from public.admin_overview_stats()), 1, 'one chula-verified player');
select is((select guests::int from public.admin_overview_stats()), 1, 'one guest');
select is((select unverified::int from public.admin_overview_stats()), 2, 'two unverified players');
select is((select (verified + guests + unverified)::int from public.admin_overview_stats()), (select players::int from public.admin_overview_stats()),
  'the three kinds partition the players exactly');
select is((select whitelisted_accounts::int from public.admin_overview_stats()), 1, 'one whitelisted account');
select is((select pending_sync::int from public.admin_overview_stats()), 1,
  'the guest''s new account is waiting to sync');
select is((select retrying_sync::int from public.admin_overview_stats()), 0, 'no account is retrying yet');
select is((select oldest_failing_since from public.admin_overview_stats()), null, 'no failure clock is running yet');
select is((select removed_accounts::int from public.admin_overview_stats()), 0, 'nothing is removed yet');

-- ------------------------------------------------- the sync failure clock
insert into public.minecraft_registrations
  (user_id, discord_user_id, discord_username, minecraft_uuid, minecraft_username, minecraft_username_key, sync_status)
values ('00000000-0000-0000-0000-000000000007', 'd-7', 'Fail Player',
  '30000000-0000-0000-0000-000000000007', 'FailOne', 'failone', 'pending');
select is((select sync_failing_since from public.minecraft_registrations where minecraft_username = 'FailOne'), null,
  'a new pending account has no failure clock');

update public.minecraft_registrations set sync_status = 'failed' where minecraft_username = 'FailOne';
select ok((select sync_failing_since is not null from public.minecraft_registrations where minecraft_username = 'FailOne'),
  'pending to failed starts the failure clock');

create temporary table clock_before (ts timestamptz);
insert into clock_before select sync_failing_since from public.minecraft_registrations where minecraft_username = 'FailOne';
update public.minecraft_registrations set sync_attempts = 2 where minecraft_username = 'FailOne';
select is((select sync_failing_since from public.minecraft_registrations where minecraft_username = 'FailOne'),
  (select ts from clock_before), 'failed to failed keeps the same failure clock');
drop table clock_before;

update public.minecraft_registrations set sync_status = 'synced' where minecraft_username = 'FailOne';
select is((select sync_failing_since from public.minecraft_registrations where minecraft_username = 'FailOne'), null,
  'failed to synced clears the failure clock');

update public.minecraft_registrations set sync_status = 'failed' where minecraft_username = 'FailOne';
select ok((select sync_failing_since is not null from public.minecraft_registrations where minecraft_username = 'FailOne'),
  'a new failure starts a new streak');

-- An admin toggling the whitelist resets the row to 'pending'; the clock must
-- clear, which only works because the zz_ trigger runs after the reset one.
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select lives_ok($$ select public.admin_set_whitelisted(
  (select id from public.minecraft_registrations where minecraft_username = 'FailOne'), false) $$,
  'an admin can revoke a failing account');
select is((select sync_status from public.minecraft_registrations where minecraft_username = 'FailOne'), 'pending',
  'revoking resets the sync status to pending');
select is((select sync_failing_since from public.minecraft_registrations where minecraft_username = 'FailOne'), null,
  'revoking clears the failure clock');

-- --------------------------------------------------- stats and clocks live
select pg_temp.login('00000000-0000-0000-0000-000000000001');
update public.minecraft_registrations set sync_status = 'failed' where minecraft_username = 'FailOne';
select is((select retrying_sync::int from public.admin_overview_stats()), 0,
  'a revoked account is not counted as retrying');
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select lives_ok($$ select public.admin_set_whitelisted(
  (select id from public.minecraft_registrations where minecraft_username = 'FailOne'), true) $$,
  'an admin can re-whitelist the account');
update public.minecraft_registrations set sync_status = 'failed' where minecraft_username = 'FailOne';
select is((select retrying_sync::int from public.admin_overview_stats()), 1, 'one account is retrying');
select ok((select oldest_failing_since is not null from public.admin_overview_stats()), 'the overview exposes the oldest failure');
select is((select (whitelisted_accounts + pending_sync + retrying_sync)::int from public.admin_overview_stats()), 4,
  'four accounts are active on the whitelist (guest''s, FailOne''s and the revoked-then-restored one, plus the restored Player row)');

-- --------------------------------------------- recent activity and new players
-- Earlier admin actions exist too: the two admin_set_whitelisted calls above.
-- Every row shares one now() inside this test transaction and ids are random,
-- so age the guest mark to make "newest" deterministic.
update public.account_change_log set created_at = created_at - interval '1 minute' where field = 'guest_verified';
select is((select count(*)::int from public.admin_recent_activity(5)), 3,
  'the activity feed lists the three admin actions so far');
select is((select field from public.admin_recent_activity(5) limit 1), 'desired_whitelisted',
  'the newest admin change is the last whitelist action');
select is((select actor_name from public.admin_recent_activity(5) limit 1), 'Admin',
  'activity resolves the admin name from profiles');
select is((select count(*)::int from public.admin_recent_activity(5) where target_name = 'pony'), 1,
  'activity prefers the target nickname');
select is((select count(*)::int from public.admin_recent_activity(1000)), 3, 'the limit is capped, not unbounded');
select is((select count(*)::int from public.admin_newest_players(50)), 4, 'newest players lists players, not staff');
select ok(not exists (select 1 from public.admin_newest_players(50) where user_id in (
    '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')),
  'the owner and the admin are excluded');

-- -------------------------------------------------------- reset clears guest
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select lives_ok($$ select public.admin_reset_chula('00000000-0000-0000-0000-000000000006') $$,
  'an admin can reset a guest with no chula claim');
select is((select guest_verified_at::text from public.profiles where user_id = '00000000-0000-0000-0000-000000000006'), null,
  'reset clears the guest timestamp');
select is((select guest_verified_by::text from public.profiles where user_id = '00000000-0000-0000-0000-000000000006'), null,
  'reset clears the admitting admin');
select is(public.is_player_verified('00000000-0000-0000-0000-000000000006'), false,
  'after a reset the user is unverified again');
select is((select count(*)::int from public.account_change_log
  where field = 'guest_verified' and new_value is null and target_user_id = '00000000-0000-0000-0000-000000000006'), 1,
  'the guest removal is logged');

-- --------------------------------------------- search by Discord (20261008000001)
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select is((select user_id from public.admin_search_users('864372561897848852')), '00000000-0000-0000-0000-000000000004'::uuid,
  'search finds a player by exact Discord user id');
select is((select user_id from public.admin_search_users('blockfan')), '00000000-0000-0000-0000-000000000004'::uuid,
  'search finds a player by Discord username even when a display name is set');
select is((select count(*)::int from public.admin_search_users('86437256189784885')), 0,
  'a partial Discord id does not match');

select * from finish();

rollback;