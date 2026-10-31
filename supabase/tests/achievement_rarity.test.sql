-- Badge tier, the Discord role allowlist and the showcase from
-- 20261026000001_achievement_rarity.sql.
begin;
select plan(31);

-- Start from an empty audit log so counts only see this test's rows.
delete from public.account_change_log;

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000002', 'admin@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'player@test.local'),
  ('00000000-0000-0000-0000-000000000005', 'staff@test.local');
update public.profiles set role = 'admin' where user_id = '00000000-0000-0000-0000-000000000002';
update public.profiles set role = 'event_staff' where user_id = '00000000-0000-0000-0000-000000000005';

-- a1..a4 published, a5 draft. Inserted without a tier, like the rows that
-- existed before the migration.
insert into public.achievements (id, name, image_path, status) values
  ('00000000-0000-0000-0000-0000000000a1', 'Builder', 'a.png', 'published'),
  ('00000000-0000-0000-0000-0000000000a2', 'Explorer', 'a.png', 'published'),
  ('00000000-0000-0000-0000-0000000000a3', 'Miner', 'a.png', 'published'),
  ('00000000-0000-0000-0000-0000000000a4', 'Farmer', 'a.png', 'published'),
  ('00000000-0000-0000-0000-0000000000a5', 'Secret', 'a.png', 'draft'),
  ('00000000-0000-0000-0000-0000000000a6', 'Unheld', 'a.png', 'published');
insert into public.achievement_awards (user_id, achievement_id, awarded_on)
  select '00000000-0000-0000-0000-000000000003', a, current_date
  from unnest('{00000000-0000-0000-0000-0000000000a1,00000000-0000-0000-0000-0000000000a2,00000000-0000-0000-0000-0000000000a3,00000000-0000-0000-0000-0000000000a4,00000000-0000-0000-0000-0000000000a5}'::uuid[]) a;

-- Tier default
select is((select tier from public.achievements where id = '00000000-0000-0000-0000-0000000000a1'), 'common', 'a badge saved without a tier is common');
select is((select count(*)::int from public.achievements where tier is null), 0, 'no badge is left without a tier');

-- Allowlist: owner/admin only.
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select throws_ok($$ select public.admin_save_discord_role('123456789012345678', 'Builder role') $$, 'FORBIDDEN', 'event staff cannot add an assignable role');
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select throws_ok($$ select public.admin_save_discord_role('12ab', 'Bad') $$, 'INVALID', 'role ids are Discord snowflakes');
select throws_ok($$ select public.admin_save_discord_role('123456789012345678', ' ') $$, 'INVALID', 'a role needs a label');
select lives_ok($$ select public.admin_save_discord_role(' 123456789012345678 ', ' Builder role ') $$, 'an admin adds an assignable role');
select lives_ok($$ select public.admin_save_discord_role('123456789012345678', 'Builders') $$, 'saving again renames it');
select is((select count(*)::int from public.account_change_log where entity = 'discord_assignable_roles'), 2, 'add and rename are audited');

select pg_temp.login('00000000-0000-0000-0000-000000000005');
select is((select array_agg(label) from public.admin_list_discord_roles()), '{Builders}'::text[], 'event staff read the list for the form');

-- Tier + role on a badge: community staff, allowlisted roles only.
select throws_ok($$ select public.admin_set_achievement_meta('00000000-0000-0000-0000-0000000000a1', 'mythic', null) $$, 'INVALID', 'unknown tiers are refused');
select throws_ok($$ select public.admin_set_achievement_meta('00000000-0000-0000-0000-0000000000a1', 'epic', '999999999999999999') $$, 'ROLE_NOT_ALLOWED', 'a role outside the allowlist is refused');
select throws_ok($$ select public.admin_set_achievement_meta(gen_random_uuid(), 'epic', null) $$, 'NOT_FOUND', 'the badge must exist');
select lives_ok($$ select public.admin_set_achievement_meta('00000000-0000-0000-0000-0000000000a1', 'epic', '123456789012345678') $$, 'event staff set a tier and an allowlisted role');
select is((select tier || ' ' || discord_role_id from public.admin_list_achievements() where id = '00000000-0000-0000-0000-0000000000a1'),
  'epic 123456789012345678', 'admin_list_achievements returns tier and role');
select is((select array_agg(field order by field) from public.account_change_log where entity = 'achievements' and entity_id = '00000000-0000-0000-0000-0000000000a1'),
  '{discord_role,tier}'::text[], 'both changed fields are audited');
select lives_ok($$ select public.admin_set_achievement_meta('00000000-0000-0000-0000-0000000000a1', 'epic', '123456789012345678') $$, 'saving the same values again is fine');
select is((select count(*)::int from public.account_change_log where entity = 'achievements' and entity_id = '00000000-0000-0000-0000-0000000000a1'), 2, 'and logs nothing new');
select public.admin_set_achievement_meta('00000000-0000-0000-0000-0000000000a2', 'legendary', null);

select pg_temp.login('00000000-0000-0000-0000-000000000002');
select throws_ok($$ select public.admin_delete_discord_role('123456789012345678') $$, 'IN_USE', 'a mapped role cannot be removed from the list');

select pg_temp.login('00000000-0000-0000-0000-000000000003');
select throws_ok($$ select public.admin_set_achievement_meta('00000000-0000-0000-0000-0000000000a1', 'common', null) $$, 'FORBIDDEN', 'players cannot set a tier');
select throws_ok($$ select * from public.admin_list_discord_roles() $$, 'FORBIDDEN', 'players cannot read the role list');

-- Showcase
select throws_ok($$ select public.set_my_showcase('{00000000-0000-0000-0000-0000000000a1,00000000-0000-0000-0000-0000000000a2,00000000-0000-0000-0000-0000000000a3,00000000-0000-0000-0000-0000000000a4}') $$,
  'INVALID', 'at most three picks');
select throws_ok($$ select public.set_my_showcase('{00000000-0000-0000-0000-0000000000a6}') $$, 'NOT_OWNED', 'only badges the player holds');
select throws_ok($$ select public.set_my_showcase('{00000000-0000-0000-0000-0000000000a5}') $$, 'NOT_OWNED', 'a draft badge cannot be picked');
select throws_ok($$ select public.set_my_showcase('{00000000-0000-0000-0000-0000000000a1,00000000-0000-0000-0000-0000000000a1}') $$, 'INVALID', 'no duplicate picks');
select lives_ok($$ select public.set_my_showcase('{00000000-0000-0000-0000-0000000000a3,00000000-0000-0000-0000-0000000000a1}') $$, 'a player picks two badges');
select is((select jsonb_object_agg(g ->> 'name', jsonb_build_array(g -> 'tier', g -> 'showcase_position'))
           from jsonb_array_elements(public.my_achievements()) g),
  '{"Builder": ["epic", 2], "Miner": ["common", 1], "Explorer": ["legendary", null], "Farmer": ["common", null]}'::jsonb,
  'groups carry tier and showcase position');
select public.set_my_showcase('{00000000-0000-0000-0000-0000000000a2}');
select is((select jsonb_object_agg(g ->> 'name', g -> 'showcase_position') from jsonb_array_elements(public.my_achievements()) g where g -> 'showcase_position' <> 'null'),
  '{"Explorer": 1}'::jsonb, 'saving replaces the whole set');
select public.set_my_showcase('{}');
select is((select count(*)::int from public.achievement_showcase where user_id = '00000000-0000-0000-0000-000000000003'), 0, 'an empty list clears the picks');

-- Direct table access
set local role authenticated;
select throws_ok($$ select * from public.achievement_showcase $$, '42501', null, 'players cannot read showcase rows directly');
select throws_ok($$ select * from public.discord_assignable_roles $$, '42501', null, 'players cannot read the allowlist directly');
reset role;
select ok(not has_function_privilege('anon', 'public.set_my_showcase(uuid[])', 'EXECUTE'), 'signed-out visitors cannot set a showcase');

select * from finish();
rollback;
