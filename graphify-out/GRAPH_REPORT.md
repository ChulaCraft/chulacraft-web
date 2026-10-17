# Graph Report - chulacraft-web  (2026-10-17)

## Corpus Check
- 256 files · ~190,186 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 30 file(s) not represented in the graph (top: .css 24, (none) 2, .toml 2)

## Summary
- 1056 nodes · 2569 edges · 57 communities (44 shown, 13 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 82 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0e597a2b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- about-you-form.tsx
- server.ts
- registration.ts
- package.json
- player/[id]/page.tsx
- compilerOptions
- next
- devDependencies
- local-mocks.mjs
- ChulaCraft Web Version 1.0
- Tables
- settings/page.tsx
- next_dev_types_root_params_d
- vitest
- award/page.tsx
- Chulacraft registration runbook
- CLAUDE.md
- supabase/README.md
- announcements/[id]/page.tsx
- server-address-card.tsx
- dashboard/page.tsx
- createClient
- Tasks
- engines
- server/page.tsx
- users/[id]/page.tsx
- ref_next_dev_types_routes_d_ts
- audit/page.tsx
- dependencies
- scripts
- achievements/[id]/actions.test.ts
- next_dev_types_routes_d
- overrides
- commu/events/[id]/actions.ts
- src_app_about_you_about_you_module
- Phases
- next_types_root_params_d
- next_types_routes_d
- src_app_auth_error_auth_error_module
- src_app_not_found_module
- icons.tsx
- reports/page.tsx
- commu/events/[id]/actions.test.ts
- allowScripts
- achievement-grid.tsx
- dbErrorCode
- app/events/[id]/page.tsx
- admin/page.tsx
- src_app_admin_admin_module
- achievements/[id]/page.tsx
- announcement-banner.tsx
- details/page.tsx
- Review Focus
- commu/announcements/page.tsx
- staff-gate.ts
- app/events/[id]/actions.ts
- restore/page.tsx

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 118 edges
2. `next` - 82 edges
3. `PixelIcon()` - 44 edges
4. `dbErrorCode()` - 41 edges
5. `vitest` - 37 edges
6. `react` - 21 edges
7. `when()` - 19 edges
8. `SubmitButton()` - 16 edges
9. `createAdminClient()` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Task 2: CSV helper + export route` --references--> `dbErrorCode()`  [INFERRED]
  docs/superpowers/plans/2026-10-16-v1.1-phase2a-players-table.md → src/lib/db-error.ts
- `Local mock services` --references--> `reconcileIdentities()`  [INFERRED]
  README.md → src/lib/reconcile-identities.ts
- `Server actions` --references--> `decideAppeal()`  [INFERRED]
  docs/api.md → src/app/admin/appeals/actions.ts
- `Task 4: Bulk actions` --references--> `selectionParam()`  [INFERRED]
  docs/superpowers/plans/2026-10-16-v1.1-phase2a-players-table.md → src/app/admin/commu/achievements/selection.ts
- `Task 3: Players table with filters, sort, infinite scroll` --references--> `StatRow()`  [INFERRED]
  docs/superpowers/plans/2026-10-16-v1.1-phase2a-players-table.md → src/app/admin/overview.tsx

## Import Cycles
- None detected.

## Communities (57 total, 13 thin omitted)

### Community 0 - "about-you-form.tsx"
Cohesion: 0.18
Nodes (17): AboutYouForm(), onSubmit(), src_app_register_details_about_you_module, saveProfile(), SaveProfileState, FACULTIES, facultyRole(), ProfileDetails (+9 more)

### Community 1 - "server.ts"
Cohesion: 0.06
Nodes (44): @supabase/ssr, authErrorResponse(), GET(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok, AuthErrorPage(), metadata, src_app_home_module (+36 more)

### Community 2 - "registration.ts"
Cohesion: 0.10
Nodes (33): `/api/registration/minecraft` — player's Minecraft accounts, DELETE(), GET(), PATCH(), POST(), Profile, resolveMinecraftProfile(), runtime (+25 more)

### Community 3 - "package.json"
Cohesion: 0.14
Nodes (14): name, private, version, @emnapi/core, @emnapi/runtime, eslint, eslint-config-next, @eslint/js (+6 more)

### Community 4 - "player/[id]/page.tsx"
Cohesion: 0.13
Nodes (24): react, blockPlayer(), finish(), playerId(), removeFriend(), reportPlayer(), respondFriendRequest(), sendFriendRequest() (+16 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "next"
Cohesion: 0.06
Nodes (36): next, react-dom, @vercel/analytics, src_app_about_about_module, gallery, metadata, values, GET() (+28 more)

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

### Community 11 - "settings/page.tsx"
Cohesion: 0.06
Nodes (50): Task 1: Show the Discord name everywhere, @supabase/supabase-js, signOut(), unlinkPersonalGoogle(), metadata, Privacy, PRIVACY_ERRORS, SettingsPage() (+42 more)

### Community 13 - "vitest"
Cohesion: 0.05
Nodes (71): RFC-4180, 1. The URL is the state, 2. Columns declare what they can do, 3. Above the table, 4. Every value is a link, 5. One RPC per table, 6. States, Admin tables: the protocol (+63 more)

### Community 14 - "award/page.tsx"
Cohesion: 0.15
Nodes (23): addPlayers(), awardId(), confirmAward(), fail(), prefillInterested(), previewAward(), m, unique() (+15 more)

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.22
Nodes (8): Chulacraft registration runbook, Daily stats, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 18 - "announcements/[id]/page.tsx"
Cohesion: 0.19
Nodes (14): deleteAnnouncement(), postedId(), refresh(), saveAnnouncement(), SEVERITIES, form(), m, valid() (+6 more)

### Community 19 - "server-address-card.tsx"
Cohesion: 0.16
Nodes (18): ref_node_dns, ref_node_net, CopyButton(), src_components_copy_button_module, serverAddress, ServerAddressRow(), ServerStatus, StatusBadge() (+10 more)

### Community 20 - "dashboard/page.tsx"
Cohesion: 0.13
Nodes (16): APPEAL_ERRORS, BanCard(), date(), MyBan, src_app_dashboard_dashboard_module, Banner, BANNER_ERRORS, metadata (+8 more)

### Community 21 - "createClient"
Cohesion: 0.23
Nodes (16): Server actions, Moderation, finish(), LEVELS, otherId(), removeFriend(), respondFriendRequest(), setBanner() (+8 more)

### Community 22 - "Tasks"
Cohesion: 0.19
Nodes (12): 2. `ProfileBanner` component, 3. Public player page (`src/app/player/[id]/page.tsx`), 4. Report dialog, 5. Profile page (`src/app/dashboard/page.tsx`), 6. Motion, 7. Verify, Addendum — profile banners (2026-10-17, kaikub request), Decisions (+4 more)

### Community 24 - "server/page.tsx"
Cohesion: 0.11
Nodes (31): ref_node_crypto, ACTIONS, openConsole(), serverAction(), m, redirected(), ConsoleAction, grant() (+23 more)

### Community 25 - "users/[id]/page.tsx"
Cohesion: 0.10
Nodes (29): BAN_DURATIONS, banUser(), finish(), grantBanner(), liftBan(), markGuest(), PRIVACY_LEVELS, resetChula() (+21 more)

### Community 27 - "audit/page.tsx"
Cohesion: 0.21
Nodes (10): AdminAuditPage(), bangkokDay(), ENTITIES, Entry, metadata, Params, AdminUserPage(), describeChange() (+2 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom, sharp, @supabase/ssr (+2 more)

### Community 29 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, db:types, dev, dev:mocks, lint, start, test (+3 more)

### Community 30 - "achievements/[id]/actions.test.ts"
Cohesion: 0.29
Nodes (4): deleteAchievement(), form(), m, valid()

### Community 33 - "commu/events/[id]/actions.ts"
Cohesion: 0.23
Nodes (15): finish(), postedId(), revokeAward(), saveAchievement(), BUCKET, EXTENSIONS, imageError(), imageKey() (+7 more)

### Community 35 - "Phases"
Cohesion: 0.15
Nodes (12): ChulaCraft Web v1.1 — Roadmap Spec, Decisions already made, Deferred (needs Minecraft server endpoint), Global constraints (every phase), Phase 1 — Quick fixes & admin navigation  → `plans/2026-10-16-v1.1-phase1-quick-fixes.md`, Phase 2 — Admin power tools, Phase 3 — Design system & UI redesign, Phase 4 — Content without a developer (+4 more)

### Community 40 - "icons.tsx"
Cohesion: 0.18
Nodes (7): metadata, AdminEventsPage(), metadata, IconProps, PIXEL_PATHS, PixelIcon(), PixelIconName

### Community 41 - "reports/page.tsx"
Cohesion: 0.33
Nodes (5): AdminReportsPage(), CATEGORIES, DONE, ERRORS, metadata

### Community 42 - "commu/events/[id]/actions.test.ts"
Cohesion: 0.33
Nodes (3): form(), m, valid()

### Community 44 - "achievement-grid.tsx"
Cohesion: 0.25
Nodes (8): 1. `eventHistory()` helper + test, AchievementGrid(), AchievementGroup, achievementImage(), day(), eventHistory(), EventVisit, src_components_achievement_grid_module

### Community 45 - "dbErrorCode"
Cohesion: 0.26
Nodes (7): decideAppeal(), handleReport(), restoreAccount(), m, redirected(), dbErrorCode(), UUID

### Community 46 - "app/events/[id]/page.tsx"
Cohesion: 0.06
Nodes (40): IMAGE_TYPES, EventForm(), onCover(), pickFile(), EventFormValues, LOADED_AT, noSubscribe(), shrink() (+32 more)

### Community 47 - "admin/page.tsx"
Cohesion: 0.29
Nodes (9): StatRow(), Stats, timeSince(), Tool, ToolCards(), Activity, AdminPage(), metadata (+1 more)

### Community 48 - "src_app_admin_admin_module"
Cohesion: 0.14
Nodes (5): src_app_admin_admin_module, AdminAppealsPage(), DONE, ERRORS, metadata

### Community 49 - "achievements/[id]/page.tsx"
Cohesion: 0.21
Nodes (12): AdminAchievementPage(), DONE, ERRORS, metadata, publicImageUrl(), AdminAchievementsPage(), metadata, AdminEventPage() (+4 more)

### Community 50 - "announcement-banner.tsx"
Cohesion: 0.29
Nodes (7): src_app_announcements_announcements_module, AnnouncementsPage(), metadata, AnnouncementBanner(), dismissedId(), subscribe(), SEVERITY

### Community 51 - "details/page.tsx"
Cohesion: 0.31
Nodes (7): DashboardPage(), unlockHint(), ServiceUnavailable(), AboutYouPage(), metadata, toStudyLevel(), requireVerifiedUser()

### Community 52 - "Review Focus"
Cohesion: 0.22
Nodes (8): Final, Global Constraints, Review Focus, Task 1: `admin_list_players` RPC, Task 2: CSV helper + export route, Task 5: Clickable dashboard numbers + real Unverified / Guest cards, Task 6: Daily stats snapshot (for Phase 6 charts), v1.1 Phase 2a — Players Table, Filters, Bulk Actions, CSV, Daily Stats

### Community 53 - "commu/announcements/page.tsx"
Cohesion: 0.50
Nodes (4): AdminAnnouncementsPage(), ERRORS, metadata, state()

### Community 54 - "staff-gate.ts"
Cohesion: 0.07
Nodes (31): Final, Global Constraints, Review Focus, Task 2: Hero copy, Task 3: Readable admin stat numbers, Task 4: Move community admin to `/admin/commu/*`, Task 5: Grouped admin nav, v1.1 Phase 1 — Quick Fixes & Admin Navigation Implementation Plan (+23 more)

### Community 55 - "app/events/[id]/actions.ts"
Cohesion: 0.31
Nodes (8): eventId(), signInPath(), form(), interested(), m, redirected(), toggleInterest(), UPCOMING_EVENTS_TAG

### Community 56 - "restore/page.tsx"
Cohesion: 0.40
Nodes (4): ERRORS, metadata, RemovedRow, RestorePage()

## Knowledge Gaps
- **318 isolated node(s):** `nextConfig`, `name`, `private`, `node`, `version` (+313 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 409 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `about-you-form.tsx`, `server.ts`, `registration.ts`, `package.json`, `player/[id]/page.tsx`, `settings/page.tsx`, `vitest`, `award/page.tsx`, `announcements/[id]/page.tsx`, `server-address-card.tsx`, `dashboard/page.tsx`, `createClient`, `server/page.tsx`, `users/[id]/page.tsx`, `audit/page.tsx`, `commu/events/[id]/actions.ts`, `icons.tsx`, `reports/page.tsx`, `achievement-grid.tsx`, `dbErrorCode`, `app/events/[id]/page.tsx`, `admin/page.tsx`, `src_app_admin_admin_module`, `achievements/[id]/page.tsx`, `announcement-banner.tsx`, `details/page.tsx`, `commu/announcements/page.tsx`, `staff-gate.ts`, `app/events/[id]/actions.ts`, `restore/page.tsx`?**
  _High betweenness centrality (0.275) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `server.ts`, `registration.ts`, `player/[id]/page.tsx`, `next`, `settings/page.tsx`, `vitest`, `award/page.tsx`, `announcements/[id]/page.tsx`, `server/page.tsx`, `users/[id]/page.tsx`, `audit/page.tsx`, `achievements/[id]/actions.test.ts`, `commu/events/[id]/actions.ts`, `icons.tsx`, `reports/page.tsx`, `dbErrorCode`, `app/events/[id]/page.tsx`, `admin/page.tsx`, `src_app_admin_admin_module`, `achievements/[id]/page.tsx`, `announcement-banner.tsx`, `details/page.tsx`, `commu/announcements/page.tsx`, `staff-gate.ts`, `app/events/[id]/actions.ts`, `restore/page.tsx`?**
  _High betweenness centrality (0.173) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `about-you-form.tsx`, `server.ts`, `registration.ts`, `package.json`, `player/[id]/page.tsx`, `next`, `settings/page.tsx`, `award/page.tsx`, `announcements/[id]/page.tsx`, `server-address-card.tsx`, `createClient`, `server/page.tsx`, `users/[id]/page.tsx`, `audit/page.tsx`, `achievements/[id]/actions.test.ts`, `commu/events/[id]/actions.test.ts`, `achievement-grid.tsx`, `dbErrorCode`, `app/events/[id]/page.tsx`, `staff-gate.ts`, `app/events/[id]/actions.ts`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _318 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05853174603174603 - nodes in this community are weakly interconnected._
- **Should `registration.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10121457489878542 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.14166666666666666 - nodes in this community are weakly interconnected._