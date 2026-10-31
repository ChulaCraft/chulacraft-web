-- Website error capture from 20261031000001_app_errors.sql.
begin;
select plan(9);

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'owner@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'player@test.local');
update public.profiles set role = 'owner' where user_id = '00000000-0000-0000-0000-000000000001';

select ok(has_function_privilege('service_role', 'public.record_app_error(text, text, text, text)', 'EXECUTE'), 'the server can record');
select ok(not has_function_privilege('authenticated', 'public.record_app_error(text, text, text, text)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.record_app_error(text, text, text, text)', 'EXECUTE'), 'browsers cannot record');
select ok(has_function_privilege('service_role', 'public.app_errors_recent(integer)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.app_errors_recent(integer)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.app_errors_recent(integer)', 'EXECUTE'), 'app_errors_recent is service_role only');

select public.record_app_error('server', '/events', 'id # failed', 'abc');
select public.record_app_error('server', '/events', 'id # failed', 'abc');
select public.record_app_error('client', '/events', 'other', null);
select is(public.app_errors_recent(5), 3, 'recent counts every row in the window');

select public.record_app_error('server', '/long', repeat('x', 900), repeat('d', 200));
select is((select length(message) from public.app_errors where route = '/long'), 500, 'an over-long message is truncated, not rejected');
select is((select length(digest) from public.app_errors where route = '/long'), 64, 'an over-long digest is truncated');
select throws_ok($$ select public.record_app_error('bogus', '/x', 'm', null) $$, 'INVALID', 'unknown kind is refused');

select pg_temp.login('00000000-0000-0000-0000-000000000002');
set local role authenticated;
select throws_ok($$ select * from public.admin_app_errors(24) $$, 'FORBIDDEN', 'a player gets FORBIDDEN');
reset role;

select pg_temp.login('00000000-0000-0000-0000-000000000001');
set local role authenticated;
select is((select n::int from public.admin_app_errors(24) where message = 'id # failed'), 2, 'identical errors group to n = 2');
reset role;

select * from finish();
rollback;
