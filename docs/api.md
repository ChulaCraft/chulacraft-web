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
| `admin/server/actions.ts` | `serverAction`, `openConsole` → `admin_server_console_access`, then calls `MCSV_MANAGER_URL` with a signed JWT |

## Pages

| Public | Signed in | Admin (`/admin/*`, owner/admin role) |
| --- | --- | --- |
| `/`, `/about`, `/announcements`, `/events`, `/events/[id]`, `/events/[id]/calendar.ics`, `/privacy`, `/terms`, `/auth/error` | `/register`, `/register/details`, `/events/[id]/check-in`, `/verify`, `/welcome`, `/dashboard`, `/settings`, `/players`, `/player/[id]` | `/admin`, `/admin/players`, `/admin/users/[id]`, `/admin/restore`, `/admin/reports`, `/admin/appeals`, `/admin/audit`, `/admin/achievements/**`, `/admin/commu/events/[id]/check-in`, `/admin/announcements/**`, `/admin/server` |
