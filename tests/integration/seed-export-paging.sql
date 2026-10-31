-- LOCAL ONLY. Adds 2500 throwaway players (paging-*@seed.local) so an export must
-- cross PostgREST's max_rows = 1000. Needs supabase/dev-seed.sql applied (admin@dev.local).
-- Run: psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f tests/integration/seed-export-paging.sql
-- Undo: tests/integration/cleanup-export-paging.sql
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new)
select '00000000-0000-0000-0000-000000000000', md5('paging-' || n)::uuid,
  'authenticated', 'authenticated', 'paging-' || n || '@seed.local', '', now(),
  '{"provider":"discord","providers":["discord"]}'::jsonb, jsonb_build_object('full_name', 'Paging ' || n),
  now() - (n || ' seconds')::interval, now(), '', '', '', ''
from generate_series(1, 2500) n
on conflict (id) do nothing;
