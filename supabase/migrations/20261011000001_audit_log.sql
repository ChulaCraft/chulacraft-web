-- Admin audit log (/admin/audit): every admin action across all players,
-- filterable and paged newest-first. Bans, appeals and reports are allowed as
-- entities now so those phases log from their first migration.

alter table public.account_change_log drop constraint if exists account_change_log_entity_check;
alter table public.account_change_log add constraint account_change_log_entity_check
  check (entity in ('minecraft_registrations', 'profiles', 'cu_sso_identities', 'chula_claims', 'identities',
                    'achievements', 'events', 'achievement_awards', 'announcements', 'server_console',
                    'bans', 'appeals', 'reports'));

create index if not exists account_change_log_admin_idx
  on public.account_change_log (created_at desc, id desc) where source = 'admin';

-- Keyset pagination: pass the last row's created_at and id to get the next
-- page. p_to is inclusive of the whole day the admin picked, so the page
-- passes the next midnight.
create or replace function public.admin_audit_log(
  p_actor uuid default null, p_target uuid default null, p_entity text default null,
  p_from timestamptz default null, p_to timestamptz default null,
  p_before_at timestamptz default null, p_before_id uuid default null,
  p_limit int default 50
)
returns table (
  id uuid, created_at timestamptz, actor_user_id uuid, actor_name text,
  target_user_id uuid, target_name text, entity text, entity_id uuid,
  field text, old_value text, new_value text
)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  return query
  select l.id, l.created_at, l.actor_user_id, public.admin_display_name(l.actor_user_id),
    l.target_user_id, public.admin_display_name(l.target_user_id),
    l.entity, l.entity_id, l.field, l.old_value, l.new_value
  from public.account_change_log l
  where l.source = 'admin'
    and (p_actor is null or l.actor_user_id = p_actor)
    and (p_target is null or l.target_user_id = p_target)
    and (p_entity is null or l.entity = p_entity)
    and (p_from is null or l.created_at >= p_from)
    and (p_to is null or l.created_at < p_to)
    and (p_before_at is null or (l.created_at, l.id) < (p_before_at, p_before_id))
  order by l.created_at desc, l.id desc
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
end;
$$;
revoke all on function public.admin_audit_log(uuid, uuid, text, timestamptz, timestamptz, timestamptz, uuid, int) from public, anon;
grant execute on function public.admin_audit_log(uuid, uuid, text, timestamptz, timestamptz, timestamptz, uuid, int) to authenticated;
