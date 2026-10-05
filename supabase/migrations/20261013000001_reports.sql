-- Player reports (/player/[id] → /admin/reports). Like bans, the table is
-- reachable only through the definer RPCs below. The rate limit is a count over
-- the table itself, so it survives restarts and needs no extra bucket.

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('grief', 'cheat', 'harassment', 'other')),
  details text not null check (length(details) between 10 and 2000),
  evidence_url text check (evidence_url ~ '^https://' and length(evidence_url) <= 500),
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  handled_by uuid references auth.users(id) on delete set null,
  admin_note text check (length(admin_note) <= 1000),
  created_at timestamptz not null default now(),
  handled_at timestamptz
);
-- One open report per reporter and target: a second one adds nothing to the queue.
create unique index reports_one_open_per_pair on public.reports (reporter_id, target_user_id) where status = 'open';
create index reports_reporter_idx on public.reports (reporter_id, created_at desc);
create index reports_open_idx on public.reports (created_at) where status = 'open';
alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;

create function public.report_player(p_target uuid, p_category text, p_details text, p_evidence_url text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_target = v_uid then raise exception 'INVALID_TARGET'; end if;
  if not exists (select 1 from auth.users u where u.id = p_target) then raise exception 'NOT_FOUND'; end if;
  if p_category is null or p_category not in ('grief', 'cheat', 'harassment', 'other')
    or length(btrim(coalesce(p_details, ''))) not between 10 and 2000
    or (nullif(btrim(p_evidence_url), '') is not null and (btrim(p_evidence_url) !~ '^https://' or length(btrim(p_evidence_url)) > 500)) then
    raise exception 'INVALID';
  end if;
  -- Serialize this reporter so two tabs can't both slip under the limit.
  perform 1 from public.profiles p where p.user_id = v_uid for update;
  if (select count(*) from public.reports r where r.reporter_id = v_uid and r.created_at > now() - interval '1 day') >= 5 then
    raise exception 'RATE_LIMITED';
  end if;
  begin
    insert into public.reports (reporter_id, target_user_id, category, details, evidence_url)
      values (v_uid, p_target, p_category, btrim(p_details), nullif(btrim(p_evidence_url), ''));
  exception when unique_violation then
    raise exception 'ALREADY_REPORTED';
  end;
end;
$$;
revoke all on function public.report_player(uuid, text, text, text) from public, anon;
grant execute on function public.report_player(uuid, text, text, text) to authenticated;

create function public.admin_list_reports(p_status text default 'open')
returns table (
  id uuid, created_at timestamptz, category text, details text, evidence_url text, status text,
  admin_note text, handled_at timestamptz, handled_by_name text,
  reporter_id uuid, reporter_name text, target_user_id uuid, target_name text,
  target_banned boolean, target_open_reports bigint
)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;
  return query
  select r.id, r.created_at, r.category, r.details, r.evidence_url, r.status,
    r.admin_note, r.handled_at, public.admin_display_name(r.handled_by),
    r.reporter_id, public.admin_display_name(r.reporter_id), r.target_user_id, public.admin_display_name(r.target_user_id),
    public.is_banned(r.target_user_id),
    (select count(*) from public.reports o where o.target_user_id = r.target_user_id and o.status = 'open')
  from public.reports r
  where r.status = coalesce(p_status, 'open')
  order by case when r.status = 'open' then r.created_at end asc, r.handled_at desc
  limit 100;
end;
$$;
revoke all on function public.admin_list_reports(text) from public, anon;
grant execute on function public.admin_list_reports(text) to authenticated;

create function public.admin_handle_report(p_report_id uuid, p_status text, p_note text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_target uuid;
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;
  if p_status is null or p_status not in ('actioned', 'dismissed') or length(p_note) > 1000 then raise exception 'INVALID'; end if;
  update public.reports r
    set status = p_status, admin_note = nullif(btrim(p_note), ''), handled_by = v_actor, handled_at = now()
    where r.id = p_report_id and r.status = 'open'
    returning r.target_user_id into v_target;
  if not found then raise exception 'NOT_FOUND'; end if;
  perform public.log_account_change(v_actor, v_target, 'reports', p_report_id, 'report', null, p_status, 'admin');
end;
$$;
revoke all on function public.admin_handle_report(uuid, text, text) from public, anon;
grant execute on function public.admin_handle_report(uuid, text, text) to authenticated;
