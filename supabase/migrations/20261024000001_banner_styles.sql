-- A banner is exactly one style: 'color' (four colours, no file), 'picture'
-- (a still 1500x300 PNG/JPEG/WebP) or 'animated' (a 1500x300 GIF plus a PNG of
-- its first frame, shown under prefers-reduced-motion and in swatches). For the
-- two file styles the server action derives the four colours from the image,
-- so they still work as swatch and loading fallback.

update public.banners set image_path = null where image_path is not null and image_path !~ '^banners/';
alter table public.banners drop constraint if exists banners_image_path_check;
alter table public.banners
  add column if not exists style text not null default 'color' check (style in ('color', 'picture', 'animated')),
  add column if not exists still_path text check (still_path ~ '^banners/[0-9a-f-]{36}\.png$');
alter table public.banners add constraint banners_image_path_check check (image_path ~ '^banners/[0-9a-f-]{36}\.(png|jpg|webp|gif)$');
update public.banners set style = 'picture' where image_path is not null;
alter table public.banners add constraint banners_style_files_check check (
  (style = 'color' and image_path is null and still_path is null)
  or (style = 'picture' and image_path is not null and image_path !~ '\.gif$' and still_path is null)
  or (style = 'animated' and image_path ~ '\.gif$' and still_path is not null));

drop function if exists public.my_banners();
drop function if exists public.admin_user_banners(uuid);
drop function if exists public.banner_list(uuid);
drop function if exists public.admin_list_banners();
drop function if exists public.get_player_banner(uuid);
drop function if exists public.admin_save_banner(text, text, text[], text);

create function public.banner_list(p_user uuid)
returns table (id text, name text, colors text[], style text, image_path text, still_path text, kind text,
               owned boolean, selected boolean, granted boolean, event_names text[])
language sql stable security definer set search_path = '' as $$
  select b.id, b.name, b.colors, b.style, b.image_path, b.still_path, b.kind,
    public.banner_owned(p_user, b.id),
    b.id = public.banner_of(p_user),
    exists (select 1 from public.banner_grants g where g.user_id = p_user and g.banner_id = b.id),
    coalesce((select array_agg(e.name order by e.starts_at desc) from public.events e
               where e.banner_id = b.id and e.status = 'published'), '{}')
  from public.banners b
  order by b.kind, b.sort, b.id;
$$;
revoke all on function public.banner_list(uuid) from public, anon, authenticated;

create function public.my_banners()
returns table (id text, name text, colors text[], style text, image_path text, still_path text, kind text,
               owned boolean, selected boolean, granted boolean, event_names text[])
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'FORBIDDEN'; end if;
  return query select * from public.banner_list(auth.uid());
end;
$$;
revoke all on function public.my_banners() from public, anon;
grant execute on function public.my_banners() to authenticated;

create function public.admin_user_banners(p_user_id uuid)
returns table (id text, name text, colors text[], style text, image_path text, still_path text, kind text,
               owned boolean, selected boolean, granted boolean, event_names text[])
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  return query select * from public.banner_list(p_user_id);
end;
$$;
revoke all on function public.admin_user_banners(uuid) from public, anon;
grant execute on function public.admin_user_banners(uuid) to authenticated;

create function public.admin_list_banners()
returns table (id text, name text, colors text[], style text, image_path text, still_path text, kind text, event_ids uuid[])
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  return query
  select b.id, b.name, b.colors, b.style, b.image_path, b.still_path, b.kind,
    coalesce((select array_agg(e.id) from public.events e where e.banner_id = b.id), '{}')
  from public.banners b
  order by b.kind, b.sort, b.id;
end;
$$;
revoke all on function public.admin_list_banners() from public, anon;
grant execute on function public.admin_list_banners() to authenticated;

create function public.get_player_banner(p_user_id uuid)
returns table (colors text[], style text, image_path text, still_path text)
language sql stable security definer set search_path = '' as $$
  select b.colors, b.style, b.image_path, b.still_path from public.banners b where b.id = public.banner_of(p_user_id);
$$;
revoke all on function public.get_player_banner(uuid) from public, anon;
grant execute on function public.get_player_banner(uuid) to authenticated;

-- p_id null creates. The style/file pairing is the table's check; a mismatch
-- comes back as INVALID rather than a raw constraint error.
create function public.admin_save_banner(p_id text, p_name text, p_colors text[], p_style text, p_image_path text, p_still_path text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_name text := trim(coalesce(p_name, ''));
  v_colors text[] := (select array_agg(lower(c) order by n) from unnest(p_colors) with ordinality as t(c, n));
  v_kind text;
  v_id text;
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  if char_length(v_name) not between 1 and 40
     or coalesce(array_to_string(v_colors, ','), '') !~ '^#[0-9a-f]{6}(,#[0-9a-f]{6}){3}$'
     or p_style is null or p_style not in ('color', 'picture', 'animated')
     or (p_image_path is not null and p_image_path !~ '^banners/[0-9a-f-]{36}\.(png|jpg|webp|gif)$')
     or (p_still_path is not null and p_still_path !~ '^banners/[0-9a-f-]{36}\.png$')
     or not ((p_style = 'color' and p_image_path is null and p_still_path is null)
          or (p_style = 'picture' and p_image_path is not null and p_image_path !~ '\.gif$' and p_still_path is null)
          or (p_style = 'animated' and p_image_path ~ '\.gif$' and p_still_path is not null)) then
    raise exception 'INVALID';
  end if;

  if p_id is null then
    v_id := 'b-' || substr(md5(gen_random_uuid()::text), 1, 8);
    insert into public.banners (id, name, colors, style, image_path, still_path, kind, sort)
    values (v_id, v_name, v_colors, p_style, p_image_path, p_still_path, 'unlock',
            coalesce((select max(b.sort) from public.banners b where b.kind = 'unlock'), 0) + 1);
    perform public.log_account_change(auth.uid(), auth.uid(), 'banners', null, 'created', null, v_name || ' banner', 'admin');
    return v_id;
  end if;

  select b.kind into v_kind from public.banners b where b.id = p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_kind = 'default' then raise exception 'DEFAULT_LOCKED'; end if;
  update public.banners b
     set name = v_name, colors = v_colors, style = p_style, image_path = p_image_path, still_path = p_still_path
   where b.id = p_id;
  perform public.log_account_change(auth.uid(), auth.uid(), 'banners', null, 'banner_design', null, v_name, 'admin');
  return p_id;
end;
$$;
revoke all on function public.admin_save_banner(text, text, text[], text, text, text) from public, anon;
grant execute on function public.admin_save_banner(text, text, text[], text, text, text) to authenticated;

-- Now returns both files so the caller can remove them from Storage.
drop function if exists public.admin_delete_banner(text);
create function public.admin_delete_banner(p_id text)
returns table (image_path text, still_path text) language plpgsql security definer set search_path = '' as $$
declare
  v_kind text;
  v_name text;
  v_image text;
  v_still text;
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  select b.kind, b.name, b.image_path, b.still_path into v_kind, v_name, v_image, v_still
    from public.banners b where b.id = p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_kind = 'default' then raise exception 'DEFAULT_LOCKED'; end if;
  delete from public.banners b where b.id = p_id;
  perform public.log_account_change(auth.uid(), auth.uid(), 'banners', null, 'deleted', v_name || ' banner', null, 'admin');
  return query select v_image, v_still;
end;
$$;
revoke all on function public.admin_delete_banner(text) from public, anon;
grant execute on function public.admin_delete_banner(text) to authenticated;
