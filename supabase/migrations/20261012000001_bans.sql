-- Bans and appeals. A ban turns off every whitelisted Minecraft account the
-- player has (the worker removes and kicks within one poll) and remembers which
-- ones, so lifting it puts exactly those back. Both tables are reachable only
-- through the definer RPCs below; the admin-only reason never leaves them for
-- a player.
--
-- ponytail: no cron for temp-ban expiry. An expired ban stops counting at once
-- (is_banned), but its accounts come back the next time the player opens their
-- profile (my_ban) or an admin bans them again. Add a pg_cron job calling
-- lift_ban if players complain about waiting.

create table public.bans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (length(reason) between 1 and 1000),
  public_note text check (length(public_note) <= 1000),
  revoked_registrations uuid[] not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  lifted_at timestamptz,
  lifted_by uuid references auth.users(id) on delete set null
);
create index bans_user_idx on public.bans (user_id, created_at desc);
alter table public.bans enable row level security;
revoke all on public.bans from anon, authenticated;

create table public.appeals (
  id uuid primary key default gen_random_uuid(),
  ban_id uuid not null references public.bans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (length(message) between 10 and 2000),
  status text not null default 'open' check (status in ('open', 'accepted', 'rejected')),
  admin_response text check (length(admin_response) <= 1000),
  decided_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create unique index appeals_one_open_per_ban on public.appeals (ban_id) where status = 'open';
create index appeals_open_idx on public.appeals (created_at) where status = 'open';
alter table public.appeals enable row level security;
revoke all on public.appeals from anon, authenticated;

create function public.is_banned(p_user_id uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.bans b
    where b.user_id = p_user_id and b.lifted_at is null and (b.expires_at is null or b.expires_at > now()));
$$;
revoke all on function public.is_banned(uuid) from public, anon, authenticated;

-- Shared by admin lift, accepted appeals and expiry. p_source is 'self' for
-- expiry so the log doesn't credit an admin who did nothing.
create function public.lift_ban(p_ban_id uuid, p_actor uuid, p_source text)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_ban public.bans%rowtype;
  v_reg uuid;
begin
  select * into v_ban from public.bans b where b.id = p_ban_id for update;
  if not found or v_ban.lifted_at is not null then return; end if;

  update public.bans b set lifted_at = now(), lifted_by = case when p_source = 'admin' then p_actor end where b.id = p_ban_id;
  for v_reg in
    update public.minecraft_registrations r set desired_whitelisted = true
      where r.id = any(v_ban.revoked_registrations) and r.user_id = v_ban.user_id and r.is_active and not r.desired_whitelisted
      returning r.id
  loop
    perform public.log_account_change(p_actor, v_ban.user_id, 'minecraft_registrations', v_reg, 'desired_whitelisted', 'false', 'true', p_source);
  end loop;
  -- A lifted ban has nothing left to appeal.
  update public.appeals a set status = 'accepted', decided_by = p_actor, decided_at = now()
    where a.ban_id = p_ban_id and a.status = 'open';
  perform public.log_account_change(p_actor, v_ban.user_id, 'bans', p_ban_id,
    case when p_source = 'admin' then 'ban_lifted' else 'ban_expired' end, null, null, p_source);
  -- The Discord bot re-syncs roles on profile updates (verified-role-sync).
  update public.profiles p set updated_at = now() where p.user_id = v_ban.user_id;
end;
$$;
revoke all on function public.lift_ban(uuid, uuid, text) from public, anon, authenticated;

create function public.admin_ban_user(p_user_id uuid, p_reason text, p_public_note text default null, p_expires_at timestamptz default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_actor_role text := coalesce(public.current_app_role(), '');
  v_target_role text;
  v_revoked uuid[];
  v_carried uuid[];
  v_id uuid;
  v_reg uuid;
begin
  if v_actor_role not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;
  if p_user_id = v_actor then raise exception 'SELF_BAN'; end if;
  -- Locks the target so two admins can't ban at once.
  select p.role into v_target_role from public.profiles p where p.user_id = p_user_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  -- A banned admin would keep the admin pages, so staff are demoted first.
  if v_target_role <> 'user' then raise exception 'FORBIDDEN'; end if;
  if nullif(btrim(p_reason), '') is null or (p_expires_at is not null and p_expires_at <= now()) then raise exception 'INVALID'; end if;
  if public.is_banned(p_user_id) then raise exception 'ALREADY_BANNED'; end if;

  -- An expired ban whose accounts never came back hands them to this ban, so
  -- lifting it restores everything.
  with stale as (
    update public.bans b set lifted_at = now() where b.user_id = p_user_id and b.lifted_at is null
    returning b.revoked_registrations
  )
  select coalesce(array_agg(x), '{}') into v_carried from stale, unnest(stale.revoked_registrations) x;

  v_revoked := v_carried;
  for v_reg in
    update public.minecraft_registrations r set desired_whitelisted = false
      where r.user_id = p_user_id and r.is_active and r.desired_whitelisted
      returning r.id
  loop
    v_revoked := v_revoked || v_reg;
    perform public.log_account_change(v_actor, p_user_id, 'minecraft_registrations', v_reg, 'desired_whitelisted', 'true', 'false', 'admin');
  end loop;

  insert into public.bans (user_id, reason, public_note, revoked_registrations, created_by, expires_at)
    values (p_user_id, btrim(p_reason), nullif(btrim(p_public_note), ''), v_revoked, v_actor, p_expires_at)
    returning id into v_id;
  perform public.log_account_change(v_actor, p_user_id, 'bans', v_id, 'banned', null, p_expires_at::text, 'admin');
  update public.profiles p set updated_at = now() where p.user_id = p_user_id;
  return v_id;
end;
$$;
revoke all on function public.admin_ban_user(uuid, text, text, timestamptz) from public, anon;
grant execute on function public.admin_ban_user(uuid, text, text, timestamptz) to authenticated;

create function public.admin_lift_ban(p_ban_id uuid)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;
  if not exists (select 1 from public.bans b where b.id = p_ban_id and b.lifted_at is null) then raise exception 'NOT_FOUND'; end if;
  perform public.lift_ban(p_ban_id, auth.uid(), 'admin');
end;
$$;
revoke all on function public.admin_lift_ban(uuid) from public, anon;
grant execute on function public.admin_lift_ban(uuid) to authenticated;

create function public.admin_user_bans(p_user_id uuid)
returns table (
  id uuid, reason text, public_note text, created_at timestamptz, expires_at timestamptz,
  lifted_at timestamptz, created_by_name text, lifted_by_name text, active boolean
)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;
  return query
  select b.id, b.reason, b.public_note, b.created_at, b.expires_at, b.lifted_at,
    public.admin_display_name(b.created_by), public.admin_display_name(b.lifted_by),
    b.lifted_at is null and (b.expires_at is null or b.expires_at > now())
  from public.bans b where b.user_id = p_user_id
  order by b.created_at desc;
end;
$$;
revoke all on function public.admin_user_bans(uuid) from public, anon;
grant execute on function public.admin_user_bans(uuid) to authenticated;

-- The player's view of their own ban: no reason, no admin names. Volatile
-- because it also finishes an expired ban (see the note at the top).
create function public.my_ban()
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_ban public.bans%rowtype;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  select * into v_ban from public.bans b where b.user_id = v_uid and b.lifted_at is null order by b.created_at desc limit 1;
  if not found then return null; end if;
  if v_ban.expires_at is not null and v_ban.expires_at <= now() then
    perform public.lift_ban(v_ban.id, v_uid, 'self');
    return null;
  end if;
  return jsonb_build_object(
    'id', v_ban.id, 'public_note', v_ban.public_note, 'created_at', v_ban.created_at, 'expires_at', v_ban.expires_at,
    'appeal', (select jsonb_build_object('status', a.status, 'message', a.message, 'admin_response', a.admin_response,
                 'created_at', a.created_at, 'decided_at', a.decided_at)
               from public.appeals a where a.ban_id = v_ban.id order by a.created_at desc limit 1),
    'appeals_left', 3 - (select count(*) from public.appeals a where a.ban_id = v_ban.id)
  );
end;
$$;
revoke all on function public.my_ban() from public, anon;
grant execute on function public.my_ban() to authenticated;

-- One open appeal at a time, three per ban in total.
create function public.submit_appeal(p_message text)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_ban_id uuid;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  select b.id into v_ban_id from public.bans b
    where b.user_id = v_uid and b.lifted_at is null and (b.expires_at is null or b.expires_at > now())
    order by b.created_at desc limit 1 for update;
  if not found then raise exception 'NOT_BANNED'; end if;
  if length(btrim(coalesce(p_message, ''))) not between 10 and 2000 then raise exception 'INVALID'; end if;
  if exists (select 1 from public.appeals a where a.ban_id = v_ban_id and a.status = 'open') then raise exception 'APPEAL_OPEN'; end if;
  if (select count(*) from public.appeals a where a.ban_id = v_ban_id) >= 3 then raise exception 'TOO_MANY_APPEALS'; end if;
  insert into public.appeals (ban_id, user_id, message) values (v_ban_id, v_uid, btrim(p_message));
end;
$$;
revoke all on function public.submit_appeal(text) from public, anon;
grant execute on function public.submit_appeal(text) to authenticated;

create function public.admin_list_appeals(p_status text default 'open')
returns table (
  id uuid, created_at timestamptz, status text, message text, admin_response text, decided_at timestamptz,
  decided_by_name text, ban_id uuid, user_id uuid, user_name text, reason text, public_note text,
  banned_at timestamptz, expires_at timestamptz, banned_by_name text
)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;
  return query
  select a.id, a.created_at, a.status, a.message, a.admin_response, a.decided_at,
    public.admin_display_name(a.decided_by), b.id, a.user_id, public.admin_display_name(a.user_id),
    b.reason, b.public_note, b.created_at, b.expires_at, public.admin_display_name(b.created_by)
  from public.appeals a join public.bans b on b.id = a.ban_id
  where a.status = coalesce(p_status, 'open')
  order by case when a.status = 'open' then a.created_at end asc, a.decided_at desc
  limit 100;
end;
$$;
revoke all on function public.admin_list_appeals(text) from public, anon;
grant execute on function public.admin_list_appeals(text) to authenticated;

create function public.admin_decide_appeal(p_appeal_id uuid, p_accept boolean, p_response text)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_appeal public.appeals%rowtype;
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;
  if length(p_response) > 1000 then raise exception 'INVALID'; end if;
  select * into v_appeal from public.appeals a where a.id = p_appeal_id and a.status = 'open' for update;
  if not found then raise exception 'NOT_FOUND'; end if;

  update public.appeals a
    set status = case when p_accept then 'accepted' else 'rejected' end,
        admin_response = nullif(btrim(p_response), ''), decided_by = v_actor, decided_at = now()
    where a.id = p_appeal_id;
  perform public.log_account_change(v_actor, v_appeal.user_id, 'appeals', p_appeal_id, 'appeal', null,
    case when p_accept then 'accepted' else 'rejected' end, 'admin');
  if p_accept then perform public.lift_ban(v_appeal.ban_id, v_actor, 'admin'); end if;
end;
$$;
revoke all on function public.admin_decide_appeal(uuid, boolean, text) from public, anon;
grant execute on function public.admin_decide_appeal(uuid, boolean, text) to authenticated;

-- Banned players lose the Discord verified/faculty roles on the bot's next sync.
create or replace function public.verified_members(p_discord_ids text[] default '{}'::text[], p_user_ids uuid[] default '{}'::uuid[])
returns table (discord_id text, is_chula boolean, faculty text, major text, study_level text)
language sql stable security definer set search_path = '' as $$
  select distinct i.provider_id,
    public.is_chula_verified(i.user_id),
    p.faculty,
    p.major,
    p.study_level
    from auth.identities i
    left join public.profiles p on p.user_id = i.user_id
   where i.provider = 'discord'
     and (i.provider_id = any(p_discord_ids) or i.user_id = any(p_user_ids))
     and public.is_player_verified(i.user_id)
     and not public.is_banned(i.user_id);
$$;

-- Unchanged from 20260927000001 except the BANNED check.
create or replace function public.add_minecraft_account(p_user_id uuid, p_minecraft_uuid uuid, p_minecraft_username text)
returns table (id uuid, minecraft_username text, desired_whitelisted boolean, sync_status text, updated_at timestamptz, created boolean)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_user_id uuid := p_user_id;
  v_discord_id text;
  v_discord_username text;
  v_row public.minecraft_registrations%rowtype;
begin
  if v_user_id is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_minecraft_username !~ '^[A-Za-z0-9_]{3,16}$' then raise exception 'INVALID_USERNAME'; end if;

  select i.provider_id, coalesce(i.identity_data ->> 'full_name', i.identity_data ->> 'user_name', i.identity_data ->> 'name')
    into v_discord_id, v_discord_username
    from auth.identities i where i.user_id = v_user_id and i.provider = 'discord' limit 1;
  if v_discord_id is null then raise exception 'DISCORD_IDENTITY_REQUIRED'; end if;
  -- Chula-verified or a guest an admin admitted. Guests are gated by
  -- profiles.guest_verified_at, not by a claim, so they have no chula_claims row.
  if not public.is_player_verified(v_user_id) then raise exception 'CU_SSO_REQUIRED'; end if;
  if public.is_banned(v_user_id) then raise exception 'BANNED'; end if;

  -- Serialize this user's adds so two tabs can't both take the last slot.
  insert into public.profiles (user_id) values (v_user_id) on conflict do nothing;
  perform 1 from public.profiles p where p.user_id = v_user_id for update;

  select * into v_row from public.minecraft_registrations r where r.minecraft_uuid = p_minecraft_uuid;
  if found then
    -- Never reveal more than "conflict" about accounts owned by someone else.
    if v_row.user_id <> v_user_id then raise exception 'REGISTRATION_CONFLICT'; end if;
    if v_row.is_active then
      return query select v_row.id, v_row.minecraft_username, v_row.desired_whitelisted, v_row.sync_status, v_row.updated_at, false;
      return;
    end if;
    if public.revoked_by_admin(v_row.id) then raise exception 'REGISTRATION_BLOCKED'; end if;
  end if;

  if (select count(*) from public.minecraft_registrations r where r.user_id = v_user_id and r.is_active) >= 5 then
    raise exception 'LIMIT_REACHED';
  end if;

  begin
    if v_row.id is not null then
      update public.minecraft_registrations r
        set is_active = true, desired_whitelisted = true, minecraft_username = p_minecraft_username, minecraft_username_key = lower(p_minecraft_username)
        where r.id = v_row.id returning * into v_row;
      perform public.log_account_change(v_user_id, v_user_id, 'minecraft_registrations', v_row.id, 'is_active', 'false', 'true', 'self');
    else
      insert into public.minecraft_registrations (user_id, discord_user_id, discord_username, minecraft_uuid, minecraft_username, minecraft_username_key)
        values (v_user_id, v_discord_id, v_discord_username, p_minecraft_uuid, p_minecraft_username, lower(p_minecraft_username))
        returning * into v_row;
      perform public.log_account_change(v_user_id, v_user_id, 'minecraft_registrations', v_row.id, 'minecraft_username', null, p_minecraft_username, 'self');
    end if;
  exception when unique_violation then
    raise exception 'REGISTRATION_CONFLICT';
  end;

  return query select v_row.id, v_row.minecraft_username, v_row.desired_whitelisted, v_row.sync_status, v_row.updated_at, true;
end;
$$;

-- Unchanged from 20260923000005 except the BANNED check: restoring an account
-- mid-ban would let the player straight back in.
create or replace function public.admin_set_whitelisted(p_registration_id uuid, p_value boolean)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_actor_role text := public.current_app_role();
  v_row public.minecraft_registrations%rowtype;
  v_target_role text;
begin
  if v_actor_role is null or v_actor_role not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  select * into v_row from public.minecraft_registrations r where r.id = p_registration_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  select p.role into v_target_role from public.profiles p where p.user_id = v_row.user_id;
  if v_actor_role = 'admin' and coalesce(v_target_role, 'user') <> 'user' then raise exception 'FORBIDDEN'; end if;
  if v_row.desired_whitelisted = p_value and (not p_value or v_row.is_active) then return; end if;
  if p_value and public.is_banned(v_row.user_id) then raise exception 'BANNED'; end if;

  if p_value and not v_row.is_active
    and (select count(*) from public.minecraft_registrations r where r.user_id = v_row.user_id and r.is_active) >= 5 then
    raise exception 'LIMIT_REACHED';
  end if;

  update public.minecraft_registrations r
    set desired_whitelisted = p_value, is_active = r.is_active or p_value
    where r.id = p_registration_id;
  if v_row.desired_whitelisted <> p_value then
    perform public.log_account_change(v_actor, v_row.user_id, 'minecraft_registrations', v_row.id, 'desired_whitelisted', (not p_value)::text, p_value::text, 'admin');
  end if;
  if p_value and not v_row.is_active then
    perform public.log_account_change(v_actor, v_row.user_id, 'minecraft_registrations', v_row.id, 'is_active', 'false', 'true', 'admin');
  end if;
end;
$$;
