-- v1.1 Phase 7: Discord bot settings and automatic jobs (/admin/ops/bot).
--
-- Pull-based, like the Phase 5 queues (docs/bot-contract-ops.md). On startup
-- the bot registers the settings it reads and the jobs it runs (bot_register).
-- It reads bot_config() on every poll: a setting's value when an admin set one,
-- otherwise the default the bot registered from its .env. It reports whether it
-- could use a channel/role (bot_settings_report) and every job run
-- (bot_job_report). Secrets stay in the bot's .env: bot_register refuses any key
-- that looks like one, so a mistake in the bot can't put the token on a page.
--
-- Admins edit values and pause jobs through admin_* RPCs, each logged. A role a
-- badge may give can't be a bot role, and the reverse (admin_save_discord_role
-- re-created below), so the database now enforces what the Phase 5 contract
-- left to the bot.

alter table public.account_change_log drop constraint if exists account_change_log_entity_check;
alter table public.account_change_log add constraint account_change_log_entity_check check (entity in (
  'minecraft_registrations', 'profiles', 'cu_sso_identities', 'chula_claims', 'identities', 'achievements', 'events',
  'achievement_awards', 'announcements', 'server_console', 'bans', 'appeals', 'reports', 'banner_grants', 'banners',
  'gallery_groups', 'gallery_images', 'team_generations', 'team_members', 'site_pages', 'site_settings',
  'discord_assignable_roles', 'event_attendance', 'ops', 'bot_settings', 'bot_jobs'));

-- ------------------------------------------------------------------ tables

create table if not exists public.bot_settings (
  key text primary key check (key ~ '^[a-z][a-z0-9_]{1,63}$'),
  kind text not null check (kind in ('guild', 'channel', 'role', 'role_list', 'user_list', 'url', 'number', 'boolean', 'text', 'text_list')),
  applies text not null default 'live' check (applies in ('live', 'restart')),
  min_value bigint,
  max_value bigint,
  label text not null check (char_length(label) between 1 and 120),
  description text not null default '' check (char_length(description) <= 500),
  -- The bot's .env value; null when the .env leaves it blank.
  default_value text check (char_length(default_value) <= 4000),
  -- Null = use the default.
  value text check (char_length(value) <= 4000),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz,
  -- The bot's last check of the effective value; null until it checks.
  bot_status text check (bot_status in ('ok', 'invalid')),
  bot_error text check (char_length(bot_error) <= 500),
  checked_at timestamptz,
  -- The last bot_register that sent this key.
  registered_at timestamptz not null default now(),
  retired_at timestamptz
);
alter table public.bot_settings enable row level security;
revoke all on public.bot_settings from anon, authenticated;

create table if not exists public.bot_jobs (
  name text primary key check (name ~ '^[a-z][a-z0-9_]{1,63}$'),
  label text not null check (char_length(label) between 1 and 120),
  -- Null for event-driven jobs, which are never overdue.
  interval_seconds integer check (interval_seconds > 0),
  enabled boolean not null default true,
  last_started_at timestamptz,
  last_finished_at timestamptz,
  last_ok boolean,
  last_items integer,
  last_error text check (char_length(last_error) <= 500),
  consecutive_failures integer not null default 0,
  -- The last bot_register that sent this job (a fresh job is "never run", not overdue).
  registered_at timestamptz not null default now(),
  retired_at timestamptz
);
alter table public.bot_jobs enable row level security;
revoke all on public.bot_jobs from anon, authenticated;

create table if not exists public.bot_job_runs (
  id bigint generated always as identity primary key,
  job text not null references public.bot_jobs(name) on delete cascade,
  started_at timestamptz not null,
  finished_at timestamptz,
  ok boolean not null,
  items integer check (items >= 0),
  error text check (char_length(error) <= 500)
);
create index if not exists bot_job_runs_job_idx on public.bot_job_runs (job, started_at desc);
alter table public.bot_job_runs enable row level security;
revoke all on public.bot_job_runs from anon, authenticated;

-- Internal: the effective value split into IDs, for the role-safety checks.
create or replace function public.bot_setting_ids(p_value text)
returns text[] language sql immutable set search_path = '' as $$
  select coalesce(regexp_split_to_array(nullif(btrim(p_value), ''), '\s*,\s*'), '{}');
$$;
revoke all on function public.bot_setting_ids(text) from public, anon, authenticated;

-- --------------------------------------------------------------- bot side

-- Startup: [{key, kind, applies?, label, description?, default_value?, min_value?, max_value?}]
-- and [{name, label, interval_seconds?}]. Never touches value or enabled. Keys
-- and jobs not sent are retired; ones that come back are un-retired.
create or replace function public.bot_register(p_settings jsonb, p_jobs jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_item jsonb;
  v_keys text[] := '{}';
  v_names text[] := '{}';
begin
  if jsonb_typeof(p_settings) is distinct from 'array' or jsonb_typeof(p_jobs) is distinct from 'array' then
    raise exception 'INVALID';
  end if;

  for v_item in select x from jsonb_array_elements(p_settings) x loop
    if jsonb_typeof(v_item) is distinct from 'object'
      or coalesce(v_item->>'key', '') !~ '^[a-z][a-z0-9_]{1,63}$'
      -- No secrets on a web page, ever.
      or v_item->>'key' ~ '(token|secret|password|key$)'
      or coalesce(v_item->>'kind', '') not in ('guild', 'channel', 'role', 'role_list', 'user_list', 'url', 'number', 'boolean', 'text', 'text_list')
      or coalesce(v_item->>'applies', 'live') not in ('live', 'restart')
      or char_length(coalesce(v_item->>'label', '')) not between 1 and 120
      or char_length(coalesce(v_item->>'description', '')) > 500
      or char_length(coalesce(v_item->>'default_value', '')) > 4000
      or coalesce(v_item->>'min_value', '0') !~ '^-?[0-9]{1,15}$'
      or coalesce(v_item->>'max_value', '0') !~ '^-?[0-9]{1,15}$' then
      raise exception 'INVALID';
    end if;
    insert into public.bot_settings as s (key, kind, applies, min_value, max_value, label, description, default_value, registered_at, retired_at)
    values (v_item->>'key', v_item->>'kind', coalesce(v_item->>'applies', 'live'), (v_item->>'min_value')::bigint,
      (v_item->>'max_value')::bigint, v_item->>'label', coalesce(v_item->>'description', ''), v_item->>'default_value', now(), null)
    on conflict (key) do update set kind = excluded.kind, applies = excluded.applies, min_value = excluded.min_value,
      max_value = excluded.max_value, label = excluded.label, description = excluded.description,
      default_value = excluded.default_value, registered_at = now(), retired_at = null;
    v_keys := v_keys || (v_item->>'key');
  end loop;

  for v_item in select x from jsonb_array_elements(p_jobs) x loop
    if jsonb_typeof(v_item) is distinct from 'object'
      or coalesce(v_item->>'name', '') !~ '^[a-z][a-z0-9_]{1,63}$'
      or char_length(coalesce(v_item->>'label', '')) not between 1 and 120
      or coalesce(v_item->>'interval_seconds', '1') !~ '^[1-9][0-9]{0,8}$' then
      raise exception 'INVALID';
    end if;
    insert into public.bot_jobs as j (name, label, interval_seconds, registered_at, retired_at)
    values (v_item->>'name', v_item->>'label', (v_item->>'interval_seconds')::integer, now(), null)
    on conflict (name) do update set label = excluded.label, interval_seconds = excluded.interval_seconds,
      registered_at = now(), retired_at = null;
    v_names := v_names || (v_item->>'name');
  end loop;

  update public.bot_settings s set retired_at = now() where s.retired_at is null and not (s.key = any(v_keys));
  update public.bot_jobs j set retired_at = now() where j.retired_at is null and not (j.name = any(v_names));
end;
$$;
revoke all on function public.bot_register(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.bot_register(jsonb, jsonb) to service_role;

-- Every poll: {settings: {key: effective value or null}, paused_jobs: [name]}.
create or replace function public.bot_config()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'settings', coalesce((select jsonb_object_agg(s.key, coalesce(s.value, s.default_value))
                            from public.bot_settings s where s.retired_at is null), '{}'::jsonb),
    'paused_jobs', coalesce((select jsonb_agg(j.name order by j.name)
                               from public.bot_jobs j where not j.enabled and j.retired_at is null), '[]'::jsonb));
$$;
revoke all on function public.bot_config() from public, anon, authenticated;
grant execute on function public.bot_config() to service_role;

-- After applying settings: [{key, ok, error?, value?}]. With `value`, the report
-- only counts if it is still the effective value, so a check of an old value
-- never marks a newer one OK. Unknown keys are skipped. Returns rows updated.
create or replace function public.bot_settings_report(p_items jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_item jsonb;
  v_count integer := 0;
  v_n integer;
begin
  if jsonb_typeof(p_items) is distinct from 'array' then raise exception 'INVALID'; end if;
  for v_item in select x from jsonb_array_elements(p_items) x loop
    if jsonb_typeof(v_item->'key') is distinct from 'string' or jsonb_typeof(v_item->'ok') is distinct from 'boolean' then
      raise exception 'INVALID';
    end if;
    update public.bot_settings s
      set bot_status = case when (v_item->>'ok')::boolean then 'ok' else 'invalid' end,
          bot_error = case when (v_item->>'ok')::boolean then null else left(coalesce(v_item->>'error', 'rejected'), 500) end,
          checked_at = now()
      where s.key = v_item->>'key'
        and (not (v_item ? 'value') or coalesce(s.value, s.default_value) is not distinct from v_item->>'value');
    get diagnostics v_n = row_count;
    v_count := v_count + v_n;
  end loop;
  return v_count;
end;
$$;
revoke all on function public.bot_settings_report(jsonb) from public, anon, authenticated;
grant execute on function public.bot_settings_report(jsonb) to service_role;

-- Every run, including no-op runs (items 0). A late report of an older run is
-- stored but doesn't move last_*.
create or replace function public.bot_job_report(
  p_job text, p_started_at timestamptz, p_finished_at timestamptz, p_ok boolean, p_items integer, p_error text
) returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_started_at is null or p_ok is null or (p_items is not null and p_items < 0) then raise exception 'INVALID'; end if;
  if not exists (select 1 from public.bot_jobs j where j.name = p_job) then raise exception 'NOT_FOUND'; end if;

  insert into public.bot_job_runs (job, started_at, finished_at, ok, items, error)
  values (p_job, p_started_at, p_finished_at, p_ok, p_items, left(case when p_ok then null else coalesce(p_error, 'failed') end, 500));

  update public.bot_jobs j set
    last_started_at = p_started_at, last_finished_at = p_finished_at, last_ok = p_ok, last_items = p_items,
    last_error = left(case when p_ok then null else coalesce(p_error, 'failed') end, 500),
    consecutive_failures = case when p_ok then 0 else j.consecutive_failures + 1 end
  where j.name = p_job and p_started_at >= coalesce(j.last_started_at, '-infinity');
end;
$$;
revoke all on function public.bot_job_report(text, timestamptz, timestamptz, boolean, integer, text) from public, anon, authenticated;
grant execute on function public.bot_job_report(text, timestamptz, timestamptz, boolean, integer, text) to service_role;

create or replace function public.cleanup_bot_job_runs() returns integer
language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  delete from public.bot_job_runs where started_at < now() - interval '14 days';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.cleanup_bot_job_runs() from public, anon, authenticated;

create extension if not exists pg_cron;
-- 00:50 Bangkok = 17:50 UTC.
select cron.schedule('bot-job-runs-cleanup', '50 17 * * *', 'select public.cleanup_bot_job_runs()');

-- ------------------------------------------------------------- admin side

-- Everything /admin/ops/bot shows: settings, jobs with their last 20 runs, and
-- what the bot's queues hold. The queue counts are capped by each queue's own
-- limit (100 role changes, 20 announcements).
create or replace function public.admin_bot_overview()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.staff_can('admin') then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
    'settings', coalesce((
      select jsonb_agg(jsonb_build_object(
        'key', s.key, 'kind', s.kind, 'applies', s.applies, 'min_value', s.min_value, 'max_value', s.max_value,
        'label', s.label, 'description', s.description, 'default_value', s.default_value, 'value', s.value,
        'updated_by_name', case when s.updated_by is null then null else public.player_display_name(s.updated_by) end,
        'updated_at', s.updated_at, 'bot_status', s.bot_status, 'bot_error', s.bot_error, 'checked_at', s.checked_at,
        'retired_at', s.retired_at) order by s.label, s.key)
      from public.bot_settings s), '[]'::jsonb),
    'jobs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', j.name, 'label', j.label, 'interval_seconds', j.interval_seconds, 'enabled', j.enabled,
        'last_started_at', j.last_started_at, 'last_finished_at', j.last_finished_at, 'last_ok', j.last_ok,
        'last_items', j.last_items, 'last_error', j.last_error, 'consecutive_failures', j.consecutive_failures,
        'registered_at', j.registered_at, 'retired_at', j.retired_at,
        'runs', coalesce((
          select jsonb_agg(jsonb_build_object('started_at', r.started_at, 'finished_at', r.finished_at, 'ok', r.ok,
            'items', r.items, 'error', r.error) order by r.started_at desc)
          from (select * from public.bot_job_runs r where r.job = j.name order by r.started_at desc limit 20) r), '[]'::jsonb))
        order by j.label, j.name)
      from public.bot_jobs j), '[]'::jsonb),
    'backlog', jsonb_build_object(
      'role_changes', (select count(*) from public.discord_role_queue()),
      'announcements', (select count(*) from public.announcements_discord_queue()),
      'reminders_due', (select count(*) from public.event_reminders_due())));
end;
$$;
revoke all on function public.admin_bot_overview() from public, anon;
grant execute on function public.admin_bot_overview() to authenticated;

-- Validates by kind (src/lib/bot-admin.ts validateSettingValue mirrors this for
-- form errors). Blank/null resets to the default. A change clears the bot's
-- check until it looks again.
create or replace function public.admin_set_bot_setting(p_key text, p_value text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_row public.bot_settings%rowtype;
  v_new text := nullif(btrim(coalesce(p_value, '')), '');
  v_items text[];
  v_num bigint;
begin
  if not public.staff_can('admin') then raise exception 'FORBIDDEN'; end if;
  select * into v_row from public.bot_settings s where s.key = p_key for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_row.retired_at is not null then raise exception 'RETIRED'; end if;

  if v_new is not null then
    case
      when v_row.kind in ('guild', 'channel', 'role') then
        if v_new !~ '^[0-9]{17,20}$' then raise exception 'INVALID'; end if;
      when v_row.kind in ('role_list', 'user_list') then
        v_items := regexp_split_to_array(v_new, '\s*,\s*');
        if cardinality(v_items) > 25 or exists (select 1 from unnest(v_items) i where i !~ '^[0-9]{17,20}$') then
          raise exception 'INVALID';
        end if;
        v_new := array_to_string(v_items, ',');
      when v_row.kind = 'url' then
        if v_new !~* '^https?://\S+$' or char_length(v_new) > 300 then raise exception 'INVALID'; end if;
      when v_row.kind = 'number' then
        if v_new !~ '^-?[0-9]{1,15}$' then raise exception 'INVALID'; end if;
        v_num := v_new::bigint;
        if v_num < coalesce(v_row.min_value, v_num) or v_num > coalesce(v_row.max_value, v_num) then raise exception 'INVALID'; end if;
        v_new := v_num::text;
      when v_row.kind = 'boolean' then
        v_new := lower(v_new);
        if v_new not in ('true', 'false') then raise exception 'INVALID'; end if;
      when v_row.kind = 'text' then
        if char_length(v_new) > 500 or v_new ~ '[\r\n]' then raise exception 'INVALID'; end if;
      when v_row.kind = 'text_list' then
        v_items := regexp_split_to_array(v_new, '\s*,\s*');
        if cardinality(v_items) > 25 or exists (select 1 from unnest(v_items) i where char_length(i) not between 1 and 120 or i ~ '[\r\n]') then
          raise exception 'INVALID';
        end if;
        v_new := array_to_string(v_items, ',');
    end case;

    if v_row.kind in ('role', 'role_list') and exists (
      select 1 from public.discord_assignable_roles r where r.role_id = any(public.bot_setting_ids(v_new))
    ) then
      raise exception 'ROLE_IN_USE_BY_BADGE';
    end if;
  end if;

  if v_row.value is distinct from v_new then
    update public.bot_settings s set value = v_new, updated_by = auth.uid(), updated_at = now(),
      bot_status = null, bot_error = null, checked_at = null
    where s.key = p_key;
    perform public.log_account_change(auth.uid(), auth.uid(), 'bot_settings', null, p_key, v_row.value, v_new, 'admin');
  end if;
end;
$$;
revoke all on function public.admin_set_bot_setting(text, text) from public, anon;
grant execute on function public.admin_set_bot_setting(text, text) to authenticated;

create or replace function public.admin_set_bot_job_enabled(p_name text, p_enabled boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_row public.bot_jobs%rowtype;
begin
  if not public.staff_can('admin') then raise exception 'FORBIDDEN'; end if;
  if p_enabled is null then raise exception 'INVALID'; end if;
  select * into v_row from public.bot_jobs j where j.name = p_name for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_row.retired_at is not null then raise exception 'RETIRED'; end if;
  if v_row.enabled is distinct from p_enabled then
    update public.bot_jobs j set enabled = p_enabled where j.name = p_name;
    perform public.log_account_change(auth.uid(), auth.uid(), 'bot_jobs', null, p_name,
      case when v_row.enabled then 'running' else 'paused' end, case when p_enabled then 'running' else 'paused' end, 'admin');
  end if;
end;
$$;
revoke all on function public.admin_set_bot_job_enabled(text, boolean) from public, anon;
grant execute on function public.admin_set_bot_job_enabled(text, boolean) to authenticated;

-- ------------------------------------------------- badge roles vs bot roles

-- Same as 20261026000001_achievement_rarity.sql, plus: a role the bot uses for a
-- live role or role-list setting (its value, or the .env default) can't be put
-- on the badge allowlist.
create or replace function public.admin_save_discord_role(p_role_id text, p_label text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_role text := btrim(coalesce(p_role_id, ''));
  v_label text := btrim(coalesce(p_label, ''));
  v_old text;
begin
  if not public.staff_can('admin') then raise exception 'FORBIDDEN'; end if;
  if v_role !~ '^[0-9]{17,20}$' or char_length(v_label) not between 1 and 60 then raise exception 'INVALID'; end if;
  if exists (
    select 1 from public.bot_settings s
    where s.kind in ('role', 'role_list') and s.retired_at is null
      and v_role = any(public.bot_setting_ids(coalesce(s.value, s.default_value)))
  ) then
    raise exception 'ROLE_MANAGED_BY_BOT';
  end if;
  select r.label into v_old from public.discord_assignable_roles r where r.role_id = v_role for update;
  if not found then
    insert into public.discord_assignable_roles (role_id, label, added_by) values (v_role, v_label, auth.uid());
    perform public.log_account_change(auth.uid(), auth.uid(), 'discord_assignable_roles', null, 'created', null, v_role || ' ' || v_label, 'admin');
  elsif v_old is distinct from v_label then
    update public.discord_assignable_roles r set label = v_label where r.role_id = v_role;
    perform public.log_account_change(auth.uid(), auth.uid(), 'discord_assignable_roles', null, 'label', v_old, v_label, 'admin');
  end if;
end;
$$;
revoke all on function public.admin_save_discord_role(text, text) from public, anon;
grant execute on function public.admin_save_discord_role(text, text) to authenticated;
