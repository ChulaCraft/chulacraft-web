-- Optional event category, shown as a chip on event cards. Set by its own RPC
-- right after admin_upsert_event saves, so the upsert's signature (and the
-- staff_can check 20261019000001 wrote into it) stays as it is.

-- Details are Markdown now (src/lib/markdown.tsx), which needs more room.
alter table public.events drop constraint if exists events_description_check;
alter table public.events add constraint events_description_check check (char_length(description) <= 2000);

alter table public.events
  add column if not exists category text check (category in ('build', 'community', 'survival', 'minigame'));

create or replace function public.admin_set_event_category(p_id uuid, p_category text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_old text;
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  if p_category is not null and p_category not in ('build', 'community', 'survival', 'minigame') then raise exception 'INVALID'; end if;
  select e.category into v_old from public.events e where e.id = p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_old is not distinct from p_category then return; end if;
  update public.events e set category = p_category where e.id = p_id;
  perform public.log_account_change(auth.uid(), auth.uid(), 'events', p_id, 'category', v_old, p_category, 'admin');
end;
$$;
revoke all on function public.admin_set_event_category(uuid, text) from public, anon;
grant execute on function public.admin_set_event_category(uuid, text) to authenticated;

-- Return types change, so these are dropped and recreated with the same
-- bodies plus category, and the same grants.
drop function if exists public.list_upcoming_events(int);
create function public.list_upcoming_events(p_limit int default 4)
returns table (id uuid, name text, starts_at timestamptz, ends_at timestamptz, location text, image_path text,
  description_excerpt text, interest_count int, category text)
language sql stable security definer set search_path = '' as $$
  select e.id, e.name, e.starts_at, e.ends_at, e.location, e.image_path,
    case when char_length(e.description) > 140 then left(e.description, 140) || '…'
         else e.description end,
    (select count(*)::int from public.event_interests i where i.event_id = e.id),
    e.category
  from public.events e
  where e.status = 'published' and not public.event_is_ended(e)
  order by e.starts_at, e.id
  limit least(greatest(coalesce(p_limit, 4), 1), 12);
$$;
revoke all on function public.list_upcoming_events(int) from public;
grant execute on function public.list_upcoming_events(int) to anon, authenticated;

drop function if exists public.list_past_events(int);
create function public.list_past_events(p_limit int default 24)
returns table (id uuid, name text, starts_at timestamptz, ends_at timestamptz, location text, image_path text,
  description_excerpt text, interest_count int, category text)
language sql stable security definer set search_path = '' as $$
  select e.id, e.name, e.starts_at, e.ends_at, e.location, e.image_path,
    case when char_length(e.description) > 140 then left(e.description, 140) || '…'
         else e.description end,
    (select count(*)::int from public.event_interests i where i.event_id = e.id),
    e.category
  from public.events e
  where e.status = 'published' and public.event_is_ended(e)
  order by e.starts_at desc, e.id
  limit least(greatest(coalesce(p_limit, 24), 1), 48);
$$;
revoke all on function public.list_past_events(int) from public;
grant execute on function public.list_past_events(int) to anon, authenticated;

drop function if exists public.admin_list_events();
create function public.admin_list_events()
returns table (id uuid, name text, description text, starts_at timestamptz, ends_at timestamptz, location text,
  image_path text, status text, award_count bigint, created_at timestamptz, updated_at timestamptz, category text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;

  return query
  select e.id, e.name, e.description, e.starts_at, e.ends_at, e.location, e.image_path, e.status,
    (select count(*) from public.achievement_awards w where w.event_id = e.id),
    e.created_at, e.updated_at, e.category
  from public.events e
  order by e.starts_at desc, e.id;
end;
$$;
revoke all on function public.admin_list_events() from public, anon;
grant execute on function public.admin_list_events() to authenticated;

create or replace function public.get_event(p_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', e.id,
    'name', e.name,
    'description', e.description,
    'starts_at', e.starts_at,
    'ends_at', e.ends_at,
    'location', e.location,
    'image_path', e.image_path,
    'category', e.category,
    'interest_count', (select count(*)::int from public.event_interests i where i.event_id = e.id),
    'me_interested', exists (
      select 1 from public.event_interests i
      where i.event_id = e.id and i.user_id = auth.uid()
    ),
    'ended', public.event_is_ended(e)
  )
  from public.events e
  where e.id = p_id and e.status = 'published';
$$;
