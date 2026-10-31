-- v1.1 Phase 6: anonymous failure counts for the funnel on /admin/insights.
-- One row per Bangkok day, step and code. There is no user column on purpose:
-- the page shows where players get stuck, not who.
create table if not exists public.funnel_failures (
  day date not null,
  step text not null check (step in ('minecraft', 'verify')),
  code text not null check (code ~ '^[A-Z0-9_]{2,40}$'),
  count int not null default 1,
  primary key (day, step, code)
);
alter table public.funnel_failures enable row level security;
revoke all on public.funnel_failures from anon, authenticated;

-- Server only (service_role), so a player can't inflate the counts.
create or replace function public.record_funnel_failure(p_step text, p_code text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_step is null or p_step not in ('minecraft', 'verify') or p_code is null or p_code !~ '^[A-Z0-9_]{2,40}$' then
    raise exception 'INVALID';
  end if;
  insert into public.funnel_failures as f (day, step, code)
  values ((now() at time zone 'Asia/Bangkok')::date, p_step, p_code)
  on conflict (day, step, code) do update set count = f.count + 1;
end;
$$;
revoke all on function public.record_funnel_failure(text, text) from public, anon, authenticated;
grant execute on function public.record_funnel_failure(text, text) to service_role;

-- Same as 20261030000001_insights.sql except `failures`, now filled from
-- funnel_failures over the same window as the steps: [{day, step, code, n}].
-- The funnel has no "vs previous" comparison, so both cover p_days days
-- ending today (clamped 1..730; null = all time), not insights_since's 2 x p_days.
create or replace function public.insights_funnel(p_days int) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_since date := case when p_days is not null
    then (now() at time zone 'Asia/Bangkok')::date - least(greatest(p_days, 1), 730) + 1 end;
  v_steps jsonb;
  v_failures jsonb;
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
  select coalesce(jsonb_agg(jsonb_build_object('day', f.day, 'step', f.step, 'code', f.code, 'n', f.count)
      order by f.day, f.step, f.code), '[]'::jsonb)
    into v_failures from public.funnel_failures f where v_since is null or f.day >= v_since;
  return jsonb_build_object('steps', v_steps, 'failures', v_failures);
end;
$$;
revoke all on function public.insights_funnel(int) from public, anon;
grant execute on function public.insights_funnel(int) to authenticated;
