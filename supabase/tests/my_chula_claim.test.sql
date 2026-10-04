-- public.my_chula_claim(), added so the dashboard can read the caller's own
-- chula_claims row (email, google_sub) without the service-role key. google_sub
-- is not a readable column for authenticated, so this is the only path.

begin;

select plan(10);

select ok(exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'my_chula_claim' and p.pronargs = 0),
  'my_chula_claim exists');

-- security definer with an empty search_path: the caller supplies no user id,
-- so the only input is the JWT, and no object is resolved through a
-- caller-controlled search_path.
select ok((select prosecdef from pg_proc where oid = 'public.my_chula_claim()'::regprocedure),
  'my_chula_claim is security definer');
select is((select array_to_string(proconfig, ',') from pg_proc where oid = 'public.my_chula_claim()'::regprocedure),
  'search_path=""', 'my_chula_claim pins search_path to empty');

-- Anon must never reach it: it reads google_sub, which the authenticated role
-- cannot select directly either.
select ok(not has_function_privilege('anon', 'public.my_chula_claim()', 'EXECUTE'),
  'anonymous users cannot execute my_chula_claim');
select ok(not has_function_privilege('public', 'public.my_chula_claim()', 'EXECUTE'),
  'my_chula_claim is not executable by PUBLIC');
select ok(has_function_privilege('authenticated', 'public.my_chula_claim()', 'EXECUTE'),
  'players can execute my_chula_claim');

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000c1', 'me@test.local'),
  ('00000000-0000-0000-0000-0000000000c2', 'them@test.local');
insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at) values
  ('d-c1', '00000000-0000-0000-0000-0000000000c1', '{"full_name":"Me"}', 'discord', now(), now()),
  ('d-c2', '00000000-0000-0000-0000-0000000000c2', '{"full_name":"Them"}', 'discord', now(), now()),
  ('g-c1', '00000000-0000-0000-0000-0000000000c1', '{"email":"me@student.chula.ac.th","email_verified":true}', 'google', now(), now()),
  ('g-c2', '00000000-0000-0000-0000-0000000000c2', '{"email":"them@student.chula.ac.th","email_verified":true}', 'google', now(), now());
select public.claim_chula('00000000-0000-0000-0000-0000000000c1', 'g-c1', 'me@student.chula.ac.th');
select public.claim_chula('00000000-0000-0000-0000-0000000000c2', 'g-c2', 'them@student.chula.ac.th');

create function pg_temp.claim(p_user uuid) returns table (email text, google_sub text) language sql as $$
  select public.my_chula_claim();
$$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
select is((select c.email from pg_temp.claim('00000000-0000-0000-0000-0000000000c1') c),
  'me@student.chula.ac.th', 'the caller gets their own claim email');
select is((select c.google_sub from pg_temp.claim('00000000-0000-0000-0000-0000000000c1') c),
  'g-c1', 'the caller gets their own google_sub, the column authenticated cannot read');

-- The row is keyed on auth.uid() and nothing else: the second player asking
-- returns their own row, never the caller's.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c2","role":"authenticated"}', true);
select is((select c.email from pg_temp.claim('00000000-0000-0000-0000-0000000000c2') c),
  'them@student.chula.ac.th', 'another player gets their own row, not the first one''s');

-- No JWT at all means no claim row, not an error.
select set_config('request.jwt.claims', '', true);
select is((select count(*)::int from pg_temp.claim(null) c), 0,
  'an unauthenticated call returns no row');

select * from finish();

rollback;