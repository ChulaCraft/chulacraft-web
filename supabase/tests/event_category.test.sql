-- Event categories from 20261020000001_event_category.sql.
begin;
select plan(9);

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'owner@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'player@test.local'),
  ('00000000-0000-0000-0000-000000000005', 'staff@test.local');
update public.profiles set role = 'owner' where user_id = '00000000-0000-0000-0000-000000000001';
update public.profiles set role = 'event_staff' where user_id = '00000000-0000-0000-0000-000000000005';
insert into public.events (id, name, starts_at, status) values
  ('00000000-0000-0000-0000-0000000000e1', 'Lobby Build Week', now() + interval '2 day', 'published');

select pg_temp.login('00000000-0000-0000-0000-000000000003');
select throws_ok($$ select public.admin_set_event_category('00000000-0000-0000-0000-0000000000e1', 'build') $$, 'FORBIDDEN', 'players cannot set a category');

select pg_temp.login('00000000-0000-0000-0000-000000000005');
select lives_ok($$ select public.admin_set_event_category('00000000-0000-0000-0000-0000000000e1', 'build') $$, 'event staff set a category');
select throws_ok($$ select public.admin_set_event_category('00000000-0000-0000-0000-0000000000e1', 'raid') $$, 'INVALID', 'unknown categories are rejected');
select throws_ok($$ select public.admin_set_event_category('00000000-0000-0000-0000-0000000000ff', 'build') $$, 'NOT_FOUND', 'missing event');
select is((select category from public.admin_list_events() where id = '00000000-0000-0000-0000-0000000000e1'), 'build', 'admin list returns it');

select set_config('request.jwt.claims', '', true);
set local role anon;
select is((select category from public.list_upcoming_events(12) where id = '00000000-0000-0000-0000-0000000000e1'), 'build', 'public upcoming list returns it');
select is(public.get_event('00000000-0000-0000-0000-0000000000e1') ->> 'category', 'build', 'event page returns it');
reset role;

select pg_temp.login('00000000-0000-0000-0000-000000000005');
select lives_ok($$ select public.admin_set_event_category('00000000-0000-0000-0000-0000000000e1', null) $$, 'category can be cleared');
select is((select category from public.events where id = '00000000-0000-0000-0000-0000000000e1'), null, 'cleared');

select * from finish();
rollback;
