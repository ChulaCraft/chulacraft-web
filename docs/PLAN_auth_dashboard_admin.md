# Plan: Auth hardening + user/admin dashboards + audit log + PDPA notice

Status: proposed, not yet implemented.

## 0. Pre-existing bugs found (must fix, not just extend)
- `src/app/auth/cucallback/route.ts` is broken: references undefined `user`/`cu_registrations` table that doesn't exist in migrations, `NextResponse.redirect("/welcome")` passes a relative string (throws), and manually forges a Supabase JWT with `SUPABASE_JWT_SECRET` + a fake refresh token instead of using Supabase's identity/session APIs. This path currently cannot work in production.
- `supabase/migrations/20260821183459_chula_sso_identities.sql` is an empty placeholder — no CU SSO schema exists yet.

## 1. Data model (normalized, in `supabase/migrations/`)

```
profiles                         -- 1:1 with auth.users, app-level user data
  user_id (pk, fk auth.users)
  role text not null default 'member' check (role in ('member','admin'))
  created_at, updated_at

cu_sso_identities                -- replaces empty placeholder migration
  user_id (fk auth.users, unique)
  chula_uid text unique not null      -- profile.uid from CU SSO
  chula_username text not null
  email text
  raw_profile jsonb                    -- gecos/roles/etc, for support/debug
  linked_at timestamptz not null default now()

minecraft_registrations          -- existing table, keep as-is (1 active reg/user)
  -- "add a new one" = replace existing row's username (re-run register flow);
  -- true multi-account per user is a separate future migration, out of scope now

account_change_log               -- audit log, append-only, normalized
  id uuid pk
  actor_user_id uuid fk auth.users        -- who made the change (self or admin)
  target_user_id uuid fk auth.users       -- whose data changed
  entity text not null                    -- 'minecraft_registrations' | 'profiles' | 'cu_sso_identities'
  entity_id uuid
  field text not null                     -- e.g. 'minecraft_username', 'desired_whitelisted', 'role'
  old_value text
  new_value text
  source text not null default 'self' check (source in ('self','admin'))
  created_at timestamptz not null default now()
  index (target_user_id, created_at), index (actor_user_id, created_at)
```
- Write via a `security definer` trigger/RPC (same pattern already used by `register_minecraft_profile`) so the log can't be forged from the client — one row per changed field, not one blob, so it stays queryable/scalable.
- RLS: users can `select` rows where `target_user_id = auth.uid()`; only admins (checked via `profiles.role`) can select all.

## 2. Auth flow changes
- Rewrite `cucallback/route.ts` to use the normal Supabase session (the already-signed-in user from `createClient()`/cookies) and just **link** the CU identity to that session's `user_id` via an RPC (upsert into `cu_sso_identities`), instead of minting a second forged session. CU SSO becomes a "link a second identity to my existing account" step, not a standalone sign-up path.
- "New user" = someone with **no row** in `minecraft_registrations` yet. Registration completion (the POST to `/api/registration/minecraft`) requires the user to have **both** a Discord identity (`auth.identities`, already checked in `register_minecraft_profile`) **and** a `cu_sso_identities` row — extend the RPC's guard to also `raise exception 'CU_SSO_REQUIRED'` if missing, surfaced in the UI as "link Chula SSO to finish".
- Existing users who registered Discord-only before this change are grandfathered (they already have a `minecraft_registrations` row) — no forced re-verification, but flagged per below.

## 3. Dashboard (rework `/welcome` → treat as "dashboard")
- Shows: Discord identity, CU SSO identity (or "not linked"), current Minecraft username + status, an editable form to change/register the username (reuses `RegistrationPanel`, extended to allow edit not just first-set).
- Banner: if user has Discord but no `cu_sso_identities` row → persistent notice "Link your Chula SSO account" with CTA to the CU SSO login button, shown at top of dashboard until linked.
- Username change goes through the same `register_minecraft_profile`-style RPC (rename/extend it) so validation + audit logging stay server-side.

## 4. Admin dashboard (`/admin`, scalable but not over-built now)
- Access gated by `profiles.role = 'admin'` (checked server-side in a layout, not just hidden UI).
- v1 screens: user list (search by Discord/CU/Minecraft name), user detail (identities, registration status, toggle `desired_whitelisted`, view that user's `account_change_log`).
- Structured for growth without speculative abstraction now: role lives in a `role` column with a check constraint (not a full permissions table) — swap to a `roles`/`permissions` join table later only if a second role beyond admin/member actually shows up. `ponytail: single role column, promote to roles table when a 3rd role is needed`.
- All admin mutations go through RPCs that log `source = 'admin'` in `account_change_log`.

## 5. PDPA notice
- One small dismissible banner component (`<PdpaNotice />`), rendered at the bottom of `register` and `welcome` pages only. Dismiss state in `localStorage`, links to a `/privacy` (or existing) policy page. No new dependency — plain component + CSS.

## Suggested delivery order (each is a reviewable chunk)
1. Fix `cucallback` route + add `cu_sso_identities` migration + linking RPC.
2. Add `account_change_log` migration + wire logging into existing `register_minecraft_profile`.
3. Add `profiles.role` migration + require both identities for new registrations + dashboard CU-SSO nudge banner.
4. Rework `/welcome` into full dashboard (profile info + edit username).
5. `/admin` section (list/detail/toggle + audit view).
6. `PdpaNotice` component on register/welcome.
