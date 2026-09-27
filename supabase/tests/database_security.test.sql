begin;

select plan(14);

select has_table(
  'public',
  'minecraft_registrations',
  'minecraft registrations table exists'
);

select ok(
  coalesce((
    select relrowsecurity
    from pg_catalog.pg_class
    where oid = 'public.minecraft_registrations'::regclass
  ), false),
  'minecraft registrations has row-level security enabled'
);

select has_table(
  'public',
  'registration_attempt_windows',
  'registration rate-limit table exists'
);

select ok(
  coalesce((
    select relrowsecurity
    from pg_catalog.pg_class
    where oid = 'public.registration_attempt_windows'::regclass
  ), false),
  'registration rate-limit table has row-level security enabled'
);

select has_function(
  'public',
  'consume_registration_attempt',
  array[]::text[],
  'authenticated rate-limit function exists'
);

select has_function(
  'public',
  'add_minecraft_account',
  array['uuid', 'uuid', 'text'],
  'registration function exists'
);

select ok(
  coalesce((
    select prosecdef
    from pg_catalog.pg_proc
    where oid = 'public.consume_registration_attempt()'::regprocedure
  ), false),
  'rate-limit function is explicitly security definer'
);

select ok(
  coalesce((
    select prosecdef
    from pg_catalog.pg_proc
    where oid = 'public.add_minecraft_account(uuid,uuid,text)'::regprocedure
  ), false),
  'registration function is explicitly security definer'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.consume_registration_attempt()',
    'EXECUTE'
  ),
  'anonymous users cannot call the rate limiter'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.add_minecraft_account(uuid,uuid,text)',
    'EXECUTE'
  ),
  'anonymous users cannot register Minecraft profiles'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.consume_registration_attempt()',
    'EXECUTE'
  ),
  'authenticated users can call the rate limiter'
);

select ok(
  has_column_privilege(
    'authenticated',
    'public.minecraft_registrations',
    'minecraft_username',
    'SELECT'
  ),
  'authenticated users can read the public registration fields'
);

select ok(
  not has_column_privilege(
    'authenticated',
    'public.minecraft_registrations',
    'discord_user_id',
    'SELECT'
  ),
  'authenticated users cannot read internal Discord identifiers'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.registration_attempt_windows',
    'SELECT'
  ),
  'authenticated users cannot inspect rate-limit state'
);

select * from finish();

rollback;
