# Graph Report - chulacraft-web  (2026-10-17)

## Corpus Check
- 245 files · ~183,449 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 29 file(s) not represented in the graph (top: .css 23, (none) 2, .toml 2)

## Summary
- 1011 nodes · 2451 edges · 57 communities (44 shown, 13 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 75 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `291ffb9f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- createClient
- server.ts
- registration.ts
- package.json
- player/[id]/page.tsx
- compilerOptions
- users/[id]/page.tsx
- devDependencies
- local-mocks.mjs
- ChulaCraft Web Version 1.0
- Tables
- chula.ts
- next_dev_types_root_params_d
- vitest
- award/page.tsx
- Chulacraft registration runbook
- CLAUDE.md
- supabase/README.md
- announcements/[id]/page.tsx
- server-status.ts
- dashboard/page.tsx
- icons.tsx
- PixelIcon
- engines
- server/page.tsx
- about-you-form.tsx
- ref_next_dev_types_routes_d_ts
- dbErrorCode
- dependencies
- scripts
- settings/page.tsx
- next_dev_types_routes_d
- overrides
- achievements/[id]/page.tsx
- src_app_about_you_about_you_module
- Phases
- next_types_root_params_d
- next_types_routes_d
- src_app_auth_error_auth_error_module
- src_app_not_found_module
- src_app_admin_admin_module
- commu/events/[id]/page.tsx
- site-header.tsx
- allowScripts
- audit/page.tsx
- admin/page.tsx
- app/events/[id]/page.tsx
- error-screen.tsx
- app/layout.tsx
- reports/page.tsx
- announcement-banner.tsx
- error/page.tsx
- next
- reconcile-identities.test.ts
- staff-gate.ts
- dev-login/route.ts
- app/players/page.tsx

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 114 edges
2. `next` - 82 edges
3. `PixelIcon()` - 42 edges
4. `dbErrorCode()` - 40 edges
5. `vitest` - 35 edges
6. `react` - 19 edges
7. `when()` - 19 edges
8. `createAdminClient()` - 16 edges
9. `compilerOptions` - 16 edges
10. `requireArea()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Task 2: CSV helper + export route` --references--> `dbErrorCode()`  [INFERRED]
  docs/superpowers/plans/2026-10-16-v1.1-phase2a-players-table.md → src/lib/db-error.ts
- `Local mock services` --references--> `reconcileIdentities()`  [INFERRED]
  README.md → src/lib/reconcile-identities.ts
- `Task 4: Bulk actions` --references--> `selectionParam()`  [INFERRED]
  docs/superpowers/plans/2026-10-16-v1.1-phase2a-players-table.md → src/app/admin/commu/achievements/selection.ts
- `Task 3: Players table with filters, sort, infinite scroll` --references--> `StatRow()`  [INFERRED]
  docs/superpowers/plans/2026-10-16-v1.1-phase2a-players-table.md → src/app/admin/overview.tsx
- `Server actions` --references--> `serverAction()`  [INFERRED]
  docs/api.md → src/app/admin/server/actions.ts

## Import Cycles
- None detected.

## Communities (57 total, 13 thin omitted)

### Community 0 - "createClient"
Cohesion: 0.21
Nodes (16): BAN_DURATIONS, banUser(), finish(), liftBan(), markGuest(), PRIVACY_LEVELS, resetChula(), saveProfileFor() (+8 more)

### Community 1 - "server.ts"
Cohesion: 0.08
Nodes (36): @supabase/ssr, ERRORS, metadata, RemovedRow, RestorePage(), signOut(), authErrorResponse(), GET() (+28 more)

### Community 2 - "registration.ts"
Cohesion: 0.06
Nodes (47): `/api/registration/minecraft` — player's Minecraft accounts, src_app_about_about_module, gallery, metadata, values, DELETE(), GET(), PATCH() (+39 more)

### Community 3 - "package.json"
Cohesion: 0.14
Nodes (14): name, private, version, @emnapi/core, @emnapi/runtime, eslint, eslint-config-next, @eslint/js (+6 more)

### Community 4 - "player/[id]/page.tsx"
Cohesion: 0.15
Nodes (22): blockPlayer(), finish(), playerId(), removeFriend(), reportPlayer(), respondFriendRequest(), sendFriendRequest(), ask() (+14 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "users/[id]/page.tsx"
Cohesion: 0.16
Nodes (15): react, AdminUserPage(), Detail, DONE, ERRORS, metadata, SupportProfile, BODY (+7 more)

### Community 7 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, @eslint/js, @playwright/test, @types/node, @types/react, @types/react-dom (+3 more)

### Community 8 - "local-mocks.mjs"
Cohesion: 0.07
Nodes (35): RFC-6455, ref_node_child_process, ref_node_fs, ref_node_http, ref_node_path, @playwright/test, shots, ACTION_BITS (+27 more)

### Community 9 - "ChulaCraft Web Version 1.0"
Cohesion: 0.10
Nodes (19): Architecture, Chula verification (Google), ChulaCraft Web Version 1.0, Commands, Current implementation caveats, Deployment, Discord authentication, Environment (+11 more)

### Community 10 - "Tables"
Cohesion: 0.09
Nodes (21): `GET /api/dev-login?as=<user>` — local only, `GET /auth/callback?code=…`, HTTP endpoints, Pages, Web API, Accounts and identity, Audit, Content (+13 more)

### Community 11 - "chula.ts"
Cohesion: 0.20
Nodes (18): Task 1: Show the Discord name everywhere, @supabase/supabase-js, unlinkPersonalGoogle(), DashboardPage(), WelcomePage(), SiteHeader(), byAge(), classifyIdentities() (+10 more)

### Community 13 - "vitest"
Cohesion: 0.05
Nodes (74): RFC-4180, 1. The URL is the state, 2. Columns declare what they can do, 3. Above the table, 4. Every value is a link, 5. One RPC per table, 6. States, Admin tables: the protocol (+66 more)

### Community 14 - "award/page.tsx"
Cohesion: 0.15
Nodes (24): addPlayers(), awardId(), confirmAward(), fail(), prefillInterested(), previewAward(), m, unique() (+16 more)

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.22
Nodes (8): Chulacraft registration runbook, Daily stats, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 18 - "announcements/[id]/page.tsx"
Cohesion: 0.19
Nodes (14): deleteAnnouncement(), postedId(), refresh(), saveAnnouncement(), SEVERITIES, form(), m, valid() (+6 more)

### Community 19 - "server-status.ts"
Cohesion: 0.30
Nodes (12): ref_node_dns, ref_node_net, packet(), parseStatusResponse(), pingServer(), readVarInt(), resolveTarget(), ServerStatus (+4 more)

### Community 20 - "dashboard/page.tsx"
Cohesion: 0.19
Nodes (11): APPEAL_ERRORS, BanCard(), date(), MyBan, src_app_dashboard_dashboard_module, metadata, Profile, Social (+3 more)

### Community 21 - "icons.tsx"
Cohesion: 0.16
Nodes (13): metadata, src_app_register_register_module, DiscordAuthButton(), signIn(), GoogleSignInButton(), LinkGoogleButton(), useGoogle(), start() (+5 more)

### Community 22 - "PixelIcon"
Cohesion: 0.17
Nodes (12): ServiceUnavailable(), metadata, Step, StepKind, src_app_welcome_welcome_module, CopyButton(), src_components_copy_button_module, PixelIcon() (+4 more)

### Community 24 - "server/page.tsx"
Cohesion: 0.11
Nodes (31): ref_node_crypto, ACTIONS, openConsole(), serverAction(), m, redirected(), ConsoleAction, grant() (+23 more)

### Community 25 - "about-you-form.tsx"
Cohesion: 0.18
Nodes (17): AboutYouForm(), onSubmit(), src_app_register_details_about_you_module, saveProfile(), SaveProfileState, FACULTIES, facultyRole(), ProfileDetails (+9 more)

### Community 27 - "dbErrorCode"
Cohesion: 0.14
Nodes (20): Server actions, Moderation, decideAppeal(), handleReport(), restoreAccount(), m, redirected(), finish() (+12 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom, sharp, @supabase/ssr (+2 more)

### Community 29 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, db:types, dev, dev:mocks, lint, start, test (+3 more)

### Community 30 - "settings/page.tsx"
Cohesion: 0.22
Nodes (10): AboutYouPage(), metadata, metadata, Privacy, PRIVACY_ERRORS, SettingsPage(), StepProgress(), linkErrorMessage() (+2 more)

### Community 33 - "achievements/[id]/page.tsx"
Cohesion: 0.07
Nodes (34): deleteAchievement(), finish(), postedId(), revokeAward(), saveAchievement(), form(), m, valid() (+26 more)

### Community 35 - "Phases"
Cohesion: 0.15
Nodes (12): ChulaCraft Web v1.1 — Roadmap Spec, Decisions already made, Deferred (needs Minecraft server endpoint), Global constraints (every phase), Phase 1 — Quick fixes & admin navigation  → `plans/2026-10-16-v1.1-phase1-quick-fixes.md`, Phase 2 — Admin power tools, Phase 3 — Design system & UI redesign, Phase 4 — Content without a developer (+4 more)

### Community 40 - "src_app_admin_admin_module"
Cohesion: 0.17
Nodes (3): src_app_admin_admin_module, AdminEventsPage(), metadata

### Community 41 - "commu/events/[id]/page.tsx"
Cohesion: 0.19
Nodes (13): AdminAchievementPage(), publicImageUrl(), AdminAchievementsPage(), metadata, AdminAnnouncementsPage(), ERRORS, metadata, state() (+5 more)

### Community 42 - "site-header.tsx"
Cohesion: 0.15
Nodes (10): react-dom, RegisterPage(), { getUser, redirect }, metadata, { getUser, getUserIdentities, rpc, redirect, reconcileIdentities }, page(), VerifyPage(), src_app_verify_verify_module (+2 more)

### Community 44 - "audit/page.tsx"
Cohesion: 0.23
Nodes (9): AdminAuditPage(), bangkokDay(), ENTITIES, Entry, metadata, Params, describeChange(), PRIVACY_FIELDS (+1 more)

### Community 45 - "admin/page.tsx"
Cohesion: 0.24
Nodes (10): Task 5: Clickable dashboard numbers + real Unverified / Guest cards, StatRow(), Stats, timeSince(), Tool, ToolCards(), Activity, AdminPage() (+2 more)

### Community 46 - "app/events/[id]/page.tsx"
Cohesion: 0.08
Nodes (29): src_app_events_events_module, eventId(), signInPath(), form(), interested(), m, redirected(), toggleInterest() (+21 more)

### Community 47 - "error-screen.tsx"
Cohesion: 0.22
Nodes (5): metadata, Action, ErrorScreen(), Href, src_components_error_screen_module

### Community 48 - "app/layout.tsx"
Cohesion: 0.27
Nodes (7): @vercel/analytics, src_app_globals, metadata, SiteFooter(), bodyFont, displayFont, monoFont

### Community 49 - "reports/page.tsx"
Cohesion: 0.14
Nodes (12): AdminAppealsPage(), DONE, ERRORS, metadata, metadata, AdminReportsPage(), CATEGORIES, DONE (+4 more)

### Community 50 - "announcement-banner.tsx"
Cohesion: 0.29
Nodes (7): src_app_announcements_announcements_module, AnnouncementsPage(), metadata, AnnouncementBanner(), dismissedId(), subscribe(), SEVERITY

### Community 51 - "error/page.tsx"
Cohesion: 0.36
Nodes (7): AuthErrorPage(), metadata, AUTH_FAILURE_REASONS, authFailureMessage(), AuthFailureReason, classifyOAuthCallbackFailure(), safeAuthFailureReason()

### Community 52 - "next"
Cohesion: 0.29
Nodes (3): nextConfig, next, ref_node_url

### Community 53 - "reconcile-identities.test.ts"
Cohesion: 0.17
Nodes (8): admin, cu, discord, gmail, m, query, run(), session

### Community 54 - "staff-gate.ts"
Cohesion: 0.07
Nodes (35): Final, Global Constraints, Review Focus, Task 2: Hero copy, Task 3: Readable admin stat numbers, Task 4: Move community admin to `/admin/commu/*`, Task 5: Grouped admin nav, v1.1 Phase 1 — Quick Fixes & Admin Navigation Implementation Plan (+27 more)

### Community 55 - "dev-login/route.ts"
Cohesion: 0.60
Nodes (3): GET(), DEV_LOGIN_ENABLED, DEV_USERS

### Community 56 - "app/players/page.tsx"
Cohesion: 0.33
Nodes (4): metadata, PlayersPage(), SearchHit, src_app_players_players_module

## Knowledge Gaps
- **307 isolated node(s):** `nextConfig`, `name`, `private`, `node`, `version` (+302 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 396 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `createClient`, `server.ts`, `registration.ts`, `package.json`, `player/[id]/page.tsx`, `users/[id]/page.tsx`, `vitest`, `award/page.tsx`, `announcements/[id]/page.tsx`, `dashboard/page.tsx`, `icons.tsx`, `PixelIcon`, `server/page.tsx`, `about-you-form.tsx`, `dbErrorCode`, `settings/page.tsx`, `achievements/[id]/page.tsx`, `src_app_admin_admin_module`, `commu/events/[id]/page.tsx`, `site-header.tsx`, `audit/page.tsx`, `admin/page.tsx`, `app/events/[id]/page.tsx`, `error-screen.tsx`, `app/layout.tsx`, `reports/page.tsx`, `announcement-banner.tsx`, `error/page.tsx`, `staff-gate.ts`, `dev-login/route.ts`, `app/players/page.tsx`?**
  _High betweenness centrality (0.245) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `server.ts`, `registration.ts`, `player/[id]/page.tsx`, `users/[id]/page.tsx`, `chula.ts`, `vitest`, `award/page.tsx`, `announcements/[id]/page.tsx`, `icons.tsx`, `server/page.tsx`, `dbErrorCode`, `settings/page.tsx`, `achievements/[id]/page.tsx`, `src_app_admin_admin_module`, `commu/events/[id]/page.tsx`, `site-header.tsx`, `audit/page.tsx`, `admin/page.tsx`, `app/events/[id]/page.tsx`, `reports/page.tsx`, `announcement-banner.tsx`, `staff-gate.ts`, `dev-login/route.ts`, `app/players/page.tsx`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `createClient`, `server.ts`, `registration.ts`, `package.json`, `player/[id]/page.tsx`, `chula.ts`, `award/page.tsx`, `announcements/[id]/page.tsx`, `server-status.ts`, `server/page.tsx`, `about-you-form.tsx`, `dbErrorCode`, `achievements/[id]/page.tsx`, `site-header.tsx`, `audit/page.tsx`, `app/events/[id]/page.tsx`, `error/page.tsx`, `next`, `reconcile-identities.test.ts`, `staff-gate.ts`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _307 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0824829931972789 - nodes in this community are weakly interconnected._
- **Should `registration.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06271186440677966 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.14166666666666666 - nodes in this community are weakly interconnected._