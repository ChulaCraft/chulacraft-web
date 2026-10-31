-- Staff design their own unlock banners at /admin/commu/banners: a name and
-- four colours, no uploads. The four defaults (20261021000001) stay fixed.
-- Deleting a banner cascades its grants and clears it from events and
-- profiles (on delete set null), so its owners fall back to the first default.

alter table public.account_change_log drop constraint if exists account_change_log_entity_check;
alter table public.account_change_log add constraint account_change_log_entity_check check (entity in (
  'minecraft_registrations', 'profiles', 'cu_sso_identities', 'chula_claims', 'identities', 'achievements', 'events',
  'achievement_awards', 'announcements', 'server_console', 'bans', 'appeals', 'reports', 'banner_grants', 'banners'));

-- p_id null creates; returns the banner's id either way.
create or replace function public.admin_save_banner(p_id text, p_name text, p_colors text[])
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_name text := trim(coalesce(p_name, ''));
  v_colors text[] := (select array_agg(lower(c) order by n) from unnest(p_colors) with ordinality as t(c, n));
  v_kind text;
  v_id text;
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  if char_length(v_name) not between 1 and 40
     or coalesce(array_to_string(v_colors, ','), '') !~ '^#[0-9a-f]{6}(,#[0-9a-f]{6}){3}$' then
    raise exception 'INVALID';
  end if;

  if p_id is null then
    v_id := 'b-' || substr(md5(gen_random_uuid()::text), 1, 8);
    insert into public.banners (id, name, colors, kind, sort)
    values (v_id, v_name, v_colors, 'unlock',
            coalesce((select max(b.sort) from public.banners b where b.kind = 'unlock'), 0) + 1);
    perform public.log_account_change(auth.uid(), auth.uid(), 'banners', null, 'created', null, v_name || ' banner', 'admin');
    return v_id;
  end if;

  select b.kind into v_kind from public.banners b where b.id = p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_kind = 'default' then raise exception 'DEFAULT_LOCKED'; end if;
  update public.banners b set name = v_name, colors = v_colors where b.id = p_id;
  perform public.log_account_change(auth.uid(), auth.uid(), 'banners', null, 'banner_design', null, v_name, 'admin');
  return p_id;
end;
$$;
revoke all on function public.admin_save_banner(text, text, text[]) from public, anon;
grant execute on function public.admin_save_banner(text, text, text[]) to authenticated;

create or replace function public.admin_delete_banner(p_id text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_kind text;
  v_name text;
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  select b.kind, b.name into v_kind, v_name from public.banners b where b.id = p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_kind = 'default' then raise exception 'DEFAULT_LOCKED'; end if;
  delete from public.banners b where b.id = p_id;
  perform public.log_account_change(auth.uid(), auth.uid(), 'banners', null, 'deleted', v_name || ' banner', null, 'admin');
end;
$$;
revoke all on function public.admin_delete_banner(text) from public, anon;
grant execute on function public.admin_delete_banner(text) to authenticated;
