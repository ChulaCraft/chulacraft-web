-- Customer support: admins see and edit what a player sees in their own
-- profile and settings. Same target rule as admin_mark_guest: admins act on
-- players only, owners on anyone. Every change goes to the account change log
-- with the admin as actor and source 'admin' (privacy fields under entity 'profiles').
--
-- Faculty and major are checked against the app's list in the server action
-- (src/lib/faculties.ts) before this is called; the columns' length checks are
-- the database's backstop. ponytail: an admin calling the RPC directly could
-- store a faculty outside that list; move the list into a table if that matters.

create or replace function public.admin_support_guard(p_user_id uuid)
returns void language plpgsql stable security definer set search_path = '' as $$
declare
  v_actor_role text := public.current_app_role();
  v_target_role text;
begin
  if coalesce(v_actor_role, '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;
  select coalesce(p.role, 'user') into v_target_role from public.profiles p where p.user_id = p_user_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_actor_role = 'admin' and v_target_role <> 'user' and p_user_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
end;
$$;
revoke all on function public.admin_support_guard(uuid) from public, anon, authenticated;

create or replace function public.admin_user_profile(p_user_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  -- Reading is allowed for any admin target, like admin_get_user.
  if coalesce(public.current_app_role(), '') not in ('owner', 'admin') then raise exception 'FORBIDDEN'; end if;
  return (
    select jsonb_build_object(
      'first_name', p.first_name, 'last_name', p.last_name, 'nickname', p.nickname,
      'faculty', p.faculty, 'major', p.major, 'study_level', p.study_level,
      'privacy', jsonb_build_object(
        'profile', coalesce(s.profile, 'public'), 'minecraft', coalesce(s.minecraft, 'public'),
        'achievements', coalesce(s.achievements, 'public'), 'friends', coalesce(s.friends, 'public')))
    from public.profiles p
    left join public.privacy_settings s on s.user_id = p.user_id
    where p.user_id = p_user_id
  );
end;
$$;
revoke all on function public.admin_user_profile(uuid) from public, anon;
grant execute on function public.admin_user_profile(uuid) to authenticated;

create or replace function public.admin_update_profile(
  p_user_id uuid, p_first_name text, p_last_name text, p_nickname text, p_faculty text, p_major text, p_study_level text
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_old public.profiles%rowtype;
  v_nick text := nullif(btrim(coalesce(p_nickname, '')), '');
  v_level text;
begin
  perform public.admin_support_guard(p_user_id);
  select * into v_old from public.profiles p where p.user_id = p_user_id for update;
  v_level := coalesce(p_study_level, v_old.study_level);

  update public.profiles set first_name = p_first_name, last_name = p_last_name, nickname = v_nick,
    faculty = p_faculty, major = p_major, study_level = v_level
    where user_id = p_user_id;

  if v_old.first_name is distinct from p_first_name then perform public.log_account_change(v_actor, p_user_id, 'profiles', p_user_id, 'first_name', v_old.first_name, p_first_name, 'admin'); end if;
  if v_old.last_name is distinct from p_last_name then perform public.log_account_change(v_actor, p_user_id, 'profiles', p_user_id, 'last_name', v_old.last_name, p_last_name, 'admin'); end if;
  if v_old.nickname is distinct from v_nick then perform public.log_account_change(v_actor, p_user_id, 'profiles', p_user_id, 'nickname', v_old.nickname, v_nick, 'admin'); end if;
  if v_old.faculty is distinct from p_faculty then perform public.log_account_change(v_actor, p_user_id, 'profiles', p_user_id, 'faculty', v_old.faculty, p_faculty, 'admin'); end if;
  if v_old.major is distinct from p_major then perform public.log_account_change(v_actor, p_user_id, 'profiles', p_user_id, 'major', v_old.major, p_major, 'admin'); end if;
  if v_old.study_level is distinct from v_level then perform public.log_account_change(v_actor, p_user_id, 'profiles', p_user_id, 'study_level', v_old.study_level, v_level, 'admin'); end if;
end;
$$;
revoke all on function public.admin_update_profile(uuid, text, text, text, text, text, text) from public, anon;
grant execute on function public.admin_update_profile(uuid, text, text, text, text, text, text) to authenticated;

create or replace function public.admin_set_privacy(
  p_user_id uuid, p_profile text, p_minecraft text, p_achievements text, p_friends text
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_old public.privacy_settings%rowtype;
begin
  perform public.admin_support_guard(p_user_id);
  if coalesce(p_profile, '') not in ('public', 'friends', 'private')
     or coalesce(p_minecraft, '') not in ('public', 'friends', 'private')
     or coalesce(p_achievements, '') not in ('public', 'friends', 'private')
     or coalesce(p_friends, '') not in ('public', 'friends', 'private') then
    raise exception 'INVALID_LEVEL';
  end if;
  select * into v_old from public.privacy_settings s where s.user_id = p_user_id;

  insert into public.privacy_settings as s (user_id, profile, minecraft, achievements, friends, updated_at)
  values (p_user_id, p_profile, p_minecraft, p_achievements, p_friends, now())
  on conflict (user_id) do update
    set profile = excluded.profile, minecraft = excluded.minecraft,
        achievements = excluded.achievements, friends = excluded.friends, updated_at = now();

  if coalesce(v_old.profile, 'public') <> p_profile then perform public.log_account_change(v_actor, p_user_id, 'profiles', p_user_id, 'privacy_profile', coalesce(v_old.profile, 'public'), p_profile, 'admin'); end if;
  if coalesce(v_old.minecraft, 'public') <> p_minecraft then perform public.log_account_change(v_actor, p_user_id, 'profiles', p_user_id, 'privacy_minecraft', coalesce(v_old.minecraft, 'public'), p_minecraft, 'admin'); end if;
  if coalesce(v_old.achievements, 'public') <> p_achievements then perform public.log_account_change(v_actor, p_user_id, 'profiles', p_user_id, 'privacy_achievements', coalesce(v_old.achievements, 'public'), p_achievements, 'admin'); end if;
  if coalesce(v_old.friends, 'public') <> p_friends then perform public.log_account_change(v_actor, p_user_id, 'profiles', p_user_id, 'privacy_friends', coalesce(v_old.friends, 'public'), p_friends, 'admin'); end if;
end;
$$;
revoke all on function public.admin_set_privacy(uuid, text, text, text, text) from public, anon;
grant execute on function public.admin_set_privacy(uuid, text, text, text, text) to authenticated;
