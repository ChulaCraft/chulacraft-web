-- v1.1 Phase 7: website errors captured in-house. Message, digest, route (path
-- only) and time: no cookies, tokens, emails, query strings or user ids. The
-- server scrubs the text before it gets here; 30-day retention.
create table if not exists public.app_errors (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  kind text not null check (kind in ('server', 'client')),
  route text not null check (char_length(route) <= 200),
  message text not null check (char_length(message) <= 500),
  digest text check (char_length(digest) <= 64),
  fingerprint text not null
);
create index if not exists app_errors_at_idx on public.app_errors (at desc);
alter table public.app_errors enable row level security;
revoke all on public.app_errors from anon, authenticated;

-- Server only (service_role), so a browser can't write rows directly; the
-- same-origin, rate-limited /api/client-errors route is the only way in.
-- Long text is cut, never refused: losing an error report helps nobody.
-- The fingerprint is sha1(kind | message with digits as '#' | route), the
-- same as fingerprint() in src/lib/app-errors.ts.
create or replace function public.record_app_error(p_kind text, p_route text, p_message text, p_digest text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_route text := left(coalesce(p_route, ''), 200);
  v_message text := left(coalesce(p_message, ''), 500);
begin
  if p_kind is null or p_kind not in ('server', 'client') then raise exception 'INVALID'; end if;
  insert into public.app_errors (kind, route, message, digest, fingerprint)
  values (p_kind, v_route, v_message, left(p_digest, 64),
    encode(extensions.digest(p_kind || '|' || regexp_replace(v_message, '[0-9]+', '#', 'g') || '|' || v_route, 'sha1'), 'hex'));
end;
$$;
revoke all on function public.record_app_error(text, text, text, text) from public, anon, authenticated;
grant execute on function public.record_app_error(text, text, text, text) to service_role;

-- Rows in the last p_minutes: the error-spike signal on /api/ops/health.
create or replace function public.app_errors_recent(p_minutes int) returns int
language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.app_errors where at > now() - make_interval(mins => greatest(coalesce(p_minutes, 5), 0));
$$;
revoke all on function public.app_errors_recent(int) from public, anon, authenticated;
grant execute on function public.app_errors_recent(int) to service_role;

-- The error feed on /admin/ops/website: one row per fingerprint, newest first.
create or replace function public.admin_app_errors(p_hours int default 24)
returns table (fingerprint text, message text, route text, kind text, n bigint, first_at timestamptz, last_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.staff_can('admin') then raise exception 'FORBIDDEN'; end if;
  return query
    select e.fingerprint, (array_agg(e.message order by e.at desc))[1], (array_agg(e.route order by e.at desc))[1],
           (array_agg(e.kind order by e.at desc))[1], count(*), min(e.at), max(e.at)
    from public.app_errors e
    where e.at > now() - make_interval(hours => least(greatest(coalesce(p_hours, 24), 1), 720))
    group by e.fingerprint
    order by max(e.at) desc
    limit 200;
end;
$$;
revoke all on function public.admin_app_errors(int) from public, anon;
grant execute on function public.admin_app_errors(int) to authenticated;

create or replace function public.cleanup_app_errors() returns integer
language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  delete from public.app_errors where at < now() - interval '30 days';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.cleanup_app_errors() from public, anon, authenticated;

create extension if not exists pg_cron;
-- 00:40 Bangkok = 17:40 UTC.
select cron.schedule('app-errors-cleanup', '40 17 * * *', 'select public.cleanup_app_errors()');
