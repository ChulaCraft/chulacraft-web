-- Default-privilege guard (20261005000004). Every function in schema public that
-- anon or authenticated may execute is pinned to an explicit allowlist, so a new
-- RPC cannot become reachable from the browser by being forgotten rather than by
-- a grant. Build the list, read it, and only then write it down: an entry that
-- looks unintended is a finding, not a line to delete quietly.

begin;

select plan(4);

-- The allowlists, exactly as the current grants stand.
-- anon: the 3 trigger functions cannot be called directly (Postgres refuses),
-- but PUBLIC execute on them is still a grant and is worth seeing.
-- is_chula_email(text) is a pure regex over its argument: no table, no uid.
create temporary table expected (role text, signature text);

insert into expected values
  ('anon', 'get_event(p_id uuid)'),
  ('anon', 'is_chula_email(p_email text)'),
  ('anon', 'list_announcements(p_limit integer)'),
  ('anon', 'get_site_settings()'),
  ('anon', 'get_site_page(p_slug text)'),
  ('anon', 'list_gallery()'),
  ('anon', 'list_gallery_groups()'),
  ('anon', 'list_team()'),
  ('anon', 'list_team_generations()'),
  ('anon', 'list_past_events(p_limit integer)'),
  ('anon', 'list_upcoming_events(p_limit integer)'),
  ('anon', 'reset_sync_on_desired_state_change()'),
  ('anon', 'set_sync_failing_since()'),
  ('anon', 'set_updated_at()'),
  ('authenticated', 'admin_award(p_achievement_id uuid, p_event_id uuid, p_awarded_on date, p_user_ids uuid[])'),
  ('authenticated', 'admin_delete_achievement(p_id uuid)'),
  ('authenticated', 'admin_delete_announcement(p_id uuid)'),
  ('authenticated', 'admin_delete_event(p_id uuid)'),
  ('authenticated', 'admin_audit_log(p_actor uuid, p_target uuid, p_entity text, p_from timestamp with time zone, p_to timestamp with time zone, p_before_at timestamp with time zone, p_before_id uuid, p_limit integer)'),
  ('authenticated', 'admin_ban_user(p_user_id uuid, p_reason text, p_public_note text, p_expires_at timestamp with time zone)'),
  ('authenticated', 'admin_decide_appeal(p_appeal_id uuid, p_accept boolean, p_response text)'),
  ('authenticated', 'admin_get_user(p_user_id uuid)'),
  ('authenticated', 'admin_lift_ban(p_ban_id uuid)'),
  ('authenticated', 'admin_list_appeals(p_status text)'),
  ('authenticated', 'admin_list_reports(p_status text)'),
  ('authenticated', 'admin_handle_report(p_report_id uuid, p_status text, p_note text)'),
  ('authenticated', 'report_player(p_target uuid, p_category text, p_details text, p_evidence_url text)'),
  ('authenticated', 'admin_user_bans(p_user_id uuid)'),
  ('authenticated', 'my_ban()'),
  ('authenticated', 'submit_appeal(p_message text)'),
  ('authenticated', 'admin_list_achievements()'),
  ('authenticated', 'admin_list_announcements()'),
  ('authenticated', 'admin_list_awards(p_achievement_id uuid)'),
  ('authenticated', 'admin_list_event_interests(p_event_id uuid)'),
  ('authenticated', 'admin_list_events()'),
  ('authenticated', 'admin_mark_guest(p_user_id uuid)'),
  ('authenticated', 'admin_newest_players(p_limit integer)'),
  ('authenticated', 'admin_overview_stats()'),
  ('authenticated', 'admin_list_players(p_filters jsonb, p_query text, p_sort text, p_desc boolean, p_offset integer, p_limit integer)'),
  ('authenticated', 'admin_recent_activity(p_limit integer)'),
  ('authenticated', 'admin_removed_accounts()'),
  ('authenticated', 'admin_reset_chula(p_user_id uuid)'),
  ('authenticated', 'admin_resolve_identifiers(p_kind text, p_values text[])'),
  ('authenticated', 'admin_revoke_award(p_award_id uuid)'),
  ('authenticated', 'admin_ops_access(p_jti uuid, p_service text, p_action text)'),
  ('authenticated', 'admin_search_users(p_query text)'),
  ('authenticated', 'admin_set_role(p_user_id uuid, p_role text)'),
  ('authenticated', 'admin_stats_daily(p_days integer)'),
  ('authenticated', 'admin_set_event_category(p_id uuid, p_category text)'),
  ('authenticated', 'admin_delete_banner(p_id text)'),
  ('authenticated', 'admin_grant_banner(p_user_id uuid, p_banner_id text, p_grant boolean)'),
  ('authenticated', 'admin_save_banner(p_id text, p_name text, p_colors text[], p_style text, p_image_path text, p_still_path text)'),
  ('authenticated', 'admin_list_banners()'),
  ('authenticated', 'admin_set_event_banner(p_id uuid, p_banner_id text)'),
  ('authenticated', 'admin_user_banners(p_user_id uuid)'),
  ('authenticated', 'get_player_banner(p_user_id uuid)'),
  ('authenticated', 'my_banners()'),
  ('authenticated', 'set_my_banner(p_banner_id text)'),
  ('authenticated', 'get_site_settings()'),
  ('authenticated', 'get_site_page(p_slug text)'),
  ('authenticated', 'list_gallery()'),
  ('authenticated', 'list_gallery_groups()'),
  ('authenticated', 'list_team()'),
  ('authenticated', 'list_team_generations()'),
  ('authenticated', 'admin_set_announcement_image(p_id uuid, p_path text)'),
  ('authenticated', 'admin_save_gallery_group(p_id uuid, p_name text, p_description text)'),
  ('authenticated', 'admin_move_gallery_group(p_id uuid, p_up boolean)'),
  ('authenticated', 'admin_delete_gallery_group(p_id uuid)'),
  ('authenticated', 'admin_save_gallery_image(p_id uuid, p_group_id uuid, p_path text, p_alt text, p_wide boolean)'),
  ('authenticated', 'admin_move_gallery_image(p_id uuid, p_up boolean)'),
  ('authenticated', 'admin_delete_gallery_image(p_id uuid)'),
  ('authenticated', 'admin_save_team_generation(p_id uuid, p_name text)'),
  ('authenticated', 'admin_move_team_generation(p_id uuid, p_up boolean)'),
  ('authenticated', 'admin_delete_team_generation(p_id uuid)'),
  ('authenticated', 'admin_save_team_member(p_id uuid, p_generation_id uuid, p_kind text, p_name text, p_title text, p_bio text, p_image_path text, p_user_id uuid, p_link_url text)'),
  ('authenticated', 'admin_move_team_member(p_id uuid, p_up boolean)'),
  ('authenticated', 'admin_delete_team_member(p_id uuid)'),
  ('authenticated', 'admin_save_site_page(p_slug text, p_body text)'),
  ('authenticated', 'admin_save_site_settings(p_settings jsonb)'),
  ('authenticated', 'admin_set_privacy(p_user_id uuid, p_profile text, p_minecraft text, p_achievements text, p_friends text)'),
  ('authenticated', 'admin_update_profile(p_user_id uuid, p_first_name text, p_last_name text, p_nickname text, p_faculty text, p_major text, p_study_level text)'),
  ('authenticated', 'admin_user_profile(p_user_id uuid)'),
  ('authenticated', 'staff_can(p_area text)'),
  ('authenticated', 'admin_set_whitelisted(p_registration_id uuid, p_value boolean)'),
  ('authenticated', 'admin_upsert_achievement(p_id uuid, p_name text, p_description text, p_image_path text, p_status text)'),
  ('authenticated', 'admin_upsert_announcement(p_id uuid, p_title text, p_body text, p_severity text, p_pinned boolean, p_published_at timestamp with time zone, p_expires_at timestamp with time zone, p_post_to_discord boolean)'),
  ('authenticated', 'admin_upsert_event(p_id uuid, p_name text, p_description text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_location text, p_image_path text, p_status text)'),
  ('authenticated', 'am_i_player_verified()'),
  ('authenticated', 'block_player(p_other uuid)'),
  ('authenticated', 'consume_registration_attempt()'),
  ('authenticated', 'current_app_role()'),
  ('authenticated', 'get_event(p_id uuid)'),
  ('authenticated', 'get_player_profile(p_user_id uuid)'),
  ('authenticated', 'is_chula_email(p_email text)'),
  ('authenticated', 'list_announcements(p_limit integer)'),
  ('authenticated', 'list_past_events(p_limit integer)'),
  ('authenticated', 'list_upcoming_events(p_limit integer)'),
  ('authenticated', 'my_achievements()'),
  ('authenticated', 'my_chula_claim()'),
  ('authenticated', 'my_privacy()'),
  ('authenticated', 'my_social()'),
  ('authenticated', 'remove_friend(p_other uuid)'),
  ('authenticated', 'reset_sync_on_desired_state_change()'),
  ('authenticated', 'respond_friend_request(p_requester uuid, p_accept boolean)'),
  ('authenticated', 'search_players(p_q text)'),
  ('authenticated', 'send_friend_request(p_other uuid)'),
  ('authenticated', 'set_event_interest(p_event_id uuid, p_interested boolean)'),
  ('authenticated', 'set_sync_failing_since()'),
  ('authenticated', 'set_updated_at()'),
  ('authenticated', 'unblock_player(p_other uuid)'),
  ('authenticated', 'update_privacy(p_profile text, p_minecraft text, p_achievements text, p_friends text)'),
  -- 20261026000001_achievement_rarity.sql
  ('authenticated', 'admin_list_discord_roles()'),
  ('authenticated', 'admin_save_discord_role(p_role_id text, p_label text)'),
  ('authenticated', 'admin_delete_discord_role(p_role_id text)'),
  ('authenticated', 'admin_set_achievement_meta(p_id uuid, p_tier text, p_discord_role_id text)'),
  ('authenticated', 'set_my_showcase(p_achievement_ids uuid[])'),
  -- 20261027000001_event_attendance.sql. checkin_proof is anon on purpose: the
  -- QR route handler trades a token for a proof before the player signs in.
  ('anon', 'checkin_proof(p_event_id uuid, p_token text)'),
  ('authenticated', 'checkin_proof(p_event_id uuid, p_token text)'),
  ('authenticated', 'check_in(p_event_id uuid, p_token text)'),
  ('authenticated', 'my_checkin_code()'),
  ('authenticated', 'my_event_history()'),
  ('authenticated', 'get_player_event_history(p_user_id uuid)'),
  ('authenticated', 'admin_checkin_token(p_event_id uuid)'),
  ('authenticated', 'admin_rotate_checkin_secret(p_event_id uuid)'),
  ('authenticated', 'admin_check_in_player(p_event_id uuid, p_code text)'),
  ('authenticated', 'admin_list_attendance(p_event_id uuid)'),
  ('authenticated', 'admin_remove_attendance(p_event_id uuid, p_user_id uuid)'),
  ('authenticated', 'admin_award_attendees(p_event_id uuid, p_achievement_id uuid)'),
  -- 20261028000001_event_reminders.sql
  ('authenticated', 'admin_set_event_reminders(p_id uuid, p_offsets integer[])'),
  ('authenticated', 'admin_event_reminders(p_id uuid)'),
  -- 20261029000001_notifications.sql
  ('authenticated', 'my_unread_notifications()'),
  ('authenticated', 'my_notifications(p_limit integer)'),
  ('authenticated', 'mark_my_notifications_read()'),
  -- 20261030000001_insights.sql
  ('authenticated', 'insights_players(p_days integer)'),
  ('authenticated', 'insights_funnel(p_days integer)'),
  ('authenticated', 'insights_events(p_days integer)'),
  ('authenticated', 'insights_community(p_days integer)'),
  ('authenticated', 'insights_staff(p_days integer)'),
  -- 20261031000001_app_errors.sql (record_app_error and app_errors_recent are service_role only)
  ('authenticated', 'admin_app_errors(p_hours integer)'),
  -- 20261031000003_bot_admin.sql (bot_* are service_role only)
  ('authenticated', 'admin_bot_overview()'),
  ('authenticated', 'admin_set_bot_setting(p_key text, p_value text)'),
  ('authenticated', 'admin_set_bot_job_enabled(p_name text, p_enabled boolean)');

-- Everything the two roles can execute right now, one row per role/function.
-- A function both roles hold must appear twice, so the roles are unnested
-- rather than picked with a CASE (which would label it anon only).
create temporary table actual as
  select r.role,
         p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as signature
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  cross join (values ('anon'), ('authenticated')) as r(role)
  where n.nspname = 'public'
    and has_function_privilege(r.role, p.oid, 'EXECUTE');

-- Compared per role: a missing entry means a grant was withdrawn, an extra one
-- means a new function became reachable.
select is((select coalesce(array_agg(a.role || ' ' || a.signature order by a.role, a.signature), '{}')
             from actual a
            where not exists (select 1 from expected e where e.role = a.role and e.signature = a.signature)),
  '{}'::text[], 'no function in public is executable by anon or authenticated outside the allowlist');

select is((select coalesce(array_agg(e.role || ' ' || e.signature order by e.role, e.signature), '{}')
             from expected e
            where not exists (select 1 from actual a where e.role = a.role and e.signature = a.signature)),
  '{}'::text[], 'every allowlisted function still has its grant (nothing was revoked by accident)');

-- The guard itself: a function created now with no explicit grant must come out
-- unreachable by both roles. Rolled back with the rest of the file. If this
-- fails, the default privileges stopped applying and the allowlist above is
-- only describing history.
create function public.default_privilege_probe() returns int language sql as $$ select 1 $$;
select ok(not has_function_privilege('anon', 'public.default_privilege_probe()', 'EXECUTE'),
  'a new function with no grant is not executable by anon');
select ok(not has_function_privilege('authenticated', 'public.default_privilege_probe()', 'EXECUTE'),
  'a new function with no grant is not executable by authenticated');

select * from finish();

rollback;