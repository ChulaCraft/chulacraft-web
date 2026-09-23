-- App-level user data (role) and an append-only audit log. Clients never write
-- these tables directly; all writes go through security-definer RPCs.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('owner', 'admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select (user_id, role) on public.profiles to authenticated;
grant select on public.profiles to service_role;
create policy "users can read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users for each row execute function public.create_profile_for_new_user();

insert into public.profiles (user_id) select id from auth.users on conflict do nothing;

-- First owner (PRD D7). No-op until that Discord account exists in this
-- environment; re-run the "Promote an owner" SQL in OPERATOR_RUNBOOK.md after first login.
update public.profiles p set role = 'owner'
  from auth.identities i
  where i.user_id = p.user_id and i.provider = 'discord' and i.provider_id = '938769182210809866';

create table if not exists public.account_change_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  entity text not null check (entity in ('minecraft_registrations', 'profiles', 'cu_sso_identities')),
  entity_id uuid,
  field text not null,
  old_value text,
  new_value text,
  source text not null default 'self' check (source in ('self', 'admin')),
  created_at timestamptz not null default now()
);

create index if not exists account_change_log_target_idx on public.account_change_log (target_user_id, created_at desc);

alter table public.account_change_log enable row level security;
revoke all on public.account_change_log from anon, authenticated;
-- actor_user_id stays hidden from players so admin identities aren't exposed.
grant select (id, target_user_id, entity, entity_id, field, old_value, new_value, source, created_at) on public.account_change_log to authenticated;
create policy "users can read own change log" on public.account_change_log for select to authenticated using ((select auth.uid()) = target_user_id);

create or replace function public.log_account_change(
  p_actor uuid, p_target uuid, p_entity text, p_entity_id uuid, p_field text, p_old text, p_new text, p_source text
) returns void language sql security definer set search_path = '' as $$
  insert into public.account_change_log (actor_user_id, target_user_id, entity, entity_id, field, old_value, new_value, source)
  values (p_actor, p_target, p_entity, p_entity_id, p_field, p_old, p_new, p_source);
$$;
revoke all on function public.log_account_change(uuid, uuid, text, uuid, text, text, text, text) from public, anon, authenticated;

-- Role of the calling user; null when signed out or when called by the service key.
create or replace function public.current_app_role()
returns text language sql stable security definer set search_path = '' as $$
  select role from public.profiles where user_id = (select auth.uid());
$$;
revoke all on function public.current_app_role() from public, anon;
grant execute on function public.current_app_role() to authenticated;
