-- Discord bot settings and jobs from 20261031000003_bot_admin.sql: what the bot
-- registers and reads, what admins may change, and the role-safety rule both
-- ways.

begin;

select plan(45);

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.logout() returns void language sql as $$
  select set_config('request.jwt.claims', '', true);
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'owner@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'admin@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'player@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'mod@test.local'),
  ('00000000-0000-0000-0000-000000000005', 'staff@test.local');
update public.profiles set role = 'owner' where user_id = '00000000-0000-0000-0000-000000000001';
update public.profiles set role = 'admin' where user_id = '00000000-0000-0000-0000-000000000002';
update public.profiles set role = 'moderator' where user_id = '00000000-0000-0000-0000-000000000004';
update public.profiles set role = 'event_staff' where user_id = '00000000-0000-0000-0000-000000000005';

-- Start from an empty registry so leftovers from a local mock run don't count.
delete from public.bot_job_runs;
delete from public.bot_jobs;
delete from public.bot_settings;
delete from public.account_change_log where entity in ('bot_settings', 'bot_jobs');

create temporary table payload as select
  '[
    {"key": "discord_guild_id", "kind": "guild", "applies": "restart", "label": "Server", "default_value": "100000000000000001"},
    {"key": "discord_announcement_channel_id", "kind": "channel", "label": "Announcements channel", "default_value": "100000000000000002"},
    {"key": "verified_role_id", "kind": "role", "label": "Verified role"},
    {"key": "discord_announcement_admin_role_ids", "kind": "role_list", "label": "Announcement admin roles"},
    {"key": "status_website_url", "kind": "url", "label": "Website URL", "default_value": "https://chulacraft.com/"},
    {"key": "status_monitor_interval_ms", "kind": "number", "label": "Status check interval", "min_value": 10000, "default_value": "60000"}
  ]'::jsonb as settings,
  '[
    {"name": "status_monitor", "label": "Status monitor", "interval_seconds": 60},
    {"name": "join_to_create", "label": "Join to create", "interval_seconds": null}
  ]'::jsonb as jobs;

-- ---------------------------------------------------------------- grants

select ok(has_function_privilege('service_role', 'public.bot_register(jsonb, jsonb)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.bot_register(jsonb, jsonb)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.bot_register(jsonb, jsonb)', 'EXECUTE'), 'bot_register is service role only');
select ok(has_function_privilege('service_role', 'public.bot_config()', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.bot_config()', 'EXECUTE')
  and not has_function_privilege('anon', 'public.bot_config()', 'EXECUTE'), 'bot_config is service role only');
select ok(has_function_privilege('service_role', 'public.bot_settings_report(jsonb)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.bot_settings_report(jsonb)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.bot_settings_report(jsonb)', 'EXECUTE'), 'bot_settings_report is service role only');
select ok(has_function_privilege('service_role', 'public.bot_job_report(text, timestamptz, timestamptz, boolean, integer, text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.bot_job_report(text, timestamptz, timestamptz, boolean, integer, text)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.bot_job_report(text, timestamptz, timestamptz, boolean, integer, text)', 'EXECUTE'), 'bot_job_report is service role only');
select ok(not has_table_privilege('authenticated', 'public.bot_settings', 'SELECT')
  and not has_table_privilege('anon', 'public.bot_jobs', 'SELECT')
  and not has_table_privilege('authenticated', 'public.bot_job_runs', 'SELECT'), 'players cannot read the bot tables');

-- -------------------------------------------------------------- register

select lives_ok($$ select public.bot_register((select settings from payload), (select jobs from payload)) $$, 'the bot registers its settings and jobs');
select is((select count(*)::int from public.bot_settings), 6, 'six settings registered');

select pg_temp.login('00000000-0000-0000-0000-000000000002');
select lives_ok($$ select public.admin_set_bot_setting('discord_announcement_channel_id', '1234567890123456789') $$,
  'an admin sets a 19-digit channel');
select is((select count(*)::int from public.account_change_log where entity = 'bot_settings'), 1, 'the change wrote one audit row');
select row_eq($$ select actor_user_id, field, old_value, new_value, source from public.account_change_log where entity = 'bot_settings' $$,
  row('00000000-0000-0000-0000-000000000002'::uuid, 'discord_announcement_channel_id'::text, null::text, '1234567890123456789'::text, 'admin'::text),
  'the audit row names the admin, the key and the new value');
select pg_temp.logout();

select lives_ok($$ select public.bot_register((select settings from payload), (select jobs from payload)) $$, 'registering again works');
select is((select count(*)::int from public.bot_settings), 6, 'registering twice adds nothing');
select is((select value from public.bot_settings where key = 'discord_announcement_channel_id'), '1234567890123456789',
  'registering again keeps the admin-set value');

select lives_ok($$ select public.bot_register(
  (select jsonb_agg(s) from jsonb_array_elements((select settings from payload)) s where s->>'key' <> 'verified_role_id'),
  (select jsonb_agg(j) from jsonb_array_elements((select jobs from payload)) j where j->>'name' <> 'join_to_create')) $$,
  'the bot registers without one setting and one job');
select isnt((select retired_at from public.bot_settings where key = 'verified_role_id'), null, 'the dropped setting is retired');
select isnt((select retired_at from public.bot_jobs where name = 'join_to_create'), null, 'the dropped job is retired');
select is((select retired_at from public.bot_settings where key = 'discord_guild_id'), null, 'settings still sent are not retired');
select public.bot_register((select settings from payload), (select jobs from payload));
select is((select retired_at from public.bot_settings where key = 'verified_role_id'), null, 'a setting that comes back is un-retired');

select throws_ok($$ select public.bot_register('[{"key": "discord_token", "kind": "text", "label": "Token"}]', '[]') $$,
  'INVALID', 'a token is never registered');
select throws_ok($$ select public.bot_register('[{"key": "openrouter_api_key", "kind": "text", "label": "Key"}]', '[]') $$,
  'INVALID', 'a key ending in "key" is never registered');
select throws_ok($$ select public.bot_register('[{"key": "x", "kind": "colour", "label": "X"}]', '[]') $$,
  'INVALID', 'a bad key or unknown kind is refused');

-- ---------------------------------------------------------------- config

select is(public.bot_config()->'settings'->>'discord_guild_id', '100000000000000001', 'bot_config gives the default when no value is set');
select is(public.bot_config()->'settings'->>'discord_announcement_channel_id', '1234567890123456789', 'and the value once one is set');

-- --------------------------------------------------------------- set rules

select pg_temp.login('00000000-0000-0000-0000-000000000002');
select throws_ok($$ select public.admin_set_bot_setting('discord_announcement_channel_id', '123') $$, 'INVALID', 'a 3-digit channel is refused');
select throws_ok($$ select public.admin_set_bot_setting('discord_announcement_admin_role_ids',
  (select string_agg((100000000000000000 + n)::text, ',') from generate_series(1, 26) n)) $$, 'INVALID', '26 role IDs are refused');
select lives_ok($$ select public.admin_set_bot_setting('discord_announcement_admin_role_ids',
  '100000000000000011, 100000000000000012') $$, 'two role IDs are fine');
select is((select value from public.bot_settings where key = 'discord_announcement_admin_role_ids'), '100000000000000011,100000000000000012',
  'a list is stored without spaces');
select throws_ok($$ select public.admin_set_bot_setting('status_monitor_interval_ms', '5000') $$, 'INVALID', 'a number below min_value is refused');
select throws_ok($$ select public.admin_set_bot_setting('status_website_url', 'javascript:alert(1)') $$, 'INVALID', 'a javascript: URL is refused');
select throws_ok($$ select public.admin_set_bot_setting('no_such_setting', '1') $$, 'NOT_FOUND', 'an unknown key is NOT_FOUND');

update public.bot_settings set bot_status = 'ok', checked_at = now() where key = 'discord_announcement_channel_id';
select lives_ok($$ select public.admin_set_bot_setting('discord_announcement_channel_id', null) $$, 'null resets to the default');
select row_eq($$ select value, bot_status from public.bot_settings where key = 'discord_announcement_channel_id' $$,
  row(null::text, null::text), 'the reset clears the value and the bot check');
select is(public.bot_config()->'settings'->>'discord_announcement_channel_id', '100000000000000002', 'the bot is back on the default');

-- ------------------------------------------------------------ bot checks

select pg_temp.logout();
select is(public.bot_settings_report('[{"key": "discord_guild_id", "ok": false, "error": "Unknown Guild"}]'), 1, 'the bot reports a check');
select row_eq($$ select bot_status, bot_error from public.bot_settings where key = 'discord_guild_id' $$,
  row('invalid'::text, 'Unknown Guild'::text), 'a rejected value shows the bot''s error');
select is(public.bot_settings_report('[{"key": "discord_guild_id", "ok": true, "value": "999999999999999999"}]'), 0,
  'a check of a value that is no longer in effect is ignored');
select pg_temp.login('00000000-0000-0000-0000-000000000002');

-- ------------------------------------------------------------ role safety

insert into public.discord_assignable_roles (role_id, label) values ('200000000000000001', 'Builder');
select throws_ok($$ select public.admin_set_bot_setting('verified_role_id', '200000000000000001') $$,
  'ROLE_IN_USE_BY_BADGE', 'a role a badge may give cannot be a bot role');
select public.admin_set_bot_setting('verified_role_id', '200000000000000002');
select throws_ok($$ select public.admin_save_discord_role('200000000000000002', 'Verified') $$,
  'ROLE_MANAGED_BY_BOT', 'a role the bot manages cannot be offered to badges');

-- ------------------------------------------------------------------ jobs

select lives_ok($$ select public.admin_set_bot_job_enabled('status_monitor', false) $$, 'an admin pauses a job');
select is(public.bot_config()->'paused_jobs', '["status_monitor"]'::jsonb, 'bot_config lists the paused job');

select pg_temp.logout();
select public.bot_job_report('status_monitor', now() - interval '2 min', now() - interval '2 min', false, 0, 'boom');
select public.bot_job_report('status_monitor', now() - interval '1 min', now() - interval '1 min', false, 0, 'boom');
select is((select consecutive_failures from public.bot_jobs where name = 'status_monitor'), 2, 'two failures in a row count 2');
select public.bot_job_report('status_monitor', now(), now(), true, 3, null);
select row_eq($$ select consecutive_failures, last_ok, last_items from public.bot_jobs where name = 'status_monitor' $$,
  row(0, true, 3), 'a success resets the count');

-- --------------------------------------------------------------- forbidden

select pg_temp.login('00000000-0000-0000-0000-000000000004');
select throws_ok($$ select public.admin_bot_overview() $$, 'FORBIDDEN', 'a moderator cannot see the bot page');
select pg_temp.login('00000000-0000-0000-0000-000000000005');
select throws_ok($$ select public.admin_set_bot_setting('discord_guild_id', '100000000000000009') $$, 'FORBIDDEN', 'event staff cannot change a setting');
select pg_temp.login('00000000-0000-0000-0000-000000000003');
select throws_ok($$ select public.admin_set_bot_job_enabled('status_monitor', true) $$, 'FORBIDDEN', 'a player cannot resume a job');

select * from finish();
rollback;
