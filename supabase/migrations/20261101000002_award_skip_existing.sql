-- v1.1 T1.2 (F4): achievement_awards has no unique key, so admin_award inserted a
-- duplicate on a re-award. Skip players who already hold the achievement, under
-- the same per-achievement lock, and return how many were really inserted.

create or replace function public.admin_award(p_achievement_id uuid, p_event_id uuid, p_awarded_on date, p_user_ids uuid[])
returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_on date;
  v_inserted int;
begin
  if not public.staff_can('community') then raise exception 'FORBIDDEN'; end if;

  if not exists (select 1 from public.achievements a where a.id = p_achievement_id) then raise exception 'NOT_FOUND'; end if;

  if p_event_id is not null then
    select (e.starts_at at time zone 'Asia/Bangkok')::date into v_on from public.events e where e.id = p_event_id;
    if v_on is null then raise exception 'NOT_FOUND'; end if;
  else
    v_on := coalesce(p_awarded_on, current_date);
  end if;

  perform pg_advisory_xact_lock(hashtextextended('award:' || p_achievement_id::text, 0));

  with targets as (
    select distinct u.id
    from unnest(p_user_ids) as t(user_id)
    join auth.users u on u.id = t.user_id
    where not exists (select 1 from public.achievement_awards w where w.user_id = u.id and w.achievement_id = p_achievement_id)
  ), ins as (
    insert into public.achievement_awards (user_id, achievement_id, event_id, awarded_on, awarded_by)
    select t.id, p_achievement_id, p_event_id, v_on, v_actor from targets t
    returning user_id, id
  )
  insert into public.account_change_log (actor_user_id, target_user_id, entity, entity_id, field, old_value, new_value, source)
  select v_actor, ins.user_id, 'achievement_awards', ins.id, 'awarded_on', null, v_on::text, 'admin' from ins;

  get diagnostics v_inserted = row_count;

  return v_inserted;
end;
$$;
