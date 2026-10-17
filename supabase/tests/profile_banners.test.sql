-- Profile banners from 20261021000001_profile_banners.sql.
begin;
select plan(17);

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'owner@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'player@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'other@test.local'),
  ('00000000-0000-0000-0000-000000000005', 'staff@test.local');
update public.profiles set role = 'owner' where user_id = '00000000-0000-0000-0000-000000000001';
update public.profiles set role = 'event_staff' where user_id = '00000000-0000-0000-0000-000000000005';
insert into public.events (id, name, starts_at, status) values
  ('00000000-0000-0000-0000-0000000000e1', 'Halloween Build', now() - interval '2 day', 'published');
insert into public.achievements (id, name, image_path, status) values
  ('00000000-0000-0000-0000-0000000000a1', 'Spooky', 'a.png', 'published');

-- Player: defaults only, first default selected.
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select is((select array_agg(id order by id) from public.my_banners() where owned), array['dusk', 'ember', 'meadow', 'ocean'], 'a new player owns the four defaults');
select is((select id from public.my_banners() where selected), 'dusk', 'first default is selected');
select throws_ok($$ select public.set_my_banner('sakura') $$, 'NOT_OWNED', 'a locked banner cannot be chosen');
select lives_ok($$ select public.set_my_banner('ocean') $$, 'a default can be chosen');
select is((select colors from public.get_player_banner('00000000-0000-0000-0000-000000000003')), '{#33506e,#3d6283,#4a7697,#5a8aa8}'::text[], 'the choice is what others see');
select throws_ok($$ select public.admin_grant_banner('00000000-0000-0000-0000-000000000003', 'gold', true) $$, 'FORBIDDEN', 'players cannot grant');
select throws_ok($$ select public.admin_set_event_banner('00000000-0000-0000-0000-0000000000e1', 'nether') $$, 'FORBIDDEN', 'players cannot set an event banner');
select ok(not has_table_privilege('authenticated', 'public.banner_grants', 'INSERT'), 'no direct writes to grants');

-- Staff grant, and an event banner earned through an award.
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select throws_ok($$ select public.admin_grant_banner('00000000-0000-0000-0000-000000000003', 'dusk', true) $$, 'INVALID', 'defaults are not grantable');
select lives_ok($$ select public.admin_grant_banner('00000000-0000-0000-0000-000000000003', 'gold', true) $$, 'event staff grant a banner');
select lives_ok($$ select public.admin_set_event_banner('00000000-0000-0000-0000-0000000000e1', 'nether') $$, 'event staff set an event banner');
insert into public.achievement_awards (user_id, achievement_id, event_id, awarded_on) values
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', current_date);
select is((select array_agg(id order by id) from public.admin_user_banners('00000000-0000-0000-0000-000000000003') where kind = 'unlock' and owned), array['gold', 'nether'], 'grant and event award both unlock');
select is((select event_names from public.admin_user_banners('00000000-0000-0000-0000-000000000003') where id = 'nether'), array['Halloween Build'], 'the list names the event that rewards it');
select is((select count(*)::int from public.account_change_log where field in ('banner', 'reward_banner')), 2, 'grant and event banner are audited');

-- Revoking the grant takes the chosen banner away; the profile falls back.
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select lives_ok($$ select public.set_my_banner('gold') $$, 'an unlocked banner can be chosen');
select pg_temp.login('00000000-0000-0000-0000-000000000001');
select public.admin_grant_banner('00000000-0000-0000-0000-000000000003', 'gold', false);
select is((select id from public.admin_user_banners('00000000-0000-0000-0000-000000000003') where selected), 'dusk', 'a revoked banner falls back to the first default');

select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok($$ select * from public.get_player_banner('00000000-0000-0000-0000-000000000003') $$, '42501', null, 'anon cannot read banners');
reset role;

select * from finish();
rollback;
