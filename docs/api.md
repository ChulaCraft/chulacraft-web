# Web API

The app is Next.js App Router. There are three kinds of entry points:

1. **Route handlers** (`src/app/**/route.ts`) — real HTTP endpoints, below.
2. **Server actions** (`src/app/**/actions.ts`) — called by `<form>`s, not a public API. They redirect back with `?done=…` or `?error=CODE`.
3. **Supabase RPCs** — Postgres functions the browser or server calls directly. See [database.md](database.md#rpc-functions).

`src/proxy.ts` runs on every request (except static files): it refreshes the Supabase session cookie and sets the Content-Security-Policy.

## HTTP endpoints

All responses are JSON unless noted. Errors are `{ "error": "<player-facing message>" }`.

### `/api/registration/minecraft` — player's Minecraft accounts

Source: `src/app/api/registration/minecraft/route.ts`. Requires a signed-in session cookie (else `401`).

| Method | Body | Success | What it does |
| --- | --- | --- | --- |
| `GET` | — | `200 { registrations: Registration[] }` | Lists the caller's active accounts (`is_active = true`). |
| `POST` | `{ "minecraftUsername": "Steve" }` | `201` new / `200` already linked, `{ registration }` | Looks the name up on Mojang, then `add_minecraft_account`. |
| `PATCH` | `{ "id": "<registration uuid>", "minecraftUsername": "Alex" }` | `200 { registration }` | Swaps one linked account for another via `change_minecraft_account`. |
| `DELETE` | `{ "id": "<registration uuid>" }` | `204` | Unlinks (soft delete + un-whitelist) via `remove_minecraft_account`. |

`Registration` = `{ id, minecraftUsername, desiredWhitelisted, syncStatus: "pending" | "synced" | "failed", updatedAt }`
(mapped in `src/lib/registration.ts`).

`POST`/`PATCH` are rate-limited per user by `consume_registration_attempt` and resolve the username with
`https://api.minecraftservices.com/minecraft/profile/lookup/name/{name}` (7 s timeout). The account RPCs are
service-role only, so the Mojang check can't be skipped.

Error mapping (`registrationError` in `src/lib/registration.ts`):

| DB error | HTTP | Meaning |
| --- | --- | --- |
| `REGISTRATION_CONFLICT` / `23505` | 409 | Another player currently owns this Minecraft account |
| `LIMIT_REACHED` | 409 | Already 5 active accounts |
| `CU_SSO_REQUIRED` | 403 | Not Chula-verified (and not an admitted guest) |
| `DISCORD_IDENTITY_REQUIRED` | 403 | No Discord identity on the user |
| `REGISTRATION_BLOCKED` | 403 | An admin removed this Minecraft account |
| `BANNED` | 403 | Player is banned |
| `NOT_FOUND` | 404 | Registration not in the caller's list |
| invalid body / unknown name | 400 | |
| too many attempts | 429 | |
| Mojang or DB unavailable | 503 | |

**Ownership transfer:** once a player unlinks an account (`is_active = false`), another player's `POST` takes it over.
The previous owner is copied to `minecraft_ownership_history`. Admin-removed accounts stay blocked for everyone.

### `GET /auth/callback?code=…`

Source: `src/app/auth/callback/route.ts`. OAuth return URL for Supabase Auth (Discord login, Chula Google linking).
Exchanges the code for a session, reconciles identities (`src/lib/reconcile-identities.ts`), then redirects to
`/welcome` (or the path reconcile chooses). Failures redirect to `/auth/error?reason=…`. Query parameters never choose
the redirect target.

### `GET /events/[id]/calendar.ics`

Source: `src/app/events/[id]/calendar.ics/route.ts`. Public. Returns the event as a `text/calendar` download (times in UTC,
`DTEND` = `ends_at`, or `starts_at` + 2 h when there is none). Reads `get_event`, so a draft or unknown id is `404`.
The filename is a slug of the event name, or the event id when the name slugifies to nothing (Thai names).

### `GET /events/[id]/check-in/start?t=<token>`

Source: `src/app/events/[id]/check-in/start/route.ts`. Target of the event's QR code. Verifies the rotating token with
`checkin_proof`, stores the returned 5-minute proof in an httpOnly cookie (`cc_checkin`) scoped to `/events/<id>/check-in`.
Signed in: redirects to `/events/<id>/check-in`. Signed out: also sets `cc_next` (`/events/<id>/check-in`, `Path=/`,
10 min) so the player returns after signing in, and redirects to `/register`. A bad or expired token redirects to
`/events/<id>/check-in?error=TOKEN_EXPIRED`. Never records attendance (only the `checkIn` POST does).

### `GET /check-in/continue`

Source: `src/app/check-in/continue/route.ts`. Called by `/welcome` after sign-in when `cc_next` is set. Clears the cookie
and redirects to the path only if `safeNext()` accepts it (`/events/<uuid>/check-in`), else `/dashboard`.

### `/admin/commu/events/[id]/check-in` (page)

Source: `src/app/admin/commu/events/[id]/check-in/page.tsx`. Community staff only (`requireArea("community")`). Shows the
rotating event QR, a scanner for a player's personal `CC-XXXXXXXXXX` code (camera needs `Permissions-Policy:
camera=(self)`, set for this path only in `next.config.ts`; typing the code always works), the attendee list, "Award
badge to attendees" and "Reset code".

### `/events/[id]/check-in` (page)

Source: `src/app/events/[id]/check-in/page.tsx`. Signed in only (else `/register`). Shows the "Check in" button only
while the proof cookie is present; reading the page never records attendance.

### `GET /api/dev-login?as=<user>` — local only

Source: `src/app/api/dev-login/route.ts`. Signs in as a seeded user from `supabase/dev-seed.sql`.
Returns `404` unless `DEV_LOGIN_ENABLED` (`src/lib/dev-login.ts`).

## Insights

`GET /admin/insights?tab=<tab>&range=<range>` (page, `src/app/admin/insights/`). Tabs: `overview`, `players`, `events`, `community`,
`staff`. Range: `7d`, `30d` (default), `90d`, `all`. An unknown tab or range, or a tab the role may not see, falls back to the first allowed
tab and `30d` with no error. A role with no allowed tab gets the 404 page.

| Tab | Role needed | RPCs called (`p_days` = 7/30/90, null for all) |
| --- | --- | --- |
| Overview | owner/admin | `insights_players`, `insights_funnel`, `insights_events`, `insights_community` |
| Players | owner/admin | `insights_players`, `insights_funnel` |
| Events | `community` (owner, admin, event_staff) | `insights_events` |
| Community | `moderation` (owner, admin, moderator) | `insights_community` |
| Staff activity | owner/admin | `insights_staff` |

A failed RPC shows an alert in its own panel; the rest still renders. Charts download CSV (built in the browser from the plotted data), and the
page prints as a light, one-column report. `/admin/players` also calls `insights_players(30)` for its four-tile strip (owner/admin only; left out if
the call fails). Tables and the role gates are in [database.md](database.md#insights-v11-phase-6).

## Error capture and health

- `POST /api/client-errors` (`src/app/api/client-errors/route.ts`): body `{ route, message, digest? }`, JSON, at most 2 KB (`413`). Same-origin only
  (`403`), 60 per minute per IP hash (`429`, per instance), bad body `400`, else `204`. Stored as `kind = client` after scrubbing.
  The browser side is `reportError()` in `src/lib/report-error.ts` (at most 5 per distinct error per page load), called from the error boundaries.
- `src/instrumentation.ts` `onRequestError` stores server errors (`kind = server`, path without query; redirects and not-found are skipped).
- `GET /api/ops/health` with `Authorization: Bearer <OPS_HEALTH_TOKEN>`: `{ ok, db: "ok"|"down", errors_5m, version }`; `401` without the token,
  `503` with `ok: false` when the database call fails. The logic is `opsHealth()` in `src/lib/ops-health.ts`.
  The Discord bot's status monitor probes it every 60 s (down on failure or `ok: false`, error-spike alert at `errors_5m >= 10`).

## `/admin/ops` (pages)

Owner/admin only (`requireArea("admin")`); `/admin/server` redirects here (permanent, `next.config.ts`).

- `/admin/ops`: every service the manager's `GET /services` returns (with its 7-day uptime bar), plus the built-in `website` row, then backups. Each row
  loads its own status, so a slow or failing manager (5 s timeout) or one broken service only errors that panel.
- `/admin/ops/[service]`: status, 24 h metrics, logs/console and the actions the service allows (7-day uptime is on the list only).
  The ids `website` and `bot` are reserved for the fixed pages below and dropped from the manager's list, as are repeated ids.
- `/admin/ops/website`: the website's own health (read directly, not through the manager) and the grouped error feed
  (`admin_app_errors`).
- `/admin/ops/bot`: the bot's settings and jobs. Its container (status, logs, restart, update) is the manager service
  `discord-bot`, at `/admin/ops/discord-bot`, which this page links to. Settings and jobs come from `admin_bot_overview` (see [bot-contract-ops.md](bot-contract-ops.md)).

Every manager call goes through `admin_ops_access` first (role check, audit row for changes; `update` is owner-only), then a
60 s EdDSA JWT to `MCSV_MANAGER_URL`. The manager API is [ops-manager-contract.md](ops-manager-contract.md).

## Metadata routes (SEO)

`metadataBase` is `getSiteUrl()` (`NEXT_PUBLIC_SITE_URL`, else the Vercel URL), and every public page sets `alternates.canonical`.

- `GET /sitemap.xml` (`src/app/sitemap.ts`, per request): the static public pages plus published events (`list_upcoming_events`,
  `list_past_events`, anon). Players are never listed.
- `GET /robots.txt` (`src/app/robots.ts`): disallows `/admin`, `/settings`, `/dashboard`, `/api`; points at the sitemap.
- `GET /manifest.webmanifest` (`src/app/manifest.ts`), `/icon.png` (32 px) and `/apple-icon.png` (180 px), made from the logo.
- `GET /opengraph-image` (site card), `/events/[id]/opengraph-image` (name, date, poster; anon read, so drafts get the site
  card) and `/player/[id]/opengraph-image` (name, avatar, top badges) as PNG, drawn by `src/lib/og-image.tsx`. A player
  image is only drawn when the asker may see the profile (`get_player_profile`, `hidden` = `can_view`); otherwise, and for
  every crawler, it is the site card. Player pages a viewer can't see are `noindex` and name the site card as `og:image`.

## Server actions

Form posts; each re-checks the session, calls one RPC, and redirects. Admin actions rely on the RPC's own
role check (`FORBIDDEN`), not on the page.

| File | Actions → RPC |
| --- | --- |
| `auth/actions.ts` | `signOut` (Supabase Auth) |
| `register/details/actions.ts` | `saveProfile` → `update_profile_details` |
| `dashboard/actions.ts` | unlink Google, `respondFriendRequest`, `removeFriend`, `unblockPlayer`, `updatePrivacy`, `submitAppeal` |
| `player/[id]/actions.ts` | `send_friend_request`, `respond_friend_request`, `remove_friend`, `block_player`, `report_player` |
| `events/[id]/actions.ts` | `toggleInterest` → `set_event_interest` |
| `events/[id]/check-in/actions.ts` | `checkIn` → `check_in` (proof from the cookie; clears the proof and `cc_next`) |
| `dashboard/actions.ts` (showcase) | `setShowcase` → `set_my_showcase` (up to 3 badges) |
| `notifications/actions.ts` | `openNotifications` → `my_notifications`, then `mark_my_notifications_read` |
| `admin/commu/events/[id]/check-in/actions.ts` | `nextToken` → `admin_checkin_token` (returns QR `svg` + `expiresAt`; QR drawn server-side), `checkInPlayer` → `admin_check_in_player`, `awardAttendees` → `admin_award_attendees`, `resetCode` → `admin_rotate_checkin_secret`, `removeAttendance` → `admin_remove_attendance` |
| `admin/users/[id]/actions.ts` | `admin_set_whitelisted`, `admin_set_role`, `admin_reset_chula`, `admin_ban_user`, `admin_lift_ban`, `admin_mark_guest` |
| `admin/restore/actions.ts` | `restoreAccount` → `admin_set_whitelisted(…, true)` |
| `admin/reports/actions.ts` | `handleReport` → `admin_handle_report` |
| `admin/appeals/actions.ts` | `decideAppeal` → `admin_decide_appeal` |
| `admin/achievements/**/actions.ts` | `admin_upsert_achievement`, `admin_delete_achievement`, `admin_revoke_award`, `admin_upsert_event`, `admin_delete_event`, `admin_resolve_identifiers`, `admin_list_event_interests`, `admin_award` |
| `admin/announcements/[id]/actions.ts` | `admin_upsert_announcement`, `admin_delete_announcement` |
| `admin/ops/actions.ts` | `opsAction` (start/stop/restart/update/backup), `openConsole` → `admin_ops_access`, then calls `MCSV_MANAGER_URL` with a signed JWT |

## Pages

| Public | Signed in | Admin (`/admin/*`, owner/admin role) |
| --- | --- | --- |
| `/`, `/about`, `/announcements`, `/events`, `/events/[id]`, `/events/[id]/calendar.ics`, `/gallery`, `/team`, `/rules`, `/privacy`, `/terms`, `/search`, `/auth/error` | `/register`, `/register/details`, `/events/[id]/check-in`, `/verify`, `/welcome`, `/dashboard`, `/settings`, `/players`, `/player/[id]` | `/admin`, `/admin/players`, `/admin/insights`, `/admin/users/[id]`, `/admin/restore`, `/admin/reports`, `/admin/appeals`, `/admin/audit`, `/admin/achievements/**`, `/admin/commu/events/[id]/check-in`, `/admin/announcements/**`, `/admin/ops`, `/admin/ops/[service]`, `/admin/ops/website` |
