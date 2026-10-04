-- Discord role sync: the `verified` role plus the faculty/unit/Graduate roles the
-- bot derives from the profile. One service_role-only RPC feeds every trigger
-- (guild join, Realtime change, startup sweep), so the bot never reads tables.
--
-- The RPC needs profiles.study_level, which is created properly by the
-- following migration (20261005000002_academic_units.sql); adding it here
-- `if not exists` keeps this migration self-contained and that one unchanged.

alter table public.profiles
  add column if not exists study_level text check (study_level in ('undergraduate', 'graduate'));

-- One row per Discord identity asked about that is a verified player. Pass guild
-- member IDs and/or user ids; a row matching either list is returned, so a whole
-- window costs exactly one call. is_chula separates a Chula player (who gets
-- faculty/unit roles) from an admin-admitted guest (who gets `verified` only).
create or replace function public.verified_members(p_discord_ids text[] default '{}', p_user_ids uuid[] default '{}')
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
     and public.is_player_verified(i.user_id);
$$;
revoke all on function public.verified_members(text[], uuid[]) from public, anon, authenticated;
grant execute on function public.verified_members(text[], uuid[]) to service_role;

-- Realtime feeds the bot's 30 s batch: a claim insert, or an admin marking a
-- guest. Idempotent, so a re-run does not fail on an already-added table.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chula_claims') then
    alter publication supabase_realtime add table public.chula_claims;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles') then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;
