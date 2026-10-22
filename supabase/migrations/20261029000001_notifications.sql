-- v1.1 Phase 5 E: the notification bell.
--
-- Rows are made by the database only, never by app code:
--   award     achievement_awards insert, published badges   (statement trigger)
--   banner    an unlock banner newly owned through an award or a grant
--                                                            (statement triggers)
--   appeal    an appeal leaves 'open' (admin_decide_appeal, lift_ban)
--   report    a report with a reporter leaves 'open'; payload is the status only
--   reminder  pg_cron, event_reminders_notify(), independent of the bot
-- Award and banner triggers are statement-level over the transition table, so
-- one admin_award batch is handled set-based. Appeal and report are row-level:
-- transition tables can't be combined with an UPDATE OF column list.
-- admin_set_event_banner unlocking a banner for past awardees notifies nobody;
-- players see it in the picker.
-- The header reads the unread count on a full page load; no Realtime.
-- Rows older than 90 days are deleted daily.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('award', 'appeal', 'report', 'banner', 'reminder')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id) where read_at is null;
alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;

-- ------------------------------------------------------------- triggers

-- Internal trigger functions: no grants.
create or replace function public.notify_awards() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, kind, payload)
  select i.user_id, 'award', jsonb_build_object('achievement_id', a.id, 'name', a.name, 'tier', a.tier)
  from inserted i
  join public.achievements a on a.id = i.achievement_id and a.status = 'published';

  -- A banner is newly owned when the player had no grant for it and no award
  -- at a banner event before this statement. Defaults are always owned
  -- (banner_owned, 20261021000001:56).
  insert into public.notifications (user_id, kind, payload)
  select distinct i.user_id, 'banner', jsonb_build_object('banner_id', b.id, 'name', b.name)
  from inserted i
  join public.events e on e.id = i.event_id and e.banner_id is not null
  join public.banners b on b.id = e.banner_id and b.kind <> 'default'
  where not exists (select 1 from public.banner_grants g where g.user_id = i.user_id and g.banner_id = b.id)
    and not exists (select 1 from public.achievement_awards w join public.events x on x.id = w.event_id
                    where w.user_id = i.user_id and x.banner_id = b.id and w.id not in (select n.id from inserted n));
  return null;
end;
$$;
revoke all on function public.notify_awards() from public, anon, authenticated;

drop trigger if exists achievement_awards_notify on public.achievement_awards;
create trigger achievement_awards_notify
  after insert on public.achievement_awards
  referencing new table as inserted
  for each statement execute function public.notify_awards();

create or replace function public.notify_banner_grants() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, kind, payload)
  select g.user_id, 'banner', jsonb_build_object('banner_id', b.id, 'name', b.name)
  from inserted g
  join public.banners b on b.id = g.banner_id and b.kind <> 'default'
  where not exists (select 1 from public.achievement_awards w join public.events e on e.id = w.event_id
                    where w.user_id = g.user_id and e.banner_id = g.banner_id);
  return null;
end;
$$;
revoke all on function public.notify_banner_grants() from public, anon, authenticated;

drop trigger if exists banner_grants_notify on public.banner_grants;
create trigger banner_grants_notify
  after insert on public.banner_grants
  referencing new table as inserted
  for each statement execute function public.notify_banner_grants();

create or replace function public.notify_appeal() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, kind, payload)
    values (new.user_id, 'appeal', jsonb_build_object('status', new.status));
  return null;
end;
$$;
revoke all on function public.notify_appeal() from public, anon, authenticated;

drop trigger if exists appeals_notify on public.appeals;
create trigger appeals_notify
  after update of status on public.appeals
  for each row when (old.status = 'open' and new.status <> 'open')
  execute function public.notify_appeal();

-- Status only: no admin note, no target.
create or replace function public.notify_report() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, kind, payload)
    values (new.reporter_id, 'report', jsonb_build_object('status', new.status));
  return null;
end;
$$;
revoke all on function public.notify_report() from public, anon, authenticated;

drop trigger if exists reports_notify on public.reports;
create trigger reports_notify
  after update of status on public.reports
  for each row when (old.status = 'open' and new.status <> 'open' and new.reporter_id is not null)
  execute function public.notify_report();

-- ------------------------------------------------------------ reminders

-- Own predicate, independent of sent_at: per published, not-started event,
-- every due offset not yet notified or skipped is claimed, and only the latest
-- one (smallest offset) produces rows, so the bell never sends stale reminders.
-- Claiming first (notified_at is null re-checked under the row lock) means
-- overlapping runs notify once. Recipients: interested or checked in.
create or replace function public.event_reminders_notify() returns integer
language sql security definer set search_path = '' as $$
  with due as (
    select r.event_id, r.offset_minutes, min(r.offset_minutes) over (partition by r.event_id) as latest
    from public.event_reminders r
    join public.events e on e.id = r.event_id
    where e.status = 'published' and e.starts_at > now()
      and r.notified_at is null and r.skipped_at is null
      and e.starts_at - make_interval(mins => r.offset_minutes) <= now()
  ), claimed as (
    update public.event_reminders r set notified_at = now()
    from due d
    where r.event_id = d.event_id and r.offset_minutes = d.offset_minutes and r.notified_at is null
    returning r.event_id, r.offset_minutes, d.latest
  ), ins as (
    insert into public.notifications (user_id, kind, payload)
    select u.user_id, 'reminder',
      jsonb_build_object('event_id', e.id, 'name', e.name, 'starts_at', e.starts_at, 'offset_minutes', c.offset_minutes)
    from claimed c
    join public.events e on e.id = c.event_id
    join lateral (
      select t.user_id from public.event_interests t where t.event_id = c.event_id
      union
      select a.user_id from public.event_attendance a where a.event_id = c.event_id
    ) u on true
    where c.offset_minutes = c.latest
    returning 1
  )
  select count(*)::int from ins;
$$;
revoke all on function public.event_reminders_notify() from public, anon, authenticated;

-- ---------------------------------------------------------- player reads

create or replace function public.my_unread_notifications() returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.notifications n where n.user_id = (select auth.uid()) and n.read_at is null;
$$;
revoke all on function public.my_unread_notifications() from public, anon;
grant execute on function public.my_unread_notifications() to authenticated;

create or replace function public.my_notifications(p_limit integer default 20)
returns table (id uuid, kind text, payload jsonb, created_at timestamptz, read_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select n.id, n.kind, n.payload, n.created_at, n.read_at
  from public.notifications n
  where n.user_id = (select auth.uid())
  order by n.created_at desc, n.id desc
  limit least(greatest(coalesce(p_limit, 20), 1), 20);
$$;
revoke all on function public.my_notifications(integer) from public, anon;
grant execute on function public.my_notifications(integer) to authenticated;

create or replace function public.mark_my_notifications_read() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_count integer;
begin
  update public.notifications n set read_at = now() where n.user_id = auth.uid() and n.read_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.mark_my_notifications_read() from public, anon;
grant execute on function public.mark_my_notifications_read() to authenticated;

-- ------------------------------------------------------------------ cron

create or replace function public.cleanup_notifications() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_count integer;
begin
  delete from public.notifications n where n.created_at < now() - interval '90 days';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.cleanup_notifications() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('event-reminders-notify', '*/5 * * * *', 'select public.event_reminders_notify()');
-- 00:20 Bangkok = 17:20 UTC.
select cron.schedule('notifications-cleanup', '20 17 * * *', 'select public.cleanup_notifications()');
