-- Gallery groups, team generations, site pages, announcement pictures and site
-- settings from 20261025000001_site_content.sql.
begin;
select plan(38);

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000003', 'player@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'target@test.local'),
  ('00000000-0000-0000-0000-000000000005', 'staff@test.local'),
  ('00000000-0000-0000-0000-000000000006', 'admin@test.local');
update public.profiles set role = 'event_staff' where user_id = '00000000-0000-0000-0000-000000000005';
update public.profiles set role = 'admin' where user_id = '00000000-0000-0000-0000-000000000006';
create temporary table made (id uuid, n text);
grant all on made to authenticated;

-- Tables are only reachable through the RPCs.
select is((select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname in ('gallery_groups', 'gallery_images', 'team_generations', 'team_members', 'site_pages', 'site_settings')
    and c.relrowsecurity), 6, 'RLS is on');
select ok(not has_table_privilege('anon', 'public.site_pages', 'select'), 'anon cannot read pages directly');

-- Gallery groups and pictures
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select throws_ok($$ select public.admin_save_gallery_group(null, 'Lobby', '') $$, 'FORBIDDEN', 'players cannot make groups');

select pg_temp.login('00000000-0000-0000-0000-000000000005');
select throws_ok($$ select public.admin_save_gallery_group(null, ' ', '') $$, 'INVALID', 'a group needs a name');
insert into made select public.admin_save_gallery_group(null, ' Lobby building day ', 'Week 1'), 'lobby';
insert into made select public.admin_save_gallery_group(null, 'Dragon fight', ''), 'dragon';
select is(array(select name from public.list_gallery_groups()), '{Lobby building day,Dragon fight}'::text[], 'groups in order, names trimmed');
select public.admin_move_gallery_group((select id from made where n = 'dragon'), true);
select is(array(select name from public.list_gallery_groups()), '{Dragon fight,Lobby building day}'::text[], 'groups move up');

select throws_ok($$ select public.admin_save_gallery_image(null, (select id from made where n = 'lobby'), '../x.webp', 'x', false) $$, 'INVALID', 'gallery paths stay under gallery/');
select throws_ok($$ select public.admin_save_gallery_image(null, (select id from made where n = 'lobby'), 'gallery/00000000-0000-4000-8000-000000000001.webp', ' ', false) $$, 'INVALID', 'alt text is required');
select throws_ok($$ select public.admin_save_gallery_image(null, gen_random_uuid(), 'gallery/00000000-0000-4000-8000-000000000001.webp', 'x', false) $$, 'NOT_FOUND', 'the group must exist');
insert into made select public.admin_save_gallery_image(null, (select id from made where n = 'lobby'), 'gallery/00000000-0000-4000-8000-00000000000' || i || '.webp', 'Shot ' || i, false), 'shot' || i
  from generate_series(1, 3) i;
select is(array(select alt from public.list_gallery() where group_id = (select id from made where n = 'lobby')), '{Shot 1,Shot 2,Shot 3}'::text[], 'new pictures go last in their group');
select public.admin_move_gallery_image((select id from made where n = 'shot3'), true);
select is(array(select alt from public.list_gallery() where group_id = (select id from made where n = 'lobby')), '{Shot 1,Shot 3,Shot 2}'::text[], 'pictures move within the group');
select public.admin_move_gallery_image((select id from made where n = 'shot1'), true);
select is(array(select alt from public.list_gallery() where group_id = (select id from made where n = 'lobby')), '{Shot 1,Shot 3,Shot 2}'::text[], 'moving the first up does nothing');
select public.admin_save_gallery_image((select id from made where n = 'shot2'), (select id from made where n = 'dragon'), null, 'Moved', true);
select is((select group_id from public.list_gallery() where alt = 'Moved'), (select id from made where n = 'dragon'), 'editing can move a picture to another group');
select is(public.admin_delete_gallery_image((select id from made where n = 'shot2')), 'gallery/00000000-0000-4000-8000-000000000002.webp', 'delete hands back the path');
select is(public.admin_delete_gallery_group((select id from made where n = 'lobby')),
  '{gallery/00000000-0000-4000-8000-000000000001.webp,gallery/00000000-0000-4000-8000-000000000003.webp}'::text[], 'deleting a group hands back its pictures');
select is((select count(*)::int from public.list_gallery()), 0, 'and removes them');

-- Team generations and members
insert into made select public.admin_save_team_generation(null, 'Gen 0'), 'gen0';
insert into made select public.admin_save_team_generation(null, 'Gen 1'), 'gen1';
select is(array(select name from public.list_team_generations()), '{Gen 0,Gen 1}'::text[], 'generations in order');
select throws_ok($$ select public.admin_save_team_member(null, (select id from made where n = 'gen0'), 'friend', 'A', '', '', null, null, null) $$, 'INVALID', 'section is board, member, contributor or sponsor');
select throws_ok($$ select public.admin_save_team_member(null, (select id from made where n = 'gen0'), 'board', 'A', '', '', 'gallery/00000000-0000-4000-8000-000000000001.webp', null, null) $$, 'INVALID', 'team photos stay under team/');
select throws_ok($$ select public.admin_save_team_member(null, (select id from made where n = 'gen0'), 'sponsor', 'A', '', '', null, null, 'http://x.example') $$, 'INVALID', 'links are https');
insert into made select public.admin_save_team_member(null, (select id from made where n = 'gen0'), 'board', ' Kai ', 'Head of Events', '', null, '00000000-0000-0000-0000-000000000006', null), 'kai';
insert into made select public.admin_save_team_member(null, (select id from made where n = 'gen0'), 'board', 'Mo', 'Head of Build', '', 'team/00000000-0000-4000-8000-000000000001.png', null, null), 'mo';
insert into made select public.admin_save_team_member(null, (select id from made where n = 'gen0'), 'sponsor', 'Cafe', '', '', null, null, 'https://cafe.example'), 'cafe';
select is(array(select name from public.list_team() where kind = 'board'), '{Kai,Mo}'::text[], 'names trimmed, in order');
select public.admin_move_team_member((select id from made where n = 'kai'), false);
select is(array(select name from public.list_team() where kind = 'board'), '{Mo,Kai}'::text[], 'members move within their section');
select public.admin_move_team_member((select id from made where n = 'cafe'), true);
select is((select count(*)::int from public.list_team() where kind = 'sponsor'), 1, 'moving the only sponsor changes nothing');
select public.admin_save_team_member((select id from made where n = 'kai'), (select id from made where n = 'gen1'), 'member', 'Kai', '', '', null, null, null);
select is((select generation_id from public.list_team() where name = 'Kai'), (select id from made where n = 'gen1'), 'a member can move to another generation');
select is(public.admin_delete_team_generation((select id from made where n = 'gen0')), '{team/00000000-0000-4000-8000-000000000001.png}'::text[], 'deleting a generation hands back its photos');
select is(array(select name from public.list_team()), '{Kai}'::text[], 'and removes its people');

-- Announcement picture
insert into public.announcements (id, title, body) values ('00000000-0000-4000-8000-0000000000a1', 'T', 'B');
select is(public.admin_set_announcement_image('00000000-0000-4000-8000-0000000000a1', 'announcements/00000000-0000-4000-8000-000000000001.jpg'), null, 'first picture replaces nothing');
select is(public.admin_set_announcement_image('00000000-0000-4000-8000-0000000000a1', null), 'announcements/00000000-0000-4000-8000-000000000001.jpg', 'removing hands back the old path');

-- Pages and settings: admins only.
select throws_ok($$ select public.admin_save_site_page('rules', 'x') $$, 'FORBIDDEN', 'event staff cannot edit pages');
select throws_ok($$ select public.admin_save_site_settings('{"home_kicker": "Hi"}') $$, 'FORBIDDEN', 'event staff cannot change settings');
select pg_temp.login('00000000-0000-0000-0000-000000000006');
select throws_ok($$ select public.admin_save_site_page('about', 'x') $$, 'INVALID', 'only known pages');
select public.admin_save_site_page('rules', ' ## Be kind ');
select is((select body from public.get_site_page('rules')), '## Be kind', 'pages are saved trimmed');
select public.admin_save_site_page('rules', '');
select is((select count(*)::int from public.get_site_page('rules')), 0, 'empty goes back to the built-in text');
select throws_ok($$ select public.admin_save_site_settings('{"nope": "x"}') $$, 'INVALID', 'unknown keys are refused');
select throws_ok($$ select public.admin_save_site_settings('{"discord_url": "https://evil.example/x"}') $$, 'INVALID', 'Discord link must be an invite');
select public.admin_save_site_settings('{"home_kicker": " Build at ", "reports_open": "false"}');
select is((select value from public.get_site_settings() where key = 'home_kicker'), 'Build at', 'values are trimmed');

-- Reports switch
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select throws_ok($$ select public.report_player('00000000-0000-0000-0000-000000000004', 'grief', 'broke my house twice', null) $$, 'REPORTS_CLOSED', 'reports off blocks new reports');
select pg_temp.login('00000000-0000-0000-0000-000000000006');
select public.admin_save_site_settings('{"reports_open": ""}');
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select lives_ok($$ select public.report_player('00000000-0000-0000-0000-000000000004', 'grief', 'broke my house twice', null) $$, 'reports reopen');

select * from finish();
rollback;
