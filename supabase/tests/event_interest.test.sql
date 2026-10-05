-- Phase A+ from 20261006000002_event_interest.sql: the public event list, the
-- public detail read, and the interest toggle (D6, D7, AC 23-28).
--
-- Plain asserts only, same shape as achievements.test.sql: a rolled-back
-- transaction, a pg_temp.login() impersonation helper, and rows written as
-- postgres so the definer functions are exercised the way PostgREST calls them.

begin;

select plan(52);

-- Same fixture as achievements.test.sql, with nothing else in the way.
delete from public.account_change_log;
delete from public.event_interests;
delete from public.achievement_awards;
delete from public.achievements;
delete from public.events;
delete from public.minecraft_registrations;
delete from public.chula_claims;
delete from public.profiles;
delete from auth.users;

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

-- 1 owner, 2 admin, 3 player, 4 second player.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'owner@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'admin@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'player@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'player2@test.local');

insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at) values
  ('d-1', '00000000-0000-0000-0000-000000000001', '{"full_name":"Owner"}', 'discord', now(), now()),
  ('d-2', '00000000-0000-0000-0000-000000000002', '{"full_name":"Admin"}', 'discord', now(), now()),
  ('d-3', '00000000-0000-0000-0000-000000000003', '{"full_name":"Player"}', 'discord', now(), now()),
  ('d-4', '00000000-0000-0000-0000-000000000004', '{"user_name":"PlayerTwo"}', 'discord', now(), now());

update public.profiles set role = 'owner' where user_id = '00000000-0000-0000-0000-000000000001';
update public.profiles set role = 'admin' where user_id = '00000000-0000-0000-0000-000000000002';
update public.profiles set nickname = 'pony' where user_id = '00000000-0000-0000-0000-000000000003';

-- Four fixtures: future/published, past/published, future/draft, ending-soon.
-- Times are relative to now() so the "not ended" filter is tested rather than
-- asserted against a date that goes stale.
select pg_temp.login('00000000-0000-0000-0000-000000000002');
create temporary table fixtures (label text primary key, id uuid);
insert into fixtures
select 'future',  public.admin_upsert_event(null, 'Launch Night',
  'Bring a pickaxe and a plan. We are rebuilding the spawn plaza together, then everyone gets a badge for the arch they helped raise. Tools, torches and the plot are provided.',
  now() + interval '7 days', now() + interval '7 days 3 hours', 'Spawn, survival world', 'events/launch.png', 'published')
union all
select 'past',   public.admin_upsert_event(null, 'Old Meetup', 'Already over', now() - interval '3 days',
  now() - interval '3 days' + interval '2 hours', 'Discord stage', null, 'published')
union all
select 'draft',  public.admin_upsert_event(null, 'Secret Planning', 'Not ready', now() + interval '2 days',
  null, null, null, 'draft')
union all
select 'soon',   public.admin_upsert_event(null, 'Ending Soon', 'Ends in an hour',
  now() - interval '30 minutes', now() + interval '1 hour', null, null, 'published');

-- -------------------------------------------------------------- privileges

-- The table is unreachable; only the functions are.
select ok(not has_table_privilege('authenticated', 'public.event_interests', 'SELECT,INSERT,UPDATE,DELETE'),
  'players cannot touch the event_interests table');
select ok(not has_table_privilege('anon', 'public.event_interests', 'SELECT'),
  'anonymous users cannot read the event_interests table');

-- D6: the two reads are the first anon-granted RPCs in this database.
select ok(has_function_privilege('anon', 'public.list_upcoming_events(integer)', 'EXECUTE'),
  'a logged-out visitor can read the upcoming events list');
select ok(has_function_privilege('anon', 'public.get_event(uuid)', 'EXECUTE'),
  'a logged-out visitor can read a published event');
select ok(has_function_privilege('authenticated', 'public.list_upcoming_events(integer)', 'EXECUTE'),
  'a signed-in player can read the upcoming events list');
select ok(has_function_privilege('authenticated', 'public.get_event(uuid)', 'EXECUTE'),
  'a signed-in player can read a published event');

-- D7: writing needs an account, reading other players does not.
select ok(not has_function_privilege('anon', 'public.set_event_interest(uuid, boolean)', 'EXECUTE'),
  'anonymous users cannot mark interest');
select ok(has_function_privilege('authenticated', 'public.set_event_interest(uuid, boolean)', 'EXECUTE'),
  'a signed-in player can mark their own interest');
select ok(has_function_privilege('authenticated', 'public.admin_list_event_interests(uuid)', 'EXECUTE'),
  'the interested list is granted to authenticated, with the role check inside the function');
select ok(not has_function_privilege('anon', 'public.admin_list_event_interests(uuid)', 'EXECUTE'),
  'anonymous users cannot list who is interested');

-- ------------------------------------------------------------- the list (D9)

-- These run with no session: a logged-out visitor reading the homepage (D6).
select set_config('request.jwt.claims', '', true);

select is((select array_agg(name order by starts_at) from public.list_upcoming_events()), array['Ending Soon', 'Launch Night'],
  'the list is published, not ended, and soonest first');
select is((select count(*)::int from public.list_upcoming_events()), 2, 'the finished event is left out');
select is((select name from public.list_upcoming_events() where id = (select id from fixtures where label = 'draft')), null,
  'a draft is never listed');
select is((select location from public.list_upcoming_events() where id = (select id from fixtures where label = 'future')),
  'Spawn, survival world', 'the list carries the location');
select is((select image_path from public.list_upcoming_events() where id = (select id from fixtures where label = 'future')),
  'events/launch.png', 'the list carries the cover path');
select is((select count(*)::int from public.list_upcoming_events(1)), 1, 'the limit is honoured');

-- D9: an event with no ends_at is ended by its start, so this one is still open
-- only because ends_at is in the future.
select is((select count(*)::int from public.list_upcoming_events() where id = (select id from fixtures where label = 'soon')), 1,
  'an event that has started but has not ended is still upcoming');

-- The excerpt, not the whole description: the homepage has room for a line.
select is((select description_excerpt from public.list_upcoming_events() where id = (select id from fixtures where label = 'soon')),
  'Ends in an hour', 'a short description passes through whole');
select is((select description_excerpt from public.list_upcoming_events() where id = (select id from fixtures where label = 'future')),
  left((select description from public.events where name = 'Launch Night'), 140) || '…',
  'a long description is cut to 140 characters plus an ellipsis');

-- ------------------------------------------------------- the detail read (D6)

select is(public.get_event((select id from fixtures where label = 'future')) ->> 'name', 'Launch Night',
  'get_event names a published event');
select is((public.get_event((select id from fixtures where label = 'future')) ->> 'ended')::boolean, false,
  'a future event is not ended');
select is((public.get_event((select id from fixtures where label = 'past')) ->> 'ended')::boolean, true,
  'a past event reads as ended, so the page can say so instead of 404ing');
select is(public.get_event((select id from fixtures where label = 'draft')), null,
  'a draft is NOT_FOUND: the function returns no row at all');
select is(public.get_event('00000000-0000-0000-0000-0000000000ff'), null,
  'an unknown id is NOT_FOUND too, so the two are indistinguishable');

-- D7/PDPA: the public surface is a count and a boolean about the reader.
select is(public.get_event((select id from fixtures where label = 'future')) ->> 'me_interested', 'false',
  'me_interested is false when nobody has marked interest');

-- ------------------------------------------------------------- the toggle

select pg_temp.login('00000000-0000-0000-0000-000000000003');
select is(public.set_event_interest((select id from fixtures where label = 'future'), true), true,
  'a player can mark themselves interested');
select throws_ok($$ select public.admin_list_event_interests((select id from fixtures where label = 'future')) $$,
  'P0001', 'FORBIDDEN', 'a plain player cannot list who is interested');
select is((select count(*)::int from public.event_interests), 1, 'one row was written');
select is(public.get_event((select id from fixtures where label = 'future')) ->> 'me_interested', 'true',
  'get_event reports the caller as interested');
select is((select interest_count from public.list_upcoming_events() where name = 'Launch Night'), 1,
  'the public count follows the toggle');

-- Marking twice is the same row, and unmarking is a delete (D7).
select lives_ok($$ select public.set_event_interest((select id from fixtures where label = 'future'), true) $$,
  'marking interested twice is accepted');
select is((select count(*)::int from public.event_interests), 1, 'marking twice does not duplicate the row');
select is(public.set_event_interest((select id from fixtures where label = 'future'), false), false,
  'a player can take it back');
select is((select count(*)::int from public.event_interests), 0, 'unmarking removes the row');
select lives_ok($$ select public.set_event_interest((select id from fixtures where label = 'future'), false) $$,
  'unmarking twice is accepted');
select is((select count(*)::int from public.event_interests), 0, 'unmarking twice is still nothing to remove');

-- A second player is a second row, and the count is theirs too.
select pg_temp.login('00000000-0000-0000-0000-000000000004');
select public.set_event_interest((select id from fixtures where label = 'future'), true);
select is((select interest_count from public.list_upcoming_events() where name = 'Launch Night'), 1,
  'the count is per event, not per viewer');
select is((public.get_event((select id from fixtures where label = 'future')) ->> 'interest_count')::int, 1,
  'the detail read agrees on the count');

-- An event with no ends_at is still open until it starts.
select is(public.set_event_interest((select id from fixtures where label = 'soon'), true), true,
  'an ongoing event can still be marked');

-- Ended and draft, two different failures so the page can say which.
select throws_ok($$ select public.set_event_interest((select id from fixtures where label = 'past'), true) $$,
  'P0001', 'EVENT_ENDED', 'a finished event refuses new interest');
select throws_ok($$ select public.set_event_interest((select id from fixtures where label = 'draft'), true) $$,
  'P0001', 'NOT_FOUND', 'a draft cannot be marked');
select throws_ok($$ select public.set_event_interest('00000000-0000-0000-0000-0000000000ff', true) $$,
  'P0001', 'NOT_FOUND', 'an unknown event cannot be marked');

-- The user id comes from the JWT: one player cannot mark for another, because
-- there is no argument that could say so.
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select is((select count(*)::int from public.event_interests where user_id = '00000000-0000-0000-0000-000000000003'), 0,
  'the other player''s interest is untouched');

-- ------------------------------------------------- the admin surface (D7)

select pg_temp.login('00000000-0000-0000-0000-000000000002');
select is((select count(*)::int from public.admin_list_event_interests((select id from fixtures where label = 'future'))), 1,
  'the admin sees one interested player');
select is((select display_name from public.admin_list_event_interests((select id from fixtures where label = 'future'))),
  'PlayerTwo', 'the interested list resolves the Discord name');
select is((select count(*)::int from public.admin_list_event_interests((select id from fixtures where label = 'draft'))), 0,
  'a draft event has no interested players');

-- D7/PDPA: the ids behind the count exist only here. get_event is checked by
-- its key names, so a future key cannot leak a user id by accident.
select ok(not exists (
    select 1 from jsonb_object_keys(public.get_event((select id from fixtures where label = 'future'))) as key(name)
    where key.name ilike '%user%')
  , 'get_event returns no user id');
select ok(not exists (
    select 1 from information_schema.columns
    where table_name = 'list_upcoming_events' and column_name ilike '%user%')
  , 'list_upcoming_events has no user column to return');

-- ------------------------------------------------------------- archive
select set_config('request.jwt.claims', '', true);
select ok(has_function_privilege('anon', 'public.list_past_events(integer)', 'EXECUTE'),
  'a logged-out visitor can read the past events list');
select is((select array_agg(name) from public.list_past_events()), array['Old Meetup'],
  'the archive lists only finished published events');
select is((select count(*)::int from public.list_past_events() where id = (select id from fixtures where label = 'draft')), 0,
  'a draft never reaches the archive');
select is((select count(*)::int from public.list_past_events() where id = (select id from fixtures where label = 'soon')), 0,
  'a running event is not in the archive yet');

select * from finish();

rollback;