-- "About you" registration step: name, optional nickname, faculty and major.
-- Written only by the server (service role) after it checks the session and
-- validates faculty/major against the app's list.

alter table public.profiles
  add column if not exists first_name text check (char_length(first_name) between 1 and 60),
  add column if not exists last_name text check (char_length(last_name) between 1 and 60),
  add column if not exists nickname text check (char_length(nickname) between 1 and 20),
  add column if not exists faculty text check (char_length(faculty) between 1 and 120),
  add column if not exists major text check (char_length(major) between 1 and 120);

grant select (user_id, role, first_name, last_name, nickname, faculty, major) on public.profiles to authenticated;

create or replace function public.update_profile_details(
  p_user_id uuid, p_first_name text, p_last_name text, p_nickname text, p_faculty text, p_major text
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_old public.profiles%rowtype;
begin
  if p_user_id is null then raise exception 'UNAUTHENTICATED'; end if;
  insert into public.profiles (user_id) values (p_user_id) on conflict do nothing;
  select * into v_old from public.profiles p where p.user_id = p_user_id for update;

  update public.profiles set first_name = p_first_name, last_name = p_last_name, nickname = nullif(p_nickname, ''),
    faculty = p_faculty, major = p_major
    where user_id = p_user_id;

  if v_old.first_name is distinct from p_first_name then perform public.log_account_change(p_user_id, p_user_id, 'profiles', null, 'first_name', v_old.first_name, p_first_name, 'self'); end if;
  if v_old.last_name is distinct from p_last_name then perform public.log_account_change(p_user_id, p_user_id, 'profiles', null, 'last_name', v_old.last_name, p_last_name, 'self'); end if;
  if v_old.nickname is distinct from nullif(p_nickname, '') then perform public.log_account_change(p_user_id, p_user_id, 'profiles', null, 'nickname', v_old.nickname, nullif(p_nickname, ''), 'self'); end if;
  if v_old.faculty is distinct from p_faculty then perform public.log_account_change(p_user_id, p_user_id, 'profiles', null, 'faculty', v_old.faculty, p_faculty, 'self'); end if;
  if v_old.major is distinct from p_major then perform public.log_account_change(p_user_id, p_user_id, 'profiles', null, 'major', v_old.major, p_major, 'self'); end if;
end;
$$;
revoke all on function public.update_profile_details(uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.update_profile_details(uuid, text, text, text, text, text) to service_role;
