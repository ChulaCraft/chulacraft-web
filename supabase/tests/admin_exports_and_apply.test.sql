-- v1.1 T1.2: export RPCs, player id list, award skip-existing, staged apply,
-- gallery cover (migrations 20261101000001..4).
begin;
select plan(63);

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.logn() returns bigint language sql as $$ select count(*) from public.account_change_log; $$;
-- The detail of the error a statement raises, or null.
create function pg_temp.detail_of(p_sql text) returns text language plpgsql as $$
declare d text;
begin
  execute p_sql;
  return null;
exception when others then
  get stacked diagnostics d = pg_exception_detail;
  return d;
end;
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'owner@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'admin@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'mod@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'staff@test.local'),
  ('00000000-0000-0000-0000-000000000005', 'player@test.local'),
  ('00000000-0000-0000-0000-000000000006', 'other@test.local');
update public.profiles set role = 'owner' where user_id = '00000000-0000-0000-0000-000000000001';
update public.profiles set role = 'admin' where user_id = '00000000-0000-0000-0000-000000000002';
update public.profiles set role = 'moderator' where user_id = '00000000-0000-0000-0000-000000000003';
update public.profiles set role = 'event_staff' where user_id = '00000000-0000-0000-0000-000000000004';

-- Seed more rows than PostgREST max_rows (1000) so "no limit" is meaningful.
insert into public.reports (reporter_id, target_user_id, category, details, status, created_at)
  select '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'other', 'Seeded report number ' || n, 'dismissed', now() - n * interval '1 minute'
  from generate_series(1, 1500) n;
insert into public.reports (reporter_id, target_user_id, category, details, status)
  values ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'grief', 'An open report here.', 'open');
insert into public.bans (id, user_id, reason) values ('7e570000-0000-4000-8000-0000000000b1', '00000000-0000-0000-0000-000000000005', 'seed');
insert into public.appeals (ban_id, user_id, message, status, decided_at)
  select '7e570000-0000-4000-8000-0000000000b1', '00000000-0000-0000-0000-000000000005', 'Seeded appeal number ' || n, 'rejected', now() - n * interval '1 minute'
  from generate_series(1, 1500) n;
insert into public.account_change_log (actor_user_id, target_user_id, entity, field, new_value, source, created_at)
  select '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'profiles', 'nickname', 'n' || n, 'admin', now() - n * interval '1 second'
  from generate_series(1, 1500) n;

-- Role gates: only owner and admin.
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select throws_ok($$ select * from public.admin_export_reports() $$, 'FORBIDDEN', 'moderator: no report export');
select throws_ok($$ select * from public.admin_export_appeals() $$, 'FORBIDDEN', 'moderator: no appeal export');
select throws_ok($$ select * from public.admin_export_audit() $$, 'FORBIDDEN', 'moderator: no audit export');
select lives_ok($$ select public.admin_list_player_ids() $$, 'moderator may list player ids (players_read)');
select pg_temp.login('00000000-0000-0000-0000-000000000004');
select throws_ok($$ select * from public.admin_export_reports() $$, 'FORBIDDEN', 'event staff: no report export');
select throws_ok($$ select * from public.admin_export_audit() $$, 'FORBIDDEN', 'event staff: no audit export');
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select throws_ok($$ select * from public.admin_export_appeals() $$, 'FORBIDDEN', 'player: no appeal export');
select throws_ok($$ select public.admin_list_player_ids() $$, 'FORBIDDEN', 'player: no id list');
select throws_ok($$ select public.admin_apply_player_changes('00000000-0000-0000-0000-000000000006', '[{"kind":"guest"}]') $$, 'FORBIDDEN', 'player: no staged apply');

-- No row limit, ids filter, status filter.
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select is((select count(*)::int from public.admin_export_reports()), 1501, 'reports export: all rows, none cut at 100/1000');
select is((select count(*)::int from public.admin_export_reports('open')), 1, 'reports export: status filter');
select is((select count(*)::int from public.admin_list_reports('dismissed')), 100, 'admin_list_reports still stops at 100');
select is((select count(*)::int from public.admin_export_reports(null, (select array_agg(id) from (select id from public.reports limit 2) x))), 2, 'reports export: ids filter');
select is((select count(*)::int from public.admin_export_appeals()), 1500, 'appeals export: all rows');
select is((select count(*)::int from public.admin_export_appeals('open')), 0, 'appeals export: status filter');
select is((select count(*)::int from public.admin_export_appeals(null, (select array_agg(id) from (select id from public.appeals limit 3) x))), 3, 'appeals export: ids filter');
select is((select count(*)::int from public.admin_export_audit(null, null, null, null, null, null, null, null, 5000)), 1000, 'audit export: one page is capped at 1000');
select is((select count(*)::int from public.admin_export_audit(p_actor => '00000000-0000-0000-0000-000000000002', p_limit => 1000)), 1000, 'audit export: actor filter');
select is((select count(*)::int from public.admin_export_audit(p_ids => (select array_agg(id) from (select id from public.account_change_log limit 4) x))), 4, 'audit export: ids filter');
-- Keyset walk reaches every row.
create temporary table walked (id uuid);
do $$
declare v_at timestamptz; v_id uuid; v_n int;
begin
  loop
    select count(*) into v_n from public.admin_export_audit(null, null, null, null, null, null, v_at, v_id, 400);
    exit when v_n = 0;
    insert into walked select id from public.admin_export_audit(null, null, null, null, null, null, v_at, v_id, 400);
    select min(x.created_at), (array_agg(x.id order by x.created_at, x.id))[1] into v_at, v_id
      from (select * from public.admin_export_audit(null, null, null, null, null, null, v_at, v_id, 400)) x
      where (x.created_at, x.id) = (select min_row.created_at, min_row.id from (select * from public.admin_export_audit(null, null, null, null, null, null, v_at, v_id, 400) order by created_at, id limit 1) min_row);
  end loop;
end $$;
select is((select count(distinct id)::int from walked), (select count(*)::int from public.account_change_log where source = 'admin'), 'audit export: keyset walk covers every row');

-- Player ids.
select is(cardinality(public.admin_list_player_ids()), 6, 'player ids: all players');
select is(cardinality(public.admin_list_player_ids('{"role":["moderator"]}')), 1, 'player ids: honours filters');
select is(cardinality(public.admin_list_player_ids('{}', 'player@')), 1, 'player ids: honours the search');
select throws_ok($$ select public.admin_list_player_ids('{"nope":1}') $$, 'INVALID', 'player ids: bad filter');
select is(array(select user_id from public.admin_list_players('{}', '', 'joined', true, 0, 1000) order by user_id),
  array(select unnest(public.admin_list_player_ids()) order by 1), 'admin_list_players and the id list agree');
select is((select total from public.admin_list_players('{}', '', 'joined', true, 0, 2) limit 1), 6::bigint, 'admin_list_players still reports the total');

-- Award skips players who already hold the achievement.
insert into public.achievements (id, name, image_path, status) values ('7e570000-0000-4000-8000-0000000000c1', 'Skippy', 'a.png', 'published');
select is(public.admin_award('7e570000-0000-4000-8000-0000000000c1', null, null, array['00000000-0000-0000-0000-000000000005'::uuid]), 1, 'first award inserts');
select is(public.admin_award('7e570000-0000-4000-8000-0000000000c1', null, null,
  array['00000000-0000-0000-0000-000000000005'::uuid, '00000000-0000-0000-0000-000000000006'::uuid, '00000000-0000-0000-0000-000000000006'::uuid]), 1, 're-award skips the holder, inserts only the new player');
select is((select count(*)::int from public.achievement_awards where achievement_id = '7e570000-0000-4000-8000-0000000000c1'), 2, 'no duplicate award rows');
select is(public.admin_award('7e570000-0000-4000-8000-0000000000c1', null, null, array['00000000-0000-0000-0000-000000000005'::uuid]), 0, 'a full repeat inserts nothing');

-- Staged apply: shape errors.
select throws_ok($$ select public.admin_apply_player_changes('00000000-0000-0000-0000-000000000006', '[]') $$, 'INVALID', 'empty list is refused');
select throws_ok($$ select public.admin_apply_player_changes('00000000-0000-0000-0000-000000000006', '[{"kind":"fly"}]') $$, 'INVALID', 'unknown kind is refused');
select throws_ok($$ select public.admin_apply_player_changes('00000000-0000-0000-0000-000000000006', '[{"kind":"guest"},{"kind":"guest"}]') $$, 'INVALID', 'a single-entry kind cannot repeat');

-- Role gate for the inner steps: a moderator is stopped by the existing RPC.
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select throws_ok($$ select public.admin_apply_player_changes('00000000-0000-0000-0000-000000000006', '[{"kind":"guest"}]') $$, 'FORBIDDEN', 'moderator: inner gate refuses');

-- Rollback: role is applied first, then a bad privacy level fails; nothing sticks.
select pg_temp.login('00000000-0000-0000-0000-000000000001');
select is(pg_temp.detail_of($$ select public.admin_apply_player_changes('00000000-0000-0000-0000-000000000006',
  '[{"kind":"privacy","profile":"bogus","minecraft":"public","achievements":"public","friends":"public"},{"kind":"role","role":"moderator"}]') $$),
  'privacy:00000000-0000-0000-0000-000000000006', 'failure names the control in detail');
create temporary table before_log as select pg_temp.logn() as n;
select throws_ok($$ select public.admin_apply_player_changes('00000000-0000-0000-0000-000000000006',
  '[{"kind":"privacy","profile":"bogus","minecraft":"public","achievements":"public","friends":"public"},{"kind":"role","role":"moderator"}]') $$,
  'INVALID_LEVEL', 'failing change re-raises its code');
select is((select role from public.profiles where user_id = '00000000-0000-0000-0000-000000000006'), 'user', 'rollback: role unchanged');
select is(pg_temp.logn(), (select n from before_log), 'rollback: no log row left');

-- Owner applies everything for a target, input out of order; D1a order holds.
update public.profiles set guest_verified_at = now() where user_id = '00000000-0000-0000-0000-000000000006';
insert into auth.identities (user_id, provider, provider_id, identity_data) values
  ('00000000-0000-0000-0000-000000000006', 'discord', 'd-6', '{"full_name":"Other"}');
select public.add_minecraft_account('00000000-0000-0000-0000-000000000006', '7e570000-0000-4000-8000-0000000000a1', 'OtherMiner');
update public.profiles set guest_verified_at = null where user_id = '00000000-0000-0000-0000-000000000006';
create temporary table l0 as select pg_temp.logn() as n;
select lives_ok($$ select public.admin_apply_player_changes('00000000-0000-0000-0000-000000000006', jsonb_build_array(
  jsonb_build_object('kind','privacy','profile','private','minecraft','public','achievements','public','friends','public'),
  jsonb_build_object('kind','banner','banner_id','sakura','grant',true),
  jsonb_build_object('kind','profile','first_name','Aa','last_name','Bb','nickname','','faculty','F','major','M','study_level',null),
  jsonb_build_object('kind','guest'),
  jsonb_build_object('kind','role','role','moderator'))) $$, 'owner applies a mixed review');
select is((select role from public.profiles where user_id = '00000000-0000-0000-0000-000000000006'), 'moderator', 'role changed');
select ok((select guest_verified_at is not null from public.profiles where user_id = '00000000-0000-0000-0000-000000000006'), 'guest applied after the role change');
select is((select count(*)::int from public.account_change_log where field = 'privacy_profile' and target_user_id = '00000000-0000-0000-0000-000000000006'), 1, 'privacy: one row for one changed level');
select is((select count(*)::int from public.account_change_log where entity = 'banner_grants' and target_user_id = '00000000-0000-0000-0000-000000000006'), 1, 'banner: one row');
select cmp_ok((select count(*)::int from public.account_change_log where entity = 'profiles' and field in ('first_name','last_name') and target_user_id = '00000000-0000-0000-0000-000000000006'), '=', 2, 'profile: one row per changed field');
select cmp_ok((pg_temp.logn() - (select n from l0))::int, '>=', 6, 'role + privacy + banner + profile + guest are all logged');

-- Admin actor demotes a moderator and stages a follow-up (D1a ordering).
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select throws_ok($$ select public.admin_mark_guest('00000000-0000-0000-0000-000000000003') $$, 'FORBIDDEN', 'admin cannot touch a moderator directly');
select lives_ok($$ select public.admin_apply_player_changes('00000000-0000-0000-0000-000000000003', '[{"kind":"ban","reason":"x","public_note":null,"expires_at":null},{"kind":"role","role":"user"}]') $$,
  'admin demotes a moderator then bans in one review');
select ok(public.is_banned('00000000-0000-0000-0000-000000000003'), 'ban applied after the demotion');

-- Gallery cover.
insert into public.gallery_groups (id, name) values ('7e570000-0000-4000-8000-0000000000d1', 'Group');
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select throws_ok($$ select public.admin_set_gallery_cover('7e570000-0000-4000-8000-0000000000d1', null) $$, 'FORBIDDEN', 'moderator cannot set a cover');
select pg_temp.login('00000000-0000-0000-0000-000000000004');
select throws_ok($$ select public.admin_set_gallery_cover('7e570000-0000-4000-8000-0000000000d1', 'x.png') $$, 'INVALID', 'cover path is validated');
select throws_ok($$ select public.admin_set_gallery_cover('7e570000-0000-4000-8000-0000000000ff', null) $$, 'NOT_FOUND', 'unknown group');
select is(public.admin_set_gallery_cover('7e570000-0000-4000-8000-0000000000d1', 'gallery/00000000-0000-4000-8000-000000000001.jpg'), null, 'first cover replaces nothing');
select is(public.admin_set_gallery_cover('7e570000-0000-4000-8000-0000000000d1', null), 'gallery/00000000-0000-4000-8000-000000000001.jpg', 'removing returns the old path');
select is((select cover_path from public.list_gallery_groups() where id = '7e570000-0000-4000-8000-0000000000d1'), null, 'list_gallery_groups exposes cover_path');

-- Ban, lift and whitelist rows (user 7), Chula reset plus guest (user 8).
reset role;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000007', 'seven@test.local'),
  ('00000000-0000-0000-0000-000000000008', 'eight@test.local');
update public.profiles set guest_verified_at = now() where user_id = '00000000-0000-0000-0000-000000000007';
insert into auth.identities (user_id, provider, provider_id, identity_data) values
  ('00000000-0000-0000-0000-000000000007', 'discord', 'd-7', '{"full_name":"Seven"}'),
  ('00000000-0000-0000-0000-000000000008', 'discord', 'd-8', '{"full_name":"Eight"}'),
  ('00000000-0000-0000-0000-000000000008', 'google', 'g-8', '{"email":"eight@chula.ac.th"}');
insert into public.chula_claims (user_id, google_sub, email, discord_id)
  values ('00000000-0000-0000-0000-000000000008', 'g-8', 'eight@chula.ac.th', 'd-8');
select public.add_minecraft_account('00000000-0000-0000-0000-000000000007', '7e570000-0000-4000-8000-0000000000a7', 'SevenMiner');
select pg_temp.login('00000000-0000-0000-0000-000000000001');
select public.admin_set_whitelisted((select id from public.minecraft_registrations where user_id = '00000000-0000-0000-0000-000000000007'), true);

create temporary table l1 as select pg_temp.logn() as n;
select lives_ok($$ select public.admin_apply_player_changes('00000000-0000-0000-0000-000000000007',
  '[{"kind":"ban","reason":"grief","public_note":null,"expires_at":null}]') $$, 'ban applied');
select is((pg_temp.logn() - (select n from l1))::int, 2, 'ban: 1 row + 1 per whitelisted registration');
create temporary table l2 as select pg_temp.logn() as n;
select lives_ok($$ select public.admin_apply_player_changes('00000000-0000-0000-0000-000000000007', jsonb_build_array(
  jsonb_build_object('kind','whitelist','registration_id',(select id from public.minecraft_registrations where user_id = '00000000-0000-0000-0000-000000000007'),'value',true),
  jsonb_build_object('kind','lift_ban','ban_id',(select id from public.bans where user_id = '00000000-0000-0000-0000-000000000007')))) $$,
  'lift then whitelist, input order reversed');
select ok(not public.is_banned('00000000-0000-0000-0000-000000000007'), 'ban lifted');
select cmp_ok((pg_temp.logn() - (select n from l2))::int, '>=', 1, 'lift_ban logs 1 + restored registrations, whitelist 0-2');
create temporary table l3 as select pg_temp.logn() as n;
select lives_ok($$ select public.admin_apply_player_changes('00000000-0000-0000-0000-000000000008', '[{"kind":"guest"},{"kind":"chula_reset"}]') $$,
  'reset plus guest in one review (reset runs first)');
select ok((select guest_verified_at is not null from public.profiles where user_id = '00000000-0000-0000-0000-000000000008'), 'the result is a guest');
select is((select count(*)::int from public.chula_claims where user_id = '00000000-0000-0000-0000-000000000008'), 0, 'the claim is gone');
select is((pg_temp.logn() - (select n from l3))::int, 2, 'chula_reset 1 row for the claim + guest 1 row');

select * from finish();
rollback;
