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
| `achievements` | Achievement definitions | `name`, `description`, `image_path`, `status` (`draft`/`published`) |
| `achievement_awards` | An achievement given to a player | `user_id`, `achievement_id`, `event_id`, `awarded_on`, `awarded_by` |

### Audit

**`account_change_log`** — append-only history of every change. Shown at `/admin/audit`.

| Column | Meaning |
| --- | --- |
| `actor_user_id` | Who did it |
| `target_user_id` | Whose account it affected (at the time) |
| `entity`, `entity_id` | Which table and row (`minecraft_registrations`, `profiles`, `chula_claims`, `identities`, `achievements`, `events`, `achievement_awards`, `announcements`, `server_console`, `bans`, `appeals`, `reports`) |
| `field`, `old_value`, `new_value` | What changed |
| `source` | `self` (player) or `admin` |

Write to it only through `log_account_change(...)`. To add a new `entity`, update the `account_change_log_entity_check` constraint.

`profiles_major_backup_20261005` is a one-off backup from a data migration; nothing reads it.

## Player-readable tables

RLS `select` policies (own rows only): `profiles`, `chula_claims`, `minecraft_registrations`, `account_change_log`.
Everything else is read through RPCs.

## RPC functions

Who can call each function (checked by `supabase/tests/default_function_privileges.test.sql`):

- **Anyone (anon):** `get_event`, `list_announcements`, `list_upcoming_events`, `list_past_events`, `is_chula_email`
- **Signed-in players:** `my_ban`, `my_chula_claim`, `my_achievements`, `my_privacy`, `my_social`, `am_i_player_verified`,
  `current_app_role`, `consume_registration_attempt`, `get_player_profile`, `search_players`, `update_privacy`,
  `send_friend_request`, `respond_friend_request`, `remove_friend`, `block_player`, `unblock_player`,
  `report_player`, `submit_appeal`, `set_event_interest`
- **Admins** (callable by `authenticated`, but each raises `FORBIDDEN` unless owner/admin): every `admin_*` function
- **Service role only** (web server / other services): `add_minecraft_account`, `change_minecraft_account`,
  `remove_minecraft_account`, `update_profile_details`, `claim_chula`, `log_account_change`, `log_identity_change`,
  `verified_members`, `announcements_discord_queue`, plus internal helpers (`is_banned`, `is_player_verified`,
  `can_view`, `revoked_by_admin`, `lift_ban`, …)
- **Auth hook:** `hook_only_discord_signups` (configured in `supabase/config.toml`; only Discord sign-ups allowed)

Errors are raised as plain codes (`FORBIDDEN`, `NOT_FOUND`, `BANNED`, `LIMIT_REACHED`, …) that the web app maps to messages.

## Other services that use this database

All use the service-role key. **Changing anything they touch can break them.**

| Service | Reads | Writes |
| --- | --- | --- |
| `chulacraft-whitelist-worker` | `minecraft_registrations` (`id, minecraft_username, desired_whitelisted, sync_status, sync_attempts, next_sync_at, revoked_at`) | Same table: `sync_status`, `sync_attempts`, `next_sync_at`, `last_sync_error_*`, `whitelisted_at`, `revoked_at` (matched on `id` + `desired_whitelisted`) |
| `chulacraft-discord` | `verified_members()` (verified role), `announcements_discord_queue()`, `minecraft_registrations` counts (status monitor) | `announcements.discord_message_id`, `discord_revision` |
| `chulacraft-server-manager` | — (trusts an Ed25519-signed JWT from `/admin/server`) | — |

Safe changes: add a table, add a nullable column, add a function. Risky: rename/drop columns, change uniqueness,
allow several rows per Minecraft account, change the meaning of `desired_whitelisted`/`revoked_at`.
There may be other consumers not listed here — check with the team before a risky change.
