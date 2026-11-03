-- v1.1 T1.2 (D1): apply a staged review of player changes in one transaction.
--
-- Security invoker: every step is an existing admin_* RPC, so each keeps its own
-- role gate and log_account_change calls. Any failure aborts the whole call.
--
-- p_changes is a jsonb array of {"kind": ..., ...}:
--   role {role} | profile {first_name,last_name,nickname,faculty,major,study_level}
--   privacy {profile,minecraft,achievements,friends} | banner {banner_id,grant} (many)
--   chula_reset {} | guest {} | lift_ban {ban_id} (many) | whitelist {registration_id,value} (many)
--   ban {reason,public_note,expires_at}
-- Applied in a fixed order (D1a) whatever the input order. On failure the error
-- code is re-raised as the message and "<kind>:<target id>" goes in detail.

create or replace function public.admin_apply_player_changes(p_user_id uuid, p_changes jsonb)
returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_order constant text[] := array['role', 'profile', 'privacy', 'banner', 'chula_reset', 'guest', 'lift_ban', 'whitelist', 'ban'];
  v_single constant text[] := array['role', 'profile', 'privacy', 'chula_reset', 'guest', 'ban'];
  v_kind text;
  v_c jsonb;
  v_target text;
  v_msg text;
begin
  if p_user_id is null or jsonb_typeof(p_changes) is distinct from 'array' or jsonb_array_length(p_changes) = 0 then
    raise exception 'INVALID';
  end if;

  for v_c in select * from jsonb_array_elements(p_changes) loop
    if jsonb_typeof(v_c) <> 'object' or not (v_c ->> 'kind') = any (v_order) then raise exception 'INVALID'; end if;
  end loop;
  foreach v_kind in array v_single loop
    if (select count(*) from jsonb_array_elements(p_changes) e where e ->> 'kind' = v_kind) > 1 then
      raise exception 'INVALID';
    end if;
  end loop;

  foreach v_kind in array v_order loop
    for v_c in select e from jsonb_array_elements(p_changes) with ordinality as t(e, n) where e ->> 'kind' = v_kind order by n loop
      v_target := coalesce(case v_kind
        when 'banner' then v_c ->> 'banner_id'
        when 'lift_ban' then v_c ->> 'ban_id'
        when 'whitelist' then v_c ->> 'registration_id' end, p_user_id::text);
      begin
        case v_kind
          when 'role' then
            perform public.admin_set_role(p_user_id, v_c ->> 'role');
          when 'profile' then
            perform public.admin_update_profile(p_user_id, v_c ->> 'first_name', v_c ->> 'last_name', v_c ->> 'nickname',
              v_c ->> 'faculty', v_c ->> 'major', v_c ->> 'study_level');
          when 'privacy' then
            perform public.admin_set_privacy(p_user_id, v_c ->> 'profile', v_c ->> 'minecraft', v_c ->> 'achievements', v_c ->> 'friends');
          when 'banner' then
            perform public.admin_grant_banner(p_user_id, v_c ->> 'banner_id', (v_c ->> 'grant')::boolean);
          when 'chula_reset' then
            perform public.admin_reset_chula(p_user_id);
          when 'guest' then
            perform public.admin_mark_guest(p_user_id);
          when 'lift_ban' then
            perform public.admin_lift_ban((v_c ->> 'ban_id')::uuid);
          when 'whitelist' then
            perform public.admin_set_whitelisted((v_c ->> 'registration_id')::uuid, (v_c ->> 'value')::boolean);
          when 'ban' then
            perform public.admin_ban_user(p_user_id, v_c ->> 'reason', v_c ->> 'public_note', (v_c ->> 'expires_at')::timestamptz);
        end case;
      exception when others then
        get stacked diagnostics v_msg = message_text;
        if v_msg !~ '^[A-Z][A-Z0-9_]*$' then v_msg := 'INVALID'; end if;
        raise exception using message = v_msg, detail = v_kind || ':' || v_target;
      end;
    end loop;
  end loop;
end;
$$;

revoke all on function public.admin_apply_player_changes(uuid, jsonb) from public, anon;
grant execute on function public.admin_apply_player_changes(uuid, jsonb) to authenticated;
