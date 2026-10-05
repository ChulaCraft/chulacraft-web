-- Server console access from 20261010000001_server_console.sql: who may get
-- a manager token, and which tokens leave an audit row.

begin;

select plan(7);

delete from public.account_change_log where entity = 'server_console';

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000002', 'admin@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'player@test.local');
update public.profiles set role = 'admin' where user_id = '00000000-0000-0000-0000-000000000002';

select ok(not has_function_privilege('anon', 'public.admin_server_console_access(uuid, text, text)', 'EXECUTE'),
  'signed-out visitors cannot ask for a token');

select pg_temp.login('00000000-0000-0000-0000-000000000003');
select throws_ok($$ select public.admin_server_console_access(gen_random_uuid(), 'survival', 'status') $$,
  'FORBIDDEN', 'a player gets no token');

select pg_temp.login('00000000-0000-0000-0000-000000000002');
select is(public.admin_server_console_access(gen_random_uuid(), 'survival', 'status'), 'admin',
  'an admin gets their role back');
select is(public.admin_server_console_access(gen_random_uuid(), 'survival', 'console'), 'admin',
  'read-only console is allowed');
select throws_ok($$ select public.admin_server_console_access(gen_random_uuid(), 'survival', 'rm -rf') $$,
  'INVALID', 'unknown actions are refused');
select public.admin_server_console_access('00000000-0000-0000-0000-0000000000f1', 'survival', 'restart');

select is((select count(*)::int from public.account_change_log where entity = 'server_console'), 1,
  'only the restart was logged');
select row_eq($$ select actor_user_id, entity_id, field, new_value, source from public.account_change_log where entity = 'server_console' $$,
  row('00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-0000000000f1'::uuid, 'restart'::text, 'survival'::text, 'admin'::text),
  'the log row names the admin, the token jti, the action and the server');

select * from finish();
rollback;
