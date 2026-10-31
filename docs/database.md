# Database

Supabase Postgres. The schema is defined only by `supabase/migrations/*.sql` (applied in filename order).
Users live in Supabase's `auth.users`; everything below is in the `public` schema and keyed by that `user_id`.

**Access model**
- Every table has row-level security on. Players can `select` only the four tables listed under
  [Player-readable tables](#player-readable-tables), and only their own rows.
- Nobody but the service role writes tables directly. Writes go through `security definer` RPCs that check the
  caller, enforce rules, and log to `account_change_log`.
- Roles are `profiles.role`: `owner` > `admin` > `user`. `current_app_role()` returns the caller's role.

## Tables

### Accounts and identity

| Table | Purpose | Key columns |
| --- | --- | --- |
| `profiles` | One row per user | `user_id` PK, `role` (`owner`/`admin`/`user`), `first_name`, `last_name`, `nickname`, `faculty`, `major`, `study_level` (`undergraduate`/`graduate`), `guest_verified_at`/`_by` (admin-admitted non-Chula guest) |
| `chula_claims` | A verified @chula.ac.th Google account linked to a user | `user_id` PK, `google_sub` unique, `email` unique, `discord_id` unique, `claimed_at` |
| `privacy_settings` | Who can see each part of a profile | `user_id`, `profile`/`minecraft`/`achievements`/`friends` = `public`/`friends`/`private` |
| `registration_attempt_windows` | Rate limit for Minecraft add/change | `user_id`, `window_started_at`, `attempts` |

A player is "verified" (`is_player_verified`) if they have a `chula_claims` row **or** `profiles.guest_verified_at` is set.

### Minecraft whitelist

**`minecraft_registrations`** — one row per Minecraft account (`minecraft_uuid` unique). The whitelist worker syncs it to the server.

| Column | Meaning |
| --- | --- |
| `user_id`, `discord_user_id`, `discord_username` | Current owner |
| `minecraft_uuid` (unique), `minecraft_username`, `minecraft_username_key` (unique, lowercase) | The Minecraft account |
| `is_active` | `true` = in the player's list. `false` = unlinked (by player or admin); another player may take it over |
| `desired_whitelisted` | What the server *should* have. `false` = remove from whitelist |
| `sync_status` | `pending` / `synced` / `failed` — worker progress toward `desired_whitelisted` |
| `sync_attempts`, `next_sync_at`, `last_sync_error_code`, `last_sync_error_at`, `sync_failing_since` | Worker retry state |
| `whitelisted_at`, `revoked_at` | When the worker last applied an add / a removal |

Triggers: changing `desired_whitelisted` resets the sync fields to `pending`; `updated_at` and `sync_failing_since` are maintained automatically.

Rules (in `add_minecraft_account`, latest version in `20261016000001_minecraft_ownership_transfer.sql`):
- Max **5 active** accounts per user.
- An active account owned by someone else → `REGISTRATION_CONFLICT`.
- An unlinked account owned by someone else → **taken over**: the row's `user_id`/Discord fields move to the new
  player and the old owner is copied to `minecraft_ownership_history`.
- If the last whitelist decision on the account was an admin removal → `REGISTRATION_BLOCKED` for everyone.

**`minecraft_ownership_history`** — server-only (no player access). One row per handover.

| Column | Meaning |
| --- | --- |
| `registration_id`, `minecraft_uuid`, `minecraft_username` | The account that changed hands |
| `user_id`, `discord_user_id`, `discord_username`, `linked_at` | The **previous** owner and when they linked it |
| `transferred_to`, `transferred_at` | The new owner and when |

Who has owned an account:
```sql
select user_id, discord_username, linked_at, transferred_at from minecraft_ownership_history
where minecraft_uuid = '<uuid>' order by transferred_at;
select user_id, discord_username, created_at from minecraft_registrations where minecraft_uuid = '<uuid>'; -- current owner
```

### Moderation

| Table | Purpose | Key columns |
| --- | --- | --- |
| `bans` | Active/past bans | `user_id`, `reason`, `public_note`, `expires_at`, `lifted_at`/`_by`, `revoked_registrations` (accounts un-whitelisted by this ban, restored on lift) |
| `appeals` | Player appeal against a ban | `ban_id`, `user_id`, `message`, `status` (`open`/`accepted`/`rejected`), `admin_response` |
| `reports` | Player reports another player | `reporter_id`, `target_user_id`, `category` (`grief`/`cheat`/`harassment`/`other`), `status` (`open`/`actioned`/`dismissed`), `admin_note`. One open report per reporter/target pair |

### Social

| Table | Purpose |
| --- | --- |
| `friendships` | `requester_id`, `addressee_id`, `status` (`pending`/`accepted`) |
| `blocks` | `blocker_id`, `blocked_id` |

### Content

| Table | Purpose | Key columns |
| --- | --- | --- |
| `announcements` | Site + Discord announcements | `title`, `body`, `severity` (`info`/`warning`/`maintenance`), `pinned`, `published_at`, `expires_at`, `post_to_discord`, `revision`, `discord_message_id`, `discord_revision`, `deleted_at` (soft delete) |
| `events` | Community events | `name`, `starts_at`, `ends_at`, `location`, `image_path`, `status` (`draft`/`published`) |
| `event_interests` | "I'm interested" per user/event | `event_id`, `user_id` |
| `achievements` | Achievement definitions | `name`, `description`, `image_path`, `status` (`draft`/`published`), `tier` (`common`/`rare`/`epic`/`legendary`), `discord_role_id` (FK to `discord_assignable_roles`, nullable) |
| `achievement_awards` | An achievement given to a player | `user_id`, `achievement_id`, `event_id`, `awarded_on`, `awarded_by` |

### Engagement (v1.1 phase 5)

All have RLS on and no policies; access is through RPCs. Bot contract: [bot-contract-phase5.md](bot-contract-phase5.md).

| Table | Purpose | Key columns |
| --- | --- | --- |
| `discord_assignable_roles` | Allowlist of Discord roles a badge may give. Edited by owner/admin only | `role_id` PK (17-20 digits), `label`, `added_by` |
| `discord_role_state` | Ledger of what the bot reported for each (member, role). Queue = wanted minus applied | `discord_id`+`role_id` PK, `status` (`applied`/`failed`), `attempts`, `retry_after`, `last_error` |
| `achievement_showcase` | Up to 3 badges a player shows first | `user_id`, `achievement_id`, `position` (1-3) |
| `event_attendance` | Who checked in to an event | `event_id`+`user_id` PK, `method` (`self`/`staff`/`backfill`), `recorded_by` |
| `event_checkin_secrets` | Per-event HMAC secret for the rotating QR. Not readable by the service role | `event_id` PK, `secret`, `rotated_at` |
| `player_checkin_codes` | Player's personal check-in code `CC-XXXXXXXXXX`. Not readable by the service role | `user_id` PK, `code` unique |
| `event_reminders` | Reminder offsets per event (15, 60, 180, 1440, 10080 min) | `event_id`+`offset_minutes` PK, `sent_at` (bot), `notified_at` (bell), `skipped_at` |
| `notifications` | The bell. Created by the database only; deleted after 90 days | `user_id`, `kind` (`award`/`appeal`/`report`/`banner`/`reminder`), `payload`, `read_at` |

Triggers:
- `achievement_awards` insert → `notify_awards` (statement-level, award + new banner notifications); `banner_grants` insert → `notify_banner_grants`.
- `appeals` / `reports` update of `status` → `notify_appeal` / `notify_report` (row-level).
- `events` update of `starts_at` → `event_reminders_rearm` (clears sent/notified/skipped for offsets now in the future).

Cron jobs (`pg_cron`): `event-reminders-notify` every 5 min (`event_reminders_notify()`), `notifications-cleanup` daily at 17:20 UTC
(`cleanup_notifications()`), plus the earlier `stats-daily`.

Check-in rules: open from `starts_at - 15 min` to `coalesce(ends_at, starts_at) + 15 min` (`checkin_open`). Token = `<window>.<mac>`,
30 s windows, current and previous accepted. A proof (`p.<expires>.<mac>`) lasts 5 min. Only verified, non-banned players can check in.

### Insights (v1.1 phase 6)

| Table | Purpose | Key columns |
| --- | --- | --- |
| `funnel_failures` | Daily count of registration failures, with **no user identifier**. RLS on, no policies | `day` (Bangkok date), `step` (`minecraft`/`verify`), `code` (`^[A-Z0-9_]{2,40}$`), `count`; PK (`day`, `step`, `code`) |

`record_funnel_failure(p_step, p_code)` adds 1 to today's row. **Service role only**, so a player can't inflate counts; the web app calls it
fire-and-forget from `src/lib/funnel.ts` (a failure to record never changes the player's response).

The page `/admin/insights` reads five `insights_*(p_days int) -> jsonb` RPCs (`p_days` 7/30/90, or null for all). Days are Asia/Bangkok.
Each returns series for `2 × p_days` days ending today, so the page can show a change vs the previous period.
`insights_funnel` is the exception: totals only, so its cohort and failures cover `p_days` days ending today.
All are callable by `authenticated` but raise `FORBIDDEN` unless the caller passes `staff_can(...)`:

| RPC | Needs | Returns |
| --- | --- | --- |
| `insights_players` | `admin` | `stats_daily` snapshots, signups per day, players by faculty |
| `insights_funnel` | `admin` | Cohort funnel (signed in, Discord, verified, registered, whitelisted) and `funnel_failures` |
| `insights_events` | `community` | Interest and attendance per event, attendance per day |
| `insights_community` | `moderation` | Badge tiers and top badges, reports and appeals per day |
| `insights_staff` | `admin` | `account_change_log` actions per day and entity |

### Error capture (v1.1 phase 7)

| Table | Purpose | Key columns |
| --- | --- | --- |
| `app_errors` | Website errors, scrubbed before insert. **No cookies, tokens, emails, query strings or user ids.** RLS on, no policies; pg_cron deletes rows older than 30 days daily | `at`, `kind` (`server`/`client`), `route` (path, <= 200), `message` (<= 500), `digest` (<= 64), `fingerprint` (sha1 of kind, message with digits as `#`, route) |

Written by `src/lib/app-errors.ts` (`recordAppError`, called from `src/instrumentation.ts` and `POST /api/client-errors`).
`record_app_error(p_kind, p_route, p_message, p_digest)` and `app_errors_recent(p_minutes)` are **service role only**. Long text is truncated,
an unknown kind raises `INVALID`. `admin_app_errors(p_hours)` (owner/admin, else `FORBIDDEN`) groups by fingerprint: `(fingerprint, message, route, kind, n, first_at, last_at)`.

### Discord bot settings and tasks (v1.1 phase 7)

RLS on, no policies, no grants to `anon`/`authenticated`. Bot contract: [bot-contract-ops.md](bot-contract-ops.md).

| Table | Purpose | Key columns |
| --- | --- | --- |
| `bot_settings` | Settings the bot registered; admins set `value` at `/admin/ops/bot`. Never secrets | `key` PK (`^[a-z][a-z0-9_]{1,63}$`), `kind`, `applies` (`live`/`restart`), `min_value`, `max_value`, `label`, `description`, `default_value` (the bot's `.env`), `value` (null = default), `updated_by`, `updated_at`, `bot_status` (`ok`/`invalid`/null), `bot_error`, `checked_at`, `registered_at`, `retired_at` |
| `bot_jobs` | Automatic tasks the bot registered | `name` PK, `label`, `interval_seconds` (null = event-driven), `enabled`, `last_started_at`, `last_finished_at`, `last_ok`, `last_items`, `last_error`, `consecutive_failures`, `registered_at`, `retired_at` |
| `bot_job_runs` | One row per task run; pg_cron `bot-job-runs-cleanup` (daily 17:50 UTC) deletes rows older than 14 days | `job` (FK), `started_at`, `finished_at`, `ok`, `items`, `error` |

Bot RPCs (**service role only**): `bot_register(p_settings, p_jobs)`, `bot_config()`, `bot_settings_report(p_items)`,
`bot_job_report(p_job, p_started_at, p_finished_at, p_ok, p_items, p_error)`. Admin RPCs (owner/admin, logged with entity
`bot_settings`/`bot_jobs`): `admin_bot_overview()` (settings, tasks with their last 20 runs, queue backlog),
`admin_set_bot_setting(p_key, p_value)` (`INVALID`, `NOT_FOUND`, `RETIRED`, `ROLE_IN_USE_BY_BADGE`),
`admin_set_bot_job_enabled(p_name, p_enabled)`. `admin_save_discord_role` now also raises `ROLE_MANAGED_BY_BOT` for a
role a bot role setting uses.

### Audit

**`account_change_log`** — append-only history of every change. Shown at `/admin/audit`.

| Column | Meaning |
| --- | --- |
| `actor_user_id` | Who did it |
| `target_user_id` | Whose account it affected (at the time) |
| `entity`, `entity_id` | Which table and row (`minecraft_registrations`, `profiles`, `chula_claims`, `identities`, `achievements`, `events`, `achievement_awards`, `announcements`, `server_console` (before Phase 7), `ops`, `bot_settings`, `bot_jobs`, `bans`, `appeals`, `reports`, `discord_assignable_roles`, `event_attendance`) |
| `field`, `old_value`, `new_value` | What changed |
| `source` | `self` (player) or `admin` |

Write to it only through `log_account_change(...)`. To add a new `entity`, update the `account_change_log_entity_check` constraint.

`profiles_major_backup_20261005` is a one-off backup from a data migration; nothing reads it.

## Player-readable tables

RLS `select` policies (own rows only): `profiles`, `chula_claims`, `minecraft_registrations`, `account_change_log`.
Everything else is read through RPCs.

## RPC functions

Who can call each function (checked by `supabase/tests/default_function_privileges.test.sql`):

- **Anyone (anon):** `get_event`, `list_announcements`, `list_upcoming_events`, `list_past_events`, `is_chula_email`,
  `checkin_proof` (also `authenticated`)
- **Signed-in players:** `my_ban`, `my_chula_claim`, `my_achievements`, `my_privacy`, `my_social`, `am_i_player_verified`,
  `current_app_role`, `consume_registration_attempt`, `get_player_profile`, `search_players`, `update_privacy`,
  `send_friend_request`, `respond_friend_request`, `remove_friend`, `block_player`, `unblock_player`,
  `report_player`, `submit_appeal`, `set_event_interest`, `set_my_showcase`, `check_in`, `my_checkin_code`,
  `my_event_history`, `get_player_event_history`, `my_unread_notifications`, `my_notifications`, `mark_my_notifications_read`
- **Admins** (callable by `authenticated`, but each raises `FORBIDDEN` unless owner/admin): every `admin_*` function.
  New in phase 5: `admin_list_discord_roles`, `admin_save_discord_role`, `admin_delete_discord_role` (owner/admin only),
  `admin_set_achievement_meta`, `admin_checkin_token`, `admin_rotate_checkin_secret`, `admin_check_in_player`,
  `admin_list_attendance`, `admin_remove_attendance`, `admin_award_attendees`, `admin_set_event_reminders`,
  `admin_event_reminders` (community staff)
  New in phase 7: `admin_bot_overview`, `admin_set_bot_setting`, `admin_set_bot_job_enabled` (owner/admin only),
  `admin_app_errors`, and `admin_ops_access(p_jti, p_service, p_action) returns text` (the caller's role), which replaced
  `admin_server_console_access`. It is the role check and audit row before `/admin/ops` signs a 60 s manager token.
  Actions: `status`, `logs`, `console`, `console_write`, `start`, `stop`, `restart`, `backup_list`, `backup_run`, `update`;
  anything else raises `INVALID`. `update` (image pull + recreate) is owner-only. Every action that isn't a read
  (`status`, `logs`, `console`, `backup_list`) writes an `account_change_log` row with entity `ops`, the token `jti` as
  `entity_id`, the action as `field` and the service id as `new_value`
  (`supabase/migrations/20261031000002_ops_console.sql`)
- **Staff by area** (phase 6): `insights_players`, `insights_funnel`, `insights_staff` (`admin`), `insights_events` (`community`),
  `insights_community` (`moderation`)
- **Service role only** (web server / other services): `add_minecraft_account`, `change_minecraft_account`,
  `remove_minecraft_account`, `update_profile_details`, `claim_chula`, `log_account_change`, `log_identity_change`,
  `verified_members`, `announcements_discord_queue`, `discord_role_queue`, `discord_role_queue_done`,
  `event_reminders_queue`, `event_reminder_sent`, `record_funnel_failure`, `bot_register`, `bot_config`,
  `bot_settings_report`, `bot_job_report`, plus internal helpers (`is_banned`, `is_player_verified`,
  `can_view`, `revoked_by_admin`, `lift_ban`, …)
- **Auth hook:** `hook_only_discord_signups` (configured in `supabase/config.toml`; only Discord sign-ups allowed)

Errors are raised as plain codes (`FORBIDDEN`, `NOT_FOUND`, `BANNED`, `LIMIT_REACHED`, …) that the web app maps to messages.

## Other services that use this database

All use the service-role key. **Changing anything they touch can break them.**

| Service | Reads | Writes |
| --- | --- | --- |
| `chulacraft-whitelist-worker` | `minecraft_registrations` (`id, minecraft_username, desired_whitelisted, sync_status, sync_attempts, next_sync_at, revoked_at`) | Same table: `sync_status`, `sync_attempts`, `next_sync_at`, `last_sync_error_*`, `whitelisted_at`, `revoked_at` (matched on `id` + `desired_whitelisted`) |
| `chulacraft-discord` | `verified_members()` (verified role), `announcements_discord_queue()`, `discord_role_queue()`, `event_reminders_queue()`, `bot_config()`, `minecraft_registrations` counts (status monitor) | `announcements.discord_message_id`, `discord_revision`; via RPC `discord_role_queue_done()`, `event_reminder_sent()` (see [bot-contract-phase5.md](bot-contract-phase5.md)), `bot_register()`, `bot_settings_report()`, `bot_job_report()` (see [bot-contract-ops.md](bot-contract-ops.md)) |
| `chulacraft-server-manager` | — (trusts an Ed25519-signed JWT from `/admin/ops`) | — |

Safe changes: add a table, add a nullable column, add a function. Risky: rename/drop columns, change uniqueness,
allow several rows per Minecraft account, change the meaning of `desired_whitelisted`/`revoked_at`.
There may be other consumers not listed here — check with the team before a risky change.
