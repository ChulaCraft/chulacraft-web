-- Postgres grants EXECUTE on a new function to PUBLIC, so every RPC was callable
-- by anon/authenticated until someone remembered to revoke. Flip the default for
-- postgres, the role the migrations run as and the only role that owns functions
-- in schemas it controls, so a new function needs an explicit grant, the same
-- shape the tables already have. Existing functions keep their current ACLs; only
-- functions created after this migration are affected.
--
-- Deliberately NOT written as `in schema public`: on this database that form is
-- accepted but has no effect (the default-ACL row is written and the function
-- still comes out executable by PUBLIC), while the global form applies. Verified
-- both ways against the local stack.
--
-- supabase_admin also owns a public default ACL from the platform bootstrap, but
-- postgres is not a member of that role, so ALTER DEFAULT PRIVILEGES FOR ROLE
-- supabase_admin is permission denied here and is left alone. It does not matter
-- for this project: no function in schema public is owned by supabase_admin.
alter default privileges for role postgres revoke execute on functions from public, anon, authenticated;

-- Pre-existing drift, found while pinning the function allowlist: 20261005000002
-- created the pre-remap backup table and revoked anon/authenticated, but never
-- granted service_role the SELECT that discord_verified_role.test.sql asserts.
-- The ACL is {postgres=all, service_role=Dxtm} yet SELECT still fails, so the
-- backup cannot be rolled back from the server. Re-assert the grant.
grant select on public.profiles_major_backup_20261005 to service_role;