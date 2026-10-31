-- v1.1 Phase 5 D: event reminders for the Discord bot.
--
-- Staff pick offsets per event from presets (1 week, 1 day, 3 h, 1 h, 15 min).
-- Due = starts_at - offset. Per event only the latest due unsent offset is
-- offered (the smallest offset whose due time has passed), so a bot that was
-- down never posts a stack of stale reminders; when it writes one back, the
-- larger unsent offsets are skipped. An offset already past when staff save it
-- is skipped at once, and nothing is offered once the event has started.
-- Moving starts_at re-arms the offsets whose new due time is ahead.
--
-- sent_at is the bot's (Discord); notified_at is the bell's (pg_cron, next
-- migration). They are tracked separately so neither waits on the other.

create table if not exists public.event_reminders (
  event_id uuid not null references public.events(id) on delete cascade,
  offset_minutes integer not null check (offset_minutes in (15, 60, 180, 1440, 10080)),
  sent_at timestamptz,
  notified_at timestamptz,
  skipped_at timestamptz,
  primary key (event_id, offset_minutes)
);
alter table public.event_reminders enable row level security;
revoke all on public.event_reminders from anon, authenticated;

-- Called right after admin_upsert_event, like admin_set_event_category. Kept
-- offsets keep their state; removed ones are deleted.
create or replace function public.admin_set_event_reminders(p_id uuid, p_offsets integer[])
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_starts timestamptz;
  v_offsets integer[] := array(select distinct x from unnest(coalesce(p_offsets, '{}')) x order by x);
  v_old integer[];
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  if exists (select 1 from unnest(v_offsets) x where x is null or x not in (15, 60, 180, 1440, 10080)) then raise exception 'INVALID'; end if;
  select e.starts_at into v_starts from public.events e where e.id = p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;

  v_old := array(select r.offset_minutes from public.event_reminders r where r.event_id = p_id order by r.offset_minutes);
  delete from public.event_reminders r where r.event_id = p_id and r.offset_minutes <> all (v_offsets);
  insert into public.event_reminders (event_id, offset_minutes, skipped_at)
    select p_id, x, case when v_starts - make_interval(mins => x) <= now() then now() end from unnest(v_offsets) x
  on conflict do nothing;
  if v_old is distinct from v_offsets then
    perform public.log_account_change(auth.uid(), auth.uid(), 'events', p_id, 'reminders',
      array_to_string(v_old, ','), array_to_string(v_offsets, ','), 'admin');
  end if;
end;
$$;
revoke all on function public.admin_set_event_reminders(uuid, integer[]) from public, anon;
grant execute on function public.admin_set_event_reminders(uuid, integer[]) to authenticated;

-- For the event form's "sent" / "skipped" tags.
create or replace function public.admin_event_reminders(p_id uuid)
returns table (offset_minutes integer, sent_at timestamptz, skipped_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  return query select r.offset_minutes, r.sent_at, r.skipped_at from public.event_reminders r
    where r.event_id = p_id order by r.offset_minutes desc;
end;
$$;
revoke all on function public.admin_event_reminders(uuid) from public, anon;
grant execute on function public.admin_event_reminders(uuid) to authenticated;

-- The time changed, so a reminder that is now ahead of us is news again, for
-- Discord and for the bell.
create or replace function public.event_reminders_rearm() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.event_reminders r set sent_at = null, notified_at = null, skipped_at = null
    where r.event_id = new.id and new.starts_at - make_interval(mins => r.offset_minutes) > now();
  return null;
end;
$$;
revoke all on function public.event_reminders_rearm() from public, anon, authenticated;

drop trigger if exists events_reminders_rearm on public.events;
create trigger events_reminders_rearm
  after update of starts_at on public.events
  for each row when (old.starts_at is distinct from new.starts_at)
  execute function public.event_reminders_rearm();

-- Internal: per published, not-started event, the latest due unsent offset.
create or replace function public.event_reminders_due()
returns table (event_id uuid, offset_minutes integer)
language sql stable security definer set search_path = '' as $$
  select distinct on (r.event_id) r.event_id, r.offset_minutes
  from public.event_reminders r
  join public.events e on e.id = r.event_id
  where e.status = 'published' and e.starts_at > now()
    and r.sent_at is null and r.skipped_at is null
    and e.starts_at - make_interval(mins => r.offset_minutes) <= now()
  order by r.event_id, r.offset_minutes;
$$;
revoke all on function public.event_reminders_due() from public, anon, authenticated;

-- Bot: post in the announcements channel and ping the players who marked
-- interest and have Discord linked.
create or replace function public.event_reminders_queue()
returns table (
  event_id uuid, name text, starts_at timestamptz, location text,
  offset_minutes integer, interested_discord_ids text[]
)
language sql stable security definer set search_path = '' as $$
  select e.id, e.name, e.starts_at, e.location, d.offset_minutes,
    coalesce((select array_agg(distinct i.provider_id order by i.provider_id)
              from public.event_interests t
              join auth.identities i on i.user_id = t.user_id and i.provider = 'discord'
              where t.event_id = e.id and not public.is_banned(t.user_id)), '{}')
  from public.event_reminders_due() d
  join public.events e on e.id = d.event_id
  order by e.starts_at, e.id
  limit 50;
$$;
revoke all on function public.event_reminders_queue() from public, anon, authenticated;
grant execute on function public.event_reminders_queue() to service_role;

-- Write-back. False when that reminder was already marked sent (or doesn't
-- exist), so a retried write-back is harmless.
create or replace function public.event_reminder_sent(p_event_id uuid, p_offset_minutes integer)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update public.event_reminders r set sent_at = now()
    where r.event_id = p_event_id and r.offset_minutes = p_offset_minutes and r.sent_at is null;
  if not found then return false; end if;
  update public.event_reminders r set skipped_at = now()
    where r.event_id = p_event_id and r.offset_minutes > p_offset_minutes and r.sent_at is null and r.skipped_at is null;
  return true;
end;
$$;
revoke all on function public.event_reminder_sent(uuid, integer) from public, anon, authenticated;
grant execute on function public.event_reminder_sent(uuid, integer) to service_role;
