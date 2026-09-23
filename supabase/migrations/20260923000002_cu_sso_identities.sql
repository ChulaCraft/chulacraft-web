-- Chula SSO identity linked to an existing (Discord-created) account. One per
-- user, and a Chula account can belong to only one user.
-- ponytail: no raw profile blob (PDPA data minimisation); add columns when needed.

create table if not exists public.cu_sso_identities (
  user_id uuid primary key references auth.users(id) on delete cascade,
  chula_uid text not null unique,
  chula_username text not null,
  email text,
  display_name text,
  linked_at timestamptz not null default now()
);

alter table public.cu_sso_identities enable row level security;
revoke all on public.cu_sso_identities from anon, authenticated;
grant select (user_id, chula_username, linked_at) on public.cu_sso_identities to authenticated;
grant select on public.cu_sso_identities to service_role;
create policy "users can read own chula identity" on public.cu_sso_identities for select to authenticated using ((select auth.uid()) = user_id);

-- Server-only: the Next.js callback calls this with the backend secret key after
-- validating the Chula ticket and the browser's link intent. Browsers can't call
-- it, otherwise anyone could claim an arbitrary Chula uid.
create or replace function public.link_cu_sso(
  p_user_id uuid, p_chula_uid text, p_chula_username text, p_email text, p_display_name text
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_existing public.cu_sso_identities%rowtype;
begin
  select * into v_existing from public.cu_sso_identities where chula_uid = p_chula_uid or user_id = p_user_id limit 1;
  if found then
    if v_existing.user_id = p_user_id and v_existing.chula_uid = p_chula_uid then return; end if;
    raise exception 'CU_ALREADY_LINKED';
  end if;

  begin
    insert into public.cu_sso_identities (user_id, chula_uid, chula_username, email, display_name)
      values (p_user_id, p_chula_uid, p_chula_username, p_email, p_display_name);
  exception when unique_violation then
    raise exception 'CU_ALREADY_LINKED';
  end;
  perform public.log_account_change(p_user_id, p_user_id, 'cu_sso_identities', p_user_id, 'chula_username', null, p_chula_username, 'self');
end;
$$;
revoke all on function public.link_cu_sso(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.link_cu_sso(uuid, text, text, text, text) to service_role;
