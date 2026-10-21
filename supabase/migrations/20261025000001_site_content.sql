-- v1.1 Phase 4: content staff change without a developer.
--   * announcement pictures
--   * gallery: groups ("Lobby building day") holding pictures       (community staff)
--   * team: generations (Gen 0, Gen 1, ...) holding board, members,
--     contributors and sponsors                                     (community staff)
--   * site pages: rules, privacy, terms as Markdown                  (admins)
--   * site settings: homepage copy, server address, Discord invite,
--     registration / reports switches                               (admins)
-- Pictures live in the achievements bucket under their own prefix. The
-- database never touches Storage, so removals hand the old paths back for the
-- server action to delete.

alter table public.account_change_log drop constraint if exists account_change_log_entity_check;
alter table public.account_change_log add constraint account_change_log_entity_check check (entity in (
  'minecraft_registrations', 'profiles', 'cu_sso_identities', 'chula_claims', 'identities', 'achievements', 'events',
  'achievement_awards', 'announcements', 'server_console', 'bans', 'appeals', 'reports', 'banner_grants', 'banners',
  'gallery_groups', 'gallery_images', 'team_generations', 'team_members', 'site_pages', 'site_settings'));

-- Moves p_id one place up or down in p_ids. Null when p_id is not in the list;
-- the list unchanged when it is already at that end. Callers renumber `sort`
-- from the result, so ties left by inserts can never stall a move.
create or replace function public.swap_order(p_ids uuid[], p_id uuid, p_up boolean) returns uuid[]
language plpgsql immutable set search_path = '' as $$
declare
  v_at int := array_position(p_ids, p_id);
  v_with int;
begin
  if v_at is null then return null; end if;
  v_with := v_at + case when p_up then -1 else 1 end;
  if v_with < 1 or v_with > cardinality(p_ids) then return p_ids; end if;
  p_ids[v_at] := p_ids[v_with];
  p_ids[v_with] := p_id;
  return p_ids;
end;
$$;
revoke all on function public.swap_order(uuid[], uuid, boolean) from public, anon, authenticated;

-- ------------------------------------------------------------ announcements

alter table public.announcements add column if not exists image_path text
  check (image_path ~ '^announcements/[0-9a-f-]{36}\.(png|jpg|webp|gif)$');

-- Separate RPC so admin_upsert_announcement's signature stays put. Returns the
-- picture it replaced, for the caller to remove from Storage.
create or replace function public.admin_set_announcement_image(p_id uuid, p_path text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_old text;
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  if p_path is not null and p_path !~ '^announcements/[0-9a-f-]{36}\.(png|jpg|webp|gif)$' then raise exception 'INVALID'; end if;
  select a.image_path into v_old from public.announcements a where a.id = p_id and a.deleted_at is null for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  update public.announcements a set image_path = p_path, updated_at = now() where a.id = p_id;
  return v_old;
end;
$$;
revoke all on function public.admin_set_announcement_image(uuid, text) from public, anon;
grant execute on function public.admin_set_announcement_image(uuid, text) to authenticated;

-- Same as 20261009000001 plus image_path.
drop function if exists public.list_announcements(integer);
create function public.list_announcements(p_limit integer default 20)
returns table (id uuid, title text, body text, severity text, pinned boolean, published_at timestamptz, image_path text)
language sql stable security definer set search_path = '' as $$
  select a.id, a.title, a.body, a.severity, a.pinned, a.published_at, a.image_path
  from public.announcements a
  where a.deleted_at is null
    and a.published_at <= now()
    and (a.expires_at is null or a.expires_at > now())
  order by a.pinned desc, a.published_at desc, a.id
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;
revoke all on function public.list_announcements(integer) from public, anon;
grant execute on function public.list_announcements(integer) to anon, authenticated;

-- Same as 20261009000001 (with the 20261019000001 role check) plus image_path.
drop function if exists public.admin_list_announcements();
create function public.admin_list_announcements()
returns table (
  id uuid, title text, body text, severity text, pinned boolean,
  published_at timestamptz, expires_at timestamptz, post_to_discord boolean,
  discord_message_id text, updated_at timestamptz, image_path text
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;

  return query
  select a.id, a.title, a.body, a.severity, a.pinned, a.published_at, a.expires_at, a.post_to_discord,
    a.discord_message_id, a.updated_at, a.image_path
  from public.announcements a
  where a.deleted_at is null
  order by a.created_at desc, a.id;
end;
$$;
revoke all on function public.admin_list_announcements() from public, anon;
grant execute on function public.admin_list_announcements() to authenticated;


-- ------------------------------------------------------------------ gallery

create table if not exists public.gallery_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  description text not null default '' check (char_length(description) <= 300),
  sort integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.gallery_groups enable row level security;
revoke all on public.gallery_groups from anon, authenticated;

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.gallery_groups(id) on delete cascade,
  image_path text not null check (image_path ~ '^gallery/[0-9a-f-]{36}\.(png|jpg|webp|gif)$'),
  alt text not null check (char_length(alt) between 1 and 200),
  wide boolean not null default false,
  sort integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists gallery_images_group_idx on public.gallery_images (group_id, sort);
alter table public.gallery_images enable row level security;
revoke all on public.gallery_images from anon, authenticated;

create or replace function public.list_gallery_groups()
returns table (id uuid, name text, description text)
language sql stable security definer set search_path = '' as $$
  select g.id, g.name, g.description from public.gallery_groups g order by g.sort, g.created_at, g.id;
$$;
revoke all on function public.list_gallery_groups() from public, anon;
grant execute on function public.list_gallery_groups() to anon, authenticated;

create or replace function public.list_gallery()
returns table (id uuid, group_id uuid, image_path text, alt text, wide boolean)
language sql stable security definer set search_path = '' as $$
  select i.id, i.group_id, i.image_path, i.alt, i.wide from public.gallery_images i order by i.sort, i.created_at, i.id;
$$;
revoke all on function public.list_gallery() from public, anon;
grant execute on function public.list_gallery() to anon, authenticated;

-- p_id null creates. Returns the group's id.
create or replace function public.admin_save_gallery_group(p_id uuid, p_name text, p_description text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_description text := btrim(coalesce(p_description, ''));
  v_id uuid;
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  if char_length(v_name) not between 1 and 60 or char_length(v_description) > 300 then raise exception 'INVALID'; end if;
  if p_id is null then
    insert into public.gallery_groups (name, description, sort)
      values (v_name, v_description, coalesce((select max(g.sort) from public.gallery_groups g), 0) + 1)
      returning id into v_id;
    perform public.log_account_change(auth.uid(), auth.uid(), 'gallery_groups', v_id, 'created', null, v_name, 'admin');
  else
    update public.gallery_groups g set name = v_name, description = v_description where g.id = p_id returning g.id into v_id;
    if not found then raise exception 'NOT_FOUND'; end if;
  end if;
  return v_id;
end;
$$;
revoke all on function public.admin_save_gallery_group(uuid, text, text) from public, anon;
grant execute on function public.admin_save_gallery_group(uuid, text, text) to authenticated;

create or replace function public.admin_move_gallery_group(p_id uuid, p_up boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_order uuid[];
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  perform 1 from public.gallery_groups for update;
  v_order := public.swap_order(array(select g.id from public.gallery_groups g order by g.sort, g.created_at, g.id), p_id, p_up);
  if v_order is null then raise exception 'NOT_FOUND'; end if;
  update public.gallery_groups g set sort = t.n from unnest(v_order) with ordinality t(id, n) where g.id = t.id;
end;
$$;
revoke all on function public.admin_move_gallery_group(uuid, boolean) from public, anon;
grant execute on function public.admin_move_gallery_group(uuid, boolean) to authenticated;

-- Deletes the group and its pictures; returns their paths to remove.
create or replace function public.admin_delete_gallery_group(p_id uuid) returns text[]
language plpgsql security definer set search_path = '' as $$
declare
  v_paths text[];
  v_name text;
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  v_paths := array(select i.image_path from public.gallery_images i where i.group_id = p_id);
  delete from public.gallery_groups g where g.id = p_id returning g.name into v_name;
  if not found then raise exception 'NOT_FOUND'; end if;
  perform public.log_account_change(auth.uid(), auth.uid(), 'gallery_groups', p_id, 'deleted', v_name, null, 'admin');
  return v_paths;
end;
$$;
revoke all on function public.admin_delete_gallery_group(uuid) from public, anon;
grant execute on function public.admin_delete_gallery_group(uuid) to authenticated;

-- p_id null adds a picture (p_path required). Editing can move it to another
-- group, where it goes last; the path never changes.
create or replace function public.admin_save_gallery_image(p_id uuid, p_group_id uuid, p_path text, p_alt text, p_wide boolean) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_alt text := btrim(coalesce(p_alt, ''));
  v_id uuid;
  v_next int;
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  if char_length(v_alt) not between 1 and 200 then raise exception 'INVALID'; end if;
  if not exists (select 1 from public.gallery_groups g where g.id = p_group_id) then raise exception 'NOT_FOUND'; end if;
  v_next := coalesce((select max(i.sort) from public.gallery_images i where i.group_id = p_group_id), 0) + 1;
  if p_id is null then
    if coalesce(p_path, '') !~ '^gallery/[0-9a-f-]{36}\.(png|jpg|webp|gif)$' then raise exception 'INVALID'; end if;
    insert into public.gallery_images (group_id, image_path, alt, wide, sort, created_by)
      values (p_group_id, p_path, v_alt, coalesce(p_wide, false), v_next, auth.uid())
      returning id into v_id;
    perform public.log_account_change(auth.uid(), auth.uid(), 'gallery_images', v_id, 'created', null, v_alt, 'admin');
  else
    update public.gallery_images i
      set alt = v_alt, wide = coalesce(p_wide, false),
          sort = case when i.group_id = p_group_id then i.sort else v_next end, group_id = p_group_id
      where i.id = p_id returning i.id into v_id;
    if not found then raise exception 'NOT_FOUND'; end if;
  end if;
  return v_id;
end;
$$;
revoke all on function public.admin_save_gallery_image(uuid, uuid, text, text, boolean) from public, anon;
grant execute on function public.admin_save_gallery_image(uuid, uuid, text, text, boolean) to authenticated;

-- Within its group.
create or replace function public.admin_move_gallery_image(p_id uuid, p_up boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_group uuid;
  v_order uuid[];
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  select i.group_id into v_group from public.gallery_images i where i.id = p_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  perform 1 from public.gallery_images i where i.group_id = v_group for update;
  v_order := public.swap_order(array(select i.id from public.gallery_images i where i.group_id = v_group order by i.sort, i.created_at, i.id), p_id, p_up);
  update public.gallery_images i set sort = t.n from unnest(v_order) with ordinality t(id, n) where i.id = t.id;
end;
$$;
revoke all on function public.admin_move_gallery_image(uuid, boolean) from public, anon;
grant execute on function public.admin_move_gallery_image(uuid, boolean) to authenticated;

create or replace function public.admin_delete_gallery_image(p_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_path text;
  v_alt text;
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  delete from public.gallery_images i where i.id = p_id returning i.image_path, i.alt into v_path, v_alt;
  if not found then raise exception 'NOT_FOUND'; end if;
  perform public.log_account_change(auth.uid(), auth.uid(), 'gallery_images', p_id, 'deleted', v_alt, null, 'admin');
  return v_path;
end;
$$;
revoke all on function public.admin_delete_gallery_image(uuid) from public, anon;
grant execute on function public.admin_delete_gallery_image(uuid) to authenticated;

-- --------------------------------------------------------------------- team

create table if not exists public.team_generations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  sort integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.team_generations enable row level security;
revoke all on public.team_generations from anon, authenticated;

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.team_generations(id) on delete cascade,
  kind text not null check (kind in ('board', 'member', 'contributor', 'sponsor')),
  name text not null check (char_length(name) between 1 and 60),
  -- Board: their department ("Head of Events"); others: what they do. Optional.
  title text not null default '' check (char_length(title) <= 60),
  bio text not null default '' check (char_length(bio) <= 300),
  image_path text check (image_path ~ '^team/[0-9a-f-]{36}\.(png|jpg|webp|gif)$'),
  -- Optional link to their player page; leaving the site unlinks, not deletes.
  user_id uuid references auth.users(id) on delete set null,
  -- Optional outside link, mostly for sponsors.
  link_url text check (link_url ~ '^https://\S+$' and char_length(link_url) <= 300),
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists team_members_generation_idx on public.team_members (generation_id, kind, sort);
alter table public.team_members enable row level security;
revoke all on public.team_members from anon, authenticated;

create or replace function public.list_team_generations()
returns table (id uuid, name text)
language sql stable security definer set search_path = '' as $$
  select g.id, g.name from public.team_generations g order by g.sort, g.created_at, g.id;
$$;
revoke all on function public.list_team_generations() from public, anon;
grant execute on function public.list_team_generations() to anon, authenticated;

create or replace function public.list_team()
returns table (id uuid, generation_id uuid, kind text, name text, title text, bio text, image_path text, user_id uuid, link_url text)
language sql stable security definer set search_path = '' as $$
  select t.id, t.generation_id, t.kind, t.name, t.title, t.bio, t.image_path, t.user_id, t.link_url
  from public.team_members t order by t.sort, t.created_at, t.id;
$$;
revoke all on function public.list_team() from public, anon;
grant execute on function public.list_team() to anon, authenticated;

create or replace function public.admin_save_team_generation(p_id uuid, p_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_id uuid;
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  if char_length(v_name) not between 1 and 40 then raise exception 'INVALID'; end if;
  if p_id is null then
    insert into public.team_generations (name, sort)
      values (v_name, coalesce((select max(g.sort) from public.team_generations g), 0) + 1)
      returning id into v_id;
    perform public.log_account_change(auth.uid(), auth.uid(), 'team_generations', v_id, 'created', null, v_name, 'admin');
  else
    update public.team_generations g set name = v_name where g.id = p_id returning g.id into v_id;
    if not found then raise exception 'NOT_FOUND'; end if;
  end if;
  return v_id;
end;
$$;
revoke all on function public.admin_save_team_generation(uuid, text) from public, anon;
grant execute on function public.admin_save_team_generation(uuid, text) to authenticated;

create or replace function public.admin_move_team_generation(p_id uuid, p_up boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_order uuid[];
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  perform 1 from public.team_generations for update;
  v_order := public.swap_order(array(select g.id from public.team_generations g order by g.sort, g.created_at, g.id), p_id, p_up);
  if v_order is null then raise exception 'NOT_FOUND'; end if;
  update public.team_generations g set sort = t.n from unnest(v_order) with ordinality t(id, n) where g.id = t.id;
end;
$$;
revoke all on function public.admin_move_team_generation(uuid, boolean) from public, anon;
grant execute on function public.admin_move_team_generation(uuid, boolean) to authenticated;

-- Deletes the generation and everyone in it; returns their photos to remove.
create or replace function public.admin_delete_team_generation(p_id uuid) returns text[]
language plpgsql security definer set search_path = '' as $$
declare
  v_paths text[];
  v_name text;
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  v_paths := array(select t.image_path from public.team_members t where t.generation_id = p_id and t.image_path is not null);
  delete from public.team_generations g where g.id = p_id returning g.name into v_name;
  if not found then raise exception 'NOT_FOUND'; end if;
  perform public.log_account_change(auth.uid(), auth.uid(), 'team_generations', p_id, 'deleted', v_name, null, 'admin');
  return v_paths;
end;
$$;
revoke all on function public.admin_delete_team_generation(uuid) from public, anon;
grant execute on function public.admin_delete_team_generation(uuid) to authenticated;

-- p_id null creates. A member whose generation or section changes goes last there.
create or replace function public.admin_save_team_member(
  p_id uuid, p_generation_id uuid, p_kind text, p_name text, p_title text, p_bio text,
  p_image_path text, p_user_id uuid, p_link_url text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_title text := btrim(coalesce(p_title, ''));
  v_bio text := btrim(coalesce(p_bio, ''));
  v_link text := nullif(btrim(coalesce(p_link_url, '')), '');
  v_next int;
  v_id uuid;
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  if char_length(v_name) not between 1 and 60 or char_length(v_title) > 60 or char_length(v_bio) > 300
    or coalesce(p_kind, '') not in ('board', 'member', 'contributor', 'sponsor')
    or (p_image_path is not null and p_image_path !~ '^team/[0-9a-f-]{36}\.(png|jpg|webp|gif)$')
    or (v_link is not null and (v_link !~ '^https://\S+$' or char_length(v_link) > 300)) then
    raise exception 'INVALID';
  end if;
  if not exists (select 1 from public.team_generations g where g.id = p_generation_id) then raise exception 'NOT_FOUND'; end if;
  if p_user_id is not null and not exists (select 1 from auth.users u where u.id = p_user_id) then raise exception 'NOT_FOUND'; end if;
  v_next := coalesce((select max(t.sort) from public.team_members t where t.generation_id = p_generation_id and t.kind = p_kind), 0) + 1;

  if p_id is null then
    insert into public.team_members (generation_id, kind, name, title, bio, image_path, user_id, link_url, sort)
      values (p_generation_id, p_kind, v_name, v_title, v_bio, p_image_path, p_user_id, v_link, v_next)
      returning id into v_id;
    perform public.log_account_change(auth.uid(), auth.uid(), 'team_members', v_id, 'created', null, v_name, 'admin');
  else
    update public.team_members t
      set sort = case when t.generation_id = p_generation_id and t.kind = p_kind then t.sort else v_next end,
          generation_id = p_generation_id, kind = p_kind, name = v_name, title = v_title, bio = v_bio,
          image_path = p_image_path, user_id = p_user_id, link_url = v_link, updated_at = now()
      where t.id = p_id returning t.id into v_id;
    if not found then raise exception 'NOT_FOUND'; end if;
    perform public.log_account_change(auth.uid(), auth.uid(), 'team_members', v_id, 'edited', null, v_name, 'admin');
  end if;
  return v_id;
end;
$$;
revoke all on function public.admin_save_team_member(uuid, uuid, text, text, text, text, text, uuid, text) from public, anon;
grant execute on function public.admin_save_team_member(uuid, uuid, text, text, text, text, text, uuid, text) to authenticated;

-- Within its generation and section.
create or replace function public.admin_move_team_member(p_id uuid, p_up boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_generation uuid;
  v_kind text;
  v_order uuid[];
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  select t.generation_id, t.kind into v_generation, v_kind from public.team_members t where t.id = p_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  perform 1 from public.team_members t where t.generation_id = v_generation and t.kind = v_kind for update;
  v_order := public.swap_order(array(
    select t.id from public.team_members t where t.generation_id = v_generation and t.kind = v_kind order by t.sort, t.created_at, t.id
  ), p_id, p_up);
  update public.team_members m set sort = t.n from unnest(v_order) with ordinality t(id, n) where m.id = t.id;
end;
$$;
revoke all on function public.admin_move_team_member(uuid, boolean) from public, anon;
grant execute on function public.admin_move_team_member(uuid, boolean) to authenticated;

create or replace function public.admin_delete_team_member(p_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_path text;
  v_name text;
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  delete from public.team_members t where t.id = p_id returning t.image_path, t.name into v_path, v_name;
  if not found then raise exception 'NOT_FOUND'; end if;
  perform public.log_account_change(auth.uid(), auth.uid(), 'team_members', p_id, 'deleted', v_name, null, 'admin');
  return v_path;
end;
$$;
revoke all on function public.admin_delete_team_member(uuid) from public, anon;
grant execute on function public.admin_delete_team_member(uuid) to authenticated;

-- --------------------------------------------------------------- site pages

-- Markdown for /rules, /privacy and /terms. No row = the text built into the
-- site, so an empty table renders exactly what shipped before.
create table if not exists public.site_pages (
  slug text primary key check (slug in ('rules', 'privacy', 'terms')),
  body text not null check (char_length(body) between 1 and 20000),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.site_pages enable row level security;
revoke all on public.site_pages from anon, authenticated;

create or replace function public.get_site_page(p_slug text)
returns table (body text, updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select p.body, p.updated_at from public.site_pages p where p.slug = p_slug;
$$;
revoke all on function public.get_site_page(text) from public, anon;
grant execute on function public.get_site_page(text) to anon, authenticated;

-- Empty body goes back to the built-in text.
create or replace function public.admin_save_site_page(p_slug text, p_body text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_body text := nullif(btrim(coalesce(p_body, '')), '');
begin
  if not public.staff_can('admin') then raise exception 'FORBIDDEN'; end if;
  if coalesce(p_slug, '') not in ('rules', 'privacy', 'terms') or char_length(coalesce(v_body, '')) > 20000 then raise exception 'INVALID'; end if;
  if v_body is null then
    delete from public.site_pages p where p.slug = p_slug;
  else
    insert into public.site_pages (slug, body, updated_by) values (p_slug, v_body, auth.uid())
      on conflict on constraint site_pages_pkey do update set body = excluded.body, updated_by = excluded.updated_by, updated_at = now();
  end if;
  perform public.log_account_change(auth.uid(), auth.uid(), 'site_pages', null, p_slug, null, case when v_body is null then 'reset' else 'edited' end, 'admin');
end;
$$;
revoke all on function public.admin_save_site_page(text, text) from public, anon;
grant execute on function public.admin_save_site_page(text, text) to authenticated;

-- ------------------------------------------------------------ site settings

-- A missing row means "use the built-in default", so an empty table renders
-- the site exactly as before this migration.
create table if not exists public.site_settings (
  key text primary key check (key in (
    'home_kicker', 'home_intro', 'server_address', 'discord_url', 'registration_open', 'reports_open')),
  value text not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon, authenticated;

create or replace function public.get_site_settings()
returns table (key text, value text)
language sql stable security definer set search_path = '' as $$
  select s.key, s.value from public.site_settings s;
$$;
revoke all on function public.get_site_settings() from public, anon;
grant execute on function public.get_site_settings() to anon, authenticated;

-- On unless an admin switched it off.
create or replace function public.site_switch_on(p_key text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select s.value from public.site_settings s where s.key = p_key), 'true') <> 'false';
$$;
revoke all on function public.site_switch_on(text) from public, anon, authenticated;

-- Every key the form sends; an empty value clears it back to the default.
-- Validated here because the server action is not the only possible caller.
create or replace function public.admin_save_site_settings(p_settings jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  r record;
  v_value text;
  v_old text;
begin
  if not public.staff_can('admin') then raise exception 'FORBIDDEN'; end if;
  if jsonb_typeof(p_settings) is distinct from 'object' then raise exception 'INVALID'; end if;

  for r in select e.key, e.value from jsonb_each_text(p_settings) e loop
    if r.key not in ('home_kicker', 'home_intro', 'server_address', 'discord_url', 'registration_open', 'reports_open') then
      raise exception 'INVALID';
    end if;
    v_value := nullif(btrim(coalesce(r.value, '')), '');
    if v_value is not null and not (
      (r.key = 'home_kicker' and char_length(v_value) <= 60)
      or (r.key = 'home_intro' and char_length(v_value) <= 300)
      or (r.key = 'server_address' and v_value ~ '^[A-Za-z0-9.-]{1,100}(:[0-9]{1,5})?$')
      or (r.key = 'discord_url' and v_value ~ '^https://(discord\.gg|discord\.com/invite)/[A-Za-z0-9-]{2,40}$')
      or (r.key in ('registration_open', 'reports_open') and v_value in ('true', 'false'))
    ) then
      raise exception 'INVALID';
    end if;

    select s.value into v_old from public.site_settings s where s.key = r.key;
    if v_old is not distinct from v_value then continue; end if;
    if v_value is null then
      delete from public.site_settings s where s.key = r.key;
    else
      insert into public.site_settings (key, value, updated_by) values (r.key, v_value, auth.uid())
        on conflict on constraint site_settings_pkey do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = now();
    end if;
    perform public.log_account_change(auth.uid(), auth.uid(), 'site_settings', null, r.key, left(v_old, 200), left(v_value, 200), 'admin');
  end loop;
end;
$$;
revoke all on function public.admin_save_site_settings(jsonb) from public, anon;
grant execute on function public.admin_save_site_settings(jsonb) to authenticated;

-- The reports switch, enforced where every report lands. Registration needs no
-- trigger: its RPCs are server-only (20260924000001) and the API route checks
-- the switch.
create or replace function public.reports_switch_check() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.site_switch_on('reports_open') then raise exception 'REPORTS_CLOSED'; end if;
  return new;
end;
$$;
revoke all on function public.reports_switch_check() from public, anon, authenticated;
drop trigger if exists reports_switch_check on public.reports;
create trigger reports_switch_check before insert on public.reports
  for each row execute function public.reports_switch_check();
