-- Phase B from 20261007000001_social.sql: privacy, friends, blocks, search and
-- the player_card whitelist (AC 14, 16-22).
--
-- Plain asserts only, same shape as achievements.test.sql: a rolled-back
-- transaction, a pg_temp.login() impersonation helper, and rows written as
-- postgres so the definer functions are exercised the way PostgREST calls them.
--
-- The two tests worth reading first:
--   - the privacy matrix, which walks levels x viewers x fields, because a
--     single spot check would pass while can_view is wrong for one combination;
--   - the AC 21 value scan, which puts a real email, nickname, first name, last
--     name, Chula email and faculty on the target and then greps the whole card
--     for them.

begin;

select plan(164);

-- Nothing else in the way: these tables hold the fixtures this file asserts on.
delete from public.account_change_log;
delete from public.blocks;
delete from public.friendships;
delete from public.privacy_settings;
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

-- Six players:
--   3 target   - the profile being looked at (every personal field filled in)
--   4 friend   - accepted friend of the target
--   5 stranger - no relationship with the target
--   6 second friend of the target, whose own profile is private
--   7 blocker  - blocks the target (and everybody else is irrelevant to it)
--   8 nodisc   - no Discord identity at all
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'owner@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'admin@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'target@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'friend@test.local'),
  ('00000000-0000-0000-0000-000000000005', 'stranger@test.local'),
  ('00000000-0000-0000-0000-000000000006', 'shy@test.local'),
  ('00000000-0000-0000-0000-000000000007', 'blocker@test.local'),
  ('00000000-0000-0000-0000-000000000008', 'nodisc@test.local');

insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at) values
  ('d-1', '00000000-0000-0000-0000-000000000001', '{"full_name":"Owner"}', 'discord', now(), now()),
  ('d-2', '00000000-0000-0000-0000-000000000002', '{"full_name":"Admin"}', 'discord', now(), now()),
  ('d-3', '00000000-0000-0000-0000-000000000003', '{"full_name":"Target Name","avatar_url":"https://cdn.discordapp.com/avatars/3/a.png"}', 'discord', now(), now()),
  ('d-4', '00000000-0000-0000-0000-000000000004', '{"user_name":"FriendName","avatar_url":"https://cdn.discordapp.com/avatars/4/b.png"}', 'discord', now(), now()),
  ('d-5', '00000000-0000-0000-0000-000000000005', '{"name":"StrangerName"}', 'discord', now(), now()),
  ('d-6', '00000000-0000-0000-0000-000000000006', '{"full_name":"Shy Name"}', 'discord', now(), now()),
  ('d-7', '00000000-0000-0000-0000-000000000007', '{"full_name":"Blocker Name"}', 'discord', now(), now()),
  -- A Google identity carrying the display name in metadata: this is the shape
  -- a nickname-first implementation would leak from, so it is here on purpose.
  ('g-3', '00000000-0000-0000-0000-000000000003', '{"email":"target@gmail.test","full_name":"Metadata Name","nickname":"MetaNick"}', 'google', now(), now()),
  ('g-8', '00000000-0000-0000-0000-000000000008', '{"email":"nodisc@gmail.test","full_name":"Google Only Name"}', 'google', now(), now());

update public.profiles set role = 'owner' where user_id = '00000000-0000-0000-0000-000000000001';
update public.profiles set role = 'admin' where user_id = '00000000-0000-0000-0000-000000000002';
update public.profiles set role = 'user' where user_id = '00000000-0000-0000-0000-000000000003';

-- The target carries every value AC 21 forbids in a public payload.
update public.profiles set
  first_name = 'Realfirst', last_name = 'Reallast', nickname = 'ponytail',
  faculty = 'FacultyofEngineering', major = 'ComputerScience'
  where user_id = '00000000-0000-0000-0000-000000000003';

insert into public.chula_claims (user_id, google_sub, email, discord_id)
values ('00000000-0000-0000-0000-000000000003', 'g-3', '64010123@student.chula.ac.th', 'd-3');

insert into public.minecraft_registrations
  (user_id, discord_user_id, discord_username, minecraft_uuid, minecraft_username, minecraft_username_key, sync_status)
values ('00000000-0000-0000-0000-000000000003', 'd-3', 'Target Name', '30000000-0000-0000-0000-000000000003',
  'TargetMC', 'targetmc', 'synced');

-- Two friendships with the target: the accepted one the matrix uses as the
-- 'friend' viewer, and a pending one the target sent (so remove_friend has
-- something to cancel).
insert into public.friendships (requester_id, addressee_id, status) values
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'accepted'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', 'pending');

-- A published achievement for the target, so the achievements key has content.
select pg_temp.login('00000000-0000-0000-0000-000000000002');
create temporary table badge as
  select public.admin_upsert_achievement(null, 'Builder', 'Built the plaza', 'achievements/builder.png', 'published') as id;
select public.admin_award((select id from badge), null, date '2026-05-01',
  array['00000000-0000-0000-0000-000000000003']::uuid[]);

-- ------------------------------------------------------------- privileges

-- The whitelist and every helper behind it must stay unreachable, or any player
-- could read any other player's card for any viewer/target pair they liked.
select ok(not has_function_privilege('authenticated', 'public.player_card(uuid, uuid)', 'EXECUTE'),
  'players cannot call the card builder directly');
select ok(not has_function_privilege('authenticated', 'public.can_view(uuid, uuid, text)', 'EXECUTE'),
  'players cannot call the permission check directly');
select ok(not has_function_privilege('authenticated', 'public.privacy_level(uuid, text)', 'EXECUTE'),
  'players cannot read another player''s settings through privacy_level');
select ok(not has_function_privilege('authenticated', 'public.player_display_name(uuid)', 'EXECUTE'),
  'players cannot resolve names through player_display_name');
select ok(not has_function_privilege('authenticated', 'public.are_friends(uuid, uuid)', 'EXECUTE'),
  'players cannot probe the friendship graph through are_friends');
select ok(not has_function_privilege('authenticated', 'public.is_blocked_either(uuid, uuid)', 'EXECUTE'),
  'players cannot probe the block list through is_blocked_either');

select ok(not has_table_privilege('authenticated', 'public.friendships', 'SELECT,INSERT,UPDATE,DELETE'),
  'players cannot touch the friendships table');
select ok(not has_table_privilege('authenticated', 'public.blocks', 'SELECT,INSERT,UPDATE,DELETE'),
  'players cannot touch the blocks table');
select ok(not has_table_privilege('authenticated', 'public.privacy_settings', 'SELECT,INSERT,UPDATE,DELETE'),
  'players cannot touch the privacy_settings table');

-- Everything a player is meant to call is granted, and anon gets nothing (D1).
select ok(has_function_privilege('authenticated', 'public.search_players(text)', 'EXECUTE'),
  'a signed-in player can search');
select ok(has_function_privilege('authenticated', 'public.get_player_profile(uuid)', 'EXECUTE'),
  'a signed-in player can read a profile');
select ok(has_function_privilege('authenticated', 'public.my_social()', 'EXECUTE'),
  'a signed-in player can read their own social graph');
select ok(not has_function_privilege('anon', 'public.search_players(text)', 'EXECUTE'),
  'anonymous users cannot search');
select ok(not has_function_privilege('anon', 'public.get_player_profile(uuid)', 'EXECUTE'),
  'anonymous users cannot read a profile');

-- ------------------------------------------------------------ display names

select is(public.player_display_name('00000000-0000-0000-0000-000000000003'), 'Target Name',
  'the display name comes from the Discord identity');
select is(public.player_avatar('00000000-0000-0000-0000-000000000003'), 'https://cdn.discordapp.com/avatars/3/a.png',
  'the avatar comes from the Discord identity');
-- No Discord identity: the Google full_name in metadata is not a fallback, so
-- the honest literal is used instead of another account's name.
select is(public.player_display_name('00000000-0000-0000-0000-000000000008'), 'Player',
  'a player with no Discord identity is called Player');
select is(public.player_avatar('00000000-0000-0000-0000-000000000008'), null,
  'a player with no Discord identity has no avatar');
-- The fallback order inside the Discord identity: full_name wins over user_name.
select is(public.player_display_name('00000000-0000-0000-0000-000000000004'), 'FriendName',
  'user_name is used when there is no full_name');
select is(public.player_display_name('00000000-0000-0000-0000-000000000005'), 'StrangerName',
  'name is the last Discord fallback');

-- A user without a row at all is also 'Player', so a deleted identity cannot
-- raise or return NULL into a JSON key.
select is(public.player_display_name('00000000-0000-0000-0000-0000000000ee'), 'Player',
  'an unknown account is called Player');

-- ---------------------------------------------------------- AC 21: values

-- One user holding every value the plan forbids. The card is grepped whole,
-- not key by key, so a value hiding inside a nested section is caught too.
select pg_temp.login('00000000-0000-0000-0000-000000000005');
create temporary table stranger_card as
  select public.get_player_profile('00000000-0000-0000-0000-000000000003') as c;
select ok((select c::text from stranger_card) not like '%target@test.local%',
  'the login email is not in the card');
select ok((select c::text from stranger_card) not like '%target@gmail.test%',
  'a linked Google email is not in the card');
select ok((select c::text from stranger_card) not like '%ponytail%',
  'the profile nickname is not in the card');
select ok((select c::text from stranger_card) not like '%Realfirst%',
  'the first name is not in the card');
select ok((select c::text from stranger_card) not like '%Reallast%',
  'the last name is not in the card');
select ok((select c::text from stranger_card) not like '%64010123@student.chula.ac.th%',
  'the Chula email is not in the card');
select ok((select c::text from stranger_card) not like '%FacultyofEngineering%',
  'the faculty is not in the card');
select ok((select c::text from stranger_card) not like '%ComputerScience%',
  'the major is not in the card');
select ok((select c::text from stranger_card) not like '%Metadata Name%',
  'the name in another provider''s metadata is not used as the display name');

-- The key set is pinned as a whitelist: a new key has to be a decision, not a
-- side effect of widening a jsonb_build_object.
-- jsonb keys come back in jsonb order (length, then bytes), so both sides of
-- this comparison are cast to text and sorted alphabetically.
select is((select array_agg(k::text order by k::text) from jsonb_object_keys((select c from stranger_card)) k),
  array['achievements', 'avatar_url', 'display_name', 'friend_count', 'friends',
        'hidden', 'minecraft_names', 'relationship', 'user_id'],
  'a fully public profile exposes exactly the whitelisted keys');

-- A hidden profile carries the five keys AC 20 allows and nothing else. The
-- friend is the viewer here, so this also pins that a private profile stays
-- hidden from somebody who is already a friend.
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select public.update_privacy('private', 'public', 'public', 'public');
select pg_temp.login('00000000-0000-0000-0000-000000000004');
create temporary table hidden_card as select public.get_player_profile('00000000-0000-0000-0000-000000000003') as c;
select is((select (c ->> 'hidden')::boolean from hidden_card), true, 'a private profile is hidden from an accepted friend too');
select is((select array_agg(k::text order by k::text) from jsonb_object_keys((select c from hidden_card)) k),
  array['avatar_url', 'display_name', 'hidden', 'relationship', 'user_id'],
  'a hidden profile exposes only the keys AC 20 allows');
select is((select c ->> 'display_name' from hidden_card), 'Target Name',
  'a hidden profile still shows the display name');

-- --------------------------------------------------------- the privacy matrix

-- Levels {public, friends, private} x viewer {self, friend, stranger} for every
-- field. can_view is the only gate, so this is where a wrong combination shows
-- up; the section key is what the page actually reads.
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select public.update_privacy('public', 'public', 'public', 'public');

select is((select (public.get_player_profile('00000000-0000-0000-0000-000000000003') ->> 'hidden')::boolean),
  false, 'matrix public/public: self sees the profile');
select is((select public.get_player_profile('00000000-0000-0000-0000-000000000003') ? 'minecraft_names'),
  true, 'matrix public/public: self sees the Minecraft names');
select is((select public.get_player_profile('00000000-0000-0000-0000-000000000003') ? 'achievements'),
  true, 'matrix public/public: self sees the achievements');
select is((select public.get_player_profile('00000000-0000-0000-0000-000000000003') ? 'friends'),
  true, 'matrix public/public: self sees the friend list');

select pg_temp.login('00000000-0000-0000-0000-000000000004');
select is((select public.get_player_profile('00000000-0000-0000-0000-000000000003') ? 'minecraft_names'),
  true, 'matrix public/public: a friend sees the Minecraft names');
select is((select public.get_player_profile('00000000-0000-0000-0000-000000000003') ? 'achievements'),
  true, 'matrix public/public: a friend sees the achievements');
select is((select public.get_player_profile('00000000-0000-0000-0000-000000000003') ? 'friends'),
  true, 'matrix public/public: a friend sees the friend list');

select pg_temp.login('00000000-0000-0000-0000-000000000005');
select is((select public.get_player_profile('00000000-0000-0000-0000-000000000003') ? 'minecraft_names'),
  true, 'matrix public/public: a stranger sees the Minecraft names');
select is((select public.get_player_profile('00000000-0000-0000-0000-000000000003') ? 'achievements'),
  true, 'matrix public/public: a stranger sees the achievements');
select is((select public.get_player_profile('00000000-0000-0000-0000-000000000003') ? 'friends'),
  true, 'matrix public/public: a stranger sees the friend list');

-- minecraft = friends
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select public.update_privacy('public', 'friends', 'public', 'public');
select is((select public.get_player_profile('00000000-0000-0000-0000-000000000003') ? 'minecraft_names'),
  true, 'matrix public/friends: self still sees their Minecraft names');
select pg_temp.login('00000000-0000-0000-0000-000000000004');
select is((select public.get_player_profile('00000000-0000-0000-0000-000000000003') ? 'minecraft_names'),
  true, 'matrix public/friends: a friend sees the Minecraft names');
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select is((select public.get_player_profile('00000000-0000-0000-0000-000000000003') ? 'minecraft_names'),
  false, 'matrix public/friends: a stranger does not see the Minecraft names');
select is((select public.get_player_profile('00000000-0000-0000-0000-000000000003') ? 'achievements'),
  true, 'matrix public/friends: the other fields stay visible to a stranger');

-- achievements = friends
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select public.update_privacy('public', 'public', 'friends', 'public');
select pg_temp.login('00000000-0000-0000-0000-000000000004');
select is((select public.get_player_profile('00000000-0000-0000-0000-000000000003') ? 'achievements'),
  true, 'matrix public/achievements=friends: a friend sees the badges');
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select is((select public.get_player_profile('00000000-0000-0000-0000-000000000003') ? 'achievements'),
  false, 'matrix public/achievements=friends: a stranger does not see the badges');
select is((select public.get_player_profile('00000000-0000-0000-0000-000000000003') ? 'minecraft_names'),
  true, 'matrix public/achievements=friends: the badges setting does not hide the Minecraft names');

-- friends = friends
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select public.update_privacy('public', 'public', 'public', 'friends');
select pg_temp.login('00000000-0000-0000-0000-000000000004');
select is((select public.get_player_profile('00000000-0000-0000-0000-000000000003') ? 'friends'),
  true, 'matrix public/friends=friends: a friend sees the friend list');
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select is((select public.get_player_profile('00000000-0000-0000-0000-000000000003') ? 'friends'),
  false, 'matrix public/friends=friends: a stranger does not see the friend list');

-- profile = friends: the profile-level setting is the most restrictive of the
-- two, so it hides every field for a stranger while friends and self are fine.
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select public.update_privacy('friends', 'public', 'public', 'public');
select is((select (public.get_player_profile('00000000-0000-0000-0000-000000000003') ->> 'hidden')::boolean),
  false, 'matrix profile=friends: self is never hidden by their own settings');
select pg_temp.login('00000000-0000-0000-0000-000000000004');
select is((select (public.get_player_profile('00000000-0000-0000-0000-000000000003') ->> 'hidden')::boolean),
  false, 'matrix profile=friends: an accepted friend is not hidden');
select is((select public.get_player_profile('00000000-0000-0000-0000-000000000003') ? 'minecraft_names'),
  true, 'matrix profile=friends: a friend sees the Minecraft names');
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select is((select (public.get_player_profile('00000000-0000-0000-0000-000000000003') ->> 'hidden')::boolean),
  true, 'matrix profile=friends: a stranger is hidden');
select is((select public.get_player_profile('00000000-0000-0000-0000-000000000003') ? 'minecraft_names'),
  false, 'matrix profile=friends: a hidden profile has no sections at all');

-- profile = private: nobody but the player themselves.
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select public.update_privacy('private', 'public', 'public', 'public');
select pg_temp.login('00000000-0000-0000-0000-000000000004');
select is((select (public.get_player_profile('00000000-0000-0000-0000-000000000003') ->> 'hidden')::boolean),
  true, 'matrix profile=private: even a friend is hidden');

-- minecraft = private: the field is gone for everyone but the owner, and the
-- profile itself stays visible.
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select public.update_privacy('public', 'private', 'public', 'public');
select pg_temp.login('00000000-0000-0000-0000-000000000004');
select is((select public.get_player_profile('00000000-0000-0000-0000-000000000003') ? 'minecraft_names'),
  false, 'matrix public/minecraft=private: a friend does not see the Minecraft names');
select is((select (public.get_player_profile('00000000-0000-0000-0000-000000000003') ->> 'hidden')::boolean),
  false, 'matrix public/minecraft=private: the profile itself is still visible');

-- A pending request is not friendship: the friends-only field stays hidden.
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select public.update_privacy('public', 'friends', 'public', 'public');
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select is((select public.get_player_profile('00000000-0000-0000-0000-000000000003') ? 'minecraft_names'),
  false, 'a pending request does not unlock a friends-only field');
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select public.update_privacy('public', 'public', 'public', 'public');

-- No settings row at all: everything is public (AC 19).
select is((select count(*)::int from public.privacy_settings where user_id = '00000000-0000-0000-0000-000000000006'), 0,
  'the second friend has no settings row');
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select is((select (public.get_player_profile('00000000-0000-0000-0000-000000000006') ->> 'hidden')::boolean),
  false, 'a profile with no settings row is public');
select is((select array_agg(k::text order by k::text) from jsonb_object_keys(public.get_player_profile('00000000-0000-0000-0000-000000000006')) k),
  array['achievements', 'avatar_url', 'display_name', 'friend_count', 'friends', 'hidden', 'minecraft_names', 'relationship', 'user_id'],
  'a profile with no settings row exposes every section');

-- update_privacy / my_privacy round trip, defaults, and the level check.
--
-- The "nothing saved yet" case is asked on the account that never touched a
-- setting: the hidden-profile fixture above is deliberately left alone here,
-- and the round trip runs on the friend instead.
select pg_temp.login('00000000-0000-0000-0000-000000000008');
select is(public.my_privacy(), '{"profile":"public","minecraft":"public","achievements":"public","friends":"public"}'::jsonb,
  'my_privacy reports the defaults before anything is saved');
select lives_ok($$ select public.update_privacy('friends', 'private', 'public', 'friends') $$,
  'a player can save a privacy mix');
select is(public.my_privacy(), '{"profile":"friends","minecraft":"private","achievements":"public","friends":"friends"}'::jsonb,
  'my_privacy reads back what was saved');
select lives_ok($$ select public.update_privacy('public', 'public', 'public', 'public') $$,
  'saving again updates the existing row rather than failing on the key');
select is((select count(*)::int from public.privacy_settings where user_id = '00000000-0000-0000-0000-000000000008'), 1,
  'saving twice leaves one row');
select throws_ok($$ select public.update_privacy('nope', 'public', 'public', 'public') $$, 'P0001', 'INVALID_LEVEL',
  'an unknown level is refused');
select throws_ok($$ select public.update_privacy('public', null, 'public', 'public') $$, 'P0001', 'INVALID_LEVEL',
  'a missing level is refused');
select throws_ok($$ insert into public.privacy_settings (user_id, profile) values ('00000000-0000-0000-0000-000000000008', 'everyone') $$,
  '23514', null, 'the column constraint refuses an unknown level too');

-- ------------------------------------------------------------ friend list

-- Two friends of the target: one visible, one whose own profile is private. The
-- list shows the first and omits the second — a friend of yours is not
-- automatically visible to whoever is reading your profile, you included.
insert into public.friendships (requester_id, addressee_id, status)
values ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000006', 'accepted')
on conflict do nothing;
insert into public.privacy_settings (user_id, profile) values ('00000000-0000-0000-0000-000000000006', 'private')
on conflict (user_id) do update set profile = 'private';

select pg_temp.login('00000000-0000-0000-0000-000000000003');
select is((select jsonb_array_length(c -> 'friends') from (select public.get_player_profile('00000000-0000-0000-0000-000000000003') c) t),
  1, 'the owner sees only the friend whose own profile is visible to them');
select pg_temp.login('00000000-0000-0000-0000-000000000004');
select is((select (c ->> 'friend_count')::int from (select public.get_player_profile('00000000-0000-0000-0000-000000000003') c) t), 1,
  'friend_count drops with the filtered list');
select is((select jsonb_array_length(c -> 'friends') from (select public.get_player_profile('00000000-0000-0000-0000-000000000003') c) t),
  1, 'a friend whose own profile is hidden is not listed');
select is((select f ->> 'display_name' from (select public.get_player_profile('00000000-0000-0000-0000-000000000003') c) t,
  jsonb_array_elements(t.c -> 'friends') f), 'FriendName', 'the visible friend is the one who is visible');
-- Each friend entry is three keys and no more: the list must not become a
-- second way to read somebody's card.
select is((select array_agg(k::text order by k::text) from jsonb_object_keys((select f from (select public.get_player_profile('00000000-0000-0000-0000-000000000003') c) t,
  jsonb_array_elements(t.c -> 'friends') f limit 1)) k),
  array['avatar_url', 'display_name', 'user_id'],
  'a friend entry is only a name, an avatar and an id');

-- ------------------------------------------------------------- search (AC 16, D2)

-- search_players returns one jsonb array, so a set-returning wrapper is what
-- lets an assert count or filter its rows in plain SQL.
create function pg_temp.hits(p_q text) returns setof jsonb language sql as $$
  select jsonb_array_elements(public.search_players(p_q));
$$;

select pg_temp.login('00000000-0000-0000-0000-000000000005');
select is((select count(*)::int from pg_temp.hits('Target') h
  where h ->> 'user_id' = '00000000-0000-0000-0000-000000000003'), 1,
  'a stranger finds a public profile by partial Discord name');
select is((select count(*)::int from pg_temp.hits('arget Nam') h
  where h ->> 'user_id' = '00000000-0000-0000-0000-000000000003'), 1,
  'the Discord name match is a substring match, not a prefix');
select is((select count(*)::int from pg_temp.hits('TargetMC') h
  where h ->> 'user_id' = '00000000-0000-0000-0000-000000000003'), 1,
  'a public profile is found by partial Minecraft name');
select is((select count(*)::int from pg_temp.hits('target') h
  where h ->> 'user_id' = '00000000-0000-0000-0000-000000000003'), 1,
  'the Minecraft name match is case-insensitive');
-- A hidden Minecraft field must not be probeable by substring (security review).
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select public.update_privacy('public', 'private', 'public', 'public');
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select is((select count(*)::int from pg_temp.hits('etMC') h where h ->> 'user_id' = '00000000-0000-0000-0000-000000000003'), 0,
  'a partial match on a hidden Minecraft name finds nothing');
select is((select count(*)::int from pg_temp.hits('targetmc') h where h ->> 'user_id' = '00000000-0000-0000-0000-000000000003'), 1,
  'the exact Minecraft name still finds the player (D2)');
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select public.update_privacy('public', 'public', 'public', 'public');
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select is((select count(*)::int from pg_temp.hits('Player') h
  where h ->> 'user_id' = '00000000-0000-0000-0000-000000000005'), 0,
  'the searcher is not in their own results');
select is((select count(*)::int from pg_temp.hits('T')), 0, 'a one-character query returns nothing');
select is((select count(*)::int from pg_temp.hits('  ')), 0, 'a blank query returns nothing');
select is((select count(*)::int from pg_temp.hits('%')), 0,
  'a wildcard is escaped, not honoured');
select is((select count(*)::int from pg_temp.hits('_')), 0,
  'a single underscore is too short and is not a wildcard');
-- The result rows are trimmed: a result needs a name and an avatar to render.
select is((select array_agg(k::text order by k::text) from jsonb_object_keys((select h from pg_temp.hits('Target') h limit 1)) k),
  array['avatar_url', 'display_name', 'hidden', 'relationship', 'user_id'],
  'a search result carries only the display keys');

-- Hidden profiles: exact Minecraft name only, unless the searcher is a friend.
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select public.update_privacy('private', 'private', 'private', 'private');
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select is((select count(*)::int from pg_temp.hits('Target') h
  where h ->> 'user_id' = '00000000-0000-0000-0000-000000000003'), 0,
  'a hidden profile is absent from a partial Discord-name search');
select is((select count(*)::int from pg_temp.hits('TargetM') h
  where h ->> 'user_id' = '00000000-0000-0000-0000-000000000003'), 0,
  'a hidden profile is absent from a partial Minecraft-name search');
select is((select count(*)::int from pg_temp.hits('TargetMC') h
  where h ->> 'user_id' = '00000000-0000-0000-0000-000000000003'), 1,
  'a hidden profile is found by an exact Minecraft name');
select is((select count(*)::int from pg_temp.hits('targetmc') h
  where h ->> 'user_id' = '00000000-0000-0000-0000-000000000003'), 1,
  'the exact Minecraft match ignores case');
-- An accepted friend of a hidden profile matches loosely again.
select pg_temp.login('00000000-0000-0000-0000-000000000004');
select is((select count(*)::int from pg_temp.hits('Target') h
  where h ->> 'user_id' = '00000000-0000-0000-0000-000000000003'), 1,
  'an accepted friend finds a hidden profile by partial Discord name');
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select is((select count(*)::int from pg_temp.hits('TargetMC') h
  where h ->> 'hidden' = 'true'), 1,
  'the exact-Minecraft hit on a hidden profile comes back flagged as hidden');

-- ------------------------------------------------------------ blocking (AC 18)

select pg_temp.login('00000000-0000-0000-0000-000000000007');
select is(public.block_player('00000000-0000-0000-0000-000000000003'), 1, 'a player can block somebody');
select throws_ok($$ select public.block_player('00000000-0000-0000-0000-000000000007') $$, 'P0001', 'INVALID_TARGET',
  'a player cannot block themselves');
select lives_ok($$ select public.block_player('00000000-0000-0000-0000-000000000003') $$,
  'blocking twice is idempotent');

-- Blocking removes the friendship, in either direction, pending or accepted.
select is((select count(*)::int from public.friendships
  where (requester_id = '00000000-0000-0000-0000-000000000007' and addressee_id = '00000000-0000-0000-0000-000000000003')
     or (requester_id = '00000000-0000-0000-0000-000000000003' and addressee_id = '00000000-0000-0000-0000-000000000007')),
  0, 'blocking removes the friendship rows');

-- The blocked player gets the same NOT_FOUND as a profile that does not exist.
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select throws_ok($$ select public.get_player_profile('00000000-0000-0000-0000-000000000007') $$, 'P0001', 'NOT_FOUND',
  'the blocked player cannot read the blocker profile');
select throws_ok($$ select public.get_player_profile('00000000-0000-0000-0000-0000000000ee') $$, 'P0001', 'NOT_FOUND',
  'an unknown profile is NOT_FOUND too');
select throws_ok($$ select public.send_friend_request('00000000-0000-0000-0000-000000000007') $$, 'P0001', 'NOT_FOUND',
  'the blocked player cannot send a request to the blocker');
select is((select count(*)::int from pg_temp.hits('Blocker') h
  where h ->> 'user_id' = '00000000-0000-0000-0000-000000000007'), 0,
  'the blocker is absent from the blocked player''s search results');
-- And the same in the other direction, so a block is symmetric from the outside.
select pg_temp.login('00000000-0000-0000-0000-000000000007');
select throws_ok($$ select public.get_player_profile('00000000-0000-0000-0000-000000000003') $$, 'P0001', 'NOT_FOUND',
  'the blocker cannot read the blocked player profile either');
select is((select count(*)::int from pg_temp.hits('TargetMC') h
  where h ->> 'user_id' = '00000000-0000-0000-0000-000000000003'), 0,
  'an exact Minecraft name does not reach a blocked player');
select throws_ok($$ select public.send_friend_request('00000000-0000-0000-0000-000000000003') $$, 'P0001', 'NOT_FOUND',
  'the blocker cannot send a request to the blocked player');
-- Even a hidden profile is out of reach: the block is checked before the card.
--
-- The friend (4) blocks the target (3), so this also covers the pending request
-- the target sent them earlier: one statement has to take out the accepted row
-- and the pending one.
select pg_temp.login('00000000-0000-0000-0000-000000000004');
select is(public.block_player('00000000-0000-0000-0000-000000000003'), 1,
  'blocking a friend removes the friendship too');
select is((select count(*)::int from public.friendships
  where (requester_id = '00000000-0000-0000-0000-000000000004' and addressee_id = '00000000-0000-0000-0000-000000000003')
     or (requester_id = '00000000-0000-0000-0000-000000000003' and addressee_id = '00000000-0000-0000-0000-000000000004')),
  0, 'both the accepted and the pending friendship are gone after the block');
select throws_ok($$ select public.send_friend_request('00000000-0000-0000-0000-000000000003') $$, 'P0001', 'NOT_FOUND',
  'the blocked side cannot send a request back');
select is(public.unblock_player('00000000-0000-0000-0000-000000000003'), 1, 'a player can unblock');
select is((select count(*)::int from public.blocks
  where blocker_id = '00000000-0000-0000-0000-000000000004' and blocked_id = '00000000-0000-0000-0000-000000000003'), 0,
  'the block row is gone');
select is((select count(*)::int from pg_temp.hits('TargetMC') h
  where h ->> 'user_id' = '00000000-0000-0000-0000-000000000003'), 1,
  'the unblocked player is findable again');

-- ------------------------------------------------- friend requests (AC 17)

-- The stranger (5) is the actor for this whole section, so every list my_social
-- returns at the end belongs to them.
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select throws_ok($$ select public.send_friend_request('00000000-0000-0000-0000-000000000005') $$, 'P0001', 'INVALID_TARGET',
  'a player cannot befriend themselves');
select is(public.send_friend_request('00000000-0000-0000-0000-000000000008'), 'pending', 'a request can be sent');
select is((select count(*)::int from jsonb_array_elements(public.my_social() -> 'outgoing') x
  where x ->> 'user_id' = '00000000-0000-0000-0000-000000000008'), 1, 'the pending request shows in the outgoing list');
select is(public.send_friend_request('00000000-0000-0000-0000-000000000008'), 'pending',
  'sending the same request again is idempotent');
select is((select count(*)::int from public.friendships
  where requester_id = '00000000-0000-0000-0000-000000000005' and addressee_id = '00000000-0000-0000-0000-000000000008'), 1,
  'and it did not create a second row');
select throws_ok($$ select public.send_friend_request('00000000-0000-0000-0000-0000000000ee') $$, 'P0001', 'NOT_FOUND',
  'a request to an account that does not exist fails');

-- The addressee sees it as incoming and can accept.
select pg_temp.login('00000000-0000-0000-0000-000000000008');
select is((select count(*)::int from jsonb_array_elements(public.my_social() -> 'incoming') x
  where x ->> 'user_id' = '00000000-0000-0000-0000-000000000005'), 1, 'the request shows in the incoming list');
select is(public.respond_friend_request('00000000-0000-0000-0000-000000000005', true), 1, 'a request can be accepted');
select is(public.are_friends('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000008'), true,
  'accepting makes them friends');
select throws_ok($$ select public.respond_friend_request('00000000-0000-0000-0000-000000000005', true) $$, 'P0001', 'NOT_FOUND',
  'the same request cannot be answered twice');
select is((select count(*)::int from jsonb_array_elements(public.my_social() -> 'incoming')), 0,
  'the incoming list is empty once it is answered');
select is((select count(*)::int from jsonb_array_elements(public.my_social() -> 'friends') x
  where x ->> 'user_id' = '00000000-0000-0000-0000-000000000005'), 1, 'the friend list has the new friend');

-- Already friends.
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select throws_ok($$ select public.send_friend_request('00000000-0000-0000-0000-000000000008') $$, 'P0001', 'ALREADY_FRIENDS',
  'a request to an existing friend is refused');

-- D4: the other side answering an already-pending request turns it into an
-- accepted friendship instead of a second, conflicting row.
select is(public.send_friend_request('00000000-0000-0000-0000-000000000006'), 'pending', 'a request to the shy player is sent');
select pg_temp.login('00000000-0000-0000-0000-000000000006');
select is(public.send_friend_request('00000000-0000-0000-0000-000000000005'), 'accepted',
  'the reverse of a pending request accepts it (D4)');
select is((select count(*)::int from public.friendships
  where ((requester_id = '00000000-0000-0000-0000-000000000005' and addressee_id = '00000000-0000-0000-0000-000000000006')
      or (requester_id = '00000000-0000-0000-0000-000000000006' and addressee_id = '00000000-0000-0000-0000-000000000005'))
    and status = 'accepted'), 1, 'the mutual request left exactly one accepted row');

-- Declining.
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select is(public.send_friend_request('00000000-0000-0000-0000-000000000002'), 'pending', 'a request to the admin is sent');
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select is(public.respond_friend_request('00000000-0000-0000-0000-000000000005', false), 1, 'a request can be declined');
select is((select count(*)::int from public.friendships
  where (requester_id = '00000000-0000-0000-0000-000000000005' and addressee_id = '00000000-0000-0000-0000-000000000002')
     or (requester_id = '00000000-0000-0000-0000-000000000002' and addressee_id = '00000000-0000-0000-0000-000000000005')), 0,
  'declining removes the row');
select throws_ok($$ select public.respond_friend_request('00000000-0000-0000-0000-000000000005', false) $$, 'P0001', 'NOT_FOUND',
  'a declined request cannot be declined again');

-- Only the addressee may answer.
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select is(public.send_friend_request('00000000-0000-0000-0000-000000000001'), 'pending', 'a request to the owner is sent');
select pg_temp.login('00000000-0000-0000-0000-000000000007');
select throws_ok($$ select public.respond_friend_request('00000000-0000-0000-0000-000000000005', true) $$, 'P0001', 'NOT_FOUND',
  'a third party cannot answer somebody else''s request');
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select is(public.remove_friend('00000000-0000-0000-0000-000000000001'), 1, 'the requester can cancel their request');
select throws_ok($$ select public.remove_friend('00000000-0000-0000-0000-000000000005') $$, 'P0001', 'INVALID_TARGET',
  'remove_friend refuses the caller themselves');
select is(public.remove_friend('00000000-0000-0000-0000-000000000001'), 0, 'cancelling twice is a no-op, not an error');

-- Either side can unfriend (AC 17).
select pg_temp.login('00000000-0000-0000-0000-000000000008');
select is(public.remove_friend('00000000-0000-0000-0000-000000000005'), 1, 'the other side can unfriend');
select is((select count(*)::int from jsonb_array_elements(public.my_social() -> 'friends')), 0, 'the friend list is empty again');

-- ------------------------------------------------- the outgoing-request cap

-- 50 waiting requests is the ceiling. The fixture is written as postgres so
-- the boundary is reached without 50 clicks, and it hangs off the account
-- (8) that has no other requests to muddy the count.
insert into auth.users (id, email)
select gen_random_uuid(), 'cap' || g || '@test.local' from generate_series(1, 50) g;
create temporary table capped as
  select u.id from auth.users u where u.email like 'cap%@test.local';
insert into public.friendships (requester_id, addressee_id, status)
select '00000000-0000-0000-0000-000000000008', c.id, 'pending' from capped c;

select pg_temp.login('00000000-0000-0000-0000-000000000008');
select throws_ok($$ select public.send_friend_request('00000000-0000-0000-0000-000000000001') $$, 'P0001', 'TOO_MANY_REQUESTS',
  'the 51st outgoing request is refused');
select is((select count(*)::int from jsonb_array_elements(public.my_social() -> 'outgoing')), 50,
  'the cap counts the requests already waiting, not the player');

-- Answering one frees a slot again, so the cap is a state and not a latch.
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select throws_ok($$ select public.respond_friend_request('00000000-0000-0000-0000-000000000008', true) $$, 'P0001', 'NOT_FOUND',
  'an unrelated addressee cannot answer somebody else''s request');
select pg_temp.login('00000000-0000-0000-0000-000000000008');
select is(public.remove_friend((select id from capped limit 1)), 1, 'the waiting request can be cancelled');
select is(public.send_friend_request('00000000-0000-0000-0000-000000000001'), 'pending',
  'a slot freed by cancelling can be used again');

-- ---------------------------------------------------- my_social, read back

-- The stranger's four lists, as the dashboard reads them: names come from the
-- Discord identity and nothing else.
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select is((select count(*)::int from jsonb_object_keys(public.my_social())), 4,
  'my_social has exactly the four lists the dashboard renders');
select is((select x ->> 'display_name' from jsonb_array_elements(public.my_social() -> 'friends') x limit 1), 'Shy Name',
  'the friend list resolves names from the Discord identity');
-- The target sent the stranger a request in the fixture and never answered it,
-- so it is the one thing my_social must report.
select is((select x ->> 'display_name' from jsonb_array_elements(public.my_social() -> 'incoming') x limit 1), 'Target Name',
  'the incoming list resolves names from the Discord identity');
select is((select count(*)::int from jsonb_array_elements(public.my_social() -> 'incoming')), 1,
  'a request the player never answered is still waiting');
select is((select count(*)::int from jsonb_array_elements(public.my_social() -> 'outgoing')), 0,
  'nothing is outgoing');
select is((select count(*)::int from jsonb_array_elements(public.my_social() -> 'blocked')), 0,
  'the blocked list is empty for a player who blocks nobody');

-- A player with no Discord identity is listed like anybody else, under the
-- fallback name, so a pending request is never an anonymous row. The 49 cap
-- fixtures have no identity either, so they cover it.
select pg_temp.login('00000000-0000-0000-0000-000000000008');
select is((select x ->> 'display_name' from jsonb_array_elements(public.my_social() -> 'outgoing') x
  where x ->> 'user_id' = '00000000-0000-0000-0000-000000000001'), 'Owner',
  'an outgoing request names the other player');
select is((select count(*)::int from jsonb_array_elements(public.my_social() -> 'outgoing') x
  where x ->> 'display_name' = 'Player'), 49,
  'every waiting request to a player with no Discord identity is listed as Player');
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select is(public.send_friend_request('00000000-0000-0000-0000-000000000008'), 'pending',
  'a request to the identity-less player can be sent');
select pg_temp.login('00000000-0000-0000-0000-000000000008');
select is((select x ->> 'display_name' from jsonb_array_elements(public.my_social() -> 'incoming') x
  where x ->> 'user_id' = '00000000-0000-0000-0000-000000000005'), 'StrangerName',
  'an incoming request names the other player, whoever is looking');
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select is(public.remove_friend('00000000-0000-0000-0000-000000000008'), 1, 'and the request can be cancelled again');

-- The blocked list, so the unblock branch is covered too.
select is(public.block_player('00000000-0000-0000-0000-000000000007'), 1, 'a block can be added at any time');
select is((select x ->> 'display_name' from jsonb_array_elements(public.my_social() -> 'blocked') x limit 1), 'Blocker Name',
  'the blocked list resolves names from the Discord identity');
select is(public.unblock_player('00000000-0000-0000-0000-000000000007'), 1, 'and it can be taken back');
select is((select count(*)::int from jsonb_array_elements(public.my_social() -> 'blocked')), 0,
  'unblocking empties the list');

-- ------------------------------------------------------- signed out is out

-- No JWT: the granted RPCs are the only entry point and they refuse an anon
-- call rather than quietly treating it as a stranger.
select set_config('request.jwt.claims', '{}', true);
select throws_ok($$ select public.search_players('Target') $$, 'P0001', 'FORBIDDEN', 'search needs a session');
select throws_ok($$ select public.get_player_profile('00000000-0000-0000-0000-000000000003') $$, 'P0001', 'FORBIDDEN',
  'reading a profile needs a session');
select throws_ok($$ select public.send_friend_request('00000000-0000-0000-0000-000000000003') $$, 'P0001', 'FORBIDDEN',
  'sending a request needs a session');
select throws_ok($$ select public.update_privacy('public', 'public', 'public', 'public') $$, 'P0001', 'FORBIDDEN',
  'saving settings needs a session');

select * from finish();

rollback;