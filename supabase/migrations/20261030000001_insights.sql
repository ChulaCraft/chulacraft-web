-- v1.1 Phase 6: /admin/insights, one read-only RPC per tab.
--
--   function            area         payload
--   insights_players    admin        snapshots, signups, faculty
--   insights_funnel     admin        steps, failures (failures from 20261030000002)
--   insights_events     community    events, attendance
--   insights_community  moderation   tiers, top, reports, appeals
--   insights_staff      admin        actions
--
-- p_days is the range (7, 30, 90; null = all time), clamped to 1..730 like
-- admin_stats_daily. Each series (not the funnel, see below) covers 2 x p_days
-- Bangkok days ending today, so the page compares the range with the one
-- before it from one call. Days
-- are Asia/Bangkok days, the same as snapshot_stats_daily, and come back as
-- 'YYYY-MM-DD'. Count series list only days with a count (the page zero-fills);
-- snapshots list the stats_daily rows that exist (a missing day is a gap).

-- First Bangkok day in the window; null = no lower bound. Internal, ungranted.
create or replace function public.insights_since(p_days int) returns date
language sql stable set search_path = '' as $$
  -- greatest() skips nulls, so null needs its own case.
  select case when p_days is not null
    then (now() at time zone 'Asia/Bangkok')::date - 2 * least(greatest(p_days, 1), 730) + 1 end;
$$;
revoke all on function public.insights_since(int) from public, anon, authenticated;

-- snapshots: stats_daily rows; signups: non-staff accounts by the day they were
-- created; faculty: every current player by faculty (not ranged), the 12
-- largest and then 'Other', no or empty faculty = 'Not set'.
create or replace function public.insights_players(p_days int) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_since date := public.insights_since(p_days);
begin
  if not public.staff_can('admin') then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
    'snapshots', coalesce((
      select jsonb_agg(jsonb_build_object('day', s.day, 'players', s.players, 'verified', s.verified, 'guests', s.guests,
        'unverified', s.unverified, 'whitelisted', s.whitelisted, 'banned', s.banned) order by s.day)
      from public.stats_daily s
      where v_since is null or s.day >= v_since), '[]'::jsonb),
    'signups', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.day, 'n', d.n) order by d.day)
      from (
        select (u.created_at at time zone 'Asia/Bangkok')::date as day, count(*)::int as n
        from auth.users u left join public.profiles p on p.user_id = u.id
        where coalesce(p.role, 'user') = 'user'
          and (v_since is null or (u.created_at at time zone 'Asia/Bangkok')::date >= v_since)
        group by 1) d), '[]'::jsonb),
    'faculty', coalesce((
      select jsonb_agg(jsonb_build_object('faculty', g.faculty, 'n', g.n) order by g.other, g.n desc, g.faculty)
      from (
        select case when r.rank > 12 then 'Other' else r.faculty end as faculty, r.rank > 12 as other, sum(r.n)::int as n
        from (
          select f.faculty, f.n, row_number() over (order by f.n desc, f.faculty) as rank
          from (
            select coalesce(nullif(p.faculty, ''), 'Not set') as faculty, count(*) as n
            from public.profiles p where p.role = 'user' group by 1) f) r
        group by 1, 2) g), '[]'::jsonb));
end;
$$;
revoke all on function public.insights_players(int) from public, anon;
grant execute on function public.insights_players(int) to authenticated;

-- Cohort funnel: non-staff accounts created in the last p_days days (totals
-- only, no "vs previous", so not insights_since's 2 x p_days). Each step counts
-- the cohort members in that state now who also hold every earlier step, so the
-- counts never go up down the funnel.
create or replace function public.insights_funnel(p_days int) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_since date := case when p_days is not null
    then (now() at time zone 'Asia/Bangkok')::date - least(greatest(p_days, 1), 730) + 1 end;
  v_steps jsonb;
begin
  if not public.staff_can('admin') then raise exception 'FORBIDDEN'; end if;
  with cohort as (
    select u.id,
      exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'discord') as discord,
      (public.is_chula_verified(u.id) or p.guest_verified_at is not null) as verified,
      exists (select 1 from public.minecraft_registrations r where r.user_id = u.id) as registered,
      exists (select 1 from public.minecraft_registrations r where r.user_id = u.id and r.whitelisted_at is not null) as whitelisted
    from auth.users u left join public.profiles p on p.user_id = u.id
    where coalesce(p.role, 'user') = 'user'
      and (v_since is null or (u.created_at at time zone 'Asia/Bangkok')::date >= v_since)
  ), counts as (
    select count(*)::int as signed_in,
      count(*) filter (where discord)::int as discord,
      count(*) filter (where discord and verified)::int as verified,
      count(*) filter (where discord and verified and registered)::int as registered,
      count(*) filter (where discord and verified and registered and whitelisted)::int as whitelisted
    from cohort
  )
  select jsonb_build_array(
      jsonb_build_object('step', 'signed_in', 'n', c.signed_in),
      jsonb_build_object('step', 'discord', 'n', c.discord),
      jsonb_build_object('step', 'verified', 'n', c.verified),
      jsonb_build_object('step', 'registered', 'n', c.registered),
      jsonb_build_object('step', 'whitelisted', 'n', c.whitelisted))
    into v_steps from counts c;
  return jsonb_build_object('steps', v_steps, 'failures', '[]'::jsonb);
end;
$$;
revoke all on function public.insights_funnel(int) from public, anon;
grant execute on function public.insights_funnel(int) to authenticated;

-- Published events starting in the window (up to today), oldest first, with
-- interest and attendance by method. attendance: attendees per Bangkok day of
-- the event's start (not of the check-in, so the Phase 5 backfill doesn't pile
-- up on the day it ran).
create or replace function public.insights_events(p_days int) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_since date := public.insights_since(p_days);
  v_today date := (now() at time zone 'Asia/Bangkok')::date;
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;
  return (
    with ev as (
      select e.id, e.name, e.starts_at, (e.starts_at at time zone 'Asia/Bangkok')::date as day,
        (select count(*) from public.event_interests i where i.event_id = e.id)::int as interest,
        (select count(*) from public.event_attendance a where a.event_id = e.id)::int as attendance,
        (select count(*) from public.event_attendance a where a.event_id = e.id and a.method = 'self')::int as self,
        (select count(*) from public.event_attendance a where a.event_id = e.id and a.method = 'staff')::int as staff,
        (select count(*) from public.event_attendance a where a.event_id = e.id and a.method = 'backfill')::int as backfill
      from public.events e
      where e.status = 'published'
        and (e.starts_at at time zone 'Asia/Bangkok')::date <= v_today
        and (v_since is null or (e.starts_at at time zone 'Asia/Bangkok')::date >= v_since)
    )
    select jsonb_build_object(
      'events', coalesce((
        select jsonb_agg(jsonb_build_object('id', ev.id, 'name', ev.name, 'starts_at', ev.starts_at, 'interest', ev.interest,
          'attendance', ev.attendance, 'self', ev.self, 'staff', ev.staff, 'backfill', ev.backfill) order by ev.starts_at, ev.id)
        from ev), '[]'::jsonb),
      'attendance', coalesce((
        select jsonb_agg(jsonb_build_object('day', d.day, 'n', d.n) order by d.day)
        from (select ev.day, sum(ev.attendance)::int as n from ev group by ev.day having sum(ev.attendance) > 0) d), '[]'::jsonb)));
end;
$$;
revoke all on function public.insights_events(int) from public, anon;
grant execute on function public.insights_events(int) to authenticated;

-- tiers and top are current totals over published badges (not ranged):
-- owners = distinct holders, badges = published badges in the tier. reports
-- and appeals: opened by created_at day, resolved (handled_at) / decided
-- (decided_at) by that day.
create or replace function public.insights_community(p_days int) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_since date := public.insights_since(p_days);
begin
  if not public.staff_can('moderation') then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
    'tiers', (
      select jsonb_agg(jsonb_build_object('tier', t.tier,
          'owners', (select count(distinct w.user_id) from public.achievement_awards w
                     join public.achievements a on a.id = w.achievement_id and a.status = 'published' and a.tier = t.tier)::int,
          'badges', (select count(*) from public.achievements a where a.status = 'published' and a.tier = t.tier)::int)
        order by t.o)
      from unnest(array['common', 'rare', 'epic', 'legendary']) with ordinality t(tier, o)),
    'top', coalesce((
      select jsonb_agg(jsonb_build_object('id', x.id, 'name', x.name, 'tier', x.tier, 'owners', x.owners) order by x.owners desc, x.name, x.id)
      from (
        select a.id, a.name, a.tier, count(distinct w.user_id)::int as owners
        from public.achievements a join public.achievement_awards w on w.achievement_id = a.id
        where a.status = 'published'
        group by a.id
        order by owners desc, a.name, a.id
        limit 10) x), '[]'::jsonb),
    'reports', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.day, 'opened', d.opened, 'resolved', d.resolved) order by d.day)
      from (
        select e.day, count(*) filter (where e.kind = 'opened')::int as opened, count(*) filter (where e.kind = 'resolved')::int as resolved
        from (
          select (r.created_at at time zone 'Asia/Bangkok')::date as day, 'opened' as kind from public.reports r
          union all
          select (r.handled_at at time zone 'Asia/Bangkok')::date, 'resolved' from public.reports r where r.handled_at is not null) e
        where v_since is null or e.day >= v_since
        group by e.day) d), '[]'::jsonb),
    'appeals', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.day, 'opened', d.opened, 'decided', d.decided) order by d.day)
      from (
        select e.day, count(*) filter (where e.kind = 'opened')::int as opened, count(*) filter (where e.kind = 'decided')::int as decided
        from (
          select (a.created_at at time zone 'Asia/Bangkok')::date as day, 'opened' as kind from public.appeals a
          union all
          select (a.decided_at at time zone 'Asia/Bangkok')::date, 'decided' from public.appeals a where a.decided_at is not null) e
        where v_since is null or e.day >= v_since
        group by e.day) d), '[]'::jsonb));
end;
$$;
revoke all on function public.insights_community(int) from public, anon;
grant execute on function public.insights_community(int) to authenticated;

-- Staff changes (account_change_log source 'admin') per Bangkok day and entity.
create or replace function public.insights_staff(p_days int) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_since date := public.insights_since(p_days);
begin
  if not public.staff_can('admin') then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
    'actions', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.day, 'entity', d.entity, 'n', d.n) order by d.day, d.entity)
      from (
        select (l.created_at at time zone 'Asia/Bangkok')::date as day, l.entity, count(*)::int as n
        from public.account_change_log l
        where l.source = 'admin'
          and (v_since is null or (l.created_at at time zone 'Asia/Bangkok')::date >= v_since)
        group by 1, 2) d), '[]'::jsonb));
end;
$$;
revoke all on function public.insights_staff(int) from public, anon;
grant execute on function public.insights_staff(int) to authenticated;
