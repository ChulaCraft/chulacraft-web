-- v1.1 Phase 5 B: badge -> Discord role queue for the bot.
--
-- Derived state plus a status ledger. What the members should have is
-- computed every time (discord_role_desired); discord_role_state records only
-- what the bot reported back. The queue is the difference:
--
--   add    = desired, and no ledger row (or a failed add whose retry is due)
--   remove = applied, no longer desired, and not waiting on a retry
--
-- So award/revoke RPCs are not touched: a revoke, a ban, drafting the badge or
-- changing its role all just change the desired set. A ban removes badge roles
-- and lifting it gives them back. A failed remove keeps status 'applied' (the
-- role is still on the member) and only records the retry, so it is never lost.
-- The bot pulls with the secret key, like announcements_discord_queue().

create table if not exists public.discord_role_state (
  discord_id text not null,
  -- Not a foreign key: a role still has to come off after it leaves the allowlist.
  role_id text not null,
  status text not null check (status in ('applied', 'failed')),
  attempts integer not null default 0,
  retry_after timestamptz,
  last_error text check (char_length(last_error) <= 500),
  updated_at timestamptz not null default now(),
  primary key (discord_id, role_id)
);
alter table public.discord_role_state enable row level security;
revoke all on public.discord_role_state from anon, authenticated;

-- Internal. The Discord identity is joined the same way as verified_members
-- (20261005000001:24-27).
create or replace function public.discord_role_desired()
returns table (discord_id text, role_id text)
language sql stable security definer set search_path = '' as $$
  select distinct i.provider_id, a.discord_role_id
  from public.achievement_awards w
  join public.achievements a on a.id = w.achievement_id and a.status = 'published' and a.discord_role_id is not null
  join auth.identities i on i.user_id = w.user_id and i.provider = 'discord'
  where not public.is_banned(w.user_id);
$$;
revoke all on function public.discord_role_desired() from public, anon, authenticated;

-- Removes first, so a ban takes effect before anything is added.
create or replace function public.discord_role_queue()
returns table (discord_id text, role_id text, op text)
language sql stable security definer set search_path = '' as $$
  with d as (select * from public.discord_role_desired())
  select q.discord_id, q.role_id, q.op from (
    select d.discord_id, d.role_id, 'add' as op
    from d left join public.discord_role_state s on s.discord_id = d.discord_id and s.role_id = d.role_id
    where s.discord_id is null or (s.status = 'failed' and coalesce(s.retry_after, '-infinity') <= now())
    union all
    select s.discord_id, s.role_id, 'remove'
    from public.discord_role_state s
    where s.status = 'applied' and coalesce(s.retry_after, '-infinity') <= now()
      and not exists (select 1 from d where d.discord_id = s.discord_id and d.role_id = s.role_id)
  ) q
  order by q.op desc, q.discord_id, q.role_id
  limit 100;
$$;
revoke all on function public.discord_role_queue() from public, anon, authenticated;
grant execute on function public.discord_role_queue() to service_role;

-- Write-back: [{discord_id, role_id, op, ok, error?}, ...]. Records facts only;
-- the next queue read re-derives, so a race with an award or revoke corrects
-- itself. Backoff is 2^attempts minutes (before this failure), capped at 24 h.
create or replace function public.discord_role_queue_done(p_items jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_item jsonb;
  v_discord text;
  v_role text;
  v_op text;
  v_ok boolean;
  v_error text;
  v_count integer := 0;
begin
  if jsonb_typeof(p_items) is distinct from 'array' then raise exception 'INVALID'; end if;

  for v_item in select x from jsonb_array_elements(p_items) x loop
    v_discord := nullif(v_item ->> 'discord_id', '');
    v_role := nullif(v_item ->> 'role_id', '');
    v_op := v_item ->> 'op';
    v_ok := case v_item -> 'ok' when 'true'::jsonb then true when 'false'::jsonb then false end;
    v_error := left(v_item ->> 'error', 500);
    if v_discord is null or v_role is null or v_ok is null or v_op is null or v_op not in ('add', 'remove') then
      raise exception 'INVALID';
    end if;

    if v_ok and v_op = 'add' then
      insert into public.discord_role_state (discord_id, role_id, status) values (v_discord, v_role, 'applied')
      on conflict (discord_id, role_id) do update
        set status = 'applied', attempts = 0, retry_after = null, last_error = null, updated_at = now();
    elsif v_ok then
      delete from public.discord_role_state s where s.discord_id = v_discord and s.role_id = v_role;
    else
      -- A failed add is 'failed'; a failed remove leaves the status as it was
      -- ('applied'), so the remove comes back once the retry is due.
      insert into public.discord_role_state (discord_id, role_id, status, attempts, retry_after, last_error)
        values (v_discord, v_role, case when v_op = 'add' then 'failed' else 'applied' end, 1, now() + interval '1 minute', v_error)
      on conflict (discord_id, role_id) do update
        set status = case when v_op = 'add' then 'failed' else public.discord_role_state.status end,
            attempts = public.discord_role_state.attempts + 1,
            retry_after = now() + make_interval(mins => least(power(2, least(public.discord_role_state.attempts, 11)), 1440)::int),
            last_error = excluded.last_error,
            updated_at = now();
    end if;
    v_count := v_count + 1;
  end loop;

  -- A failed add that is no longer wanted has nothing left to retry.
  delete from public.discord_role_state s
    where s.status = 'failed'
      and not exists (select 1 from public.discord_role_desired() d where d.discord_id = s.discord_id and d.role_id = s.role_id);

  return v_count;
end;
$$;
revoke all on function public.discord_role_queue_done(jsonb) from public, anon, authenticated;
grant execute on function public.discord_role_queue_done(jsonb) to service_role;
