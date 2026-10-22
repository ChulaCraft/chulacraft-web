-- Check-in tokens, proofs, attendance, awarding attendees and event history
-- from 20261027000001_event_attendance.sql.
begin;
select plan(61);

-- Start from an empty audit log so counts only see this test's rows.
delete from public.account_change_log;

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;
-- now() is fixed for the whole transaction, so the window is too.
create function pg_temp.w() returns bigint language sql as $$
  select floor(extract(epoch from now()) / 30)::bigint;
$$;
create function pg_temp.tok(p_event uuid, p_window bigint) returns text language sql as $$
  select p_window || '.' || public.checkin_mac(p_event, 'token:' || p_event || ':' || p_window);
$$;
create function pg_temp.proof(p_event uuid, p_expires bigint) returns text language sql as $$
  select 'p.' || p_expires || '.' || public.checkin_mac(p_event, 'proof:' || p_event || ':' || p_expires);
$$;

-- 02 admin, 05 event staff; 03 04 09 10 verified players, 07 unverified, 08 banned.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000002', 'admin@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'p3@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'p4@test.local'),
  ('00000000-0000-0000-0000-000000000005', 'staff@test.local'),
  ('00000000-0000-0000-0000-000000000007', 'unverified@test.local'),
  ('00000000-0000-0000-0000-000000000008', 'banned@test.local'),
  ('00000000-0000-0000-0000-000000000009', 'p9@test.local'),
  ('00000000-0000-0000-0000-000000000010', 'p10@test.local');
update public.profiles set role = 'admin' where user_id = '00000000-0000-0000-0000-000000000002';
update public.profiles set role = 'event_staff' where user_id = '00000000-0000-0000-0000-000000000005';
update public.profiles set guest_verified_at = now() where user_id in (
  '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000010');
insert into auth.identities (user_id, provider, provider_id, identity_data) values
  ('00000000-0000-0000-0000-000000000010', 'discord', 'd-10', '{"full_name":"Player Ten"}');

-- e1 running now, e2 ended 20 min ago, e3 starts in 20 min, e4 draft (running),
-- e5 running but never shown a QR (no secret), e6 starts in 10 min, e7 ended 10 min ago.
insert into public.events (id, name, starts_at, ends_at, status) values
  ('00000000-0000-0000-0000-0000000000e1', 'Build Day', now() - interval '1 hour', now() + interval '1 hour', 'published'),
  ('00000000-0000-0000-0000-0000000000e2', 'Dragon Fight', now() - interval '2 days', now() - interval '20 minutes', 'published'),
  ('00000000-0000-0000-0000-0000000000e3', 'Later', now() + interval '20 minutes', null, 'published'),
  ('00000000-0000-0000-0000-0000000000e4', 'Draft', now() - interval '1 hour', null, 'draft'),
  ('00000000-0000-0000-0000-0000000000e5', 'No QR yet', now(), null, 'published'),
  ('00000000-0000-0000-0000-0000000000e6', 'Soon', now() + interval '10 minutes', null, 'published'),
  ('00000000-0000-0000-0000-0000000000e7', 'Just over', now() - interval '3 hours', now() - interval '10 minutes', 'published');
insert into public.achievements (id, name, image_path, status) values
  ('00000000-0000-0000-0000-0000000000a1', 'Builder', 'a.png', 'published'),
  ('00000000-0000-0000-0000-0000000000a2', 'Secret', 'a.png', 'draft');

select pg_temp.login('00000000-0000-0000-0000-000000000002');
select public.admin_ban_user('00000000-0000-0000-0000-000000000008', 'griefing', null, null);

-- Privileges
select ok(not has_table_privilege('service_role', 'public.event_checkin_secrets', 'SELECT'), 'the bot key cannot read check-in secrets');
select ok(not has_table_privilege('service_role', 'public.player_checkin_codes', 'SELECT'), 'the bot key cannot read player codes');
select ok(not has_table_privilege('authenticated', 'public.event_attendance', 'SELECT'), 'players cannot read attendance directly');
select ok(has_function_privilege('anon', 'public.checkin_proof(uuid, text)', 'EXECUTE'), 'the QR route handler works signed out');
select ok(not has_function_privilege('anon', 'public.check_in(uuid, text)', 'EXECUTE'), 'checking in needs an account');
select ok(not has_function_privilege('authenticated', 'public.checkin_verify(uuid, text)', 'EXECUTE'), 'verify is internal');

-- The QR
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select throws_ok($$ select * from public.admin_checkin_token('00000000-0000-0000-0000-0000000000e1') $$, 'FORBIDDEN', 'players cannot show the QR');
select pg_temp.login('00000000-0000-0000-0000-000000000005');
create temporary table qr as select * from public.admin_checkin_token('00000000-0000-0000-0000-0000000000e1');
select is((select token || ' ' || expires_at from qr),
  pg_temp.tok('00000000-0000-0000-0000-0000000000e1', pg_temp.w()) || ' ' || to_timestamp((pg_temp.w() + 1) * 30),
  'event staff get the current window token and when it rotates');
select throws_ok($$ select * from public.admin_checkin_token('00000000-0000-0000-0000-0000000000e4') $$, 'NOT_FOUND', 'no QR for a draft');
select throws_ok($$ select * from public.admin_checkin_token('00000000-0000-0000-0000-0000000000e3') $$, 'CHECKIN_CLOSED', 'no QR more than 15 min before the start');
select throws_ok($$ select * from public.admin_checkin_token('00000000-0000-0000-0000-0000000000e2') $$, 'CHECKIN_CLOSED', 'no QR more than 15 min after the end');
select lives_ok($$ select * from public.admin_checkin_token('00000000-0000-0000-0000-0000000000e6') $$, 'open 10 min before the start');
select lives_ok($$ select * from public.admin_checkin_token('00000000-0000-0000-0000-0000000000e7') $$, 'still open 10 min after the end');

-- Tokens
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select is(public.check_in('00000000-0000-0000-0000-0000000000e1', pg_temp.tok('00000000-0000-0000-0000-0000000000e1', pg_temp.w())), 'recorded', 'the current window is accepted');
select is(public.check_in('00000000-0000-0000-0000-0000000000e1', pg_temp.tok('00000000-0000-0000-0000-0000000000e1', pg_temp.w())), 'already', 'a second scan says already');
select is((select count(*)::int from public.event_attendance where event_id = '00000000-0000-0000-0000-0000000000e1' and user_id = '00000000-0000-0000-0000-000000000003'), 1, 'and there is still one row');
select pg_temp.login('00000000-0000-0000-0000-000000000004');
select throws_ok(format('select public.check_in(%L, %L)', '00000000-0000-0000-0000-0000000000e1', pg_temp.tok('00000000-0000-0000-0000-0000000000e1', pg_temp.w() - 2)),
  'TOKEN_EXPIRED', 'two windows back is expired');
select throws_ok(format('select public.check_in(%L, %L)', '00000000-0000-0000-0000-0000000000e1', pg_temp.w() || '.AAAAAAAAAAAAAAAAAAAAAA'),
  'TOKEN_EXPIRED', 'a forged mac is refused');
select throws_ok($$ select public.check_in('00000000-0000-0000-0000-0000000000e1', 'x') $$, 'TOKEN_EXPIRED', 'garbage is refused as expired');
select throws_ok($$ select public.check_in('00000000-0000-0000-0000-0000000000e1', '1.') $$, 'TOKEN_EXPIRED', 'a half token is refused as expired');
select throws_ok($$ select public.check_in('00000000-0000-0000-0000-0000000000e1', null) $$, 'TOKEN_EXPIRED', 'no token is refused as expired');
select throws_ok(format('select public.check_in(%L, %L)', '00000000-0000-0000-0000-0000000000e5', pg_temp.w() || '.AAAAAAAAAAAAAAAAAAAAAA'),
  'TOKEN_EXPIRED', 'an event without a secret accepts nothing');
select is(public.check_in('00000000-0000-0000-0000-0000000000e1', pg_temp.tok('00000000-0000-0000-0000-0000000000e1', pg_temp.w() - 1)), 'recorded', 'the previous window is accepted');
select throws_ok(format('select public.check_in(%L, %L)', '00000000-0000-0000-0000-0000000000e3', pg_temp.tok('00000000-0000-0000-0000-0000000000e1', pg_temp.w())),
  'CHECKIN_CLOSED', 'a scan before the grace is closed');
select throws_ok(format('select public.check_in(%L, %L)', '00000000-0000-0000-0000-0000000000e2', pg_temp.tok('00000000-0000-0000-0000-0000000000e1', pg_temp.w())),
  'CHECKIN_CLOSED', 'a scan after the grace is closed');
select throws_ok(format('select public.check_in(%L, %L)', '00000000-0000-0000-0000-0000000000e4', pg_temp.tok('00000000-0000-0000-0000-0000000000e1', pg_temp.w())),
  'NOT_FOUND', 'drafts take no check-ins');

-- Proofs
select set_config('request.jwt.claims', '', true);
create temporary table proofs as
  select public.checkin_proof('00000000-0000-0000-0000-0000000000e1', pg_temp.tok('00000000-0000-0000-0000-0000000000e1', pg_temp.w())) as p;
select is((select p from proofs), pg_temp.proof('00000000-0000-0000-0000-0000000000e1', floor(extract(epoch from now()))::bigint + 300),
  'a valid token buys a 5-minute proof, signed out');
select is(public.checkin_proof('00000000-0000-0000-0000-0000000000e1', (select p from proofs)), null, 'a proof cannot buy a fresh proof');
select is(public.checkin_proof('00000000-0000-0000-0000-0000000000e1', 'x'), null, 'garbage buys nothing');
select is(public.checkin_proof('00000000-0000-0000-0000-0000000000e2', pg_temp.tok('00000000-0000-0000-0000-0000000000e2', pg_temp.w())), null, 'nor does a closed event');
select pg_temp.login('00000000-0000-0000-0000-000000000009');
select throws_ok(format('select public.check_in(%L, %L)', '00000000-0000-0000-0000-0000000000e1', pg_temp.proof('00000000-0000-0000-0000-0000000000e1', floor(extract(epoch from now()))::bigint - 1)),
  'TOKEN_EXPIRED', 'an expired proof is refused');
select throws_ok(format('select public.check_in(%L, %L)', '00000000-0000-0000-0000-0000000000e1',
    'p.' || (floor(extract(epoch from now()))::bigint + 300) || '.' || split_part(pg_temp.tok('00000000-0000-0000-0000-0000000000e1', pg_temp.w()), '.', 2)),
  'TOKEN_EXPIRED', 'a token mac does not pass as a proof');
select is(public.check_in('00000000-0000-0000-0000-0000000000e1', (select p from proofs)), 'recorded', 'a live proof checks in');

select pg_temp.login('00000000-0000-0000-0000-000000000005');
select public.admin_rotate_checkin_secret('00000000-0000-0000-0000-0000000000e1');
select is((select count(*)::int from public.account_change_log where entity = 'events' and field = 'checkin_secret'), 1, 'rotating is audited');
select pg_temp.login('00000000-0000-0000-0000-000000000010');
select throws_ok(format('select public.check_in(%L, %L)', '00000000-0000-0000-0000-0000000000e1', (select p from proofs)),
  'TOKEN_EXPIRED', 'proofs stop working after a rotation');

-- Banned and unverified, both paths.
select pg_temp.login('00000000-0000-0000-0000-000000000008');
select throws_ok(format('select public.check_in(%L, %L)', '00000000-0000-0000-0000-0000000000e1', pg_temp.tok('00000000-0000-0000-0000-0000000000e1', pg_temp.w())),
  'BANNED', 'a banned player cannot scan in');
create temporary table codes as select '00000000-0000-0000-0000-000000000008'::uuid as user_id, public.my_checkin_code() as code;
grant all on codes to authenticated;
select pg_temp.login('00000000-0000-0000-0000-000000000007');
select throws_ok(format('select public.check_in(%L, %L)', '00000000-0000-0000-0000-0000000000e1', pg_temp.tok('00000000-0000-0000-0000-0000000000e1', pg_temp.w())),
  'NOT_VERIFIED', 'an unverified player cannot scan in');
insert into codes select '00000000-0000-0000-0000-000000000007', public.my_checkin_code();

-- Personal code + staff scan
select pg_temp.login('00000000-0000-0000-0000-000000000010');
insert into codes select '00000000-0000-0000-0000-000000000010', public.my_checkin_code();
select is(public.my_checkin_code(), (select code from codes where user_id = '00000000-0000-0000-0000-000000000010'), 'the personal code is stable');
select ok((select code ~ '^CC-[A-Z2-9]{10}$' from codes where user_id = '00000000-0000-0000-0000-000000000010'), 'and looks like CC-XXXXXXXXXX');
select throws_ok(format('select * from public.admin_check_in_player(%L, %L)', '00000000-0000-0000-0000-0000000000e1', 'CC-AAAAAAAAAA'),
  'FORBIDDEN', 'players cannot scan others in');

select pg_temp.login('00000000-0000-0000-0000-000000000005');
select is((select status || ' ' || user_id || ' ' || display_name from public.admin_check_in_player('00000000-0000-0000-0000-0000000000e1',
    ' ' || lower((select code from codes where user_id = '00000000-0000-0000-0000-000000000010')) || ' ')),
  'recorded 00000000-0000-0000-0000-000000000010 Player Ten', 'staff scan records and names the player');
select is((select status from public.admin_check_in_player('00000000-0000-0000-0000-0000000000e1', (select code from codes where user_id = '00000000-0000-0000-0000-000000000010'))),
  'already', 'scanning again says already');
select is((select count(*)::int from public.account_change_log where entity = 'event_attendance' and field = 'checked_in'), 1, 'the staff check-in is audited once');
select throws_ok(format('select * from public.admin_check_in_player(%L, %L)', '00000000-0000-0000-0000-0000000000e1', 'CC-ZZZZZZZZZZ'),
  'UNKNOWN_CODE', 'an unknown code is refused');
select throws_ok(format('select * from public.admin_check_in_player(%L, %L)', '00000000-0000-0000-0000-0000000000e1', (select code from codes where user_id = '00000000-0000-0000-0000-000000000008')),
  'BANNED', 'staff cannot check in a banned player');
select throws_ok(format('select * from public.admin_check_in_player(%L, %L)', '00000000-0000-0000-0000-0000000000e1', (select code from codes where user_id = '00000000-0000-0000-0000-000000000007')),
  'NOT_VERIFIED', 'staff cannot check in an unverified player');
select is((select array_agg(method order by user_id) from public.admin_list_attendance('00000000-0000-0000-0000-0000000000e1')),
  '{self,self,self,staff}'::text[], 'the attendance list has everyone and how they came in');

-- Award attendees: 03 already holds the badge.
select public.admin_award('00000000-0000-0000-0000-0000000000a1', null, null, '{00000000-0000-0000-0000-000000000003}');
delete from public.account_change_log where entity = 'achievement_awards';
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select throws_ok($$ select public.admin_award_attendees('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1') $$, 'FORBIDDEN', 'players cannot award attendees');
select set_config('request.jwt.claims', '', true);
select throws_ok($$ select public.admin_award_attendees('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1') $$, 'FORBIDDEN', 'signed out cannot award attendees');
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select is(public.admin_award_attendees('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1'), 3, 'event staff award the three attendees without it');
select is((select count(*)::int from public.account_change_log where entity = 'achievement_awards'), 3, 'one audit row per recipient');
select is((select new_value from public.account_change_log where entity = 'events' and field = 'award_attendees'), 'Builder x3', 'plus one row on the event with the count');
select is(public.admin_award_attendees('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1'), 0, 'a second click awards nobody');
select is((select count(*)::int from public.achievement_awards where achievement_id = '00000000-0000-0000-0000-0000000000a1'), 4, 'and makes no duplicate awards');
select throws_ok($$ select public.admin_award_attendees('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a2') $$, 'NOT_FOUND', 'a draft badge cannot be awarded to attendees');

-- Backfill: awards at published events count as attendance, drafts don't.
insert into public.achievement_awards (user_id, achievement_id, event_id, awarded_on) values
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e2', current_date - 2),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e4', current_date);
select public.event_attendance_backfill();
select is((select array_agg(event_id::text || ' ' || method order by event_id) from public.event_attendance where user_id = '00000000-0000-0000-0000-000000000004'),
  '{"00000000-0000-0000-0000-0000000000e1 self","00000000-0000-0000-0000-0000000000e2 backfill"}'::text[], 'backfill covers published events only');

-- History: 04 attended e1 (now) and e2 (2 days ago); the draft e4 and the draft badge never show.
insert into public.event_attendance (event_id, user_id, method) values ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-000000000004', 'staff');
insert into public.achievement_awards (user_id, achievement_id, event_id, awarded_on) values
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000e1', current_date);
select pg_temp.login('00000000-0000-0000-0000-000000000004');
select is((select jsonb_agg(jsonb_build_array(h ->> 'name', (select jsonb_agg(b ->> 'name') from jsonb_array_elements(h -> 'badges') b))) from jsonb_array_elements(public.my_event_history()) h),
  '[["Build Day", ["Builder"]], ["Dragon Fight", ["Builder"]]]'::jsonb, 'history is newest first with the badges earned there; drafts filtered out');
select pg_temp.login('00000000-0000-0000-0000-000000000009');
select is(public.get_player_event_history('00000000-0000-0000-0000-000000000004'), (select public.event_history('00000000-0000-0000-0000-000000000004')), 'another player sees a public history');
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select public.block_player('00000000-0000-0000-0000-000000000004');
select throws_ok($$ select public.get_player_event_history('00000000-0000-0000-0000-000000000004') $$, 'NOT_FOUND', 'the blocker cannot read it');
select pg_temp.login('00000000-0000-0000-0000-000000000004');
select throws_ok($$ select public.get_player_event_history('00000000-0000-0000-0000-000000000003') $$, 'NOT_FOUND', 'nor can the blocked player read theirs');

-- Removing attendance logs the old method.
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select public.admin_remove_attendance('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-000000000010');
select is((select old_value from public.account_change_log where entity = 'event_attendance' and new_value is null), 'staff', 'removing attendance is audited with how they came in');

select * from finish();
rollback;
