-- Apply only after the Google verification code (20260927000001) is deployed.
drop function if exists public.link_cu_sso(uuid, text, text, text, text);
drop table if exists public.cu_sso_identities;
-- account_change_log keeps 'cu_sso_identities' as an allowed entity so old
-- audit rows survive.
