-- Profile banners: a four-colour strip behind the avatar on /dashboard and
-- /player/[id] (src/components/profile-banner.tsx). No uploads: a banner is a
-- palette. Every 'default' banner is free; an 'unlock' banner is owned by
-- earning any badge at an event that rewards it, or by a staff grant.
-- Ownership is computed, never copied, so a revoked grant or a deleted award
-- takes the banner away and the profile falls back to the first default.

create table if not exists public.banners (
  id text primary key check (id ~ '^[a-z0-9-]{2,32}$'),
  name text not null check (char_length(name) between 1 and 40),
  colors text[] not null check (array_to_string(colors, ',') ~ '^#[0-9a-f]{6}(,#[0-9a-f]{6}){3}$'),
  kind text not null check (kind in ('default', 'unlock')),
  sort int not null default 0
);
alter table public.banners enable row level security;
revoke all on public.banners from anon, authenticated;

create table if not exists public.banner_grants (
  user_id uuid not null references auth.users (id) on delete cascade,
  banner_id text not null references public.banners (id) on delete cascade,
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, banner_id)
);
alter table public.banner_grants enable row level security;
revoke all on public.banner_grants from anon, authenticated;

alter table public.profiles add column if not exists banner_id text references public.banners (id) on delete set null;
alter table public.events add column if not exists banner_id text references public.banners (id) on delete set null;
create index if not exists events_banner_idx on public.events (banner_id) where banner_id is not null;

-- Grants and revocations show up in the audit log.
alter table public.account_change_log drop constraint if exists account_change_log_entity_check;
alter table public.account_change_log add constraint account_change_log_entity_check check (entity in (
  'minecraft_registrations', 'profiles', 'cu_sso_identities', 'chula_claims', 'identities', 'achievements', 'events',
  'achievement_awards', 'announcements', 'server_console', 'bans', 'appeals', 'reports', 'banner_grants'));

insert into public.banners (id, name, colors, kind, sort) values
  ('dusk', 'Dusk', '{#6f5d92,#7a5a8e,#8a4f78,#6a3f5f}', 'default', 1),
  ('meadow', 'Meadow', '{#4d6b4f,#5b7d55,#6e8f5c,#81a064}', 'default', 2),
  ('ocean', 'Ocean', '{#33506e,#3d6283,#4a7697,#5a8aa8}', 'default', 3),
  ('ember', 'Ember', '{#7a4a32,#8f5a36,#a46c3c,#b88044}', 'default', 4),
  ('sakura', 'Sakura', '{#c97a9a,#e09ab4,#f0bccd,#f7d8e2}', 'unlock', 1),
  ('aurora', 'Aurora', '{#2a4a5e,#2f7a6e,#5aa37a,#a3c97a}', 'unlock', 2),
  ('nether', 'Nether', '{#4a1e22,#6e2a2a,#93372f,#b8502f}', 'unlock', 3),
  ('the-end', 'The End', '{#1e1a2e,#2e2546,#4a3a6e,#c9c27a}', 'unlock', 4),
  ('gold', 'Gold', '{#6e5420,#9a7428,#c9a03a,#e8c860}', 'unlock', 5)
on conflict (id) do nothing;

-- Internal helpers: no grants, called only from the definer RPCs below.
create or replace function public.banner_owned(p_user uuid, p_banner text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.banners b
    where b.id = p_banner and (
      b.kind = 'default'
      or exists (select 1 from public.banner_grants g where g.user_id = p_user and g.banner_id = b.id)
      or exists (select 1 from public.achievement_awards w join public.events e on e.id = w.event_id
                  where w.user_id = p_user and e.banner_id = b.id)));
$$;
revoke all on function public.banner_owned(uuid, text) from public, anon, authenticated;

create or replace function public.banner_of(p_user uuid) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select p.banner_id from public.profiles p where p.user_id = p_user and public.banner_owned(p_user, p.banner_id)),
    (select b.id from public.banners b where b.kind = 'default' order by b.sort, b.id limit 1));
$$;
revoke all on function public.banner_of(uuid) from public, anon, authenticated;

create or replace function public.banner_list(p_user uuid)
returns table (id text, name text, colors text[], kind text, owned boolean, selected boolean, granted boolean, event_names text[])
language sql stable security definer set search_path = '' as $$
  select b.id, b.name, b.colors, b.kind,
    public.banner_owned(p_user, b.id),
    b.id = public.banner_of(p_user),
    exists (select 1 from public.banner_grants g where g.user_id = p_user and g.banner_id = b.id),
    coalesce((select array_agg(e.name order by e.starts_at desc) from public.events e
               where e.banner_id = b.id and e.status = 'published'), '{}')
  from public.banners b
  order by b.kind, b.sort, b.id;
$$;
revoke all on function public.banner_list(uuid) from public, anon, authenticated;

-- Player-facing.
create or replace function public.my_banners()
returns table (id text, name text, colors text[], kind text, owned boolean, selected boolean, granted boolean, event_names text[])
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'FORBIDDEN'; end if;
  return query select * from public.banner_list(auth.uid());
end;
$$;
revoke all on function public.my_banners() from public, anon;
grant execute on function public.my_banners() to authenticated;

create or replace function public.set_my_banner(p_banner_id text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'FORBIDDEN'; end if;
  if not public.banner_owned(auth.uid(), p_banner_id) then raise exception 'NOT_OWNED'; end if;
  update public.profiles p set banner_id = p_banner_id where p.user_id = auth.uid();
end;
$$;
revoke all on function public.set_my_banner(text) from public, anon;
grant execute on function public.set_my_banner(text) to authenticated;

-- A banner is cosmetic, so any signed-in viewer may read anyone's, hidden
-- profiles included: it says nothing the name and avatar don't.
create or replace function public.get_player_banner(p_user_id uuid) returns text[]
language sql stable security definer set search_path = '' as $$
  select b.colors from public.banners b where b.id = public.banner_of(p_user_id);
$$;
revoke all on function public.get_player_banner(uuid) from public, anon;
grant execute on function public.get_player_banner(uuid) to authenticated;

-- Staff: events and badges are the community area, so banners are too.
create or replace function public.admin_user_banners(p_user_id uuid)
returns table (id text, name text, colors text[], kind text, owned boolean, selected boolean, granted boolean, event_names text[])
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  return query select * from public.banner_list(p_user_id);
end;
$$;
revoke all on function public.admin_user_banners(uuid) from public, anon;
grant execute on function public.admin_user_banners(uuid) to authenticated;

create or replace function public.admin_list_banners()
returns table (id text, name text, colors text[], kind text, event_ids uuid[])
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  return query
  select b.id, b.name, b.colors, b.kind,
    coalesce((select array_agg(e.id) from public.events e where e.banner_id = b.id), '{}')
  from public.banners b
  order by b.kind, b.sort, b.id;
end;
$$;
revoke all on function public.admin_list_banners() from public, anon;
grant execute on function public.admin_list_banners() to authenticated;

create or replace function public.admin_grant_banner(p_user_id uuid, p_banner_id text, p_grant boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  if not exists (select 1 from public.banners b where b.id = p_banner_id and b.kind = 'unlock') then raise exception 'INVALID'; end if;
  if not exists (select 1 from auth.users u where u.id = p_user_id) then raise exception 'NOT_FOUND'; end if;
  if p_grant then
    insert into public.banner_grants (user_id, banner_id, granted_by) values (p_user_id, p_banner_id, auth.uid())
    on conflict do nothing;
    if not found then return; end if;
    perform public.log_account_change(auth.uid(), p_user_id, 'banner_grants', p_user_id, 'banner', null, p_banner_id, 'admin');
  else
    delete from public.banner_grants g where g.user_id = p_user_id and g.banner_id = p_banner_id;
    if not found then return; end if;
    perform public.log_account_change(auth.uid(), p_user_id, 'banner_grants', p_user_id, 'banner', p_banner_id, null, 'admin');
  end if;
end;
$$;
revoke all on function public.admin_grant_banner(uuid, text, boolean) from public, anon;
grant execute on function public.admin_grant_banner(uuid, text, boolean) to authenticated;

-- Separate from admin_upsert_event for the same reason as the category
-- (20261020000001): the upsert's signature stays put.
create or replace function public.admin_set_event_banner(p_id uuid, p_banner_id text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_old text;
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  if p_banner_id is not null and not exists (select 1 from public.banners b where b.id = p_banner_id and b.kind = 'unlock') then
    raise exception 'INVALID';
  end if;
  select e.banner_id into v_old from public.events e where e.id = p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_old is not distinct from p_banner_id then return; end if;
  update public.events e set banner_id = p_banner_id where e.id = p_id;
  perform public.log_account_change(auth.uid(), auth.uid(), 'events', p_id, 'reward_banner', v_old, p_banner_id, 'admin');
end;
$$;
revoke all on function public.admin_set_event_banner(uuid, text) from public, anon;
grant execute on function public.admin_set_event_banner(uuid, text) to authenticated;
