# Plan: server status, announcements, bans/appeals, reports, audit log

## Constraints from `chulacraft-server-manager`

The manager is a Rust/axum service behind Apache on a unix socket. It exposes
`/status` (host CPU/RAM), `/servers`, `/server/{id}/status` (systemd unit +
process), logs, a console WebSocket, `/server/{id}/cmd?cmd=…` (raw console
command over GET) and `/server/{id}/{start|stop|restart}`. Auth is whatever
Apache puts in `X-Remote-User`.

Decisions that follow:

- **The web app never calls the manager.** `/cmd` is a root-equivalent console
  over GET; exposing it to Vercel means a leaked secret = full server control.
  It also doesn't know player counts, only systemd state.
- **Supabase stays the source of truth.** The existing whitelist worker already
  turns DB rows into server state, and admin revoke (`revoked_by_admin`) already
  blocks re-registration. Bans build on that instead of sending `/ban`.
- **Player count comes from the standard Minecraft Server List Ping** (TCP, the
  same thing the multiplayer screen uses) against
  `NEXT_PUBLIC_MINECRAFT_SERVER_ADDRESS` (`mc` CNAME →
  `dklab-mc-beaw-ct01.endpoints.dekkapok.engineering`, port 25565, reachable
  publicly). No server changes needed.

## Other repos involved

| Repo | Role here |
| --- | --- |
| `chulacraft-whitelist-worker` (new, split out) | Supabase → RCON. Gains: kick on removal. |
| `chulacraft-discord` | Already subscribes to Supabase Realtime (`verified-role-sync`). Gains: post web announcements to channel `1556576724416864336`. |
| `chulacraft-minecraft` | Compose stack; switches `whitelist-sync` to the worker's published image. |

## Phase 0 — Split the whitelist worker into its own repo

`chulacraft-minecraft/whitelist-worker/` is self-contained (5 `.cjs` files,
own `package.json`, `Dockerfile`, `node --test` tests), so this is a move, not a
rewrite.

1. `git subtree split --prefix=whitelist-worker -b worker-only` in
   `chulacraft-minecraft` → push to new `ChulaCraft/chulacraft-whitelist-worker`
   (keeps history).
2. New repo: README (env vars: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`,
   `RCON_HOST`, `RCON_PORT`, `RCON_PASSWORD`, `POLL_INTERVAL_MS`), CI running
   `npm run check && npm test`, and a workflow publishing the image to
   `ghcr.io/chulacraft/whitelist-worker` on `main`.
3. Bump base image `node:22-alpine` → `node:24-alpine` (Node 20/22 EOL path).
4. `chulacraft-minecraft`: Compose `whitelist-sync` uses the GHCR image instead
   of `build: ./whitelist-worker`; delete the folder; README points to the new
   repo.

Worker change needed for bans (Phase 3): after a successful
`whitelist remove <name>`, also send `kick <name> Your access was removed.`
(ignore "no player found"). Removal only happens when an admin revokes / bans or
the player deletes the account, so kicking on every removal is correct and needs
no new column.

## Phase 1 — Live server status (#1)

- `src/lib/server-status.ts`: SLP over `node:net` (handshake + status request,
  parse JSON → `{ online, players: { online, max, sample[] }, version, motd }`),
  3 s timeout, returns `{ online: false }` on any error. No new dependency.
- Cache: wrap in `unstable_cache`/`"use cache"` (check
  `node_modules/next/dist/docs/` for the Next 16 API) with 30 s revalidate so a
  page load never waits on the server.
- UI: `src/components/server-status.tsx` badge (dot + "12/50 online" + names from
  `sample`) on home page next to `server-address-card` and on `/dashboard`.
- Tests: unit test the packet encoder/parser with a recorded status payload;
  visual audit stubs the fetch (offline state renders).

## Phase 2 — Announcements (#3)

- Migration `announcements(id, title, body, severity info|warning|maintenance,
  pinned bool, published_at, expires_at, created_by)`. RLS: anyone selects rows
  where `published_at <= now()` and not expired; writes via
  `current_app_role() in ('owner','admin')`.
- `/admin/announcements` list + form — copy the `admin/achievements/events`
  CRUD pattern (server actions + `confirm-action`). Form has a
  "Post to Discord" checkbox (`post_to_discord bool`).
- Discord: extra columns `discord_message_id text`, `discord_posted_at`. The
  bot adds a Realtime listener on `announcements` (same pattern as
  `verified-role-sync`) plus a startup sweep for rows where
  `post_to_discord and discord_message_id is null and published_at <= now()`
  (covers missed events and scheduled posts). It posts an embed with title,
  body and a link to `/announcements`, to `DISCORD_WEB_NEWS_CHANNEL_ID=1556576724416864336`,
  with `allowedMentions: { parse: [] }`, then writes back `discord_message_id`
  (conditional update `where discord_message_id is null` so restarts don't
  double-post). Editing on the web edits the Discord message; delete deletes it.
  This is separate from the existing `/announce` AI-draft flow, which keeps
  posting to `1531645378720567326`.
- Site-wide banner in `site-header` for the newest pinned/active one
  (dismiss stored in `localStorage` by id); `/announcements` page lists all.
- pgTAP test for the RLS policies.

## Phase 2b — Downtime alerts (chulacraft-discord bot)

New `src/status-monitor.js` in the bot; posts to
`DISCORD_STATUS_ALERT_CHANNEL_ID=1556586342484287498`. Every 60 s it checks:

| Service | Check | Down when |
| --- | --- | --- |
| Minecraft | Server List Ping to `mc.chulacraft.com` (port of `src/lib/server-status.ts` to JS) | no valid reply in 5 s |
| Website | `GET https://chulacraft.com/` | non-2xx or > 10 s |
| Supabase | `GET $SUPABASE_URL/auth/v1/health` | non-2xx or > 10 s |
| Whitelist worker | rows in `minecraft_registrations` with `sync_status='pending'` and `next_sync_at` older than 5 min (service-role read the bot already has) | count > 0 |

Because the worker's only output is the database, the stuck-queue check catches
a dead worker, an RCON outage and a broken DB write all at once, without a
heartbeat table.

- Alerts on state changes only: 🔴 after 2 consecutive failures (no flapping
  from one dropped packet), 🟢 "recovered after 12 min" on the first success.
  State is kept in memory; on startup the bot assumes "up", so a restart during
  an outage re-alerts once at most.
- Plain embed, `allowedMentions: { parse: [] }`. Optional
  `STATUS_ALERT_MENTION_ROLE_ID` to ping on-call admins on 🔴 only.
- Config via env (`STATUS_MONITOR_INTERVAL_MS`, target URLs), unit tests for
  the state machine (up → 1 fail → down alert → recovery) with injected checks
  and clock, following the bot's existing `node --test` style.
- Limitation: if the bot's own host dies, nothing alerts. If the bot runs on
  the same box as Minecraft, add an external uptime check (e.g. UptimeRobot →
  Discord webhook into the same channel) for the website and Minecraft port.

## Phase 3 — Bans & appeals (#8)

- Migration `bans(id, user_id, reason, public_note, created_by, created_at,
  expires_at null = permanent, lifted_at, lifted_by)`.
- RPC `admin_ban_user(user_id, reason, public_note, expires_at)`: same role
  guard as the existing admin RPCs (admin can't ban admin/owner), revokes all
  the user's `minecraft_registrations` the same way admin revoke does, writes
  `account_change_log`. `admin_lift_ban` reverses it (registrations go back to
  pending so the worker re-whitelists).
- Temp-ban expiry: `is_banned(uid)` checks `expires_at > now()`; the
  registration RPC refuses while banned. Re-whitelisting after expiry happens
  when the player re-saves (ponytail: no cron; add pg_cron job if players
  complain).
- Player view: `/dashboard` shows a ban card (public note, expiry, appeal
  button). Admin-only `reason` is never selected for players (column grant,
  same trick as `account_change_log.actor_user_id`).
- `appeals(id, ban_id, user_id, message, status open|accepted|rejected,
  admin_response, decided_by, created_at, decided_at)`; one open appeal per
  ban (partial unique index). Accepting an appeal calls `admin_lift_ban`.
- Admin: ban/lift buttons on `/admin/users/[id]`; `/admin/appeals` queue.
- In-game: revoking sets `desired_whitelisted=false`; the worker removes from
  the whitelist and kicks (Phase 0 change) within one poll (~8 s).
- Discord: `verified_members` excludes banned users, so the bot's existing sync
  drops the verified/faculty roles. Removing them from the guild is out of
  scope.

## Phase 4 — Report a player (#9)

- Migration `reports(id, reporter_id, target_user_id, category grief|cheat|
  harassment|other, details, evidence_url, status open|actioned|dismissed,
  handled_by, admin_note, created_at)`. Reporter can insert and read own rows;
  admins read/update all. Rate limit with the existing durable per-user limiter
  (e.g. 5/day). Can't report yourself.
- "Report" button on `/player/[id]` next to the existing block action → small
  form (server action). `/admin/reports` queue with "ban this user" shortcut
  into Phase 3.

## Phase 5 — Admin audit log (#10)

- Reuse `account_change_log`: widen the `entity` check to include `bans`,
  `appeals`, `reports`, `announcements`, `achievement_awards`, and log from the
  new RPCs/actions.
- RPC `admin_audit_log(filters…, before cursor, limit 50)` gated to
  owner/admin, joins actor/target display names.
- `/admin/audit` page: table, filters (actor, target, entity, date), keyset
  pagination. Link per-user filtered view from `/admin/users/[id]`.

## Order and size

| Phase | Depends on | Size |
| --- | --- | --- |
| 0 Worker repo split | — | S |
| 1 Status | — | S |
| 2 Announcements (+ bot listener) | — | S + S (bot) |
| 2b Downtime alerts (bot) | — | S (bot only) |
| 5 Audit log | — (do before 3/4 so they log from day one) | S |
| 3 Bans/appeals | 0 (kick), 5 | M |
| 4 Reports | 3 | S |

Each phase = one PR with migration + pgTAP test + unit tests + visual audit
route where a public page is added.

## Open questions

1. The bot docs list an existing Server Status channel `1533034852054732827`.
   Does the alert channel `1556586342484287498` replace it, or are they
   separate (public status vs. admin alerts)?
2. Does the bot run on the same host as the Minecraft server?
