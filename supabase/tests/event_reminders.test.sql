-- Event reminders from 20261028000001_event_reminders.sql.
begin;
select plan(25);

-- Start from an empty audit log so counts only see this test's rows.
delete from public.account_change_log;

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;
-- The queue for the test events, as 'name offset'.
create function pg_temp.queue() returns text[] language sql as $$
  select coalesce(array_agg(q.name || ' ' || q.offset_minutes order by q.name), '{}')
  from public.event_reminders_queue() q where q.event_id::text like '00000000-0000-0000-0000-0000000000e%';
$$;
create function pg_temp.state(p_event uuid, p_offset int) returns text language sql as $$
  select case when r.sent_at is not null then 'sent' when r.skipped_at is not null then 'skipped' else 'armed' end
  from public.event_reminders r where r.event_id = p_event and r.offset_minutes = p_offset;
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000003', 'player@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'unlinked@test.local'),
  ('00000000-0000-0000-0000-000000000005', 'staff@test.local');
update public.profiles set role = 'event_staff' where user_id = '00000000-0000-0000-0000-000000000005';
insert into auth.identities (user_id, provider, provider_id, identity_data) values
  ('00000000-0000-0000-0000-000000000003', 'discord', 'd-3', '{"full_name":"Player"}');

-- e1 in 2 days, e2 in 30 min, e3 started, e4 draft in 30 min.
insert into public.events (id, name, starts_at, status) values
  ('00000000-0000-0000-0000-0000000000e1', 'Build Day', now() + interval '2 days', 'published'),
  ('00000000-0000-0000-0000-0000000000e2', 'Soon', now() + interval '30 minutes', 'published'),
  ('00000000-0000-0000-0000-0000000000e3', 'Started', now() + interval '2 days', 'published'),
  ('00000000-0000-0000-0000-0000000000e4', 'Draft', now() + interval '2 days', 'draft');
insert into public.event_interests (event_id, user_id) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-000000000004');

-- Privileges
select ok(has_function_privilege('service_role', 'public.event_reminders_queue()', 'EXECUTE')
  and has_function_privilege('service_role', 'public.event_reminder_sent(uuid, integer)', 'EXECUTE'), 'the bot reads and writes back');
select ok(not has_function_privilege('anon', 'public.event_reminders_queue()', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.event_reminders_queue()', 'EXECUTE'), 'browsers cannot read the queue');
select ok(not has_function_privilege('anon', 'public.event_reminder_sent(uuid, integer)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.event_reminder_sent(uuid, integer)', 'EXECUTE'), 'browsers cannot write back');
select ok(not has_table_privilege('authenticated', 'public.event_reminders', 'SELECT'), 'players cannot read reminders directly');

-- Saving
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select throws_ok($$ select public.admin_set_event_reminders('00000000-0000-0000-0000-0000000000e1', '{60}') $$, 'FORBIDDEN', 'players cannot set reminders');
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select throws_ok($$ select public.admin_set_event_reminders('00000000-0000-0000-0000-0000000000e1', '{30}') $$, 'INVALID', 'presets only');
select public.admin_set_event_reminders('00000000-0000-0000-0000-0000000000e1', '{1440,60,60}');
select is((select array_agg(offset_minutes) from public.admin_event_reminders('00000000-0000-0000-0000-0000000000e1')), '{1440,60}', 'event staff set reminders, duplicates collapse');
select is((select new_value from public.account_change_log where entity = 'events' and field = 'reminders'), '60,1440', 'and it is audited');
select is(pg_temp.queue(), '{}', 'nothing is due yet');

-- An offset already past at save time is skipped at once.
select public.admin_set_event_reminders('00000000-0000-0000-0000-0000000000e2', '{1440,15}');
select is(pg_temp.state('00000000-0000-0000-0000-0000000000e2', 1440), 'skipped', 'a past offset is skipped when saved');
select is(pg_temp.queue(), '{}', 'and a future one is not listed early');

-- Both 1 day and 1 h due: only 1 h is offered; writing it back skips 1 day.
update public.events set starts_at = now() + interval '30 minutes' where id = '00000000-0000-0000-0000-0000000000e1';
select is(pg_temp.state('00000000-0000-0000-0000-0000000000e1', 1440), 'armed', 'moving the start earlier re-arms nothing and skips nothing');
select is(pg_temp.queue(), '{"Build Day 60"}', 'only the latest due offset is listed');
select is((select interested_discord_ids from public.event_reminders_queue() where event_id = '00000000-0000-0000-0000-0000000000e1'),
  '{d-3}'::text[], 'with the interested players who have Discord linked');
insert into public.bans (id, user_id, reason) values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000003', 'test');
select is((select interested_discord_ids from public.event_reminders_queue() where event_id = '00000000-0000-0000-0000-0000000000e1'),
  '{}'::text[], 'banned players are not pinged');
delete from public.bans where id = '00000000-0000-0000-0000-0000000000b1';
select is(public.event_reminder_sent('00000000-0000-0000-0000-0000000000e1', 60), true, 'write-back marks it sent');
select is(pg_temp.state('00000000-0000-0000-0000-0000000000e1', 1440), 'skipped', 'and skips the older unsent offset');
select is(pg_temp.queue(), '{}', 'a sent reminder is listed once');
select is(public.event_reminder_sent('00000000-0000-0000-0000-0000000000e1', 60), false, 'a second write-back returns false');

-- Started and draft events are never listed.
select public.admin_set_event_reminders('00000000-0000-0000-0000-0000000000e3', '{60}');
update public.events set starts_at = now() - interval '1 minute' where id = '00000000-0000-0000-0000-0000000000e3';
select public.admin_set_event_reminders('00000000-0000-0000-0000-0000000000e4', '{60}');
update public.events set starts_at = now() + interval '30 minutes' where id = '00000000-0000-0000-0000-0000000000e4';
select is(pg_temp.queue(), '{}', 'started and draft events are not listed');

-- An update that leaves starts_at alone re-arms nothing; moving it later does.
update public.events set name = 'Build Day!' where id = '00000000-0000-0000-0000-0000000000e1';
select is(pg_temp.state('00000000-0000-0000-0000-0000000000e1', 60), 'sent', 'renaming the event re-arms nothing');
update public.events set starts_at = now() + interval '3 days' where id = '00000000-0000-0000-0000-0000000000e1';
select is(pg_temp.state('00000000-0000-0000-0000-0000000000e1', 60) || ' ' || pg_temp.state('00000000-0000-0000-0000-0000000000e1', 1440),
  'armed armed', 'moving the start later re-arms both offsets');

-- Removing an offset deletes it; kept ones keep their state.
select public.event_reminder_sent('00000000-0000-0000-0000-0000000000e2', 15);
select public.admin_set_event_reminders('00000000-0000-0000-0000-0000000000e2', '{15}');
select is((select array_agg(offset_minutes || ' ' || (sent_at is not null)) from public.admin_event_reminders('00000000-0000-0000-0000-0000000000e2')),
  '{"15 true"}', 'removed offsets go, kept ones keep their sent state');

select throws_ok($$ select public.admin_set_event_reminders(gen_random_uuid(), '{60}') $$, 'NOT_FOUND', 'the event must exist');
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select throws_ok($$ select * from public.admin_event_reminders('00000000-0000-0000-0000-0000000000e1') $$, 'FORBIDDEN', 'players cannot read reminder state');

select * from finish();
rollback;
