-- Insights RPCs from 20261030000001_insights.sql. The local DB keeps its seed,
-- so counts are read as a change from a baseline taken before this file's rows.
begin;
select plan(49);

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;
-- Sum of field p_field over the elements of p_arr whose p_key equals p_val.
create function pg_temp.at(p_arr jsonb, p_key text, p_val text, p_field text) returns int language sql as $$
  select coalesce(sum((x ->> p_field)::int), 0)::int from jsonb_array_elements(p_arr) x where x ->> p_key = p_val;
$$;
create function pg_temp.total(p_arr jsonb) returns int language sql as $$
  select coalesce(sum((x ->> 'n')::int), 0)::int from jsonb_array_elements(p_arr) x;
$$;

-- 01 owner first, so the baseline can be read.
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000001', 'owner@test.local');
update public.profiles set role = 'owner' where user_id = '00000000-0000-0000-0000-000000000001';
select pg_temp.login('00000000-0000-0000-0000-000000000001');
create temporary table base as select
  public.insights_players(null) p, public.insights_funnel(null) f,
  public.insights_events(null) e, public.insights_community(null) c;

-- 02 admin, 05 moderator, 06 event staff (all created now); players:
-- 03 created 2026-10-21 17:30Z (Bangkok 22 Oct 00:30), 04 verified + whitelisted, 07 created 400 days ago.
insert into auth.users (id, email, created_at) values
  ('00000000-0000-0000-0000-000000000002', 'admin@test.local', now()),
  ('00000000-0000-0000-0000-000000000005', 'mod@test.local', now()),
  ('00000000-0000-0000-0000-000000000006', 'staff@test.local', now()),
  ('00000000-0000-0000-0000-000000000003', 'p3@test.local', '2026-10-21 17:30:00+00'),
  ('00000000-0000-0000-0000-000000000004', 'p4@test.local', '2026-01-15 05:00:00+00'),
  ('00000000-0000-0000-0000-000000000007', 'p7@test.local', now() - interval '400 days');
update public.profiles set role = 'admin' where user_id = '00000000-0000-0000-0000-000000000002';
update public.profiles set role = 'moderator' where user_id = '00000000-0000-0000-0000-000000000005';
update public.profiles set role = 'event_staff' where user_id = '00000000-0000-0000-0000-000000000006';
update public.profiles set faculty = 'ZZ Test Faculty' where user_id in ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004');
update public.profiles set faculty = 'ZZ Test Faculty' where user_id in ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005');
update public.profiles set guest_verified_at = now() where user_id = '00000000-0000-0000-0000-000000000004';
insert into auth.identities (user_id, provider, provider_id, identity_data) values
  ('00000000-0000-0000-0000-000000000004', 'discord', 'd-4', '{"full_name":"Player Four"}'),
  ('00000000-0000-0000-0000-000000000002', 'discord', 'd-2', '{"full_name":"Admin"}');
insert into public.minecraft_registrations (user_id, discord_user_id, minecraft_uuid, minecraft_username, minecraft_username_key, whitelisted_at) values
  ('00000000-0000-0000-0000-000000000004', 'd-4', '00000000-0000-0000-0000-00000000aa04', 'InsightFour', 'insightfour', now());

-- e1 published yesterday, e2 a draft.
insert into public.events (id, name, starts_at, status) values
  ('00000000-0000-0000-0000-0000000000e1', 'Build Day', now() - interval '1 day', 'published'),
  ('00000000-0000-0000-0000-0000000000e2', 'Draft', now() - interval '1 day', 'draft');
insert into public.event_attendance (event_id, user_id, method) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-000000000004', 'self'),
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-000000000003', 'staff'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-000000000004', 'self');
insert into public.event_interests (event_id, user_id) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-000000000003');

-- a1 common, a2 rare, a3 rare draft.
insert into public.achievements (id, name, image_path, status, tier) values
  ('00000000-0000-0000-0000-0000000000a1', 'Builder', 'a.png', 'published', 'common'),
  ('00000000-0000-0000-0000-0000000000a2', 'Dragon', 'a.png', 'published', 'rare'),
  ('00000000-0000-0000-0000-0000000000a3', 'Hidden', 'a.png', 'draft', 'rare');
insert into public.achievement_awards (user_id, achievement_id, awarded_on) values
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000a1', current_date),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000000a1', current_date),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000000a2', current_date),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000a3', current_date);

-- A report opened 22 Oct and handled 23 Oct (Bangkok); an appeal opened 1 Oct, decided 2 Oct.
insert into public.reports (reporter_id, target_user_id, category, details, status, created_at, handled_at) values
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'grief', 'Broke my house at spawn.', 'actioned',
   '2026-10-21 17:30:00+00', '2026-10-22 17:30:00+00');
insert into public.bans (id, user_id, reason) values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000007', 'test');
insert into public.appeals (ban_id, user_id, message, status, created_at, decided_at) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000007', 'Please let me back in.', 'accepted',
   '2026-10-01 03:00:00+00', '2026-10-02 03:00:00+00');

-- Staff actions: only source 'admin' counts.
delete from public.account_change_log;
insert into public.account_change_log (actor_user_id, target_user_id, entity, field, source) values
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'events', 'status', 'admin'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'profiles', 'nickname', 'self');

-- Who may call what
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select throws_ok($$ select public.insights_players(30) $$, 'FORBIDDEN', 'players cannot read player insights');
select throws_ok($$ select public.insights_funnel(30) $$, 'FORBIDDEN', 'players cannot read the funnel');
select throws_ok($$ select public.insights_events(30) $$, 'FORBIDDEN', 'players cannot read event insights');
select throws_ok($$ select public.insights_community(30) $$, 'FORBIDDEN', 'players cannot read community insights');
select throws_ok($$ select public.insights_staff(30) $$, 'FORBIDDEN', 'players cannot read staff activity');

select pg_temp.login('00000000-0000-0000-0000-000000000005');
select throws_ok($$ select public.insights_players(30) $$, 'FORBIDDEN', 'moderators cannot read player insights');
select throws_ok($$ select public.insights_funnel(30) $$, 'FORBIDDEN', 'moderators cannot read the funnel');
select throws_ok($$ select public.insights_events(30) $$, 'FORBIDDEN', 'moderators cannot read event insights');
select lives_ok($$ select public.insights_community(30) $$, 'moderators read community insights');
select throws_ok($$ select public.insights_staff(30) $$, 'FORBIDDEN', 'moderators cannot read staff activity');

select pg_temp.login('00000000-0000-0000-0000-000000000006');
select throws_ok($$ select public.insights_players(30) $$, 'FORBIDDEN', 'event staff cannot read player insights');
select throws_ok($$ select public.insights_funnel(30) $$, 'FORBIDDEN', 'event staff cannot read the funnel');
select lives_ok($$ select public.insights_events(30) $$, 'event staff read event insights');
select throws_ok($$ select public.insights_community(30) $$, 'FORBIDDEN', 'event staff cannot read community insights');
select throws_ok($$ select public.insights_staff(30) $$, 'FORBIDDEN', 'event staff cannot read staff activity');

select pg_temp.login('00000000-0000-0000-0000-000000000002');
select lives_ok($$ select public.insights_players(30) $$, 'admins read player insights');

select pg_temp.login('00000000-0000-0000-0000-000000000001');
select lives_ok($$ select public.insights_players(30) $$, 'owners read player insights');
select lives_ok($$ select public.insights_funnel(30) $$, 'owners read the funnel');
select lives_ok($$ select public.insights_events(30) $$, 'owners read event insights');
select lives_ok($$ select public.insights_community(30) $$, 'owners read community insights');
select lives_ok($$ select public.insights_staff(30) $$, 'owners read staff activity');

create temporary table now_ as select
  public.insights_players(null) p, public.insights_funnel(null) f,
  public.insights_events(null) e, public.insights_community(null) c, public.insights_staff(null) s;

-- Players: signups by Bangkok day, staff left out
select is((select pg_temp.at(n.p -> 'signups', 'day', '2026-10-22', 'n') - pg_temp.at(b.p -> 'signups', 'day', '2026-10-22', 'n') from now_ n, base b),
  1, 'a signup at 17:30Z on 21 Oct counts on Bangkok 22 Oct');
select is((select pg_temp.at(n.p -> 'signups', 'day', '2026-10-21', 'n') - pg_temp.at(b.p -> 'signups', 'day', '2026-10-21', 'n') from now_ n, base b),
  0, 'and not on 21 Oct');
select is((select pg_temp.total(n.p -> 'signups') - pg_temp.total(b.p -> 'signups') from now_ n, base b),
  3, 'three players signed up; the three staff accounts are not counted');
select ok((select bool_and((x ->> 'day')::date > (now() at time zone 'Asia/Bangkok')::date - 14)
             from jsonb_array_elements(public.insights_players(7) -> 'signups') x) is not false,
  'p_days = 7 returns no signup older than 14 days');
-- Own snapshot rows (whether today's exists depends on when the cron last ran):
-- 3 days ago is inside the 7-day window (14 days), 20 days ago is outside it.
delete from public.stats_daily;
insert into public.stats_daily (day, players, verified, guests, unverified, whitelisted, banned) values
  ((now() at time zone 'Asia/Bangkok')::date - 3, 41, 20, 11, 10, 30, 2),
  ((now() at time zone 'Asia/Bangkok')::date - 20, 9, 1, 1, 7, 1, 0);
select is((select x from jsonb_array_elements(public.insights_players(7) -> 'snapshots') x
            where x ->> 'day' = ((now() at time zone 'Asia/Bangkok')::date - 3)::text),
  jsonb_build_object('day', (now() at time zone 'Asia/Bangkok')::date - 3, 'players', 41, 'verified', 20, 'guests', 11,
    'unverified', 10, 'whitelisted', 30, 'banned', 2),
  'a stats_daily row inside the window comes back with every field');
select is((select count(*)::int from jsonb_array_elements(public.insights_players(7) -> 'snapshots') x
            where x ->> 'day' = ((now() at time zone 'Asia/Bangkok')::date - 20)::text),
  0, 'a stats_daily row older than 2 x p_days is left out');
select is((select pg_temp.at(n.p -> 'faculty', 'faculty', 'ZZ Test Faculty', 'n') from now_ n),
  2, 'faculty counts players only (staff in the same faculty left out)');
select is((select pg_temp.at(n.p -> 'faculty', 'faculty', 'Not set', 'n') - pg_temp.at(b.p -> 'faculty', 'faculty', 'Not set', 'n') from now_ n, base b),
  1, 'a player with no faculty counts as Not set');

-- Funnel
select is((select array_agg(x ->> 'step' order by o) from now_ n, jsonb_array_elements(n.f -> 'steps') with ordinality t(x, o)),
  array['signed_in', 'discord', 'verified', 'registered', 'whitelisted'], 'funnel steps in order');
select ok((select bool_and(a.n >= b.n) from
             (select (x ->> 'n')::int n, o from now_, jsonb_array_elements(now_.f -> 'steps') with ordinality t(x, o)) a
             join (select (x ->> 'n')::int n, o from now_, jsonb_array_elements(now_.f -> 'steps') with ordinality t(x, o)) b on b.o = a.o + 1),
  'funnel counts never increase down the steps');
select is((select pg_temp.at(n.f -> 'steps', 'step', 'signed_in', 'n') - pg_temp.at(b.f -> 'steps', 'step', 'signed_in', 'n') from now_ n, base b),
  3, 'the cohort is the three players, not the staff');
select is((select pg_temp.at(n.f -> 'steps', 'step', 'whitelisted', 'n') - pg_temp.at(b.f -> 'steps', 'step', 'whitelisted', 'n') from now_ n, base b),
  1, 'the whitelisted player reaches the last step');
select is((select n.f -> 'failures' from now_ n), '[]'::jsonb, 'no failures recorded: empty list');

-- Events
select is((select x - 'starts_at' from now_ n, jsonb_array_elements(n.e -> 'events') x where x ->> 'id' = '00000000-0000-0000-0000-0000000000e1'),
  '{"id": "00000000-0000-0000-0000-0000000000e1", "name": "Build Day", "interest": 1, "attendance": 2, "self": 1, "staff": 1, "backfill": 0}'::jsonb,
  'a published event with its interest and attendance by method');
select is((select count(*)::int from now_ n, jsonb_array_elements(n.e -> 'events') x where x ->> 'id' = '00000000-0000-0000-0000-0000000000e2'),
  0, 'a draft event is left out');
select is((select pg_temp.at(n.e -> 'attendance', 'day', d, 'n') - pg_temp.at(b.e -> 'attendance', 'day', d, 'n')
             from now_ n, base b, (select (((now() - interval '1 day') at time zone 'Asia/Bangkok')::date)::text d) dd),
  2, 'attendance counts on the event''s Bangkok day, drafts left out');

-- Community
select is((select array_agg(x ->> 'tier' order by o) from now_ n, jsonb_array_elements(n.c -> 'tiers') with ordinality t(x, o)),
  array['common', 'rare', 'epic', 'legendary'], 'every tier, in rarity order');
select is((select array[pg_temp.at(n.c -> 'tiers', 'tier', 'common', 'owners') - pg_temp.at(b.c -> 'tiers', 'tier', 'common', 'owners'),
                        pg_temp.at(n.c -> 'tiers', 'tier', 'common', 'badges') - pg_temp.at(b.c -> 'tiers', 'tier', 'common', 'badges')] from now_ n, base b),
  array[2, 1], 'common: two owners of one badge');
select is((select array[pg_temp.at(n.c -> 'tiers', 'tier', 'rare', 'owners') - pg_temp.at(b.c -> 'tiers', 'tier', 'rare', 'owners'),
                        pg_temp.at(n.c -> 'tiers', 'tier', 'rare', 'badges') - pg_temp.at(b.c -> 'tiers', 'tier', 'rare', 'badges')] from now_ n, base b),
  array[1, 1], 'rare: the draft badge and its holder are left out');
select is((select x from now_ n, jsonb_array_elements(n.c -> 'top') x where x ->> 'id' = '00000000-0000-0000-0000-0000000000a1'),
  '{"id": "00000000-0000-0000-0000-0000000000a1", "name": "Builder", "tier": "common", "owners": 2}'::jsonb, 'top badges by owners');
select is((select array[pg_temp.at(n.c -> 'reports', 'day', '2026-10-22', 'opened') - pg_temp.at(b.c -> 'reports', 'day', '2026-10-22', 'opened'),
                        pg_temp.at(n.c -> 'reports', 'day', '2026-10-23', 'resolved') - pg_temp.at(b.c -> 'reports', 'day', '2026-10-23', 'resolved')] from now_ n, base b),
  array[1, 1], 'reports open on created_at and resolve on handled_at, by Bangkok day');
select is((select array[pg_temp.at(n.c -> 'appeals', 'day', '2026-10-01', 'opened') - pg_temp.at(b.c -> 'appeals', 'day', '2026-10-01', 'opened'),
                        pg_temp.at(n.c -> 'appeals', 'day', '2026-10-02', 'decided') - pg_temp.at(b.c -> 'appeals', 'day', '2026-10-02', 'decided')] from now_ n, base b),
  array[1, 1], 'appeals open on created_at and are decided on decided_at');

-- Staff activity
select is((select n.s -> 'actions' from now_ n),
  jsonb_build_array(jsonb_build_object('day', (now() at time zone 'Asia/Bangkok')::date, 'entity', 'events', 'n', 1)),
  'staff actions count admin changes only, per day and entity');

-- Clamped range
select lives_ok($$ select public.insights_players(0), public.insights_funnel(0), public.insights_events(0),
  public.insights_community(0), public.insights_staff(0) $$, 'p_days = 0 is clamped');
select lives_ok($$ select public.insights_players(5000), public.insights_funnel(5000), public.insights_events(5000),
  public.insights_community(5000), public.insights_staff(5000) $$, 'p_days = 5000 is clamped');

-- Faculty: top 12, then Other. Thirteen more faculties make 15+ buckets.
insert into auth.users (id, email, created_at)
  select ('00000000-0000-0000-0000-0000000001' || lpad(i::text, 2, '0'))::uuid, 'f' || i || '@test.local', '2025-01-01 00:00:00+00'
  from generate_series(1, 13) i;
update public.profiles set faculty = 'F' || lpad(right(user_id::text, 2), 2, '0')
  where user_id::text like '00000000-0000-0000-0000-0000000001%';
select is((select jsonb_array_length(public.insights_players(null) -> 'faculty')), 13, 'twelve faculties plus Other');
select is((select public.insights_players(null) -> 'faculty' -> 12 ->> 'faculty'), 'Other', 'Other comes last');
select is((select pg_temp.total(public.insights_players(null) -> 'faculty')),
  (select count(*)::int from public.profiles where role = 'user'), 'every player is in exactly one bucket');

select * from finish();
rollback;
