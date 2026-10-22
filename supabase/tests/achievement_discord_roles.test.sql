-- Badge -> Discord role queue from 20261026000002_achievement_discord_roles.sql.
begin;
select plan(28);

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;
-- The queue as one sorted text array, e.g. {"remove d-4 R1","add d-3 R1"}.
create function pg_temp.queue() returns text[] language sql as $$
  select coalesce(array_agg(q.op || ' ' || q.discord_id || ' ' || q.role_id order by q.op desc, q.discord_id, q.role_id), '{}')
  from public.discord_role_queue() q;
$$;
create function pg_temp.done(p_discord text, p_role text, p_op text, p_ok boolean) returns integer language sql as $$
  select public.discord_role_queue_done(jsonb_build_array(jsonb_build_object(
    'discord_id', p_discord, 'role_id', p_role, 'op', p_op, 'ok', p_ok, 'error', case when not p_ok then 'Missing Permissions' end)));
$$;

-- The queue is global; dev rows would show up in it (rolled back at the end).
delete from public.discord_role_state;
delete from public.achievement_awards;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000002', 'admin@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'player@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'player2@test.local'),
  ('00000000-0000-0000-0000-000000000006', 'unlinked@test.local');
update public.profiles set role = 'admin' where user_id = '00000000-0000-0000-0000-000000000002';
insert into auth.identities (user_id, provider, provider_id, identity_data) values
  ('00000000-0000-0000-0000-000000000003', 'discord', 'd-3', '{"full_name":"Player"}'),
  ('00000000-0000-0000-0000-000000000004', 'discord', 'd-4', '{"full_name":"Player Two"}');
insert into public.discord_assignable_roles (role_id, label) values
  ('111111111111111111', 'R1'), ('222222222222222222', 'R2');
insert into public.achievements (id, name, image_path, status, discord_role_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Builder', 'a.png', 'published', '111111111111111111'),
  ('00000000-0000-0000-0000-0000000000a2', 'Explorer', 'a.png', 'published', null);

-- Privileges
select ok(has_function_privilege('service_role', 'public.discord_role_queue()', 'EXECUTE'), 'the bot reads the queue');
select ok(has_function_privilege('service_role', 'public.discord_role_queue_done(jsonb)', 'EXECUTE'), 'the bot writes back');
select ok(not has_function_privilege('anon', 'public.discord_role_queue()', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.discord_role_queue()', 'EXECUTE'), 'browsers cannot read the queue');
select ok(not has_function_privilege('anon', 'public.discord_role_queue_done(jsonb)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.discord_role_queue_done(jsonb)', 'EXECUTE'), 'browsers cannot write back');
select ok(not has_function_privilege('authenticated', 'public.discord_role_desired()', 'EXECUTE'), 'the desired set is internal');
select ok(not has_table_privilege('authenticated', 'public.discord_role_state', 'SELECT'), 'players cannot read the ledger');

-- Award, write back ok.
select pg_temp.login('00000000-0000-0000-0000-000000000002');
select public.admin_award('00000000-0000-0000-0000-0000000000a1', null, null, '{00000000-0000-0000-0000-000000000003}');
select public.admin_award('00000000-0000-0000-0000-0000000000a2', null, null, '{00000000-0000-0000-0000-000000000004}');
select public.admin_award('00000000-0000-0000-0000-0000000000a1', null, null, '{00000000-0000-0000-0000-000000000006}');
select is(pg_temp.queue(), '{"add d-3 111111111111111111"}', 'a mapped award queues one add; unmapped badges and unlinked players never show');
select is(pg_temp.done('d-3', '111111111111111111', 'add', true), 1, 'write-back counts its items');
select is(pg_temp.queue(), '{}', 'an ok add clears it');
select public.admin_award('00000000-0000-0000-0000-0000000000a1', null, null, '{00000000-0000-0000-0000-000000000003}');
select is(pg_temp.queue(), '{}', 'a second award of the same badge adds nothing');

-- Revokes
select public.admin_revoke_award((select id from public.achievement_awards
  where user_id = '00000000-0000-0000-0000-000000000003' order by created_at, id limit 1));
select is(pg_temp.queue(), '{}', 'revoking one of two awards changes nothing');
select public.admin_revoke_award((select id from public.achievement_awards
  where user_id = '00000000-0000-0000-0000-000000000003' and achievement_id = '00000000-0000-0000-0000-0000000000a1'));
select is(pg_temp.queue(), '{"remove d-3 111111111111111111"}', 'revoking the last one queues a remove');

-- Failed remove: still applied, held back until the retry is due.
select pg_temp.done('d-3', '111111111111111111', 'remove', false);
select is((select status || ' ' || attempts || ' ' || last_error from public.discord_role_state where discord_id = 'd-3'),
  'applied 1 Missing Permissions', 'a failed remove keeps the row applied and records the error');
select is(pg_temp.queue(), '{}', 'and hides the remove until retry_after');
update public.discord_role_state set retry_after = now() - interval '1 second' where discord_id = 'd-3';
select is(pg_temp.queue(), '{"remove d-3 111111111111111111"}', 'the remove comes back once the retry is due');
select pg_temp.done('d-3', '111111111111111111', 'remove', true);
select is((select count(*)::int from public.discord_role_state where discord_id = 'd-3'), 0, 'an ok remove deletes the row');

-- Failed add: held back, then back in the queue.
select public.admin_award('00000000-0000-0000-0000-0000000000a1', null, null, '{00000000-0000-0000-0000-000000000004}');
select pg_temp.done('d-4', '111111111111111111', 'add', false);
select is((select status from public.discord_role_state where discord_id = 'd-4'), 'failed', 'a failed add is recorded as failed');
select is(pg_temp.queue(), '{}', 'and hidden until retry_after');
update public.discord_role_state set retry_after = now() - interval '1 second' where discord_id = 'd-4';
select is(pg_temp.queue(), '{"add d-4 111111111111111111"}', 'the add returns once the retry is due');
select pg_temp.done('d-4', '111111111111111111', 'add', false);
select is((select attempts || ' ' || (retry_after = now() + interval '2 minutes')::text from public.discord_role_state where discord_id = 'd-4'),
  '2 true', 'each failure backs off further');
select pg_temp.done('d-4', '111111111111111111', 'add', true);
select is((select status || ' ' || attempts || ' ' || coalesce(retry_after::text, '-') from public.discord_role_state where discord_id = 'd-4'),
  'applied 0 -', 'an ok write-back resets the retry');

-- Drafting the badge removes its role.
update public.achievements set status = 'draft' where id = '00000000-0000-0000-0000-0000000000a1';
select is(pg_temp.queue(), '{"remove d-4 111111111111111111"}', 'drafting a mapped badge queues a remove');
update public.achievements set status = 'published' where id = '00000000-0000-0000-0000-0000000000a1';

-- Ban removes, lift restores.
select public.admin_ban_user('00000000-0000-0000-0000-000000000004', 'griefing', null, null);
select is(pg_temp.queue(), '{"remove d-4 111111111111111111"}', 'a ban queues a remove');
select pg_temp.done('d-4', '111111111111111111', 'remove', true);
select public.admin_lift_ban((select id from public.bans where user_id = '00000000-0000-0000-0000-000000000004'));
select is(pg_temp.queue(), '{"add d-4 111111111111111111"}', 'lifting the ban queues the add again');
select pg_temp.done('d-4', '111111111111111111', 'add', true);

-- Changing the badge's role: remove the old, add the new.
select public.admin_set_achievement_meta('00000000-0000-0000-0000-0000000000a1', 'common', '222222222222222222');
select is(pg_temp.queue(), '{"remove d-4 111111111111111111","add d-4 222222222222222222"}', 'a new role removes the old one and adds the new one');

-- A failed add that is no longer wanted is dropped by the next write-back.
select pg_temp.done('d-4', '222222222222222222', 'add', false);
select public.admin_set_achievement_meta('00000000-0000-0000-0000-0000000000a1', 'common', null);
select pg_temp.done('d-4', '111111111111111111', 'remove', true);
select is((select count(*)::int from public.discord_role_state), 0, 'a stale failed add is cleaned up');

select throws_ok($$ select public.discord_role_queue_done('[{"discord_id": "d-4", "role_id": "1", "op": "kick", "ok": true}]') $$, 'INVALID', 'unknown ops are refused');
select throws_ok($$ select public.discord_role_queue_done('{}') $$, 'INVALID', 'the write-back is a list');

select * from finish();
rollback;
