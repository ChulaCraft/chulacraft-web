-- Server console (/admin/server): the website signs short-lived tokens for
-- chulacraft-server-manager. Before signing one it calls this function, which
-- is both the role check (the token's permission bits come from the role it
-- returns) and the audit trail: anything that changes the server is logged
-- with the token's jti, which the manager prints next to what it did.

alter table public.account_change_log drop constraint if exists account_change_log_entity_check;
alter table public.account_change_log add constraint account_change_log_entity_check
  check (entity in ('minecraft_registrations', 'profiles', 'cu_sso_identities', 'chula_claims', 'identities',
                    'achievements', 'events', 'achievement_awards', 'announcements', 'server_console'));

create or replace function public.admin_server_console_access(p_jti uuid, p_server text, p_action text)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_role text := coalesce(public.current_app_role(), '');
begin
  if v_role not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;
  if p_action not in ('status', 'console', 'console_write', 'start', 'stop', 'restart') then raise exception 'INVALID'; end if;

  -- Reads are not logged; every token that can change the server is.
  if p_action not in ('status', 'console') then
    perform public.log_account_change(v_actor, v_actor, 'server_console', p_jti, p_action, null, p_server, 'admin');
  end if;
  return v_role;
end;
$$;
revoke all on function public.admin_server_console_access(uuid, text, text) from public, anon;
grant execute on function public.admin_server_console_access(uuid, text, text) to authenticated;
