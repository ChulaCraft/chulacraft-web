# Discord bot contract (v1.1 phase 5)

What `chulacraft-discord` must do for badge roles and event reminders. Both are **pull-based**: the bot calls an RPC
with the service-role key, acts on Discord, then writes the result back. Nothing is pushed to the bot. Same pattern
as `announcements_discord_queue()`. The code is the final word: `supabase/migrations/20261026000002_achievement_discord_roles.sql`
and `20261028000001_event_reminders.sql`.

For local testing, `node scripts/local-mocks.mjs --bot` stands in for the bot (see [Local mock](#local-mock)).

Phase 7 adds settings from the database, task reports and the health check: [bot-contract-ops.md](bot-contract-ops.md).
It also moves the role-safety rule below into the database for roles the bot's settings name.

## Rules for the bot

- **At-least-once delivery.** Write back only *after* the Discord action succeeds. A crash between the action and the
  write-back repeats the action on the next poll. Adding or removing a role is idempotent; a reminder post may repeat.
- **One bot instance only.** Two instances would both act on the same item. A lease is a follow-up, not built yet.
- **Failures are written back, not swallowed.** Send `ok: false` with an `error` string. The queue then holds the item
  back until `retry_after` (backoff `min(2^attempts minutes, 24 h)`, where `attempts` counts earlier failures).
  "Member not in guild" is a failure like any other: never report it as success.
- **Role safety.** Refuse to add or remove any role the bot manages itself: the roles `verified-role-sync` assigns
  (verified, faculty, unit and Graduate role IDs). The database cannot know them, so this check lives in the bot.
  Discord hierarchy also applies: the bot can only assign roles below its own top role; a higher role fails and is retried.
- **Poll every 60 s.** Run the two queues independently.

## Badge roles

A badge can map to one role from `discord_assignable_roles` (edited by owner/admin only). The queue is the difference
between the roles members *should* have and what the bot has reported applying (`discord_role_state`). So revoking a
badge, banning the player, drafting the badge or changing its role all produce a `remove` with no extra work. Lifting a
ban gives the roles back.

### `discord_role_queue()`

| | |
| --- | --- |
| Arguments | none |
| Returns | rows `{ discord_id text, role_id text, op text }`, `op` is `add` or `remove` |
| Order / limit | removes first, then adds; then `discord_id`, `role_id`. At most **100** rows |
| Held back | a failed item is not listed again until its `retry_after` has passed |

`discord_id` is the player's Discord user ID (the Discord identity's `provider_id`). `role_id` is a Discord role ID.

### `discord_role_queue_done(p_items jsonb)` → `integer`

Argument: a JSON array, one object per item you acted on:

```json
[
  { "discord_id": "123", "role_id": "456", "op": "add", "ok": true },
  { "discord_id": "123", "role_id": "789", "op": "remove", "ok": false, "error": "Unknown Member" }
]
```

Returns how many items were recorded. Anything malformed (not an array, missing field, `op` not `add`/`remove`,
`ok` not a boolean) raises `INVALID` and records nothing.

| Item | Effect |
| --- | --- |
| `ok: true`, `add` | Recorded as applied; the failure count is cleared |
| `ok: true`, `remove` | Ledger row deleted |
| `ok: false`, `add` | Recorded as failed; held until `retry_after`; `error` stored (first 500 chars) |
| `ok: false`, `remove` | Role is still on the member, so it stays "applied" and comes back after `retry_after` |

Write-back only records facts. The next queue read re-derives what is wanted, so a race with an award or revoke
corrects itself. A failed add that is no longer wanted is dropped.

## Event reminders

Staff choose offsets per event (1 week, 1 day, 3 h, 1 h, 15 min). A reminder is due at `starts_at - offset`. Per event
only the **latest due** unsent offset is offered, so a bot that was down never posts a stack of stale reminders. A
reminder for an event that has started, or that is a draft, is never offered. Moving `starts_at` re-arms offsets that
are ahead again.

### `event_reminders_queue()`

| | |
| --- | --- |
| Arguments | none |
| Returns | rows `{ event_id uuid, name text, starts_at timestamptz, location text, offset_minutes integer, interested_discord_ids text[] }` |
| Order / limit | `starts_at`, then `event_id`. At most **50** rows (soonest first) |

`interested_discord_ids` are the Discord IDs of players who marked "interested" and have Discord linked; it can be empty.

### `event_reminder_sent(p_event_id uuid, p_offset_minutes integer)` → `boolean`

Call it after the post succeeds, with the `event_id` and `offset_minutes` from the row. It marks that reminder sent and
marks the larger unsent offsets of the same event skipped. Returns `true` when it marked one, `false` when it was already
sent or does not exist, so a retried write-back is harmless.

There is no failure write-back: if the post fails, do not call it. The reminder stays in the queue and is offered again
on the next poll, until the event starts.

### Message

Post one message in the **announcements channel** with the event name, start time, location and how long until it
starts, pinging every ID in `interested_discord_ids` (`<@id>`). DMs would use the same rows. The bell notification on
the website is separate: a `pg_cron` job (`event-reminders-notify`, every 5 min) sends it whether or not the bot runs,
and tracks it in its own column (`notified_at`).

## Local mock

```bash
node scripts/local-mocks.mjs --bot-once   # one pass over both queues, then exit
node scripts/local-mocks.mjs --bot        # poll both queues every 10 s
node scripts/local-mocks.mjs --bot-fail   # same, but write back ok:false, error 'mock failure'
```

Needs local Supabase running (`docker exec supabase_db_chulacraft`). It runs as `service_role`, logs each item and
writes it back. Under `--bot-fail`, role items are held until `retry_after` and reminders are left unsent.
