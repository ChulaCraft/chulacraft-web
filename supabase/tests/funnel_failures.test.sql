-- Anonymous funnel failure counts from 20261030000002_funnel_failures.sql.
begin;
select plan(16);

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000001', 'owner@test.local');
update public.profiles set role = 'owner' where user_id = '00000000-0000-0000-0000-000000000001';

select is((select count(*)::int from information_schema.columns
  where table_schema = 'public' and table_name = 'funnel_failures' and column_name ilike '%user%'), 0,
  'no column can identify a player');

select ok(not has_function_privilege('anon', 'public.record_funnel_failure(text, text)', 'EXECUTE'), 'anon cannot record');
select ok(not has_function_privilege('authenticated', 'public.record_funnel_failure(text, text)', 'EXECUTE'), 'players cannot record');
select ok(has_function_privilege('service_role', 'public.record_funnel_failure(text, text)', 'EXECUTE'), 'the server can record');

select public.record_funnel_failure('minecraft', 'RATE_LIMITED');
select public.record_funnel_failure('minecraft', 'RATE_LIMITED');
select public.record_funnel_failure('verify', 'CU_SWAP');
select is((select count(*)::int from public.funnel_failures where step = 'minecraft' and code = 'RATE_LIMITED'), 1, 'one row per day, step and code');
select is((select count from public.funnel_failures where step = 'minecraft' and code = 'RATE_LIMITED'), 2, 'the repeat increments the count');
select is((select day from public.funnel_failures where step = 'verify' and code = 'CU_SWAP'), (now() at time zone 'Asia/Bangkok')::date, 'the day is a Bangkok day');

select throws_ok($$ select public.record_funnel_failure('x', 'RATE_LIMITED') $$, 'INVALID', 'unknown step is refused');
select throws_ok($$ select public.record_funnel_failure('minecraft', 'drop table') $$, 'INVALID', 'malformed code is refused');

set local role authenticated;
select throws_ok($$ select * from public.funnel_failures $$, '42501', null, 'players cannot read the table');
reset role;

-- insights_funnel reports the counts for the same window.
select pg_temp.login('00000000-0000-0000-0000-000000000001');
set local role authenticated;
select is((select (x ->> 'n')::int from jsonb_array_elements(public.insights_funnel(7) -> 'failures') x
  where x ->> 'step' = 'minecraft' and x ->> 'code' = 'RATE_LIMITED'), 2, 'the funnel lists failures as {day, step, code, n}');
select is((select count(*)::int from jsonb_array_elements(public.insights_funnel(7) -> 'failures') x where x ? 'day'), (select jsonb_array_length(public.insights_funnel(7) -> 'failures')), 'every failure carries its day');
reset role;

-- The funnel covers p_days days (not 2 x p_days): a player who signed up 10
-- days ago, and a failure 10 days ago, are in the 30-day range but not the 7-day one.
-- Read as the owner (claims still set) from the postgres role, so pg_temp helpers work.
create temporary table fbase as select public.insights_funnel(7) f7, public.insights_funnel(30) f30;
insert into auth.users (id, email, created_at) values ('00000000-0000-0000-0000-000000000008', 'p8@test.local', now() - interval '10 days');
insert into public.funnel_failures (day, step, code, count)
  values ((now() at time zone 'Asia/Bangkok')::date - 10, 'verify', 'ZZ_OLD_TEST', 4);
create function pg_temp.signed_in(p jsonb) returns int language sql as $$
  select (x ->> 'n')::int from jsonb_array_elements(p -> 'steps') x where x ->> 'step' = 'signed_in';
$$;
create function pg_temp.old_failures(p jsonb) returns int language sql as $$
  select coalesce(sum((x ->> 'n')::int), 0)::int from jsonb_array_elements(p -> 'failures') x where x ->> 'code' = 'ZZ_OLD_TEST';
$$;
select is((select pg_temp.signed_in(public.insights_funnel(7)) - pg_temp.signed_in(f7) from fbase), 0, 'a signup 10 days ago is not in the 7-day funnel');
select is((select pg_temp.signed_in(public.insights_funnel(30)) - pg_temp.signed_in(f30) from fbase), 1, 'but is in the 30-day funnel');
select is(pg_temp.old_failures(public.insights_funnel(7)), 0, 'a failure 10 days ago is not in the 7-day list');
select is(pg_temp.old_failures(public.insights_funnel(30)), 4, 'but is in the 30-day list');

select * from finish();
rollback;
