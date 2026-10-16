-- Moderator and event-staff roles from 20261019000001_staff_roles.sql.
begin;
select plan(39);

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'owner@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'admin@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'player@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'mod@test.local'),
  ('00000000-0000-0000-0000-000000000005', 'staff@test.local');
update public.profiles set role = 'owner' where user_id = '00000000-0000-0000-0000-000000000001';
update public.profiles set role = 'admin' where user_id = '00000000-0000-0000-0000-000000000002';

-- Only owners hand out the new roles.
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select throws_ok($$ select public.admin_set_role('00000000-0000-0000-0000-000000000004', 'moderator') $$, 'FORBIDDEN', 'admins cannot give roles');
select pg_temp.login('00000000-0000-0000-0000-000000000001');
select lives_ok($$ select public.admin_set_role('00000000-0000-0000-0000-000000000004', 'moderator') $$, 'owner makes a moderator');
select lives_ok($$ select public.admin_set_role('00000000-0000-0000-0000-000000000005', 'event_staff') $$, 'owner makes event staff');
select throws_ok($$ select public.admin_set_role('00000000-0000-0000-0000-000000000003', 'superuser') $$, 'INVALID_ROLE', 'unknown roles are rejected');

-- Moderator: players (read) + moderation.
select pg_temp.login('00000000-0000-0000-0000-000000000004');
select lives_ok($$ select * from public.admin_list_players() $$, 'moderator lists players');
select lives_ok($$ select public.admin_get_user('00000000-0000-0000-0000-000000000003') $$, 'moderator opens a player');
-- View only means no emails and no change history (those stay owner/admin).
select is(public.admin_get_user('00000000-0000-0000-0000-000000000003') -> 'user' ->> 'email', null, 'moderator: no account email');
select is(public.admin_get_user('00000000-0000-0000-0000-000000000003') -> 'log', '[]'::jsonb, 'moderator: no change log');
select is(public.admin_get_user('00000000-0000-0000-0000-000000000003') -> 'google', '[]'::jsonb, 'moderator: no Google emails');
select is((select count(*)::int from public.admin_list_players() where email is not null or chula_email is not null), 0, 'moderator: list has no emails');
select lives_ok($$ select * from public.admin_overview_stats() $$, 'moderator sees the overview numbers');
select lives_ok($$ select * from public.admin_list_reports('open') $$, 'moderator lists reports');
select lives_ok($$ select * from public.admin_list_appeals('pending') $$, 'moderator lists appeals');
select lives_ok($$ select public.admin_ban_user('00000000-0000-0000-0000-000000000003', 'griefing', null, null) $$, 'moderator bans a player');
select throws_ok($$ select public.admin_ban_user('00000000-0000-0000-0000-000000000005', 'x', null, null) $$, 'FORBIDDEN', 'moderator cannot ban staff');
select throws_ok($$ select * from public.admin_list_achievements() $$, 'FORBIDDEN', 'moderator: no community');
select throws_ok($$ select * from public.admin_audit_log(null, null, null, null, null, null, null, 10) $$, 'FORBIDDEN', 'moderator: no audit log');
select throws_ok($$ select public.admin_mark_guest('00000000-0000-0000-0000-000000000003') $$, 'FORBIDDEN', 'moderator: players are view only');
select throws_ok($$ select public.admin_update_profile('00000000-0000-0000-0000-000000000003', 'A', 'B', '', 'F', 'M', null) $$, 'FORBIDDEN', 'moderator: no support edits');

-- Event staff: players (read) + community.
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select lives_ok($$ select * from public.admin_list_players() $$, 'event staff lists players');
select lives_ok($$ select * from public.admin_list_achievements() $$, 'event staff lists achievements');
select lives_ok($$ select * from public.admin_list_events() $$, 'event staff lists events');
select lives_ok($$ select public.admin_upsert_announcement(null, 'Hi', 'Body', 'info', false, null, null, false) $$, 'event staff writes an announcement');
select lives_ok($$ select * from public.admin_resolve_identifiers('discord', array['x']) $$, 'event staff resolves award targets');
select throws_ok($$ select * from public.admin_list_reports('open') $$, 'FORBIDDEN', 'event staff: no moderation');
select throws_ok($$ select public.admin_lift_ban((select id from public.bans limit 1)) $$, 'FORBIDDEN', 'event staff cannot lift bans');
select throws_ok($$ select * from public.admin_audit_log(null, null, null, null, null, null, null, 10) $$, 'FORBIDDEN', 'event staff: no audit log');

-- Admins keep everything they had; players get nothing.
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select lives_ok($$ select * from public.admin_list_reports('open') $$, 'admin still moderates');
select is(public.admin_get_user('00000000-0000-0000-0000-000000000003') -> 'user' ->> 'email', 'player@test.local', 'admin still sees emails');
select ok((select count(*) from public.admin_list_players() where email is not null) > 0, 'admin list still has emails');
-- Admins can take a staff role away (not hand one out), so a rogue moderator doesn't need an owner.
select throws_ok($$ select public.admin_set_role('00000000-0000-0000-0000-000000000003', 'moderator') $$, 'FORBIDDEN', 'admins cannot promote');
select lives_ok($$ select public.admin_set_role('00000000-0000-0000-0000-000000000004', 'user') $$, 'admin demotes a moderator');
select throws_ok($$ select public.admin_set_role('00000000-0000-0000-0000-000000000001', 'user') $$, 'FORBIDDEN', 'admins cannot demote owners');
select lives_ok($$ select * from public.admin_list_achievements() $$, 'admin still runs community');
select lives_ok($$ select * from public.admin_audit_log(null, null, null, null, null, null, null, 10) $$, 'admin still reads the audit log');
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select throws_ok($$ select * from public.admin_list_players() $$, 'FORBIDDEN', 'players: no admin list');
select throws_ok($$ select * from public.admin_list_events() $$, 'FORBIDDEN', 'players: no community admin');

-- Staff show up under the role filter and in the Staff view.
select pg_temp.login('00000000-0000-0000-0000-000000000001');
select public.admin_set_role('00000000-0000-0000-0000-000000000004', 'moderator'); -- demoted by the admin above
select is((select array_agg(user_id order by user_id) from public.admin_list_players('{"role":["moderator","event_staff"]}')),
  array['00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005']::uuid[], 'role filter knows the new roles');

-- Nothing the migration meant to open still carries the old owner/admin-only check.
select is((select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = any (public.staff_area_functions())
    and (p.prosrc like '%not in (''owner'', ''admin'')%' or p.prosrc not like '%staff_can(%')), 0, 'every opened function uses staff_can');

select * from finish();
rollback;
