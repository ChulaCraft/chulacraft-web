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

-- Rows for the other exports: 1500 each, so every list crosses max_rows = 1000.
-- Everything is tagged 'paging-seed' (names, reasons, messages) for the cleanup script.
insert into public.reports (reporter_id, target_user_id, category, details, status, created_at)
select md5('paging-' || n)::uuid, md5('paging-1')::uuid, 'other',
  'paging-seed report number ' || n, 'actioned', now() - (n || ' minutes')::interval
from generate_series(1, 1500) n;

insert into public.bans (id, user_id, reason, created_by, created_at, lifted_at)
select md5('paging-ban-' || n)::uuid, md5('paging-' || n)::uuid, 'paging-seed ban', null, now() - (n || ' minutes')::interval, now()
from generate_series(1, 1500) n;
insert into public.appeals (ban_id, user_id, message, status, created_at)
select md5('paging-ban-' || n)::uuid, md5('paging-' || n)::uuid, 'paging-seed appeal number ' || n, 'rejected', now() - (n || ' minutes')::interval
from generate_series(1, 1500) n;

alter table public.account_change_log disable trigger user;
insert into public.account_change_log (actor_user_id, target_user_id, entity, field, old_value, new_value, source, created_at)
select md5('paging-1')::uuid, md5('paging-' || n)::uuid, 'profiles', 'paging-seed', 'a', 'b', 'admin', now() - (n || ' seconds')::interval
from generate_series(1, 1500) n;
alter table public.account_change_log enable trigger user;

insert into public.achievements (id, name, image_path, status) values ('00000000-0000-4000-8000-0000000fa001', 'paging-seed achievement', 'paging-seed.png', 'draft');
insert into public.events (id, name, starts_at, status) values ('00000000-0000-4000-8000-0000000fa002', 'paging-seed event', now(), 'draft');
insert into public.achievement_awards (user_id, achievement_id, awarded_on)
select md5('paging-' || n)::uuid, '00000000-0000-4000-8000-0000000fa001', current_date from generate_series(1, 1500) n;
insert into public.event_attendance (event_id, user_id, method)
select '00000000-0000-4000-8000-0000000fa002', md5('paging-' || n)::uuid, 'staff' from generate_series(1, 1500) n;
