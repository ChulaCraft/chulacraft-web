# Discord bot contract: settings and automatic tasks (v1.1 phase 7)

What `chulacraft-discord` must do so owners and admins can change its channel and role IDs at `/admin/ops/bot` and
see every automatic task it runs. Like [bot-contract-phase5.md](bot-contract-phase5.md), it is **pull-based**: the bot
calls RPCs with the service-role key and nothing is pushed to it. The code is the final word:
`supabase/migrations/20261031000003_bot_admin.sql`.

For local testing, `node scripts/local-mocks.mjs --bot` stands in for the bot (see [Local mock](#local-mock)).

## Where values live

| Where | What |
| --- | --- |
| Bot `.env` | **Secrets** (`DISCORD_TOKEN`, `OPENROUTER_API_KEY`, `SUPABASE_SECRET_KEY`), never in the database. Every other value too, as the **fallback default**, so the bot still starts with the database down |
| `bot_settings.value` | What an admin set on the site. Null means "use the default" |
| `db.json` on the host | Join-to-create lobbies, managed messages, the bot-owned `academicRoles` map (unchanged in v1) |

**Effective value = the database value if set, otherwise the `.env` value.** `bot_config()` already does this merge
using the default the bot registered, so the bot only falls back to its own `.env` when the database can't be reached.

## Rules for the bot

- **Never register a secret.** `bot_register` refuses any key matching `token|secret|password|key$` with `INVALID`, so
  a mistake can't put the token on a web page. Register only what an admin may see and change.
- **Your validators stay the final check.** Run the existing ones (`announcement-config.js`, `verified-role-config.js`,
  `status-monitor.js`) on database values exactly as on `.env` values. On rejection keep the **last good value** and
  report the setting `invalid` with the validator's message.
- **Apply `live` settings at once; keep `restart` settings until the next start.** The site says "Applies after the
  bot restarts" for those and links to the bot container's Ops page.
- **Skip paused tasks.** A task listed in `paused_jobs` does not run until it disappears from the list.
- **Report every task run**, including no-op runs with `items: 0`. The site calls a task *Overdue* when an enabled task
  with an interval hasn't started for more than 3 intervals, so a silent no-op looks like a stuck task.
- **One bot instance only**, as in phase 5.

## Startup: `bot_register(p_settings jsonb, p_jobs jsonb)` → `void`

If the call fails, the bot retries it on each 60 s poll until it succeeds.

Call once on every start, before the first poll. It upserts the definitions and **never overwrites `value` or
`enabled`**. Keys and tasks you no longer send get `retired_at` (shown folded at the bottom of the page); ones that
come back are un-retired. Anything malformed raises `INVALID` and registers nothing.

```json
{
  "p_settings": [
    { "key": "discord_announcement_channel_id", "kind": "channel", "applies": "live",
      "label": "Announcements channel", "description": "Where /announce drafts are posted.",
      "default_value": "1531645378720567326" },
    { "key": "status_monitor_interval_ms", "kind": "number", "label": "Status check interval (ms)",
      "min_value": 10000, "default_value": "60000" }
  ],
  "p_jobs": [
    { "name": "status_monitor", "label": "Status monitor", "interval_seconds": 60 },
    { "name": "join_to_create", "label": "Join to create", "interval_seconds": null }
  ]
}
```

| Field | Rule |
| --- | --- |
| `key`, `name` | `^[a-z][a-z0-9_]{1,63}$`. Use the `.env` name lower-cased |
| `kind` | `guild`, `channel`, `role`, `role_list`, `user_list`, `url`, `number`, `boolean`, `text`, `text_list` |
| `applies` | `live` (default) or `restart` |
| `label` | 1–120 chars; `description` ≤ 500 chars |
| `default_value` | The `.env` value as a string, or omit/null when blank |
| `min_value`, `max_value` | Optional integers, `number` only |
| `interval_seconds` | A positive integer, or null for event-driven tasks (never overdue; the page shows last run and result only) |

### Settings in v1

| Key | Kind | Applies |
| --- | --- | --- |
| `discord_guild_id` | `guild` | restart |
| `discord_admin_bot_channel_id`, `discord_announcement_channel_id`, `discord_status_channel_id`, `discord_web_news_channel_id` | `channel` | live |
| `verified_role_id`, `status_alert_mention_role_id` | `role` | live |
| `discord_announcement_admin_role_ids` | `role_list` | live |
| `discord_announcement_admin_user_ids` | `user_list` | live |
| `status_minecraft_address` | `text` | live |
| `status_website_url`, `web_announcements_url`, `openrouter_site_url` | `url` | live |
| `status_monitor_interval_ms`, `web_announcements_interval_ms` | `number` (`min_value` 10000) | live |
| `announcement_draft_ttl_minutes`, `announcement_daily_generation_limit`, `announcement_daily_warning_threshold`, `announcement_user_cooldown_seconds`, `announcement_max_concurrent_requests`, `announcement_max_image_bytes` | `number` (`min_value` 1) | live |
| `openrouter_default_model` | `text` | live |
| `openrouter_allowed_models` | `text_list` | live |
| `openrouter_require_free_models` | `boolean` | live |

### Tasks in v1

| Name | Trigger | `interval_seconds` |
| --- | --- | --- |
| `web_announcements` | every 60 s + Realtime | 60 |
| `status_monitor` | every 60 s | 60 |
| `verified_role_sync` | Realtime + startup sweep | null |
| `join_to_create` | voice events | null |
| `managed_messages` | startup / reload | null |
| `announce_drafts` | `/announce` | null |

The phase 5 queues `badge_roles` and `event_reminders` (every 60 s) are added when the bot builds them.

## Every poll: `bot_config()` → `jsonb`

Read it every **60 s** and on `SIGHUP`.

```json
{ "settings": { "discord_announcement_channel_id": "1531645378720567326", "status_alert_mention_role_id": null },
  "paused_jobs": ["web_announcements"] }
```

`settings` has every registered, non-retired key with its effective value; `null` means neither the site nor the
registered default has one, so use the `.env` value (blank: feature off, as today). `paused_jobs` lists the tasks to skip.

## After applying settings: `bot_settings_report(p_items jsonb)` → `integer`

After you apply a changed setting (and on startup for every `guild`/`channel`/`role`/`role_list`/`user_list` one),
report whether you could use it: the channel or role resolved in the guild, and your validator accepted it.

```json
[
  { "key": "discord_announcement_channel_id", "value": "1531645378720567326", "ok": true },
  { "key": "discord_status_channel_id", "value": "1556586342484287490", "ok": false, "error": "Unknown Channel" }
]
```

`ok: false` shows "Bot can't find this channel: Unknown Channel" (the first 500 chars of `error`) next to the field.
Send the `value` you checked: the report is ignored if an admin changed the setting since, so an old check never marks a
new value OK. Unknown keys are skipped. Returns how many settings were updated. A save on the site clears the check, and
the field says "Waiting for the bot to check" until your next report.

## Every task run: `bot_job_report(p_job, p_started_at, p_finished_at, p_ok, p_items, p_error)` → `void`

| Argument | Meaning |
| --- | --- |
| `p_job text` | A registered task name (`NOT_FOUND` otherwise) |
| `p_started_at`, `p_finished_at timestamptz` | When the run started and finished |
| `p_ok boolean` | Whether it worked |
| `p_items integer` | How many items it handled (`0` for a no-op run), or null when that doesn't apply |
| `p_error text` | Why it failed (first 500 chars); ignored when `p_ok` is true |

Writes a row to `bot_job_runs` (kept 14 days) and updates the task: last run, result, items and error.
`consecutive_failures` counts failures in a row and resets on success. A late report of an older run is stored but
doesn't move "last run".

## Status monitor: website health and error spikes

Add one check to `src/status-monitor.js`, next to Minecraft, the website, Supabase and the whitelist queue:

- `GET https://www.chulacraft.com/api/ops/health` (the bare domain redirects to `www`, and `fetch` drops `Authorization` across that redirect, so the probe uses `redirect: "error"` and never follows one) with `Authorization: Bearer <OPS_HEALTH_TOKEN>` (new value in the bot's
  `.env`; the same secret is set on the website). The response is `{ ok, db: "ok" | "down", errors_5m, version }`.
- **Down** when the request fails, times out, isn't 200, or `ok` is false. Same rule as the other checks: 🔴 after two
  failures, 🟢 on recovery.
- **Error spike** when `errors_5m ≥ 10`: post one alert, and one recovery once it drops below 10.

Known gap (already in the bot README): nothing alerts when the bot's own host is down, and the bot can't alert about its
own stuck tasks. `/admin/ops` shows overdue tasks and the bot container's Docker state.

## Role safety

The database now enforces the bot-managed-roles rule that phase 5 left to the bot:

- A `role` or `role_list` setting can't hold a role in `discord_assignable_roles` (`ROLE_IN_USE_BY_BADGE`).
- `admin_save_discord_role` refuses a role any live `role`/`role_list` setting uses, as its value or registered default
  (`ROLE_MANAGED_BY_BOT`).

The phase 5 bot-side check stays: roles from the `academicRoles` map in `db.json` are not in the database.

## Admin side (for reference)

`admin_bot_overview()`, `admin_set_bot_setting(p_key, p_value)` and `admin_set_bot_job_enabled(p_name, p_enabled)` are
owner/admin only (`FORBIDDEN` otherwise) and every change is logged in `account_change_log` with entity
`bot_settings` or `bot_jobs`. Value rules per kind (`INVALID` otherwise):

| Kind | Rule |
| --- | --- |
| `guild`, `channel`, `role` | 17–20 digits |
| `role_list`, `user_list` | comma-separated 17–20-digit IDs, ≤ 25 (stored without spaces) |
| `url` | `http://` or `https://`, no spaces, ≤ 300 chars |
| `number` | integer, within `min_value..max_value` when set |
| `boolean` | `true` / `false` |
| `text` | ≤ 500 chars, no newlines |
| `text_list` | comma-separated, ≤ 25 items, each 1–120 chars |

## Local mock

```bash
node scripts/local-mocks.mjs --bot-once   # register, one pass, then exit
node scripts/local-mocks.mjs --bot        # register, then a pass every 10 s
node scripts/local-mocks.mjs --bot-fail   # same, but queue tasks report ok:false 'mock failure'
```

On start the mock registers the v1 settings (fake defaults) and tasks, plus `badge_roles` and `event_reminders`, which
it already works. Each pass reads `bot_config()`, skips paused tasks, reports a run for every task it works (including
`items: 0`), and reports each changed ID setting: `ok`, or `invalid` with "Unknown Channel" for a channel ending `0000`.
