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
| `/`, `/about`, `/announcements`, `/events`, `/events/[id]`, `/privacy`, `/terms`, `/auth/error` | `/register`, `/register/details`, `/verify`, `/welcome`, `/dashboard`, `/settings`, `/players`, `/player/[id]` | `/admin`, `/admin/players`, `/admin/users/[id]`, `/admin/restore`, `/admin/reports`, `/admin/appeals`, `/admin/audit`, `/admin/achievements/**`, `/admin/announcements/**`, `/admin/server` |
