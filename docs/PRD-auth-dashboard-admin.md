# PRD: Auth (Discord + Chula SSO), User Dashboard, Admin, PDPA

- Status: **approved for build**, supersedes `docs/PLAN_auth_dashboard_admin.md` where they differ
- Source: deep interview (7 rounds, ambiguity 17%) → `.omc/specs/deep-interview-auth-dashboard-admin.md`
- Owner: kaikub · Date: 2026-09-23

> **Build status (2026-09-23):** Phases 1–4 implemented on `dev-auth-dashboard-admin`. Phase 5 (PDPA) is **deferred** by the owner, so `add_minecraft_account` does not check PDPA yet and `profiles` has no PDPA columns; add both with Phase 5. Deviations from the plan below:
> - New migrations `20260923000001..3` instead of filling the committed placeholder `20260821183459_chula_sso_identities.sql` (editing an already-recorded migration wouldn't re-run on existing databases). The placeholder stays empty.
> - The first-owner SQL lives in `OPERATOR_RUNBOOK.md` (`supabase/snippets/` is root-owned).
> - `register.module.css` was not moved next to `registration-panel` (cosmetic; still noted in `docs/DEPENDENCY_GRAPH.md`).
> - Security review hardening: every Chula SSO flow (sign-in too, not just linking) now starts at `/auth/cusso/start` and must return a matching `cu_state` nonce, blocking login-CSRF; players can't read `account_change_log.actor_user_id`.
> - Extra: `user_id` and `created_at` are readable by players (their own rows only, via RLS) so the dashboard can filter and keep a stable order.

## 1. Problem

- `src/app/auth/cucallback/route.ts` forges a Supabase JWT with `SUPABASE_JWT_SECRET` and a fake refresh token. It also queries a `cu_registrations` table that doesn't exist, and `NextResponse.redirect("/welcome")` throws because the URL is relative. Chula SSO login doesn't work and is unsafe.
- `supabase/migrations/20260821183459_chula_sso_identities.sql` is empty.
- `minecraft_registrations` only allows **one** Minecraft account per user (`user_id unique`, `discord_user_id unique`).
- There are no roles, no admin area, no audit trail and no PDPA consent.

## 2. Goals

1. One person = **one account** with **many login methods** (Discord, Chula SSO) and **up to 5 Minecraft accounts**.
2. Chula SSO is a real login method that creates a genuine Supabase session, with no forged tokens.
3. Users manage their own Minecraft accounts from `/welcome`: **+** adds one, the **pen** button edits one, then **Save**.
4. Three roles: **owner**, **admin** and **user**, with an audit log of every account change.
5. PDPA: a popup on `/welcome` shown once per device, plus a required consent checkbox before registering that is stored server-side.

## 3. Non-goals (explicitly out of scope)

- Signing up with Chula SSO. New accounts are created **only** through Discord.
- Merging two existing accounts.
- Users deleting their own Minecraft accounts (only admins and owners can remove one).
- Deleting users, banning, email notifications, CSV export.
- A permissions table or any roles beyond owner/admin/user.
- Letting users revoke PDPA consent or request data export in the UI (handled manually by an owner on request).
- Changes to the whitelist sync worker, which keeps reading `desired_whitelisted`.

## 4. Decisions (from the interview)

| # | Decision |
|---|---|
| D1 | Discord creates accounts. Chula SSO login works **only** if that Chula account is already linked to a user. |
| D2 | Chula SSO is linked from the dashboard **while signed in**. A signed-out, unlinked Chula SSO login is blocked with: "Log in with Discord, then press *Link Chula SSO*." |
| D3 | Up to 5 **active** Minecraft accounts per user (active = `desired_whitelisted = true`). |
| D4 | Pen button → edit name → Save. Same Mojang UUID: only the name changes. Different UUID: the old account is revoked and the new one added, in one transaction. |
| D5 | Any **new UUID** entering the whitelist needs Discord + Chula SSO + PDPA consent. Existing Discord-only rows stay whitelisted (grandfathered). |
| D6 | Roles: `owner` manages everyone's roles, including promoting others to owner. `admin` manages only users with the `user` role and can't change roles. `user` edits only their own data. There can be several owners. Nobody changes their own role. |
| D7 | First owner: the Discord identity with `provider_id = '938769182210809866'`, set in the roles migration. |
| D8 | PDPA on register: the checkbox is required, and the version plus timestamp are stored on the profile. The `/welcome` popup is `localStorage` only. Bumping the version shows the checkbox again. |

## 5. Research notes (how, verified against the Supabase docs)

- **Chula SSO login without forging a token.** On the server, use the service-key client to call `auth.admin.getUserById(linkedUserId)`, then `auth.admin.generateLink({ type: 'magiclink', email: user.email })`. This returns `properties.hashed_token` and sends no email. Then the cookie-bound client (`createClient()` from `lib/supabase/server`) calls `auth.verifyOtp({ type: 'magiclink', token_hash })`, which sets a normal Supabase session with a refresh token.
  - The link and the admin calls must use a separate service-role client **without cookies**, so the admin session never leaks into the user's cookies.
  - This needs the linked user to have an email. Discord OAuth provides one. If it's missing, redirect to `/auth/error?reason=cu_no_email`.
- **Chula SSO ticket.** `lib/cusso/server.ts#resolveTicket` already validates the ticket against `account.it.chula.ac.th/serviceValidation`. Reject when `profile.disable === true`.
- **Stopping someone else's Chula account being linked to yours** (link-CSRF: an attacker sends the victim a link carrying the attacker's ticket, which would let the attacker log in as the victim). Linking needs an intent that the user's own browser started:
  - `GET /auth/cusso/start?intent=link` sets an httpOnly, SameSite=Lax cookie `cu_link=<nonce>` (10 min) and redirects to Chula with `service=/auth/cucallback?link=<nonce>`.
  - The callback links only when the cookie matches the `link` query value, then deletes the cookie.
  - **Verify in Phase 2:** that Chula SSO keeps query params on `service`. If it doesn't, keep the cookie-only check.
- **Database tests** already run in CI with `supabase test db` (pgTAP, `supabase/tests/database_security.test.sql`). Every RPC and role rule gets a pgTAP assertion there, and no new test framework is added.
- **Remove:** the `jsonwebtoken` and `@types/jsonwebtoken` dependencies, the `SUPABASE_JWT_SECRET` usage, and `src/app/api/registration/cu/route.ts` (it has no callers and queries a table that doesn't exist).

## 6. Data model (migrations in `supabase/migrations/`)

```sql
profiles                                  -- 1:1 auth.users, created by trigger on auth.users insert + backfill
  user_id uuid pk references auth.users on delete cascade
  role text not null default 'user' check (role in ('owner','admin','user'))
  pdpa_version text, pdpa_accepted_at timestamptz
  created_at, updated_at

cu_sso_identities                         -- fills the empty placeholder migration
  user_id uuid pk references auth.users on delete cascade   -- one Chula account per user
  chula_uid text not null unique
  chula_username text not null
  email text, display_name text
  linked_at timestamptz not null default now()
  -- ponytail: no raw_profile jsonb (PDPA data minimisation); add columns when a feature needs them

minecraft_registrations                   -- existing; alter
  drop unique (user_id), drop unique (discord_user_id)
  keep unique (minecraft_uuid), unique (minecraft_username_key)
  -- limit of 5 active rows enforced inside the RPC (profile row locked `for update`), not by a trigger

account_change_log                        -- append-only, one row per changed field
  id uuid pk, actor_user_id, target_user_id (fk auth.users)
  entity text  -- 'minecraft_registrations' | 'profiles' | 'cu_sso_identities'
  entity_id uuid, field text, old_value text, new_value text
  source text check (source in ('self','admin'))
  created_at timestamptz default now()
  index (target_user_id, created_at desc)
```

RLS:
- Clients have **no** insert/update/delete on any of these tables. All writes go through `security definer` RPCs with `set search_path = ''`, the same pattern as `register_minecraft_profile`.
- `select` on your own rows is allowed. Admins and owners get read access only through admin RPCs.

RPCs (each one writes `account_change_log`):

| RPC | Caller | Rule |
|---|---|---|
| `accept_pdpa(p_version)` | self | sets `pdpa_version`, `pdpa_accepted_at` |
| `link_cu_sso(...)` | server only (service role) | `CU_ALREADY_LINKED` if the Chula uid belongs to another user or the user already has a different one |
| `add_minecraft_account(p_uuid, p_username)` | self | needs Discord + Chula SSO + PDPA; `LIMIT_REACHED` at 5 active; reactivates the user's own revoked row with the same UUID |
| `change_minecraft_account(p_id, p_uuid, p_username)` | self | own active row; same UUID → rename; new UUID → revoke old + add new (D4, D5) |
| `admin_set_whitelisted(p_id, p_value)` | admin/owner | admin: target must have role `user`; also used as "remove" |
| `admin_set_role(p_user, p_role)` | owner | `p_user <> auth.uid()` (D6) |
| `admin_search_users(p_query)` | admin/owner | matches Discord name, Chula username or email, Minecraft name; `limit 50` |

`ponytail: last-owner guard is implied — owners can't change their own role, so the caller always remains an owner.`

Existing `register_minecraft_profile` is replaced by `add_minecraft_account`, and `POST /api/registration/minecraft` switches to the new RPC with the same response shape.

## 7. Delivery model: hybrid (waterfall gates, agile inside)

**Why hybrid.** Schema, security and the auth flow are expensive to change after data exists, so they are designed once and **locked at a gate** (waterfall). UI work is cheap to change, so it's built in short **iterations** with a demo and feedback (agile).

```
Phase 0  Design lock        ─┐ waterfall: sequential, each ends in a sign-off gate
Phase 1  DB foundation       │
Phase 2  Auth (CU SSO)      ─┘
Phase 3  Dashboard iteration ─┐ agile: 1-week iterations, demo → feedback → adjust
Phase 4  Admin iteration      │ (can overlap once Phase 2 gate passes)
Phase 5  PDPA iteration      ─┘
Phase 6  Release              waterfall gate: prod migration + smoke test
```

Rules:
- Waterfall phases: scope is frozen. A change after the gate needs a new migration and a note in this PRD.
- Agile phases: each iteration ships a working, reviewable PR. Copy, layout and UX can change freely; RPC contracts cannot (that would reopen Phase 1).
- One PR per phase or iteration, merged to `dev-auth-dashboard-admin`, then to `main` at Phase 6.
- **Definition of Done (every phase):** `npm run lint`, `typecheck`, `test`, `build` and `supabase db reset && supabase test db` all green in CI, `docs/DEPENDENCY_GRAPH.md` updated if imports changed, and the acceptance criteria below ticked.

---

### Phase 0: Design lock (waterfall, ~0.5 day)
- Review this PRD. Confirm D1–D8, the table columns and the RPC names.
- Confirm that the Chula SSO `app_id` callback URL is registered for both prod and preview.
- Get the PDPA notice text (Thai and English) from the owner. This is the only external dependency, and it blocks Phase 5 only.

**Gate:** PRD marked approved. Nothing is coded before this.

### Phase 1: Database foundation (waterfall, ~2 days)
One migration per concern, in order:
1. Fill `chula_sso_identities.sql` with the `cu_sso_identities` table.
2. `profiles`: table, `auth.users` insert trigger, backfill, and the owner seed (D7).
3. `account_change_log` table and RLS.
4. `minecraft_registrations`: drop the two unique constraints, then add the new RPCs and drop `register_minecraft_profile`.

Acceptance (pgTAP, added to `supabase/tests/`):
- [ ] RLS is enabled on all new tables. `anon` and `authenticated` can't insert, update or delete any of them directly.
- [ ] A user with Discord + Chula SSO + PDPA can add 5 accounts. The 6th raises `LIMIT_REACHED`.
- [ ] Adding without a Chula SSO link raises `CU_SSO_REQUIRED`. Without PDPA it raises `PDPA_REQUIRED`.
- [ ] A UUID owned by another user raises `REGISTRATION_CONFLICT`.
- [ ] Changing an account to a new UUID leaves the old row `desired_whitelisted = false`, the new row `true`, and adds 2+ log rows.
- [ ] Changing an account with the same UUID only renames it.
- [ ] An admin calling `admin_set_whitelisted` on an admin or owner is rejected. `admin_set_role` called by an admin is rejected. An owner changing their own role is rejected.
- [ ] Each mutating RPC writes the matching `account_change_log` row with the correct `source`.
- [ ] Owner seed: the profile of Discord `938769182210809866` has `role = 'owner'` whenever that identity exists.

**Gate:** CI database job green, migration reviewed. Schema is frozen from here.

**Risk:** the seed doesn't match if that Discord account hasn't logged in on the target environment yet. Mitigation: after first login, run the same `update ... from auth.identities` statement once from `supabase/snippets/`.

### Phase 2: Chula SSO auth (waterfall, ~2 days)
- Rewrite `src/app/auth/cucallback/route.ts` for these cases:
  - **Signed in and link intent valid:** `link_cu_sso`, then redirect to `/welcome?linked=cu`.
  - **Signed out and uid linked:** `generateLink` + `verifyOtp` (§5), then redirect to `/welcome`.
  - **Signed out and uid not linked:** `/auth/error?reason=cu_not_linked`.
  - **Disabled account, invalid ticket, or already linked elsewhere:** `/auth/error` with a specific reason.
- Add `src/app/auth/cusso/start/route.ts` to set the link-intent cookie.
- Add the new reasons to `lib/auth-error.ts` with Thai and English messages.
- Delete `api/registration/cu/route.ts`, the `jsonwebtoken` dependency, and any `SUPABASE_JWT_SECRET` references.
- Redirects use absolute URLs from `getSiteUrl()`, matching `auth/callback/route.ts`.

Acceptance:
- [ ] Vitest: callback branch logic (each case → the expected redirect), with Supabase and `resolveTicket` mocked.
- [ ] Manual on preview: link Chula SSO while signed in, sign out, log in with Chula SSO and land on `/welcome` as the same user. The session refreshes after 1h, which proves the refresh token is real.
- [ ] Hitting the callback with a valid ticket but no intent cookie while signed in does **not** link.
- [ ] `grep -r jsonwebtoken src package.json` returns nothing.

**Gate:** security review of the callback (the `code-review` skill, or a reviewer who isn't the author). Auth is frozen from here.

### Phase 3: User dashboard (agile, 1–2 iterations)
`/welcome` becomes the dashboard (server component and `RegistrationPanel`).
- **Identities card:** Discord ✓. Chula SSO shows ✓ plus the username, or a **Link Chula SSO** button (→ `/auth/cusso/start?intent=link`).
- **Banner** until Chula SSO is linked: "Link Chula SSO to add Minecraft accounts."
- **Minecraft list:** each active account shows its name, sync status and a **pen** button (inline edit, then **Save** or **Cancel**). A **+** button adds a row; it's hidden at 5 accounts, with a "5/5" hint.
- Errors from RPC codes map to friendly messages in `lib/registration.ts`.
- Move `register.module.css` next to `registration-panel` (this fixes the cross-tree CSS coupling noted in the dependency graph).

Acceptance:
- [ ] Add, edit and limit work end to end on preview. Playwright visual audit passes on the existing viewports.
- [ ] Keyboard only: the + button, pen, input and Save can be reached and have labels.
- [ ] Iteration demo to the owner. Feedback goes into the next iteration, not back into Phase 1.

### Phase 4: Admin (agile, 1–2 iterations)
- `src/app/admin/layout.tsx`: server-side role check and `notFound()` for the `user` role. Hiding the UI alone isn't enough.
- `/admin`: search box (`?q=`) → `admin_search_users`, as a table of up to 50 rows. There's no pagination until more than 50 users actually show up.
- `/admin/users/[id]`: identities, Minecraft accounts (whitelist toggle and remove), a role select (owner only, disabled for yourself), and that user's change log (newest first, limit 100).
- Mutations use Server Actions → RPC. The RPC is the authority, and the UI only mirrors it.

Acceptance:
- [ ] A `user` visiting `/admin` gets a 404. An `admin` sees no role select. An `owner` can promote a user to admin and to owner.
- [ ] An admin toggling an admin's account gets an error message and nothing changes (the rejection comes from the RPC).
- [ ] Every admin action appears in the target's log with `source = 'admin'`.

### Phase 5: PDPA (agile, 1 iteration)
- `src/lib/pdpa.ts`: `export const PDPA_VERSION = "v1"`.
- `/privacy`: a static page with the owner's notice text.
- **Register page:** the "I accept the privacy notice" checkbox is required.
  - Signed out, the login buttons are disabled until it's ticked. Ticking sets a `pdpa_consent=v1` cookie, and `auth/callback` calls `accept_pdpa` after `exchangeCodeForSession`.
  - Signed in but `profile.pdpa_version !== PDPA_VERSION` (grandfathered users or a version bump): show the checkbox plus Continue, which calls `accept_pdpa`. The dashboard redirects such users here.
- `<PdpaNotice />` on `/welcome`: a fixed bottom popup with an **Accept** button, dismissed by `localStorage["pdpa_notice"] = PDPA_VERSION`, with a link to `/privacy`. It uses plain CSS and adds no dependency.

`ponytail: version enforcement for re-consent is UI-side (profile.pdpa_version vs constant); move the constant into SQL if legal requires DB-level enforcement.`

Acceptance:
- [ ] Vitest: register page with the checkbox unticked has login disabled. The popup hides after Accept and stays hidden after a reload.
- [ ] After registering, `profiles.pdpa_version = 'v1'` and `pdpa_accepted_at` is set, with one log row.

### Phase 6: Release (waterfall gate, ~0.5 day)
- Take a backup, run `supabase db push` to prod, and check the owner seed row.
- Remove `SUPABASE_JWT_SECRET` from Vercel env if nothing else uses it.
- Smoke test on prod:
  - Discord login
  - link Chula SSO
  - Chula SSO login
  - add, edit and 5-limit
  - admin toggle
  - owner promote
  - PDPA popup and checkbox
- Update `README.md` / `OPERATOR_RUNBOOK.md`: how to promote an owner by SQL, and the new error reasons.

**Gate:** smoke checklist signed off, then merge to `main`.

## 8. Risks

| Risk | Mitigation |
|---|---|
| A Discord account has no email, so `generateLink` fails | Clear error `cu_no_email`. Such users keep logging in with Discord. |
| Chula SSO drops query params on `service` | Fall back to the cookie-only intent check (still blocks cross-site link attempts). |
| Two tabs add a 6th account at the same time | The RPC locks the profile row `for update` before counting. |
| Grandfathered rows have no Chula SSO | They stay whitelisted (D5). The banner nudges them to link. Adding or changing needs Chula SSO. |
| PDPA text isn't ready | Only Phase 5 is blocked. Phases 1–4 ship without it. |
