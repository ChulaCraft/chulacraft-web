-- Follow-up to 20261004000001_redesign_admin.sql. Apply only after the app that
-- calls am_i_player_verified() is deployed; the old app still calls this one.
drop function if exists public.am_i_chula_verified();
