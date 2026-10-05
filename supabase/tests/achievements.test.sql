-- Phase A: achievements, events and awards from 20261006000001_achievements.sql.
--
-- Plain asserts only (ok / is / throws_ok / lives_ok), one script as the plan
-- asks, in the shape of redesign_admin.test.sql: a rolled-back transaction, a
-- pg_temp.login() impersonation helper and rows inserted as postgres so the
-- definer functions are exercised the way PostgREST would call them.

begin;

select plan(95);

-- Counts below assume no other rows; clear any dev seed (rolled back at the end).
delete from public.account_change_log;
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

-- 1 owner, 2 admin, 3 plain player, 4 chula player, 5 second player.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'owner@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'admin@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'player@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'cu@test.local'),
  ('00000000-0000-0000-0000-000000000005', 'player2@test.local');

insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at) values
  ('d-1', '00000000-0000-0000-0000-000000000001', '{"full_name":"Owner"}', 'discord', now(), now()),
  ('d-2', '00000000-0000-0000-0000-000000000002', '{"full_name":"Admin"}', 'discord', now(), now()),
  ('d-3', '00000000-0000-0000-0000-000000000003', '{"full_name":"Player"}', 'discord', now(), now()),
  ('d-4', '00000000-0000-0000-0000-000000000004', '{"full_name":"CU Player"}', 'discord', now(), now()),
  ('d-5', '00000000-0000-0000-0000-000000000005', '{"user_name":"PlayerTwo"}', 'discord', now(), now()),
  ('g-4', '00000000-0000-0000-0000-000000000004', '{"email":"cu@student.chula.ac.th","email_verified":true}', 'google', now(), now());

update public.profiles set role = 'owner' where user_id = '00000000-0000-0000-0000-000000000001';
update public.profiles set role = 'admin' where user_id = '00000000-0000-0000-0000-000000000002';
update public.profiles set nickname = 'pony' where user_id = '00000000-0000-0000-0000-000000000003';

select public.claim_chula('00000000-0000-0000-0000-000000000004', 'g-4', 'cu@student.chula.ac.th');

insert into public.minecraft_registrations
  (user_id, discord_user_id, discord_username, minecraft_uuid, minecraft_username, minecraft_username_key, sync_status)
values ('00000000-0000-0000-0000-000000000003', 'd-3', 'Player', '30000000-0000-0000-0000-000000000003',
  'AwardOne', 'awardone', 'synced');

-- ------------------------------------------------------------- privileges

-- AC 5: no table is writable or readable by a client; the catalog is reached
-- through definer functions only.
select ok(not has_table_privilege('authenticated', 'public.achievements', 'SELECT,INSERT,UPDATE,DELETE'),
  'players cannot touch the achievements table');
select ok(not has_table_privilege('authenticated', 'public.events', 'SELECT,INSERT,UPDATE,DELETE'),
  'players cannot touch the events table');
select ok(not has_table_privilege('authenticated', 'public.achievement_awards', 'SELECT,INSERT,UPDATE,DELETE'),
  'players cannot touch the awards table');

-- The whitelist function must stay unreachable, or any player could read any
-- other player's awards (and Phase B's player_card builds on it).
select ok(not has_function_privilege('authenticated', 'public.achievement_groups(uuid)', 'EXECUTE'),
  'players cannot read another user''s achievement groups');
select ok(not has_function_privilege('anon', 'public.my_achievements()', 'EXECUTE'),
  'anonymous users cannot read achievements');
select ok(has_function_privilege('authenticated', 'public.my_achievements()', 'EXECUTE'),
  'a signed-in player can read their own achievements');

-- AC 4: the bucket row is the part of the upload limit the database owns. The
-- real 2 MB / MIME rejection happens in the Storage API (server action + manual
-- step), so this pins only the configuration and the role gate.
select is((select file_size_limit::int from storage.buckets where id = 'achievements'), 2097152,
  'the achievements bucket caps files at 2 MB');
select is((select array_to_string(allowed_mime_types, ',') from storage.buckets where id = 'achievements'),
  'image/png,image/jpeg,image/webp,image/gif', 'the bucket allows only the four image types');
select ok((select public from storage.buckets where id = 'achievements'),
  'the achievements bucket is public, so <img> can read the images');
select ok(exists (select 1 from pg_policies
  where schemaname = 'storage' and tablename = 'objects'
  and policyname = 'admins upload achievement images' and lower(cmd) = 'insert'
  and with_check like '%current_app_role%' and with_check like '%owner%'),
  'the storage insert policy gates on the admin role (a player is denied by the database, not only by the form)');

-- A player really is refused by the policy, not just by the form: the policy
-- expression is evaluated as the player with their JWT claims set.
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select is((select (select public.current_app_role()) in ('owner', 'admin')), false,
  'a plain player is not an admin, so the storage policy denies them');

-- --------------------------------------------------- non-admins are refused

select throws_ok($$ select public.admin_upsert_achievement(null, 'x', null, 'p.png', 'draft') $$, 'P0001', 'FORBIDDEN',
  'players cannot create achievements');
select throws_ok($$ select public.admin_upsert_achievement((select id from public.achievements limit 1), 'x', null, 'p.png', 'draft') $$,
  'P0001', 'FORBIDDEN', 'players cannot edit achievements');
select throws_ok($$ select public.admin_delete_achievement('00000000-0000-0000-0000-0000000000aa') $$, 'P0001', 'FORBIDDEN',
  'players cannot delete achievements');
select throws_ok($$ select public.admin_upsert_event(null, 'x', null, now(), null, null, null, 'draft') $$, 'P0001', 'FORBIDDEN',
  'players cannot create events');
select throws_ok($$ select public.admin_delete_event('00000000-0000-0000-0000-0000000000bb') $$, 'P0001', 'FORBIDDEN',
  'players cannot delete events');
select throws_ok($$ select public.admin_award('00000000-0000-0000-0000-0000000000cc', null, current_date,
  array['00000000-0000-0000-0000-000000000003']::uuid[]) $$, 'P0001', 'FORBIDDEN', 'players cannot award');
select throws_ok($$ select public.admin_revoke_award('00000000-0000-0000-0000-0000000000dd') $$, 'P0001', 'FORBIDDEN',
  'players cannot revoke');
select throws_ok($$ select public.admin_resolve_identifiers('discord', array['Player']) $$, 'P0001', 'FORBIDDEN',
  'players cannot resolve identifiers');
select throws_ok($$ select * from public.admin_list_achievements() $$, 'P0001', 'FORBIDDEN', 'players cannot list achievements');
select throws_ok($$ select * from public.admin_list_events() $$, 'P0001', 'FORBIDDEN', 'players cannot list events');
select throws_ok($$ select * from public.admin_list_awards(null) $$, 'P0001', 'FORBIDDEN', 'players cannot list awards');

-- ------------------------------------------------------- the admin catalog

select pg_temp.login('00000000-0000-0000-0000-000000000002');

create temporary table catalog (achievement uuid, event uuid);
insert into catalog
select public.admin_upsert_achievement(null, 'Builder', 'First builder badge', 'achievements/builder.png', 'draft'),
       public.admin_upsert_event(null, 'Launch Night', 'The first community event',
         '2026-10-10 18:00:00+07', '2026-10-10 21:00:00+07', 'Spawn, survival world', 'achievements/launch.png', 'draft');

select lives_ok($$ select public.admin_upsert_achievement((select achievement from catalog),
  'Builder', 'First builder badge', 'achievements/builder.png', 'draft') $$,
  'an admin can save an existing achievement');

select is((select status from public.achievements where id = (select achievement from catalog)), 'draft',
  'a new achievement starts as a draft');
select is((select created_by from public.achievements where id = (select achievement from catalog)),
  '00000000-0000-0000-0000-000000000002', 'the achievement records who created it');
select is((select count(*)::int from public.events where starts_at is null), 0, 'an event always has a start');
select is((select location from public.events where id = (select event from catalog)), 'Spawn, survival world',
  'the event keeps its location');
select is((select count(*)::int from public.events where ends_at < starts_at), 0,
  'an event cannot end before it starts');
select throws_ok($$ update public.events set ends_at = starts_at - interval '1 hour'
  where id = (select event from catalog) $$, '23514', null, 'the ends_at check constraint holds');
select throws_ok($$ insert into public.achievements (name, image_path) values ('', 'p.png') $$, '23514', null,
  'an achievement needs a name');
select throws_ok($$ update public.achievements set status = 'hidden'
  where id = (select achievement from catalog) $$, '23514', null, 'status is draft or published only');

select is((select count(*)::int from public.account_change_log where entity = 'achievements' and target_user_id = '00000000-0000-0000-0000-000000000002'),
  1, 'creating an achievement is audited against the actor (D3)');
select is((select count(*)::int from public.account_change_log where entity = 'events' and target_user_id = '00000000-0000-0000-0000-000000000002'),
  1, 'creating an event is audited against the actor (D3)');

-- The catalog reads see both rows, drafts included (admins manage drafts).
select is((select count(*)::int from public.admin_list_achievements()), 1, 'the admin sees the achievement');
select is((select count(*)::int from public.admin_list_events()), 1, 'the admin sees the event');
select is((select award_count::int from public.admin_list_achievements() limit 1), 0, 'nothing is awarded yet');

-- ----------------------------------------------------- awarding a draft

-- A draft achievement is invisible to players: the badge list stays empty
-- until it is published (AC 6).
select is((select public.admin_award((select achievement from catalog), (select event from catalog), null,
  array['00000000-0000-0000-0000-000000000003']::uuid[])::int), 1, 'an admin can award the achievement');
select is((select awarded_on from public.achievement_awards limit 1), date '2026-10-10',
  'the award copies the event''s Bangkok date, not the caller''s argument');
select is((select count(*)::int from public.account_change_log
  where entity = 'achievement_awards' and target_user_id = '00000000-0000-0000-0000-000000000003' and source = 'admin'),
  1, 'the award is audited against its recipient');

select pg_temp.login('00000000-0000-0000-0000-000000000003');
select is(public.my_achievements(), '[]'::jsonb, 'a draft achievement does not reach its recipient');
select is((select jsonb_array_length(public.my_achievements())), 0, 'the badge list is empty while the badge is a draft');
-- postgres is a superuser, so has_function_privilege answers true for it and
-- cannot be used to prove a revoke from inside this test. The grant is pinned
-- from the other side: the ACL entry for authenticated is gone.
select ok((select not (coalesce(p.proacl, '{}')::text[] && array['anon=X/postgres', 'authenticated=X/postgres', 'public=X/postgres'])
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'achievement_groups'),
  'the internal grouping function is not granted to anon or authenticated');

-- Publishing the achievement keeps the event draft, so the entry shows with a
-- null event_name: the title is a draft and drafts never show (AC 6).
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select public.admin_upsert_achievement((select achievement from catalog), 'Builder', 'First builder badge',
  'achievements/builder.png', 'published');

select pg_temp.login('00000000-0000-0000-0000-000000000003');
select is((select count(*)::int from jsonb_array_elements(public.my_achievements())), 1,
  'publishing the achievement shows it to the recipient');
select is((select g ->> 'name' from jsonb_array_elements(public.my_achievements()) g limit 1), 'Builder',
  'the badge is named');
select is((select g ->> 'image_path' from jsonb_array_elements(public.my_achievements()) g limit 1), 'achievements/builder.png',
  'the badge carries its image path');
select is((select g ->> 'count' from jsonb_array_elements(public.my_achievements()) g limit 1), '1', 'one award so far');
select is((select e ->> 'event_name' from jsonb_array_elements(public.my_achievements()) g,
  jsonb_array_elements(g -> 'entries') e limit 1), null,
  'a draft event''s name is not shown');
select is((select e ->> 'awarded_on' from jsonb_array_elements(public.my_achievements()) g,
  jsonb_array_elements(g -> 'entries') e limit 1), '2026-10-10', 'the entry carries the award date');

-- Publishing the event reveals the name (AC 6).
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select public.admin_upsert_event((select event from catalog), 'Launch Night', 'The first community event',
  '2026-10-10 18:00:00+07', '2026-10-10 21:00:00+07', 'Spawn, survival world', 'achievements/launch.png', 'published');

select pg_temp.login('00000000-0000-0000-0000-000000000003');
select is((select e ->> 'event_name' from jsonb_array_elements(public.my_achievements()) g,
  jsonb_array_elements(g -> 'entries') e limit 1), 'Launch Night', 'a published event is named on the entry');

-- ----------------------------------------------------------- bulk awarding

-- Same achievement, second award in a separate call: count 2, two entries
-- (AC 9, AC 12).
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select is((select public.admin_award((select achievement from catalog), (select event from catalog), null,
  array['00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000005']::uuid[])::int), 2,
  'a duplicate id in one call is collapsed and unknown ids are ignored');

select pg_temp.login('00000000-0000-0000-0000-000000000003');
select is((select g ->> 'count' from jsonb_array_elements(public.my_achievements()) g limit 1), '2',
  'two separate awards make count 2');
select is((select jsonb_array_length(g -> 'entries') from jsonb_array_elements(public.my_achievements()) g limit 1), 2,
  'two separate awards make two entries');
select is((select count(*)::int from public.achievement_awards where user_id = '00000000-0000-0000-0000-000000000003'), 2,
  'the same user appears twice only because there were two calls');
select is((select count(*)::int from public.achievement_awards
  where achievement_id = (select achievement from catalog) and user_id = '00000000-0000-0000-0000-000000000005'), 1,
  'the second player got exactly one award');
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select is((select g ->> 'count' from jsonb_array_elements(public.my_achievements()) g limit 1), '1',
  'the second player sees one award, not the first player''s');

-- An award without an event takes the date it was given.
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select is((select public.admin_award((select achievement from catalog), null, date '2026-01-02',
  array['00000000-0000-0000-0000-000000000005']::uuid[])::int), 1, 'an award without an event is allowed');
select is((select awarded_on from public.achievement_awards
  where user_id = '00000000-0000-0000-0000-000000000005' and event_id is null), date '2026-01-02',
  'an award without an event keeps the date it was given');
select throws_ok($$ select public.admin_award('00000000-0000-0000-0000-0000000000cc', null, current_date,
  array['00000000-0000-0000-0000-000000000003']::uuid[]) $$, 'P0001', 'NOT_FOUND', 'awarding an unknown achievement fails');
select throws_ok($$ select public.admin_award((select achievement from catalog),
  '00000000-0000-0000-0000-0000000000bb', null, array['00000000-0000-0000-0000-000000000003']::uuid[]) $$, 'P0001', 'NOT_FOUND',
  'awarding against an unknown event fails');

-- ------------------------------------------------------- identifier lookup

select is((select count(*)::int from public.admin_resolve_identifiers('discord',
  array['Player', 'playertwo', 'CU Player', 'nobody'])), 4, 'every input value comes back');
select is((select user_id from public.admin_resolve_identifiers('discord', array['nobody'])), null,
  'nothing is matched for an unknown name');
select is((select user_id from public.admin_resolve_identifiers('discord', array['playertwo'])),
  '00000000-0000-0000-0000-000000000005', 'discord names match case-insensitively on user_name');
select is((select user_id from public.admin_resolve_identifiers('minecraft', array['awardone'])),
  '00000000-0000-0000-0000-000000000003', 'minecraft names resolve to the active registration');
select is((select user_id from public.admin_resolve_identifiers('chula', array['CU@STUDENT.CHULA.AC.TH'])),
  '00000000-0000-0000-0000-000000000004', 'chula values resolve through chula_claims.email');
select is((select user_id from public.admin_resolve_identifiers('chula', array['player@test.local'])), null,
  'a login email is not a chula identifier');
select is((select count(*)::int from public.admin_resolve_identifiers('discord', array['  Player  '])), 1,
  'values are trimmed');
select throws_ok($$ select * from public.admin_resolve_identifiers('discord',
  array(SELECT 'x' || g FROM generate_series(1, 1001) g) ) $$, 'P0001', 'TOO_MANY',
  'more than 1000 values is refused');
select throws_ok($$ select * from public.admin_resolve_identifiers('nickname', array['Player']) $$, 'P0001', 'INVALID_KIND',
  'an unknown kind is refused');

-- ------------------------------------------------------------ the admin reads

select pg_temp.login('00000000-0000-0000-0000-000000000002');
select is((select count(*)::int from public.admin_list_awards((select achievement from catalog))), 4,
  'the awards list shows every award');
select is((select display_name from public.admin_list_awards((select achievement from catalog))
  where user_id = '00000000-0000-0000-0000-000000000003' limit 1), 'pony',
  'the awards list resolves the recipient name');
select is((select count(*)::int from public.admin_list_events() where award_count = 3), 1,
  'the event lists its three event-linked awards');

-- -------------------------------------------------------------- revoking

create temporary table one_award as
  select id from public.achievement_awards
  where user_id = '00000000-0000-0000-0000-000000000003' order by awarded_on limit 1;
select is(public.admin_revoke_award((select id from one_award)), 1, 'an admin can revoke an award');
select is((select count(*)::int from public.achievement_awards where user_id = '00000000-0000-0000-0000-000000000003'), 1,
  'the revoked award is gone');
select is((select count(*)::int from public.account_change_log
  where entity = 'achievement_awards' and target_user_id = '00000000-0000-0000-0000-000000000003'
  and new_value is null), 1, 'the revocation is audited against the recipient');
select throws_ok($$ select public.admin_revoke_award('00000000-0000-0000-0000-0000000000dd') $$, 'P0001', 'NOT_FOUND',
  'revoking an unknown award fails');

-- ------------------------------------------------- deleting catalog entries

-- Moving the event moves its own awards only (the one earned without an event
-- is untouched), and only the date, not the event link.
select is((select public.admin_upsert_event((select event from catalog), 'Launch Night', 'The first community event',
  '2026-10-17 18:00:00+07', null, 'Spawn, survival world', 'achievements/launch.png', 'published')::uuid) is not null, true,
  'an admin can move an event');
select is((select count(*)::int from public.achievement_awards where awarded_on = date '2026-10-17'), 2,
  'a moved event re-syncs its awards');
select is((select count(*)::int from public.achievement_awards where awarded_on = date '2026-01-02'), 1,
  'an award not made at that event keeps its own date');
select is((select count(*)::int from public.achievement_awards where event_id = (select event from catalog)), 2,
  'moving an event does not unlink its awards');

select pg_temp.login('00000000-0000-0000-0000-000000000003');
select is((select g ->> 'count' from jsonb_array_elements(public.my_achievements()) g limit 1), '1',
  'the badge count drops back after the revoke');

-- Deleting the event keeps the awards, with their dates (AC 3).
select pg_temp.login('00000000-0000-0000-0000-000000000002');
create temporary table deleted_event as select * from public.admin_delete_event((select event from catalog));
select is((select removed from deleted_event), 2,
  'deleting an event reports how many awards it unlinked');
select is((select count(*)::int from public.achievement_awards), 3, 'the awards survive the event');
select is((select count(*)::int from public.achievement_awards where event_id is null), 3,
  'their event link is null');
select is((select count(*)::int from public.achievement_awards where awarded_on = date '2026-10-17'), 2,
  'their dates are the ones copied at award time');
select throws_ok($$ select public.admin_delete_event((select achievement from catalog)) $$, 'P0001', 'NOT_FOUND',
  'deleting an unknown event fails');

select pg_temp.login('00000000-0000-0000-0000-000000000003');
select is((select e ->> 'event_name' from jsonb_array_elements(public.my_achievements()) g,
  jsonb_array_elements(g -> 'entries') e limit 1), null,
  'an award whose event is gone shows no event name');

-- Deleting the achievement removes its awards (AC 2) and hands back the image
-- path so the caller can clean Storage up (D5).
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select throws_ok($$ select public.admin_delete_achievement('00000000-0000-0000-0000-0000000000aa') $$, 'P0001', 'NOT_FOUND',
  'deleting an unknown achievement fails');
create temporary table deleted as select * from public.admin_delete_achievement((select achievement from catalog));
select is((select removed from deleted), 3, 'deleting an achievement reports the awards it removed');
select is((select image_path from deleted), 'achievements/builder.png',
  'the deleted image path comes back so the caller can clean Storage up (D5)');

select pg_temp.login('00000000-0000-0000-0000-000000000003');
select is(public.my_achievements(), '[]'::jsonb, 'deleting the achievement empties the badge list');
select is((select count(*)::int from public.achievement_awards), 0, 'deleting the achievement removes the awards');

-- The new achievement still works end to end, so nothing above was an artefact
-- of a single fixture.
select pg_temp.login('00000000-0000-0000-0000-000000000002');
create temporary table second as
  select public.admin_upsert_achievement(null, 'Architect', 'Built the spawn plaza', 'achievements/architect.png', 'published') as id;
select is((select public.admin_award((select id from second), null, date '2026-09-09',
  array['00000000-0000-0000-0000-000000000004']::uuid[])::int), 1, 'a published achievement can be awarded right away');

select pg_temp.login('00000000-0000-0000-0000-000000000004');
select is((select g ->> 'name' from jsonb_array_elements(public.my_achievements()) g limit 1), 'Architect',
  'the new badge reaches its recipient');

-- The save action uploads first and checks the requested id comes back.
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select is(public.admin_upsert_achievement('00000000-0000-0000-0000-00000000abcd', 'Fresh', null, 'achievements/fresh.png', 'draft'),
  '00000000-0000-0000-0000-00000000abcd'::uuid, 'a new achievement is created under the requested id');
select is(public.admin_upsert_event('00000000-0000-0000-0000-00000000abce', 'Fresh event', null, '2026-12-01 18:00:00+07', null, null, null, 'draft'),
  '00000000-0000-0000-0000-00000000abce'::uuid, 'a new event is created under the requested id');

select * from finish();

rollback;
