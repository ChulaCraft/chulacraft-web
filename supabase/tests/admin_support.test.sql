-- Customer-support editing from 20261018000001_admin_support.sql.
begin;
select plan(13);

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'owner@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'admin@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'player@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'admin2@test.local');
update public.profiles set role = 'owner' where user_id = '00000000-0000-0000-0000-000000000001';
update public.profiles set role = 'admin' where user_id in ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004');

-- Players can't use any of it.
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select throws_ok($$ select public.admin_user_profile('00000000-0000-0000-0000-000000000003') $$, 'FORBIDDEN', 'players cannot read support data');
select throws_ok($$ select public.admin_update_profile('00000000-0000-0000-0000-000000000003', 'A', 'B', '', 'F', 'M', 'undergraduate') $$, 'FORBIDDEN', 'players cannot edit via the admin RPC');

select pg_temp.login('00000000-0000-0000-0000-000000000002');
select is(public.admin_user_profile('00000000-0000-0000-0000-000000000003') -> 'privacy' ->> 'profile', 'public', 'privacy defaults to public');

select lives_ok($$ select public.admin_update_profile('00000000-0000-0000-0000-000000000003', 'Ratchaphon', 'P', 'Kai', 'Faculty of Engineering', 'CEDT', 'undergraduate') $$, 'admin edits a player');
select is(public.admin_user_profile('00000000-0000-0000-0000-000000000003') ->> 'nickname', 'Kai', 'the edit is saved');
select is((select actor_user_id from public.account_change_log where target_user_id = '00000000-0000-0000-0000-000000000003' and field = 'nickname'),
  '00000000-0000-0000-0000-000000000002'::uuid, 'the change log names the admin');
select is((select source from public.account_change_log where target_user_id = '00000000-0000-0000-0000-000000000003' and field = 'nickname'), 'admin', 'and marks it as an admin change');
select is((select count(*)::int from public.account_change_log where target_user_id = '00000000-0000-0000-0000-000000000003' and field = 'study_level'), 1, 'study level change is logged');

select lives_ok($$ select public.admin_set_privacy('00000000-0000-0000-0000-000000000003', 'friends', 'private', 'public', 'friends') $$, 'admin sets privacy');
select is(public.admin_user_profile('00000000-0000-0000-0000-000000000003') -> 'privacy' ->> 'minecraft', 'private', 'privacy is saved');
select throws_ok($$ select public.admin_set_privacy('00000000-0000-0000-0000-000000000003', 'everyone', 'public', 'public', 'public') $$, 'INVALID_LEVEL', 'privacy levels are checked');

select throws_ok($$ select public.admin_update_profile('00000000-0000-0000-0000-000000000004', 'X', 'Y', '', 'F', 'M', null) $$, 'FORBIDDEN', 'admins cannot edit other admins');

select pg_temp.login('00000000-0000-0000-0000-000000000001');
select lives_ok($$ select public.admin_update_profile('00000000-0000-0000-0000-000000000004', 'X', 'Y', '', 'F', 'M', null) $$, 'owners can edit admins');

select * from finish();
rollback;
