-- Announcements: written by admins on the web, read by everyone, and mirrored
-- to Discord by the bot.
--
-- Same access shape as achievements/events (20261006000001): clients never
-- touch the table, every read and write is a security definer function with an
-- explicit grant. The public list is granted to anon because the banner and
-- /announcements are public.
--
-- Discord mirroring is pull-based. The bot (service_role) asks
-- announcements_discord_queue() what needs posting, editing or deleting, does
-- it, and writes back discord_message_id / discord_revision. `revision` goes up
-- only when the text Discord shows changes, so the bot's own write-back never
-- re-queues the row. Deleting is soft so the bot can still find the message it
-- has to remove.

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 2000),
  severity text not null default 'info' check (severity in ('info', 'warning', 'maintenance')),
  pinned boolean not null default false,
  -- null = draft; in the future = scheduled.
  published_at timestamptz,
  expires_at timestamptz check (expires_at is null or published_at is null or expires_at > published_at),
  post_to_discord boolean not null default false,
  revision integer not null default 1,
  discord_message_id text,
  discord_revision integer,
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists announcements_published_at_idx on public.announcements (published_at desc);

alter table public.announcements enable row level security;
revoke all on public.announcements from anon, authenticated, service_role;
-- The bot reads through the queue function and may only write the two columns
-- that record what it did.
grant select, update (discord_message_id, discord_revision) on public.announcements to service_role;

-- The bot listens for changes so a new announcement is posted at once rather
-- than on its next poll.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'announcements') then
    alter publication supabase_realtime add table public.announcements;
  end if;
end;
$$;

alter table public.account_change_log drop constraint if exists account_change_log_entity_check;
alter table public.account_change_log add constraint account_change_log_entity_check
  check (entity in ('minecraft_registrations', 'profiles', 'cu_sso_identities', 'chula_claims', 'identities',
                    'achievements', 'events', 'achievement_awards', 'announcements'));

-- ------------------------------------------------------------------ public

-- Live announcements: published, not expired, not deleted. Pinned first, so
-- the site banner is simply the first row when that row is pinned.
create or replace function public.list_announcements(p_limit integer default 20)
returns table (id uuid, title text, body text, severity text, pinned boolean, published_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select a.id, a.title, a.body, a.severity, a.pinned, a.published_at
  from public.announcements a
  where a.deleted_at is null
    and a.published_at <= now()
    and (a.expires_at is null or a.expires_at > now())
  order by a.pinned desc, a.published_at desc, a.id
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;
revoke all on function public.list_announcements(integer) from public, anon;
grant execute on function public.list_announcements(integer) to anon, authenticated;

-- ------------------------------------------------------------------- admin

create or replace function public.admin_list_announcements()
returns table (
  id uuid, title text, body text, severity text, pinned boolean,
  published_at timestamptz, expires_at timestamptz, post_to_discord boolean,
  discord_message_id text, updated_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  return query
  select a.id, a.title, a.body, a.severity, a.pinned, a.published_at, a.expires_at, a.post_to_discord,
    a.discord_message_id, a.updated_at
  from public.announcements a
  where a.deleted_at is null
  order by a.created_at desc, a.id;
end;
$$;
revoke all on function public.admin_list_announcements() from public, anon;
grant execute on function public.admin_list_announcements() to authenticated;

create or replace function public.admin_upsert_announcement(
  p_id uuid, p_title text, p_body text, p_severity text, p_pinned boolean,
  p_published_at timestamptz, p_expires_at timestamptz, p_post_to_discord boolean
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_old public.announcements%rowtype;
  v_id uuid;
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  select * into v_old from public.announcements a where a.id = p_id;
  if found then
    if v_old.deleted_at is not null then raise exception 'NOT_FOUND'; end if;
    update public.announcements a
      set title = p_title, body = p_body, severity = p_severity, pinned = p_pinned,
          published_at = p_published_at, expires_at = p_expires_at, post_to_discord = p_post_to_discord,
          revision = a.revision
            + case when (a.title, a.body, a.severity) is distinct from (p_title, p_body, p_severity) then 1 else 0 end,
          updated_at = now()
      where a.id = p_id
      returning a.id into v_id;
    if v_old.published_at is distinct from p_published_at then
      perform public.log_account_change(v_actor, v_actor, 'announcements', p_id, 'published_at',
        v_old.published_at::text, p_published_at::text, 'admin');
    end if;
  else
    insert into public.announcements
      (id, title, body, severity, pinned, published_at, expires_at, post_to_discord, created_by)
      values (coalesce(p_id, gen_random_uuid()), p_title, p_body, p_severity, p_pinned,
              p_published_at, p_expires_at, p_post_to_discord, v_actor)
      returning id into v_id;
    perform public.log_account_change(v_actor, v_actor, 'announcements', v_id, 'created', null, p_title, 'admin');
  end if;

  return v_id;
end;
$$;
revoke all on function public.admin_upsert_announcement(uuid, text, text, text, boolean, timestamptz, timestamptz, boolean) from public, anon;
grant execute on function public.admin_upsert_announcement(uuid, text, text, text, boolean, timestamptz, timestamptz, boolean) to authenticated;

-- Soft: the row has to outlive the request so the bot can delete its message.
create or replace function public.admin_delete_announcement(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_title text;
begin
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;

  update public.announcements a set deleted_at = now(), updated_at = now()
    where a.id = p_id and a.deleted_at is null
    returning a.title into v_title;
  if not found then raise exception 'NOT_FOUND'; end if;
  perform public.log_account_change(v_actor, v_actor, 'announcements', p_id, 'deleted', v_title, null, 'admin');
end;
$$;
revoke all on function public.admin_delete_announcement(uuid) from public, anon;
grant execute on function public.admin_delete_announcement(uuid) to authenticated;

-- --------------------------------------------------------------------- bot

-- What Discord is behind on: messages to delete, live announcements never
-- posted, and posted ones whose text changed since. An announcement that
-- expired before it was ever posted is skipped; one already posted is still
-- edited, so a correction reaches Discord even after it left the site.
create or replace function public.announcements_discord_queue()
returns table (
  id uuid, title text, body text, severity text, revision integer,
  discord_message_id text, deleted boolean
)
language sql stable security definer set search_path = '' as $$
  select a.id, a.title, a.body, a.severity, a.revision, a.discord_message_id, a.deleted_at is not null
  from public.announcements a
  where (a.deleted_at is not null and a.discord_message_id is not null)
     or (a.deleted_at is null and a.post_to_discord and a.published_at <= now()
         and ((a.discord_message_id is null and (a.expires_at is null or a.expires_at > now()))
           or (a.discord_message_id is not null and a.discord_revision is distinct from a.revision)))
  order by a.published_at, a.id
  limit 20;
$$;
revoke all on function public.announcements_discord_queue() from public, anon, authenticated;
grant execute on function public.announcements_discord_queue() to service_role;
