-- Bans and appeals from 20261012000001_bans.sql.

begin;

select plan(26);

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'owner@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'admin@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'player@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'admin2@test.local');
update public.profiles set role = 'owner' where user_id = '00000000-0000-0000-0000-000000000001';
update public.profiles set role = 'admin' where user_id in ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004');
update public.profiles set guest_verified_at = now() where user_id = '00000000-0000-0000-0000-000000000003';
insert into auth.identities (user_id, provider, provider_id, identity_data) values
  ('00000000-0000-0000-0000-000000000003', 'discord', 'd-player', '{"full_name":"Player"}');

-- Two whitelisted accounts and one an admin had already removed before the ban.
insert into public.minecraft_registrations (id, user_id, discord_user_id, minecraft_uuid, minecraft_username, minecraft_username_key, desired_whitelisted) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000003', 'd-player', gen_random_uuid(), 'Mint', 'mint', true),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000003', 'd-player', gen_random_uuid(), 'Choco', 'choco', true),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-000000000003', 'd-player', gen_random_uuid(), 'Old', 'old', false);

-- Privileges
select ok(not has_function_privilege('anon', 'public.my_ban()', 'EXECUTE'), 'signed-out visitors cannot call my_ban');
select ok(not has_function_privilege('authenticated', 'public.lift_ban(uuid, uuid, text)', 'EXECUTE'), 'lift_ban is internal');
select ok(not has_function_privilege('authenticated', 'public.is_banned(uuid)', 'EXECUTE'), 'is_banned is internal');
select ok(not has_table_privilege('authenticated', 'public.bans', 'SELECT'), 'players cannot read bans directly');
select ok(not has_table_privilege('authenticated', 'public.appeals', 'SELECT'), 'players cannot read appeals directly');

-- Who may ban whom
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select throws_ok($$ select public.admin_ban_user('00000000-0000-0000-0000-000000000004', 'x', null, null) $$, 'FORBIDDEN', 'players cannot ban');
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select throws_ok($$ select public.admin_ban_user('00000000-0000-0000-0000-000000000004', 'x', null, null) $$, 'FORBIDDEN', 'admins cannot ban admins');
select throws_ok($$ select public.admin_ban_user('00000000-0000-0000-0000-000000000002', 'x', null, null) $$, 'SELF_BAN', 'nobody bans themselves');
select pg_temp.login('00000000-0000-0000-0000-000000000001');
select throws_ok($$ select public.admin_ban_user('00000000-0000-0000-0000-000000000004', 'x', null, null) $$, 'FORBIDDEN', 'owners demote an admin before banning');
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select throws_ok($$ select public.admin_ban_user('00000000-0000-0000-0000-000000000003', '  ', null, null) $$, 'INVALID', 'a reason is required');
select throws_ok($$ select public.admin_ban_user('00000000-0000-0000-0000-000000000003', 'x', null, now() - interval '1 day') $$, 'INVALID', 'expiry must be in the future');

-- Ban
select lives_ok($$ select public.admin_ban_user('00000000-0000-0000-0000-000000000003', 'griefed spawn', 'Griefing at spawn', null) $$, 'an admin bans a player');
select is((select count(*)::int from public.minecraft_registrations where user_id = '00000000-0000-0000-0000-000000000003' and desired_whitelisted), 0,
  'every account leaves the whitelist');
select throws_ok($$ select public.admin_ban_user('00000000-0000-0000-0000-000000000003', 'again', null, null) $$, 'ALREADY_BANNED', 'no double ban');
select throws_ok($$ select public.admin_set_whitelisted('00000000-0000-0000-0000-0000000000b1', true) $$, 'BANNED', 'admins cannot restore an account mid-ban');
select is((select count(*)::int from public.verified_members(p_discord_ids := array['d-player'])), 0, 'banned players lose Discord roles');

-- Player side
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select is((public.my_ban() ->> 'public_note'), 'Griefing at spawn', 'the player sees the public note');
select ok(not (public.my_ban() ? 'reason'), 'the player never sees the admin reason');
select throws_ok($$ select * from public.add_minecraft_account('00000000-0000-0000-0000-000000000003', gen_random_uuid(), 'NewOne') $$, 'BANNED', 'banned players cannot add accounts');
select throws_ok($$ select public.submit_appeal('too short') $$, 'INVALID', 'appeals need a real message');
select lives_ok($$ select public.submit_appeal('I was rebuilding spawn, not griefing it.') $$, 'the player appeals');
select throws_ok($$ select public.submit_appeal('Another appeal while one is open.') $$, 'APPEAL_OPEN', 'one open appeal at a time');

-- Accepting the appeal lifts the ban and restores exactly the accounts it took
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select public.admin_decide_appeal((select id from public.admin_list_appeals()), true, 'Thanks, confirmed with the builders.');
select results_eq($$ select id from public.minecraft_registrations where user_id = '00000000-0000-0000-0000-000000000003' and desired_whitelisted order by minecraft_username $$,
  $$ values ('00000000-0000-0000-0000-0000000000b2'::uuid), ('00000000-0000-0000-0000-0000000000b1'::uuid) $$,
  'lifting restores the banned accounts but not the one removed earlier');
select is((select count(*)::int from public.verified_members(p_discord_ids := array['d-player'])), 1, 'Discord roles come back');

-- Temp ban that expires: my_ban finishes it and restores the accounts
select public.admin_ban_user('00000000-0000-0000-0000-000000000003', 'spam', null, now() + interval '1 hour');
update public.bans set expires_at = now() - interval '1 second' where lifted_at is null;
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select is(public.my_ban(), null, 'an expired ban is gone for the player');
select is((select count(*)::int from public.minecraft_registrations where user_id = '00000000-0000-0000-0000-000000000003' and desired_whitelisted), 2,
  'and their accounts are back');

select * from finish();
rollback;
