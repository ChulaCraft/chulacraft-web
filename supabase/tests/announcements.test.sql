-- Announcements from 20261009000001_announcements.sql: who may read and write,
-- what the public list shows, and what the Discord bot is asked to do.
--
-- Same shape as achievements.test.sql: a rolled-back transaction, a
-- pg_temp.login() impersonation helper, definer functions called the way
-- PostgREST would call them.

begin;

select plan(32);

-- Counts below assume no other announcements (rolled back at the end).
delete from public.account_change_log where entity = 'announcements';
delete from public.announcements;

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

-- 2 admin, 3 plain player.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000002', 'admin@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'player@test.local');
update public.profiles set role = 'admin' where user_id = '00000000-0000-0000-0000-000000000002';

-- ------------------------------------------------------------- privileges

select ok(not has_table_privilege('authenticated', 'public.announcements', 'SELECT,INSERT,UPDATE,DELETE'),
  'players cannot touch the announcements table');
select ok(not has_table_privilege('anon', 'public.announcements', 'SELECT,INSERT,UPDATE,DELETE'),
  'anonymous users cannot touch the announcements table');
select ok(has_function_privilege('anon', 'public.list_announcements(integer)', 'EXECUTE'),
  'the public list is readable signed out');
select ok(not has_function_privilege('anon', 'public.admin_list_announcements()', 'EXECUTE'),
  'anonymous users cannot call the admin list');
select ok(not has_function_privilege('anon',
  'public.admin_upsert_announcement(uuid, text, text, text, boolean, timestamptz, timestamptz, boolean)', 'EXECUTE'),
  'anonymous users cannot write announcements');
select ok(not has_function_privilege('authenticated', 'public.announcements_discord_queue()', 'EXECUTE'),
  'players cannot read the Discord queue');
select ok(has_function_privilege('service_role', 'public.announcements_discord_queue()', 'EXECUTE'),
  'the bot can read the Discord queue');
select ok(has_column_privilege('service_role', 'public.announcements', 'discord_message_id', 'UPDATE'),
  'the bot can record the message it posted');
select ok(not has_column_privilege('service_role', 'public.announcements', 'title', 'UPDATE'),
  'the bot cannot rewrite an announcement');

-- ------------------------------------------------------------------ writes

select pg_temp.login('00000000-0000-0000-0000-000000000003');
select throws_ok($$ select public.admin_upsert_announcement(null, 't', 'b', 'info', false, now(), null, false) $$,
  'P0001', 'FORBIDDEN', 'a player cannot create an announcement');
select throws_ok($$ select public.admin_list_announcements() $$, 'P0001', 'FORBIDDEN',
  'a player cannot read drafts');
select throws_ok($$ select public.admin_delete_announcement('00000000-0000-0000-0000-0000000000a1') $$, 'P0001', 'FORBIDDEN',
  'a player cannot delete an announcement');

select pg_temp.login('00000000-0000-0000-0000-000000000002');
-- a1 live + Discord, a2 draft, a3 scheduled, a4 expired + Discord, a5 pinned and older.
select is(public.admin_upsert_announcement('00000000-0000-0000-0000-0000000000a1', 'Live', 'Body', 'info', false,
  now() - interval '1 hour', null, true), '00000000-0000-0000-0000-0000000000a1'::uuid,
  'an admin creates an announcement under the requested id');
select public.admin_upsert_announcement('00000000-0000-0000-0000-0000000000a2', 'Draft', 'Body', 'info', false, null, null, true);
select public.admin_upsert_announcement('00000000-0000-0000-0000-0000000000a3', 'Scheduled', 'Body', 'info', false,
  now() + interval '1 day', null, true);
select public.admin_upsert_announcement('00000000-0000-0000-0000-0000000000a4', 'Expired', 'Body', 'warning', false,
  now() - interval '2 days', now() - interval '1 day', true);
select public.admin_upsert_announcement('00000000-0000-0000-0000-0000000000a5', 'Pinned', 'Body', 'maintenance', true,
  now() - interval '3 hours', null, false);

select throws_ok($$ select public.admin_upsert_announcement(null, 't', 'b', 'loud', false, now(), null, false) $$,
  '23514', null, 'an unknown severity is refused');
select throws_ok($$ select public.admin_upsert_announcement(null, 't', 'b', 'info', false, now(), now() - interval '1 hour', false) $$,
  '23514', null, 'an expiry before publication is refused');
select is((select count(*)::int from public.admin_list_announcements()), 5, 'the admin list shows drafts and scheduled posts');
select is((select count(*)::int from public.account_change_log where entity = 'announcements' and field = 'created'), 5,
  'each creation is audited');

-- ------------------------------------------------------------- public list

select set_config('request.jwt.claims', '{"role":"anon"}', true);
select is((select array_agg(l.title) from public.list_announcements() l), array['Pinned', 'Live'],
  'the public list shows live announcements only, pinned first');
select is((select count(*)::int from public.list_announcements(1)), 1, 'the limit is honoured');

-- ----------------------------------------------------------- Discord queue

select is((select array_agg(q.title) from public.announcements_discord_queue() q), array['Live'],
  'only a live, unposted, opted-in announcement is queued');
select is((select bool_or(q.deleted) from public.announcements_discord_queue() q), false, 'a new post is not a deletion');

-- What the bot writes back after posting.
update public.announcements set discord_message_id = 'm1', discord_revision = revision
  where id = '00000000-0000-0000-0000-0000000000a1';
select is((select count(*)::int from public.announcements_discord_queue()), 0, 'a posted announcement leaves the queue');

select pg_temp.login('00000000-0000-0000-0000-000000000002');
select public.admin_upsert_announcement('00000000-0000-0000-0000-0000000000a1', 'Live', 'Body', 'info', true,
  (select published_at from public.announcements where id = '00000000-0000-0000-0000-0000000000a1'), null, true);
select is((select revision from public.announcements where id = '00000000-0000-0000-0000-0000000000a1'), 1,
  'pinning does not change the revision');
select is((select count(*)::int from public.announcements_discord_queue()), 0, 'so pinning does not re-queue the post');

select public.admin_upsert_announcement('00000000-0000-0000-0000-0000000000a1', 'Live', 'Fixed typo', 'info', true,
  (select published_at from public.announcements where id = '00000000-0000-0000-0000-0000000000a1'), null, true);
select is((select revision from public.announcements where id = '00000000-0000-0000-0000-0000000000a1'), 2,
  'editing the text bumps the revision');
select is((select q.discord_message_id from public.announcements_discord_queue() q), 'm1',
  'an edited post is queued with the message to edit');

-- ------------------------------------------------------------------ delete

select lives_ok($$ select public.admin_delete_announcement('00000000-0000-0000-0000-0000000000a1') $$,
  'an admin deletes an announcement');
select is((select array_agg(l.title) from public.list_announcements() l), array['Pinned'],
  'a deleted announcement leaves the public list');
select is((select q.deleted from public.announcements_discord_queue() q), true,
  'its Discord message is queued for deletion');
select throws_ok($$ select public.admin_delete_announcement('00000000-0000-0000-0000-0000000000a1') $$, 'P0001', 'NOT_FOUND',
  'it cannot be deleted twice');
select throws_ok($$ select public.admin_upsert_announcement('00000000-0000-0000-0000-0000000000a1', 't', 'b', 'info', false, null, null, false) $$,
  'P0001', 'NOT_FOUND', 'or edited back to life');

update public.announcements set discord_message_id = null where id = '00000000-0000-0000-0000-0000000000a1';
select is((select count(*)::int from public.announcements_discord_queue()), 0,
  'once the message is gone the row is left alone');

select * from finish();

rollback;
