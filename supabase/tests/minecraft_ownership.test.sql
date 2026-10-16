-- Minecraft account ownership transfer from 20261016000001_minecraft_ownership_transfer.sql.

begin;

select plan(11);

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'owner@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'a@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'b@test.local');
update public.profiles set role = 'owner' where user_id = '00000000-0000-0000-0000-000000000001';
update public.profiles set guest_verified_at = now() where user_id in ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004');
insert into auth.identities (user_id, provider, provider_id, identity_data) values
  ('00000000-0000-0000-0000-000000000003', 'discord', 'd-a', '{"full_name":"A"}'),
  ('00000000-0000-0000-0000-000000000004', 'discord', 'd-b', '{"full_name":"B"}');

select ok(not has_table_privilege('authenticated', 'public.minecraft_ownership_history', 'SELECT'), 'players cannot read ownership history');

-- A links OwnTest, B can't while A owns it.
select lives_ok($$ select * from public.add_minecraft_account('00000000-0000-0000-0000-000000000003', '7e570000-0000-4000-8000-0000000000aa', 'OwnTest') $$, 'A links OwnTest');
select throws_ok($$ select * from public.add_minecraft_account('00000000-0000-0000-0000-000000000004', '7e570000-0000-4000-8000-0000000000aa', 'OwnTest') $$,
  'REGISTRATION_CONFLICT', 'B cannot take an active account');

-- A unlinks; B takes over the same row and A goes into history.
select public.remove_minecraft_account('00000000-0000-0000-0000-000000000003',
  (select id from public.minecraft_registrations where minecraft_uuid = '7e570000-0000-4000-8000-0000000000aa'));
select lives_ok($$ select * from public.add_minecraft_account('00000000-0000-0000-0000-000000000004', '7e570000-0000-4000-8000-0000000000aa', 'OwnTest') $$, 'B links OwnTest after A unlinked');
select is((select count(*)::int from public.minecraft_registrations where minecraft_uuid = '7e570000-0000-4000-8000-0000000000aa'), 1, 'still one row per Minecraft account');
select is((select user_id::text || discord_user_id || is_active::text || desired_whitelisted::text from public.minecraft_registrations where minecraft_uuid = '7e570000-0000-4000-8000-0000000000aa'),
  '00000000-0000-0000-0000-000000000004d-btruetrue', 'the row now belongs to B and is whitelisted');
select is((select user_id::text || '>' || transferred_to::text from public.minecraft_ownership_history where minecraft_uuid = '7e570000-0000-4000-8000-0000000000aa'),
  '00000000-0000-0000-0000-000000000003>00000000-0000-0000-0000-000000000004', 'history records A handing over to B');
select throws_ok($$ select * from public.add_minecraft_account('00000000-0000-0000-0000-000000000003', '7e570000-0000-4000-8000-0000000000aa', 'OwnTest') $$,
  'REGISTRATION_CONFLICT', 'A cannot take it back while B owns it');

-- B unlinks; A takes it back, a second history entry.
select public.remove_minecraft_account('00000000-0000-0000-0000-000000000004',
  (select id from public.minecraft_registrations where minecraft_uuid = '7e570000-0000-4000-8000-0000000000aa'));
select lives_ok($$ select * from public.add_minecraft_account('00000000-0000-0000-0000-000000000003', '7e570000-0000-4000-8000-0000000000aa', 'OwnTest') $$, 'A re-links');
select is((select count(*)::int from public.minecraft_ownership_history where minecraft_uuid = '7e570000-0000-4000-8000-0000000000aa'), 2, 'every handover is kept');

-- An admin removal follows the Minecraft account to the next player.
select pg_temp.login('00000000-0000-0000-0000-000000000001');
select public.admin_set_whitelisted((select id from public.minecraft_registrations where minecraft_uuid = '7e570000-0000-4000-8000-0000000000aa'), false);
select public.remove_minecraft_account('00000000-0000-0000-0000-000000000003',
  (select id from public.minecraft_registrations where minecraft_uuid = '7e570000-0000-4000-8000-0000000000aa'));
select throws_ok($$ select * from public.add_minecraft_account('00000000-0000-0000-0000-000000000004', '7e570000-0000-4000-8000-0000000000aa', 'OwnTest') $$,
  'REGISTRATION_BLOCKED', 'admin-removed accounts stay blocked for other players');

select * from finish();
rollback;
