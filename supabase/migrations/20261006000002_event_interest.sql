-- Phase A+ (D6, D7): the public event list, one event's public detail page, and
-- the "Mark as interested" boolean.
--
-- events already has starts_at / ends_at / location / image_path from
-- 20261006000001, so this migration adds no event column: it adds only the
-- interest table and the functions that read and write it.
--
-- Privacy (PDPA, D7): the public surface is a count and nothing else. Neither
-- list_upcoming_events nor get_event names or returns a user id, so a logged-out
-- visitor learns how many players are interested and not who they are. The
-- list of players is admin-only, which is why admin_list_event_interests is the
-- one function here that resolves names.

-- ------------------------------------------------------------ default grants

-- Re-applied verbatim from 20261006000001:31 on purpose. That migration was the
-- correction to 20261005000004 (the schema-scoped form is the one this database
-- applies), so re-stating it here keeps a freshly reset database on the same
-- footing as the one the allowlist test in supabase/tests describes.
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;

-- ------------------------------------------------------------------ the table

-- Boolean only: no Going/Maybe, no attendance (D7). The primary key is the
-- toggle, so marking twice is not a duplicate row, which is what makes
-- set_event_interest idempotent.
create table if not exists public.event_interests (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index if not exists event_interests_user_idx on public.event_interests (user_id);

alter table public.event_interests enable row level security;
-- No policies on purpose: nothing reads or writes this table directly, the
-- definer functions below are the only path in.
revoke all on public.event_interests from anon, authenticated;
grant select on public.event_interests to service_role;

-- An event is over once coalesce(ends_at, starts_at) has passed. One definition,
-- used by the list, the detail read and the write, so the three cannot disagree
-- about whether an event is still open.
create or replace function public.event_is_ended(p_event public.events) returns boolean
language sql stable set search_path = '' as $$
  select coalesce(p_event.ends_at, p_event.starts_at) < now();
$$;
revoke all on function public.event_is_ended(public.events) from public, anon, authenticated;

-- ------------------------------------------------------------ public: the list

-- D9: the next published events that have not ended, soonest first. Granted to
-- anon as well as authenticated because the homepage is public (D6), which is
-- the first time in this database an anon-readable RPC exists.
create or replace function public.list_upcoming_events(p_limit integer default 4)
returns table (
  id uuid, name text, starts_at timestamptz, ends_at timestamptz,
  location text, image_path text, description_excerpt text, interest_count integer
)
language sql stable security definer set search_path = '' as $$
  select e.id, e.name, e.starts_at, e.ends_at, e.location, e.image_path,
    case when char_length(e.description) > 140 then left(e.description, 140) || '…'
         else e.description end,
    (select count(*)::int from public.event_interests i where i.event_id = e.id)
  from public.events e
  where e.status = 'published' and not public.event_is_ended(e)
  order by e.starts_at, e.id
  limit least(greatest(coalesce(p_limit, 4), 1), 12);
$$;
revoke all on function public.list_upcoming_events(integer) from public, anon;
grant execute on function public.list_upcoming_events(integer) to anon, authenticated;

-- /events archive: the same public shape, finished events only, newest first.
create or replace function public.list_past_events(p_limit integer default 24)
returns table (
  id uuid, name text, starts_at timestamptz, ends_at timestamptz,
  location text, image_path text, description_excerpt text, interest_count integer
)
language sql stable security definer set search_path = '' as $$
  select e.id, e.name, e.starts_at, e.ends_at, e.location, e.image_path,
    case when char_length(e.description) > 140 then left(e.description, 140) || '…'
         else e.description end,
    (select count(*)::int from public.event_interests i where i.event_id = e.id)
  from public.events e
  where e.status = 'published' and public.event_is_ended(e)
  order by e.starts_at desc, e.id
  limit least(greatest(coalesce(p_limit, 24), 1), 48);
$$;
revoke all on function public.list_past_events(integer) from public, anon;
grant execute on function public.list_past_events(integer) to anon, authenticated;

-- D6: the detail read. Published only — a draft is NOT_FOUND here, exactly as if
-- it did not exist, so an unpublished title never reaches a visitor. Unlike the
-- list this does not filter on time, because the detail page has to be able to
-- show a finished event with "This event has ended" instead of a 404.
--
-- me_interested is this caller's own row and false for anon, where auth.uid() is
-- null. It is a boolean about the reader, not a list of anybody.
create or replace function public.get_event(p_id uuid)
returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', e.id,
    'name', e.name,
    'description', e.description,
    'starts_at', e.starts_at,
    'ends_at', e.ends_at,
    'location', e.location,
    'image_path', e.image_path,
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
revoke all on function public.get_event(uuid) from public, anon;
grant execute on function public.get_event(uuid) to anon, authenticated;

-- ------------------------------------------------------- player: the toggle

-- D7: on before the event ends, off any time. The pair of failures is
-- deliberate: NOT_FOUND means "no such published event, or you made it up",
-- EVENT_ENDED means "it was real and it is over" so the page can say which.
create or replace function public.set_event_interest(p_event_id uuid, p_interested boolean)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_event public.events%rowtype;
begin
  select * into v_event from public.events e where e.id = p_event_id and e.status = 'published';
  if not found then raise exception 'NOT_FOUND'; end if;
  if public.event_is_ended(v_event) then raise exception 'EVENT_ENDED'; end if;

  -- The user id comes from the JWT, never from an argument, so nobody can mark
  -- somebody else interested. v_user is non-null: the grant is authenticated
  -- only, so the empty case is unreachable rather than handled.
  if p_interested then
    insert into public.event_interests (event_id, user_id) values (p_event_id, v_user)
    on conflict (event_id, user_id) do nothing;
  else
    delete from public.event_interests i where i.event_id = p_event_id and i.user_id = v_user;
  end if;

  return p_interested;
end;
$$;
revoke all on function public.set_event_interest(uuid, boolean) from public, anon;
grant execute on function public.set_event_interest(uuid, boolean) to authenticated;

-- ------------------------------------------------------------- admin: the list

-- The interested players behind the public count, for the event's admin page
-- and the award page's "Prefill from interested players" (D7: interest is not
-- attendance, so this is a starting point the admin still confirms).
-- admin_display_name may fall back to the login email; that is the same
-- admin-only surface admin_list_awards already has.
create or replace function public.admin_list_event_interests(p_event_id uuid)
returns table (user_id uuid, display_name text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  return query
  select i.user_id, public.admin_display_name(i.user_id), i.created_at
  from public.event_interests i
  where i.event_id = p_event_id
  order by i.created_at, i.user_id;
end;
$$;
revoke all on function public.admin_list_event_interests(uuid) from public, anon;
grant execute on function public.admin_list_event_interests(uuid) to authenticated;