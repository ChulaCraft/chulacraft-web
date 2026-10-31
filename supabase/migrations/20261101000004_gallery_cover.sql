-- v1.1 T1.2: an admin-chosen cover picture per gallery group.
-- list_gallery_groups() returns a new column, so it is dropped and recreated.

alter table public.gallery_groups add column cover_path text
  check (cover_path is null or cover_path ~ '^gallery/[0-9a-f-]{36}\.(png|jpg|webp|gif)$');

drop function public.list_gallery_groups();
create function public.list_gallery_groups()
returns table (id uuid, name text, description text, cover_path text)
language sql stable security definer set search_path = '' as $$
  select g.id, g.name, g.description, g.cover_path from public.gallery_groups g order by g.sort, g.created_at, g.id;
$$;
revoke all on function public.list_gallery_groups() from public, anon;
grant execute on function public.list_gallery_groups() to anon, authenticated;

-- Returns the previous path so the caller can remove the old object.
create function public.admin_set_gallery_cover(p_id uuid, p_path text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_old text;
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  if p_path is not null and p_path !~ '^gallery/[0-9a-f-]{36}\.(png|jpg|webp|gif)$' then raise exception 'INVALID'; end if;
  select g.cover_path into v_old from public.gallery_groups g where g.id = p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  update public.gallery_groups g set cover_path = p_path where g.id = p_id;
  if v_old is distinct from p_path then
    perform public.log_account_change(auth.uid(), auth.uid(), 'gallery_groups', p_id, 'cover_path', v_old, p_path, 'admin');
  end if;
  return v_old;
end;
$$;
revoke all on function public.admin_set_gallery_cover(uuid, text) from public, anon;
grant execute on function public.admin_set_gallery_cover(uuid, text) to authenticated;
