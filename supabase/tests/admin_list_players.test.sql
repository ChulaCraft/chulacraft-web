-- admin_list_players from 20261017000001_admin_list_players.sql.
begin;
select plan(22);

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.ids(p_filters jsonb, p_query text default '') returns uuid[] language sql as $$
  select coalesce(array_agg(user_id order by user_id), '{}') from public.admin_list_players(p_filters, p_query);
$$;

insert into auth.users (id, email, created_at) values
  ('00000000-0000-0000-0000-000000000001', 'owner@test.local', '2026-10-01 05:00+00'),
  ('00000000-0000-0000-0000-000000000003', 'guest@test.local', '2026-10-02 05:00+00'),
  ('00000000-0000-0000-0000-000000000004', 'new_one@test.local', '2026-10-03 05:00+00'),
  ('00000000-0000-0000-0000-000000000005', 'chula@test.local', '2026-10-04 05:00+00'),
  ('00000000-0000-0000-0000-000000000006', 'bad@test.local', '2026-10-05 05:00+00'),
  ('00000000-0000-0000-0000-000000000007', 'pct%x@test.local', '2026-09-01 05:00+00'),
  ('00000000-0000-0000-0000-000000000008', 'back\slash@test.local', '2026-09-02 05:00+00');
update public.profiles set role = 'owner' where user_id = '00000000-0000-0000-0000-000000000001';
update public.profiles set guest_verified_at = now() where user_id in ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000006');
insert into auth.identities (user_id, provider, provider_id, identity_data) values
  ('00000000-0000-0000-0000-000000000003', 'discord', 'd-g', '{"full_name":"Guesty"}'),
  ('00000000-0000-0000-0000-000000000005', 'discord', 'd-c', '{"full_name":"Chulaboy"}'),
  ('00000000-0000-0000-0000-000000000005', 'google', 'g-c', '{"email":"c@chula.ac.th"}');
insert into public.chula_claims (user_id, google_sub, email, discord_id)
  values ('00000000-0000-0000-0000-000000000005', 'g-c', 'c@chula.ac.th', 'd-c');
select public.add_minecraft_account('00000000-0000-0000-0000-000000000003', '7e570000-0000-4000-8000-0000000000a1', 'GuestMiner');
select public.add_minecraft_account('00000000-0000-0000-0000-000000000005', '7e570000-0000-4000-8000-0000000000a2', 'ChulaPending');
select public.add_minecraft_account('00000000-0000-0000-0000-000000000005', '7e570000-0000-4000-8000-0000000000a3', 'ChulaFailed');
update public.minecraft_registrations set sync_status = 'synced' where minecraft_username = 'GuestMiner';
update public.minecraft_registrations set sync_status = 'failed' where minecraft_username = 'ChulaFailed';

select pg_temp.login('00000000-0000-0000-0000-000000000004');
select throws_ok($$ select * from public.admin_list_players() $$, 'FORBIDDEN', 'players cannot list players');

select pg_temp.login('00000000-0000-0000-0000-000000000001');
select public.admin_ban_user('00000000-0000-0000-0000-000000000006', 'test', null, null);

select is((select count(*)::int from public.admin_list_players()), 7, 'no filters lists everyone');
select is((select max(total)::int from public.admin_list_players('{}', '', 'joined', true, 0, 2)), 7, 'total ignores the page size');
select is((select count(*)::int from public.admin_list_players('{}', '', 'joined', true, 0, 2)), 2, 'limit pages');
select is((select user_id from public.admin_list_players('{}', '', 'joined', true, 0, 1)), '00000000-0000-0000-0000-000000000006'::uuid, 'newest first by default');
select is((select user_id from public.admin_list_players('{}', '', 'player', false, 0, 1)), '00000000-0000-0000-0000-000000000008'::uuid, 'sorts by player name');

select is(pg_temp.ids('{"role":["user"]}'), array['00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000008']::uuid[], 'role filter');
select is(pg_temp.ids('{"role":["user"],"status":["guest"]}'), array['00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000006']::uuid[], 'filters combine with and');
select is(pg_temp.ids('{"status":["verified","guest"]}'), array['00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006']::uuid[], 'enum values combine with or');
select is(pg_temp.ids('{"banned":["yes"]}'), array['00000000-0000-0000-0000-000000000006']::uuid[], 'banned filter');
select is(pg_temp.ids('{"whitelist":["pending"]}'), array['00000000-0000-0000-0000-000000000005']::uuid[], 'whitelist matches any account in that state');
select is(pg_temp.ids('{"whitelist":["whitelisted","pending","retrying"]}'), array['00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005']::uuid[], 'players with any whitelisted account');
select is((select whitelist from public.admin_list_players('{"player":"chulaboy"}')), 'retrying', 'shows the worst account state');
select is(pg_temp.ids('{"minecraft":"miner"}'), array['00000000-0000-0000-0000-000000000003']::uuid[], 'minecraft text filter');
select is(pg_temp.ids('{"joined_from":"2026-10-02","joined_to":"2026-10-03"}'), array['00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004']::uuid[], 'joined range is inclusive, Bangkok days');
select is(pg_temp.ids('{}', 'new_'), array['00000000-0000-0000-0000-000000000004']::uuid[], 'underscore in search is literal');
select is(pg_temp.ids('{"player":"pct%"}'), array['00000000-0000-0000-0000-000000000007']::uuid[], 'percent in a filter is literal');
select is(pg_temp.ids('{}', 'back\s'), array['00000000-0000-0000-0000-000000000008']::uuid[], 'backslash in search is literal');

select throws_ok($$ select * from public.admin_list_players('{"evil":"x"}') $$, 'INVALID', 'unknown filter key');
select throws_ok($$ select * from public.admin_list_players('{"status":["admin"]}') $$, 'INVALID', 'unknown enum value');
select throws_ok($$ select * from public.admin_list_players('{"status":"guest"}') $$, 'INVALID', 'enum filter must be a list');
select throws_ok($$ select * from public.admin_list_players('{}', '', 'email') $$, 'INVALID', 'unknown sort');

select * from finish();
rollback;
