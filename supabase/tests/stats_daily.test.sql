-- Daily stats snapshot from 20261017000002_stats_daily.sql.
begin;
select plan(5);
create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'owner@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'p@test.local');
update public.profiles set role = 'owner' where user_id = '00000000-0000-0000-0000-000000000001';

-- The migration's first snapshot may be from another day; start clean.
delete from public.stats_daily;

select ok(not has_function_privilege('authenticated', 'public.snapshot_stats_daily()', 'EXECUTE'), 'players cannot write snapshots');
select public.snapshot_stats_daily();
select public.snapshot_stats_daily();
select is((select count(*)::int from public.stats_daily where day = (now() at time zone 'Asia/Bangkok')::date), 1, 'one row per day, re-run updates it');
select is((select players from public.stats_daily where day = (now() at time zone 'Asia/Bangkok')::date), 1, 'counts role=user like the dashboard');

select pg_temp.login('00000000-0000-0000-0000-000000000003');
select throws_ok($$ select * from public.admin_stats_daily() $$, 'FORBIDDEN', 'players cannot read stats');
select pg_temp.login('00000000-0000-0000-0000-000000000001');
select is((select count(*)::int from public.admin_stats_daily(7)), 1, 'admins read the history');
select * from finish();
rollback;
