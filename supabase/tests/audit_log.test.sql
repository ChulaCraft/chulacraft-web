-- Admin audit log from 20261011000001_audit_log.sql: who can read it, what it
-- shows, filters, and keyset paging.

begin;

select plan(8);

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

delete from public.account_change_log;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000002', 'admin@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'player@test.local');
update public.profiles set role = 'admin' where user_id = '00000000-0000-0000-0000-000000000002';

insert into public.account_change_log (id, actor_user_id, target_user_id, entity, field, old_value, new_value, source, created_at) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'profiles', 'role', 'user', 'admin', 'admin', '2026-10-01 10:00+07'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'server_console', 'restart', null, 'survival', 'admin', '2026-10-02 10:00+07'),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'bans', 'banned', null, 'griefing', 'admin', '2026-10-03 10:00+07'),
  ('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'profiles', 'nickname', null, 'Mint', 'self', '2026-10-04 10:00+07');

select ok(not has_function_privilege('anon', 'public.admin_audit_log(uuid, uuid, text, timestamptz, timestamptz, timestamptz, uuid, int)', 'EXECUTE'),
  'signed-out visitors cannot read the audit log');

select pg_temp.login('00000000-0000-0000-0000-000000000003');
select throws_ok($$ select * from public.admin_audit_log() $$, 'FORBIDDEN', 'players cannot read the audit log');

select pg_temp.login('00000000-0000-0000-0000-000000000002');
select results_eq($$ select id from public.admin_audit_log() $$,
  $$ values ('00000000-0000-0000-0000-0000000000a3'::uuid), ('00000000-0000-0000-0000-0000000000a2'::uuid), ('00000000-0000-0000-0000-0000000000a1'::uuid) $$,
  'admins see admin actions newest first, not self edits');
select results_eq($$ select id from public.admin_audit_log(p_target := '00000000-0000-0000-0000-000000000003') $$,
  $$ values ('00000000-0000-0000-0000-0000000000a3'::uuid), ('00000000-0000-0000-0000-0000000000a1'::uuid) $$,
  'filters by target');
select results_eq($$ select id from public.admin_audit_log(p_entity := 'server_console') $$,
  $$ values ('00000000-0000-0000-0000-0000000000a2'::uuid) $$,
  'filters by entity');
select results_eq($$ select id from public.admin_audit_log(p_from := '2026-10-02 00:00+07', p_to := '2026-10-03 00:00+07') $$,
  $$ values ('00000000-0000-0000-0000-0000000000a2'::uuid) $$,
  'filters by date range');
select results_eq($$ select id from public.admin_audit_log(p_before_at := '2026-10-03 10:00+07', p_before_id := '00000000-0000-0000-0000-0000000000a3', p_limit := 1) $$,
  $$ values ('00000000-0000-0000-0000-0000000000a2'::uuid) $$,
  'pages with a keyset cursor');
select is((select actor_name is not null from public.admin_audit_log(p_limit := 1)), true,
  'resolves the actor display name');

select * from finish();
rollback;
