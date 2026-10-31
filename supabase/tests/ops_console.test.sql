-- Ops console access from 20261031000002_ops_console.sql: who may get a
-- manager token, and which tokens leave an audit row.

begin;

select plan(17);

delete from public.account_change_log where entity = 'ops';

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'owner@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'admin@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'player@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'mod@test.local'),
  ('00000000-0000-0000-0000-000000000005', 'staff@test.local');
update public.profiles set role = 'owner' where user_id = '00000000-0000-0000-0000-000000000001';
update public.profiles set role = 'admin' where user_id = '00000000-0000-0000-0000-000000000002';
update public.profiles set role = 'moderator' where user_id = '00000000-0000-0000-0000-000000000004';
update public.profiles set role = 'event_staff' where user_id = '00000000-0000-0000-0000-000000000005';

select ok(not has_function_privilege('anon', 'public.admin_ops_access(uuid, text, text)', 'EXECUTE'),
  'signed-out visitors cannot ask for a token');
select ok(to_regprocedure('public.admin_server_console_access(uuid, text, text)') is null,
  'the old server console function is gone');

select pg_temp.login('00000000-0000-0000-0000-000000000003');
select throws_ok($$ select public.admin_ops_access(gen_random_uuid(), 'survival', 'status') $$,
  'FORBIDDEN', 'a player gets no token');
select pg_temp.login('00000000-0000-0000-0000-000000000004');
select throws_ok($$ select public.admin_ops_access(gen_random_uuid(), 'survival', 'status') $$,
  'FORBIDDEN', 'a moderator gets no token');
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select throws_ok($$ select public.admin_ops_access(gen_random_uuid(), 'survival', 'status') $$,
  'FORBIDDEN', 'event staff get no token');

select pg_temp.login('00000000-0000-0000-0000-000000000002');
select is(public.admin_ops_access(gen_random_uuid(), 'survival', 'status'), 'admin', 'an admin gets their role back');
select is(public.admin_ops_access(gen_random_uuid(), 'survival', 'console'), 'admin', 'read-only console is allowed');
select is(public.admin_ops_access(gen_random_uuid(), '', 'backup_list'), 'admin', 'an admin may list backups');
select is(public.admin_ops_access('00000000-0000-0000-0000-0000000000f1', 'survival', 'restart'), 'admin', 'an admin may restart');
select is(public.admin_ops_access('00000000-0000-0000-0000-0000000000f2', 'world', 'backup_run'), 'admin', 'an admin may start a backup');
select throws_ok($$ select public.admin_ops_access(gen_random_uuid(), 'discord-bot', 'update') $$,
  'FORBIDDEN', 'an admin cannot update an image');
select throws_ok($$ select public.admin_ops_access(gen_random_uuid(), 'survival', 'rm -rf') $$,
  'INVALID', 'unknown actions are refused');

select pg_temp.login('00000000-0000-0000-0000-000000000001');
select is(public.admin_ops_access('00000000-0000-0000-0000-0000000000f3', 'discord-bot', 'update'), 'owner', 'an owner may update an image');

select is((select count(*)::int from public.account_change_log where entity = 'ops'), 3,
  'restart, backup_run and update were logged; status, console and backup_list were not');
select is((select count(*)::int from public.account_change_log where entity = 'ops' and field = 'update' and entity_id = '00000000-0000-0000-0000-0000000000f3'),
  1, 'the update row carries the token jti');
select row_eq($$ select actor_user_id, entity_id, field, new_value, source from public.account_change_log where entity = 'ops' and field = 'restart' $$,
  row('00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-0000000000f1'::uuid, 'restart'::text, 'survival'::text, 'admin'::text),
  'the log row names the admin, the token jti, the action and the service');
select is((select new_value from public.account_change_log where entity = 'ops' and field = 'backup_run'), 'world',
  'a backup row names its target');

select * from finish();
rollback;
