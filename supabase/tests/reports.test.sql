-- Player reports from 20261013000001_reports.sql.

begin;

select plan(15);

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000002', 'admin@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'reporter@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'target@test.local');
update public.profiles set role = 'admin' where user_id = '00000000-0000-0000-0000-000000000002';

select ok(not has_function_privilege('anon', 'public.report_player(uuid, text, text, text)', 'EXECUTE'), 'signed-out visitors cannot report');
select ok(not has_table_privilege('authenticated', 'public.reports', 'SELECT'), 'players cannot read reports directly');

select pg_temp.login('00000000-0000-0000-0000-000000000003');
select throws_ok($$ select public.report_player('00000000-0000-0000-0000-000000000003', 'grief', 'I griefed myself, sorry.') $$,
  'INVALID_TARGET', 'nobody reports themselves');
select throws_ok($$ select public.report_player(gen_random_uuid(), 'grief', 'Someone who does not exist.') $$, 'NOT_FOUND', 'unknown players cannot be reported');
select throws_ok($$ select public.report_player('00000000-0000-0000-0000-000000000004', 'spam', 'Not a real category here.') $$, 'INVALID', 'category must be known');
select throws_ok($$ select public.report_player('00000000-0000-0000-0000-000000000004', 'grief', 'short') $$, 'INVALID', 'details need 10 characters');
select throws_ok($$ select public.report_player('00000000-0000-0000-0000-000000000004', 'grief', 'Broke my house at spawn.', 'javascript:alert(1)') $$,
  'INVALID', 'evidence must be an https link');
select lives_ok($$ select public.report_player('00000000-0000-0000-0000-000000000004', 'grief', 'Broke my house at spawn.', 'https://imgur.com/a/x') $$,
  'a player reports another');
select throws_ok($$ select public.report_player('00000000-0000-0000-0000-000000000004', 'cheat', 'Also flying around spawn.') $$,
  'ALREADY_REPORTED', 'one open report per target');
select throws_ok($$ select * from public.admin_list_reports() $$, 'FORBIDDEN', 'players cannot list reports');

-- The limit counts the last day's reports, whatever their status.
insert into public.reports (reporter_id, target_user_id, category, details, status)
  select '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'other', 'Older report number ' || n, 'dismissed'
  from generate_series(1, 4) n;
select throws_ok($$ select public.report_player('00000000-0000-0000-0000-000000000002', 'other', 'One report too many today.') $$,
  'RATE_LIMITED', 'five reports a day');

select pg_temp.login('00000000-0000-0000-0000-000000000002');
select is((select count(*)::int from public.admin_list_reports()), 1, 'admins see the open queue');
select throws_ok($$ select public.admin_handle_report((select id from public.admin_list_reports()), 'open') $$, 'INVALID', 'reports close as actioned or dismissed');
select public.admin_handle_report((select id from public.admin_list_reports()), 'actioned', 'Banned for a week.');
select is((select count(*)::int from public.admin_list_reports('actioned')), 1, 'the report moves to actioned');
select is((select count(*)::int from public.account_change_log where entity = 'reports' and new_value = 'actioned'), 1, 'and the decision is in the audit log');

select * from finish();
rollback;
