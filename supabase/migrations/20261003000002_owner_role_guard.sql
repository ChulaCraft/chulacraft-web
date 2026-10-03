-- Owners are peers: no owner may change another owner's role, in either
-- direction. Replaces the version in 20260923000003, which documented the
-- missing guard. Self role changes are still rejected separately.

create or replace function public.admin_set_role(p_user_id uuid, p_role text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_old text;
begin
  if public.current_app_role() is distinct from 'owner' then raise exception 'FORBIDDEN'; end if;
  if p_user_id = v_actor then raise exception 'SELF_ROLE_CHANGE'; end if;
  if p_role is null or p_role not in ('owner', 'admin', 'user') then raise exception 'INVALID_ROLE'; end if;

  select p.role into v_old from public.profiles p where p.user_id = p_user_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_old = p_role then return; end if;
  if v_old = 'owner' then raise exception 'OWNER_ROLE_PROTECTED'; end if;

  update public.profiles p set role = p_role where p.user_id = p_user_id;
  perform public.log_account_change(v_actor, p_user_id, 'profiles', p_user_id, 'role', v_old, p_role, 'admin');
end;
$$;
revoke all on function public.admin_set_role(uuid, text) from public, anon;
grant execute on function public.admin_set_role(uuid, text) to authenticated;