-- Banner design admin from 20261022000001_banner_admin.sql.
begin;
select plan(19);

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000003', 'player@test.local'),
  ('00000000-0000-0000-0000-000000000005', 'staff@test.local');
update public.profiles set role = 'event_staff' where user_id = '00000000-0000-0000-0000-000000000005';
create temporary table made (id text);
grant all on made to authenticated;

select pg_temp.login('00000000-0000-0000-0000-000000000003');
select throws_ok($$ select public.admin_save_banner(null, 'Mine', '{#000000,#111111,#222222,#333333}', 'color', null, null) $$, 'FORBIDDEN', 'players cannot create banners');

select pg_temp.login('00000000-0000-0000-0000-000000000005');
select throws_ok($$ select public.admin_save_banner(null, ' ', '{#000000,#111111,#222222,#333333}', 'color', null, null) $$, 'INVALID', 'a name is required');
select throws_ok($$ select public.admin_save_banner(null, 'Bad', '{#000000,#111111,#222222}', 'color', null, null) $$, 'INVALID', 'exactly four colours');
select throws_ok($$ select public.admin_save_banner(null, 'Bad', '{#000000,#111111,#222222,red}', 'color', null, null) $$, 'INVALID', 'colours are hex');
insert into made select public.admin_save_banner(null, ' Lava ', '{#AA0000,#bb1100,#cc2200,#dd3300}', 'color', null, null);
select is((select kind from public.banners where id = (select id from made)), 'unlock', 'new banners are unlockable');
select is((select colors from public.banners where id = (select id from made)), '{#aa0000,#bb1100,#cc2200,#dd3300}'::text[], 'colours are stored lower case');
select is((select name from public.banners where id = (select id from made)), 'Lava', 'name is trimmed');

select lives_ok($$ select public.admin_save_banner((select id from made), 'Magma', '{#000000,#111111,#222222,#333333}', 'color', null, null) $$, 'staff edit their banner');
select throws_ok($$ select public.admin_save_banner('dusk', 'Mine', '{#000000,#111111,#222222,#333333}', 'color', null, null) $$, 'DEFAULT_LOCKED', 'defaults cannot be edited');
select throws_ok($$ select public.admin_delete_banner('dusk') $$, 'DEFAULT_LOCKED', 'defaults cannot be deleted');

-- Someone using it falls back to the default when it is deleted.
select public.admin_grant_banner('00000000-0000-0000-0000-000000000003', (select id from made), true);
update public.profiles set banner_id = (select id from made) where user_id = '00000000-0000-0000-0000-000000000003';
select lives_ok($$ select public.admin_delete_banner((select id from made)) $$, 'staff delete a banner');
select is((select id from public.admin_user_banners('00000000-0000-0000-0000-000000000003') where selected), 'dusk', 'its users fall back to the default');
select is((select count(*)::int from public.account_change_log where entity = 'banners' and actor_user_id = '00000000-0000-0000-0000-000000000005'), 3, 'create, edit and delete are audited');

select throws_ok($$ select public.admin_save_banner(null, 'Pic', '{#000000,#111111,#222222,#333333}', 'picture', '../secret.png', null) $$, 'INVALID', 'picture paths stay under banners/');
delete from made;
insert into made select public.admin_save_banner(null, 'Pic', '{#000000,#111111,#222222,#333333}', 'picture', 'banners/00000000-0000-4000-8000-000000000001.webp', null);
select is((select image_path from public.banners where id = (select id from made)), 'banners/00000000-0000-4000-8000-000000000001.webp', 'a picture is stored');

select throws_ok($$ select public.admin_save_banner(null, 'X', '{#000000,#111111,#222222,#333333}', 'color', 'banners/00000000-0000-4000-8000-000000000001.webp', null) $$, 'INVALID', 'a colour banner has no file');
select throws_ok($$ select public.admin_save_banner(null, 'X', '{#000000,#111111,#222222,#333333}', 'picture', null, null) $$, 'INVALID', 'a picture banner needs its file');
select throws_ok($$ select public.admin_save_banner(null, 'X', '{#000000,#111111,#222222,#333333}', 'animated', 'banners/00000000-0000-4000-8000-000000000002.gif', null) $$, 'INVALID', 'an animated banner needs its still frame');
delete from made;
insert into made select public.admin_save_banner(null, 'Spin', '{#000000,#111111,#222222,#333333}', 'animated', 'banners/00000000-0000-4000-8000-000000000002.gif', 'banners/00000000-0000-4000-8000-000000000003.png');
select is((select style || ' ' || still_path from public.banners where id = (select id from made)), 'animated banners/00000000-0000-4000-8000-000000000003.png', 'an animated banner keeps its still frame');

select * from finish();
rollback;
