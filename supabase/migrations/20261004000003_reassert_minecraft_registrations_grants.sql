-- Production drifted from the migrations: anon gained SELECT on this table
-- outside version control (pentest 2026-10-04, F-01). RLS still hid every row,
-- but anon must hold no grants here. Re-assert the intended privileges from
-- scratch so any dashboard-made grant to anon or authenticated is dropped.
revoke all on public.minecraft_registrations from anon, authenticated;
grant select (id, user_id, minecraft_username, desired_whitelisted, sync_status, is_active, created_at, updated_at)
  on public.minecraft_registrations to authenticated;
