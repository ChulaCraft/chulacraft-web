-- One row per day of headline counts, so charts can show history that the
-- live tables can't (players removed or banned later still count on the day).
-- History starts the day this ships.
create table if not exists public.stats_daily (
  day date primary key,
  players int not null, verified int not null, guests int not null, unverified int not null,
  whitelisted int not null, banned int not null,
  created_at timestamptz not null default now()
);
alter table public.stats_daily enable row level security;
revoke all on public.stats_daily from anon, authenticated, service_role;

create or replace function public.snapshot_stats_daily()
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.stats_daily (day, players, verified, guests, unverified, whitelisted, banned)
  select (now() at time zone 'Asia/Bangkok')::date,
    count(*) filter (where coalesce(p.role, 'user') = 'user'),
    count(*) filter (where coalesce(p.role, 'user') = 'user' and public.is_chula_verified(u.id)),
    count(*) filter (where coalesce(p.role, 'user') = 'user' and not public.is_chula_verified(u.id) and p.guest_verified_at is not null),
    count(*) filter (where coalesce(p.role, 'user') = 'user' and not public.is_chula_verified(u.id) and p.guest_verified_at is null),
    (select count(*) from public.minecraft_registrations r where r.is_active and r.desired_whitelisted),
    count(*) filter (where public.is_banned(u.id))
  from auth.users u left join public.profiles p on p.user_id = u.id
  on conflict (day) do update set
    players = excluded.players, verified = excluded.verified, guests = excluded.guests,
    unverified = excluded.unverified, whitelisted = excluded.whitelisted, banned = excluded.banned, created_at = now();
end;
$$;
revoke all on function public.snapshot_stats_daily() from public, anon, authenticated;

create or replace function public.admin_stats_daily(p_days int default 90)
returns setof public.stats_daily language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;
  return query select * from public.stats_daily s
    where s.day > (now() at time zone 'Asia/Bangkok')::date - least(greatest(coalesce(p_days, 90), 1), 730)
    order by s.day;
end;
$$;
revoke all on function public.admin_stats_daily(int) from public, anon;
grant execute on function public.admin_stats_daily(int) to authenticated;

-- 23:55 Bangkok = 16:55 UTC.
create extension if not exists pg_cron;
select cron.schedule('stats-daily', '55 16 * * *', 'select public.snapshot_stats_daily()');
select public.snapshot_stats_daily();
