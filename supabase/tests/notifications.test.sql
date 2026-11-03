-- The notification bell from 20261029000001_notifications.sql.
begin;
select plan(38);

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.n(p_user uuid, p_kind text) returns integer language sql as $$
  select count(*)::int from public.notifications where user_id = p_user and kind = p_kind;
$$;

-- 02 admin; 03 04 06 players; 07 08 only read their bells.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000002', 'admin@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'p3@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'p4@test.local'),
  ('00000000-0000-0000-0000-000000000006', 'p6@test.local'),
  ('00000000-0000-0000-0000-000000000007', 'a@test.local'),
  ('00000000-0000-0000-0000-000000000008', 'b@test.local');
update public.profiles set role = 'admin' where user_id = '00000000-0000-0000-0000-000000000002';

-- e1 and e2 reward the sakura banner, e3 a default banner.
insert into public.events (id, name, starts_at, status, banner_id) values
  ('00000000-0000-0000-0000-0000000000e1', 'Spring Build', now() - interval '3 days', 'published', 'sakura'),
  ('00000000-0000-0000-0000-0000000000e2', 'Spring Build 2', now() - interval '2 days', 'published', 'sakura'),
  ('00000000-0000-0000-0000-0000000000e3', 'Dusk Walk', now() - interval '1 day', 'published', 'dusk');
insert into public.achievements (id, name, image_path, status, tier) values
  ('00000000-0000-0000-0000-0000000000a1', 'Builder', 'a.png', 'published', 'rare'),
  ('00000000-0000-0000-0000-0000000000a2', 'Secret', 'a.png', 'draft', 'common');

-- Privileges
select ok(not has_table_privilege('authenticated', 'public.notifications', 'SELECT'), 'players cannot read the table directly');
select ok(not has_function_privilege('authenticated', 'public.event_reminders_notify()', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.cleanup_notifications()', 'EXECUTE'), 'the cron functions are internal');
select is((select count(*)::int from cron.job where jobname in ('event-reminders-notify', 'notifications-cleanup')), 2, 'both cron jobs are scheduled');

-- Awards
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select public.admin_award('00000000-0000-0000-0000-0000000000a1', null, null,
  '{00000000-0000-0000-0000-000000000003,00000000-0000-0000-0000-000000000004,00000000-0000-0000-0000-000000000006}');
select is((select array_agg(user_id::text || ' ' || (payload ->> 'tier') order by user_id) from public.notifications where kind = 'award'),
  '{"00000000-0000-0000-0000-000000000003 rare","00000000-0000-0000-0000-000000000004 rare","00000000-0000-0000-0000-000000000006 rare"}'::text[],
  'an award to three players makes one award row each');
select public.admin_award('00000000-0000-0000-0000-0000000000a2', null, null, '{00000000-0000-0000-0000-000000000003}');
select is(pg_temp.n('00000000-0000-0000-0000-000000000003', 'award'), 1, 'a draft badge notifies nobody');

-- Banner grants
select public.admin_grant_banner('00000000-0000-0000-0000-000000000004', 'sakura', true);
select is(pg_temp.n('00000000-0000-0000-0000-000000000004', 'banner'), 1, 'a grant makes one banner row');
select public.admin_grant_banner('00000000-0000-0000-0000-000000000004', 'sakura', true);
select is(pg_temp.n('00000000-0000-0000-0000-000000000004', 'banner'), 1, 'granting it again makes none');

-- Banners through awards
delete from public.notifications;
delete from public.achievement_awards; -- admin_award skips holders, so start from nobody holding a1
select public.admin_award('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', null,
  '{00000000-0000-0000-0000-000000000003,00000000-0000-0000-0000-000000000004}');
select is((select array_agg(user_id::text || ' ' || (payload ->> 'banner_id')) from public.notifications where kind = 'banner'),
  '{"00000000-0000-0000-0000-000000000003 sakura"}'::text[], 'a badge at a banner event notifies only the player who did not own the banner');
-- a second award of a1 would be skipped now; insert the row directly to reach the same trigger path
insert into public.achievement_awards (user_id, achievement_id, event_id, awarded_on)
  select '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e2', current_date;
select is(pg_temp.n('00000000-0000-0000-0000-000000000003', 'banner'), 1, 'owning it through another banner event means no new banner row');
select public.admin_award('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e3', null, '{00000000-0000-0000-0000-000000000006}');
select is(pg_temp.n('00000000-0000-0000-0000-000000000006', 'banner'), 0, 'a default banner is never news');
select public.admin_grant_banner('00000000-0000-0000-0000-000000000003', 'sakura', true);
select is(pg_temp.n('00000000-0000-0000-0000-000000000003', 'banner'), 1, 'granting a banner already owned through an award makes none');
select public.admin_grant_banner('00000000-0000-0000-0000-000000000006', 'gold', true);
select is(pg_temp.n('00000000-0000-0000-0000-000000000006', 'banner'), 1, 'a grant of a new banner makes one');

-- Appeals
select public.admin_ban_user('00000000-0000-0000-0000-000000000006', 'griefing', null, null);
select pg_temp.login('00000000-0000-0000-0000-000000000006');
select public.submit_appeal('I am sorry, it was my brother.');
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select public.admin_decide_appeal((select id from public.appeals where user_id = '00000000-0000-0000-0000-000000000006' and status = 'open'), false, 'No.');
select is((select array_agg(payload) from public.notifications where kind = 'appeal'), array['{"status": "rejected"}'::jsonb], 'a decided appeal makes one row');
select pg_temp.login('00000000-0000-0000-0000-000000000006');
select public.submit_appeal('Please, I rebuilt the whole spawn.');
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select public.admin_decide_appeal((select id from public.appeals where user_id = '00000000-0000-0000-0000-000000000006' and status = 'open'), true, 'OK.');
select is((select array_agg(payload ->> 'status' order by created_at, payload ->> 'status') from public.notifications where kind = 'appeal'),
  '{accepted,rejected}'::text[], 'an accept that lifts the ban still makes exactly one row');
select ok(not public.is_banned('00000000-0000-0000-0000-000000000006'), 'and the ban was lifted');

-- Reports
select pg_temp.login('00000000-0000-0000-0000-000000000004');
select public.report_player('00000000-0000-0000-0000-000000000003', 'grief', 'broke my house twice', null);
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select public.admin_handle_report((select id from public.reports where reporter_id = '00000000-0000-0000-0000-000000000004'), 'actioned', 'banned for a week');
select is((select array_agg(payload) from public.notifications where kind = 'report' and user_id = '00000000-0000-0000-0000-000000000004'),
  array['{"status": "actioned"}'::jsonb], 'the reporter gets one row with the status only (no note, no target)');
select is((select count(*)::int from public.notifications where kind = 'report'), 1, 'and nobody else does');
insert into public.reports (id, reporter_id, target_user_id, category, details) values
  ('00000000-0000-0000-0000-0000000000f1', null, '00000000-0000-0000-0000-000000000003', 'other', 'reporter account deleted');
select public.admin_handle_report('00000000-0000-0000-0000-0000000000f1', 'dismissed', null);
select is((select count(*)::int from public.notifications where kind = 'report'), 1, 'a reporter-less report notifies nobody');

-- Reminders. e4: 1 day and 1 h both due; 03 interested, 04 checked in (and interested), 06 neither.
insert into public.events (id, name, starts_at, status) values
  ('00000000-0000-0000-0000-0000000000e4', 'Night Raid', now() + interval '30 minutes', 'published'),
  ('00000000-0000-0000-0000-0000000000e5', 'Morning Raid', now() + interval '30 minutes', 'published'),
  ('00000000-0000-0000-0000-0000000000e6', 'Noon Raid', now() + interval '30 minutes', 'published');
insert into public.event_reminders (event_id, offset_minutes) values
  ('00000000-0000-0000-0000-0000000000e4', 1440), ('00000000-0000-0000-0000-0000000000e4', 60),
  ('00000000-0000-0000-0000-0000000000e5', 60), ('00000000-0000-0000-0000-0000000000e6', 60);
insert into public.event_interests (event_id, user_id) values
  ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-000000000004'),
  ('00000000-0000-0000-0000-0000000000e5', '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-0000000000e6', '00000000-0000-0000-0000-000000000004');
insert into public.event_attendance (event_id, user_id, method) values
  ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-000000000004', 'staff');
-- The bot wrote e5 back before the cron ran.
select public.event_reminder_sent('00000000-0000-0000-0000-0000000000e5', 60);
-- Only the test events: the cron sees every due reminder in the database.
update public.event_reminders set skipped_at = now() where event_id::text not like '00000000-0000-0000-0000-0000000000e%';

select is(public.event_reminders_notify(), 4, 'the first run notifies');
select is(public.event_reminders_notify(), 0, 'the second run notifies nobody');
select is((select array_agg(user_id::text || ' ' || (payload ->> 'offset_minutes') order by user_id)
           from public.notifications where kind = 'reminder' and payload ->> 'event_id' = '00000000-0000-0000-0000-0000000000e4'),
  '{"00000000-0000-0000-0000-000000000003 60","00000000-0000-0000-0000-000000000004 60"}'::text[],
  'one row per interested or attending user, for the latest due offset only');
select is(pg_temp.n('00000000-0000-0000-0000-000000000006', 'reminder'), 0, 'a player who is neither gets none');
select is((select count(*)::int from public.event_reminders where event_id = '00000000-0000-0000-0000-0000000000e4' and notified_at is not null), 2,
  'the older offset is claimed too, so it never fires later');
select is((select count(*)::int from public.notifications where kind = 'reminder' and payload ->> 'event_id' = '00000000-0000-0000-0000-0000000000e5'), 1,
  'the bot writing back first still leaves exactly one row per user');
select is((select array_agg(user_id) from public.notifications where kind = 'reminder' and payload ->> 'event_id' = '00000000-0000-0000-0000-0000000000e6'),
  '{00000000-0000-0000-0000-000000000004}'::uuid[], 'e6 was notified once by the first run');
-- Two calls in one statement: the second runs after the first has claimed.
update public.event_reminders set notified_at = null where event_id = '00000000-0000-0000-0000-0000000000e6';
delete from public.notifications where payload ->> 'event_id' = '00000000-0000-0000-0000-0000000000e6';
select is((select public.event_reminders_notify() + public.event_reminders_notify()), 1, 'overlapping calls notify once');

-- Reading: 25 rows for A, 2 for B.
delete from public.notifications;
insert into public.notifications (user_id, kind, payload, created_at)
  select '00000000-0000-0000-0000-000000000007', 'award', jsonb_build_object('n', i), now() - make_interval(mins => i) from generate_series(1, 25) i;
insert into public.notifications (user_id, kind, created_at) values
  ('00000000-0000-0000-0000-000000000008', 'award', now()), ('00000000-0000-0000-0000-000000000008', 'award', now());
select pg_temp.login('00000000-0000-0000-0000-000000000007');
select is((select array_agg((payload ->> 'n')::int) from public.my_notifications()), array(select generate_series(1, 20)), 'the last 20, newest first');
select is((select count(*)::int from public.my_notifications(100)), 20, 'the limit is clamped to 20');
select is(public.my_unread_notifications(), 25, 'all 25 are unread');
select is(public.mark_my_notifications_read(), 25, 'marking read returns how many');
select is(public.my_unread_notifications(), 0, 'and the unread count goes to 0');
select is((select count(*)::int from public.my_notifications() where payload ? 'n' is not true), 0, 'B''s rows never show to A');
select is((select count(*)::int from public.notifications where user_id = '00000000-0000-0000-0000-000000000008' and read_at is null), 2, 'and A cannot mark them read');

set local role authenticated;
select throws_ok($$ select * from public.notifications $$, '42501', null, 'authenticated cannot select the table');
select throws_ok($$ update public.notifications set read_at = now() $$, '42501', null, 'authenticated cannot update the table');
reset role;
set local role anon;
select throws_ok($$ select * from public.notifications $$, '42501', null, 'anon cannot select the table');
reset role;

-- Cleanup
insert into public.notifications (user_id, kind, payload, created_at) values
  ('00000000-0000-0000-0000-000000000008', 'award', '{"age": 91}', now() - interval '91 days'),
  ('00000000-0000-0000-0000-000000000008', 'award', '{"age": 89}', now() - interval '89 days');
select is(public.cleanup_notifications(), 1, 'cleanup removes one row');
select is((select array_agg(payload ->> 'age') from public.notifications where payload ? 'age'), '{89}'::text[], 'rows of 91 days go, rows of 89 days stay');

select * from finish();
rollback;
