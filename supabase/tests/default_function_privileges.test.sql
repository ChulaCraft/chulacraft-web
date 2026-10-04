-- Default-privilege guard (20261005000004). Every function in schema public that
-- anon or authenticated may execute is pinned to an explicit allowlist, so a new
-- RPC cannot become reachable from the browser by being forgotten rather than by
-- a grant. Build the list, read it, and only then write it down: an entry that
-- looks unintended is a finding, not a line to delete quietly.

begin;

select plan(4);

-- The allowlists, exactly as the current grants stand.
-- anon: the 3 trigger functions cannot be called directly (Postgres refuses),
-- but PUBLIC execute on them is still a grant and is worth seeing.
-- is_chula_email(text) is a pure regex over its argument: no table, no uid.
create temporary table expected (role text, signature text);

insert into expected values
  ('anon', 'is_chula_email(p_email text)'),
  ('anon', 'reset_sync_on_desired_state_change()'),
  ('anon', 'set_sync_failing_since()'),
  ('anon', 'set_updated_at()'),
  ('authenticated', 'admin_get_user(p_user_id uuid)'),
  ('authenticated', 'admin_mark_guest(p_user_id uuid)'),
  ('authenticated', 'admin_newest_players(p_limit integer)'),
  ('authenticated', 'admin_overview_stats()'),
  ('authenticated', 'admin_recent_activity(p_limit integer)'),
  ('authenticated', 'admin_removed_accounts()'),
  ('authenticated', 'admin_reset_chula(p_user_id uuid)'),
  ('authenticated', 'admin_search_users(p_query text)'),
  ('authenticated', 'admin_set_role(p_user_id uuid, p_role text)'),
  ('authenticated', 'admin_set_whitelisted(p_registration_id uuid, p_value boolean)'),
  ('authenticated', 'am_i_player_verified()'),
  ('authenticated', 'consume_registration_attempt()'),
  ('authenticated', 'current_app_role()'),
  ('authenticated', 'is_chula_email(p_email text)'),
  ('authenticated', 'my_chula_claim()'),
  ('authenticated', 'reset_sync_on_desired_state_change()'),
  ('authenticated', 'set_sync_failing_since()'),
  ('authenticated', 'set_updated_at()');

-- Everything the two roles can execute right now, one row per role/function.
-- A function both roles hold must appear twice, so the roles are unnested
-- rather than picked with a CASE (which would label it anon only).
create temporary table actual as
  select r.role,
         p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as signature
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  cross join (values ('anon'), ('authenticated')) as r(role)
  where n.nspname = 'public'
    and has_function_privilege(r.role, p.oid, 'EXECUTE');

-- Compared per role: a missing entry means a grant was withdrawn, an extra one
-- means a new function became reachable.
select is((select coalesce(array_agg(a.role || ' ' || a.signature order by a.role, a.signature), '{}')
             from actual a
            where not exists (select 1 from expected e where e.role = a.role and e.signature = a.signature)),
  '{}'::text[], 'no function in public is executable by anon or authenticated outside the allowlist');

select is((select coalesce(array_agg(e.role || ' ' || e.signature order by e.role, e.signature), '{}')
             from expected e
            where not exists (select 1 from actual a where e.role = a.role and e.signature = a.signature)),
  '{}'::text[], 'every allowlisted function still has its grant (nothing was revoked by accident)');

-- The guard itself: a function created now with no explicit grant must come out
-- unreachable by both roles. Rolled back with the rest of the file. If this
-- fails, the default privileges stopped applying and the allowlist above is
-- only describing history.
create function public.default_privilege_probe() returns int language sql as $$ select 1 $$;
select ok(not has_function_privilege('anon', 'public.default_privilege_probe()', 'EXECUTE'),
  'a new function with no grant is not executable by anon');
select ok(not has_function_privilege('authenticated', 'public.default_privilege_probe()', 'EXECUTE'),
  'a new function with no grant is not executable by authenticated');

select * from finish();

rollback;