-- Ops console (/admin/ops): admin_ops_access replaces admin_server_console_access.
-- It is still the role check and the audit trail before the website signs a
-- short-lived manager token, now for every service and for backups and image
-- updates. Image updates are owner-only. Old audit rows keep 'server_console'.

alter table public.account_change_log drop constraint if exists account_change_log_entity_check;
alter table public.account_change_log add constraint account_change_log_entity_check check (entity in (
  'minecraft_registrations', 'profiles', 'cu_sso_identities', 'chula_claims', 'identities', 'achievements', 'events',
  'achievement_awards', 'announcements', 'server_console', 'bans', 'appeals', 'reports', 'banner_grants', 'banners',
  'gallery_groups', 'gallery_images', 'team_generations', 'team_members', 'site_pages', 'site_settings',
  'discord_assignable_roles', 'event_attendance', 'ops'));

create or replace function public.admin_ops_access(p_jti uuid, p_service text, p_action text)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_role text := coalesce(public.current_app_role(), '');
begin
  if v_role not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;
  if p_action not in ('status', 'logs', 'console', 'console_write', 'start', 'stop', 'restart', 'backup_list', 'backup_run', 'update') then
    raise exception 'INVALID';
  end if;
  if p_action = 'update' and v_role <> 'owner' then raise exception 'FORBIDDEN'; end if;

  -- Reads are not logged; every token that can change something is.
  if p_action not in ('status', 'logs', 'console', 'backup_list') then
    perform public.log_account_change(v_actor, v_actor, 'ops', p_jti, p_action, null, p_service, 'admin');
  end if;
  return v_role;
end;
$$;
revoke all on function public.admin_ops_access(uuid, text, text) from public, anon;
grant execute on function public.admin_ops_access(uuid, text, text) to authenticated;

drop function public.admin_server_console_access(uuid, text, text);
