# Graph Report - chulacraft-web  (2026-10-17)

## Corpus Check
- 281 files · ~204,222 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 31 file(s) not represented in the graph (top: .css 25, (none) 2, .toml 2)

## Summary
- 1168 nodes · 2927 edges · 59 communities (47 shown, 12 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 88 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `df181884`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- banner-form.tsx
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
- dashboard/page.tsx
- next_dev_types_root_params_d
- player-table.tsx
- award/page.tsx
- Chulacraft registration runbook
- CLAUDE.md
- supabase/README.md
- announcements/[id]/actions.ts
- app/page.tsx
- table-query.ts
- createClient
- vitest
- engines
- server/page.tsx
- users/[id]/page.tsx
- ref_next_dev_types_routes_d_ts
- audit/page.tsx
- dependencies
- scripts
- achievements/[id]/page.tsx
- next_dev_types_routes_d
- overrides
- images.ts
- src_app_about_you_about_you_module
- Phases
- next_types_root_params_d
- next_types_routes_d
- src_app_auth_error_auth_error_module
- src_app_not_found_module
- icons.tsx
- staff-gate.ts
- commu/events/[id]/actions.test.ts
- commu/team/page.tsx
- about/page.tsx
- dbErrorCode
- app/events/[id]/page.tsx
- admin/page.tsx
- src_app_admin_admin_module
- announcements/[id]/page.tsx
- site-header.tsx
- PixelIcon
- Review Focus
- players/actions.ts
- admin-nav.tsx
- Tasks
- register/page.tsx
- Admin tables: the protocol
- app/players/page.tsx

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 140 edges
2. `next` - 94 edges
3. `dbErrorCode()` - 50 edges
4. `PixelIcon()` - 49 edges
5. `vitest` - 40 edges
6. `react` - 22 edges
7. `publicImageUrl()` - 20 edges
8. `SubmitButton()` - 20 edges
9. `when()` - 19 edges
10. `requireArea()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `2. Gallery` --references--> `ConfirmAction()`  [INFERRED]
  docs/superpowers/plans/2026-10-17-v1.1-phase4-content.md → src/components/confirm-action.tsx
- `Task 2: CSV helper + export route` --references--> `dbErrorCode()`  [INFERRED]
  docs/superpowers/plans/2026-10-16-v1.1-phase2a-players-table.md → src/lib/db-error.ts
- `Local mock services` --references--> `reconcileIdentities()`  [INFERRED]
  README.md → src/lib/reconcile-identities.ts
- `1. The URL is the state` --references--> `readTable()`  [INFERRED]
  docs/admin-tables.md → src/lib/table-query.ts
- `Server actions` --references--> `decideAppeal()`  [INFERRED]
  docs/api.md → src/app/admin/appeals/actions.ts

## Import Cycles
- None detected.

## Communities (59 total, 12 thin omitted)

### Community 0 - "banner-form.tsx"
Cohesion: 0.10
Nodes (28): sharp, MAX_IMAGE_BYTES, Checked, checkFile(), saveBanner(), colors, gif(), m (+20 more)

### Community 1 - "server.ts"
Cohesion: 0.06
Nodes (48): @supabase/ssr, ERRORS, metadata, RemovedRow, RestorePage(), saveSiteSettings(), SWITCHES, m (+40 more)

### Community 2 - "registration.ts"
Cohesion: 0.06
Nodes (48): `/api/registration/minecraft` — player's Minecraft accounts, AdminUserPage(), DELETE(), GET(), PATCH(), POST(), Profile, resolveMinecraftProfile() (+40 more)

### Community 3 - "package.json"
Cohesion: 0.13
Nodes (15): allowScripts, unrs-resolver@1.12.2, name, private, version, @emnapi/core, @emnapi/runtime, eslint (+7 more)

### Community 4 - "player/[id]/page.tsx"
Cohesion: 0.07
Nodes (43): 1. `eventHistory()` helper + test, 2. `ProfileBanner` component, 3. Public player page (`src/app/player/[id]/page.tsx`), 4. Report dialog, 5. Profile page (`src/app/dashboard/page.tsx`), 6. Motion, 7. Verify, Addendum — profile banners (2026-10-17, kaikub request) (+35 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "next"
Cohesion: 0.07
Nodes (26): nextConfig, next, ref_node_url, @vercel/analytics, GET(), AuthErrorPage(), metadata, src_app_globals (+18 more)

### Community 7 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, @eslint/js, @playwright/test, @types/node, @types/react, @types/react-dom (+3 more)

### Community 8 - "local-mocks.mjs"
Cohesion: 0.05
Nodes (47): RFC-6455, ref_node_child_process, ref_node_dns, ref_node_fs, ref_node_http, ref_node_net, ref_node_path, @playwright/test (+39 more)

### Community 9 - "ChulaCraft Web Version 1.0"
Cohesion: 0.10
Nodes (19): Architecture, Chula verification (Google), ChulaCraft Web Version 1.0, Commands, Current implementation caveats, Deployment, Discord authentication, Environment (+11 more)

### Community 10 - "Tables"
Cohesion: 0.09
Nodes (21): `GET /api/dev-login?as=<user>` — local only, `GET /auth/callback?code=…`, HTTP endpoints, Pages, Web API, Accounts and identity, Audit, Content (+13 more)

### Community 11 - "dashboard/page.tsx"
Cohesion: 0.05
Nodes (60): Server actions, Moderation, Task 1: Show the Discord name everywhere, @supabase/supabase-js, finish(), LEVELS, otherId(), removeFriend() (+52 more)

### Community 13 - "player-table.tsx"
Cohesion: 0.14
Nodes (27): Task 3: Players table with filters, sort, infinite scroll, loadPlayers(), AchievementOption, BulkPermissions, AdminPlayersPage(), metadata, activeView(), BASE (+19 more)

### Community 14 - "award/page.tsx"
Cohesion: 0.15
Nodes (23): addPlayers(), awardId(), confirmAward(), fail(), prefillInterested(), previewAward(), m, unique() (+15 more)

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.22
Nodes (8): Chulacraft registration runbook, Daily stats, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 18 - "announcements/[id]/actions.ts"
Cohesion: 0.27
Nodes (10): uploadPicture(), deleteAnnouncement(), postedId(), refresh(), saveAnnouncement(), SEVERITIES, form(), m (+2 more)

### Community 19 - "app/page.tsx"
Cohesion: 0.19
Nodes (14): GET(), src_app_home_module, HomePage(), loadUpcomingEvents(), steps(), upcomingEvents, CopyButton(), src_components_copy_button_module (+6 more)

### Community 20 - "table-query.ts"
Cohesion: 0.17
Nodes (19): 2. Columns declare what they can do, Ctx, FilterChips(), FilterPanel(), KeepState(), keysOf(), src_components_data_table_module, SortHeader() (+11 more)

### Community 21 - "createClient"
Cohesion: 0.31
Nodes (13): IMAGE_TYPES, addGalleryImage(), alt(), deleteGalleryImage(), finish(), moveGalleryImage(), postedId(), updateGalleryImage() (+5 more)

### Community 22 - "vitest"
Cohesion: 0.23
Nodes (10): RFC-4180, vitest, GET(), get(), m, Cell, toCsv(), AREAS (+2 more)

### Community 24 - "server/page.tsx"
Cohesion: 0.11
Nodes (33): ref_node_crypto, ACTIONS, openConsole(), serverAction(), m, redirected(), ConsoleAction, grant() (+25 more)

### Community 25 - "users/[id]/page.tsx"
Cohesion: 0.06
Nodes (53): react, AdminLayout(), metadata, BAN_DURATIONS, banUser(), finish(), grantBanner(), liftBan() (+45 more)

### Community 27 - "audit/page.tsx"
Cohesion: 0.23
Nodes (9): AdminAuditPage(), bangkokDay(), ENTITIES, Entry, metadata, Params, describeChange(), PRIVACY_FIELDS (+1 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom, sharp, @supabase/ssr (+2 more)

### Community 29 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, db:types, dev, dev:mocks, lint, start, test (+3 more)

### Community 30 - "achievements/[id]/page.tsx"
Cohesion: 0.18
Nodes (11): deleteAchievement(), finish(), postedId(), revokeAward(), saveAchievement(), form(), m, valid() (+3 more)

### Community 33 - "images.ts"
Cohesion: 0.27
Nodes (12): Decisions, BUCKET, EXTENSIONS, imageError(), imageKey(), Storage, toStatus(), deleteEvent() (+4 more)

### Community 35 - "Phases"
Cohesion: 0.15
Nodes (12): ChulaCraft Web v1.1 — Roadmap Spec, Decisions already made, Deferred (needs Minecraft server endpoint), Global constraints (every phase), Phase 1 — Quick fixes & admin navigation  → `plans/2026-10-16-v1.1-phase1-quick-fixes.md`, Phase 2 — Admin power tools, Phase 3 — Design system & UI redesign, Phase 4 — Content without a developer (+4 more)

### Community 40 - "icons.tsx"
Cohesion: 0.23
Nodes (8): GoogleSignInButton(), LinkGoogleButton(), useGoogle(), start(), CUIcon(), GoogleIcon(), IconProps, PIXEL_PATHS

### Community 41 - "staff-gate.ts"
Cohesion: 0.24
Nodes (8): Layout(), Layout(), Layout(), Layout(), Layout(), Layout(), Layout(), requireArea()

### Community 42 - "commu/events/[id]/actions.test.ts"
Cohesion: 0.33
Nodes (3): form(), m, valid()

### Community 43 - "commu/team/page.tsx"
Cohesion: 0.25
Nodes (12): deleteTeamMember(), finish(), KINDS, moveTeamMember(), playerIdFrom(), postedId(), saveTeamMember(), AdminTeamPage() (+4 more)

### Community 44 - "about/page.tsx"
Cohesion: 0.19
Nodes (10): src_app_about_about_module, AboutPage(), builtInGallery, metadata, values, metadata, RulesPage(), src_app_team_team_module (+2 more)

### Community 45 - "dbErrorCode"
Cohesion: 0.24
Nodes (8): decideAppeal(), deleteBanner(), handleReport(), restoreAccount(), m, redirected(), dbErrorCode(), UUID

### Community 46 - "app/events/[id]/page.tsx"
Cohesion: 0.05
Nodes (48): react-dom, EventForm(), onCover(), pickFile(), EventFormValues, LOADED_AT, noSubscribe(), shrink() (+40 more)

### Community 47 - "admin/page.tsx"
Cohesion: 0.26
Nodes (10): StatRow(), Stats, timeSince(), Tool, ToolCards(), Activity, AdminPage(), metadata (+2 more)

### Community 48 - "src_app_admin_admin_module"
Cohesion: 0.08
Nodes (21): src_app_admin_admin_module, AdminAppealsPage(), DONE, ERRORS, metadata, AdminAchievementPage(), metadata, AdminAchievementsPage() (+13 more)

### Community 49 - "announcements/[id]/page.tsx"
Cohesion: 0.18
Nodes (13): publicImageUrl(), AdminAnnouncementPage(), DONE, ERRORS, metadata, AdminEventPage(), DONE, ERRORS (+5 more)

### Community 50 - "site-header.tsx"
Cohesion: 0.31
Nodes (5): AnnouncementBanner(), dismissedId(), subscribe(), Brand(), SEVERITY

### Community 51 - "PixelIcon"
Cohesion: 0.16
Nodes (11): AdminEventsPage(), metadata, ServiceUnavailable(), metadata, src_app_verify_verify_module, metadata, Step, StepKind (+3 more)

### Community 52 - "Review Focus"
Cohesion: 0.22
Nodes (8): Final, Global Constraints, Review Focus, Task 1: `admin_list_players` RPC, Task 2: CSV helper + export route, Task 5: Clickable dashboard numbers + real Unverified / Guest cards, Task 6: Daily stats snapshot (for Phase 6 charts), v1.1 Phase 2a — Players Table, Filters, Bulk Actions, CSV, Daily Stats

### Community 53 - "players/actions.ts"
Cohesion: 0.35
Nodes (9): Task 4: Bulk actions, bulkBan(), bulkMarkGuest(), BulkResult, each(), m, BulkBar(), say() (+1 more)

### Community 54 - "admin-nav.tsx"
Cohesion: 0.10
Nodes (21): Final, Global Constraints, Review Focus, Task 2: Hero copy, Task 3: Readable admin stat numbers, Task 4: Move community admin to `/admin/commu/*`, Task 5: Grouped admin nav, v1.1 Phase 1 — Quick Fixes & Admin Navigation Implementation Plan (+13 more)

### Community 55 - "Tasks"
Cohesion: 0.20
Nodes (9): 1. Announcement images, 2. Gallery, 3. Team page, 4. Site settings, 5. Verify, Already covered (no work), Answers (kaikub, 2026-10-17) and what was built, Tasks (+1 more)

### Community 56 - "register/page.tsx"
Cohesion: 0.27
Nodes (7): metadata, RegisterPage(), { getUser, redirect }, src_app_register_register_module, DiscordAuthButton(), signIn(), DiscordIcon()

### Community 57 - "Admin tables: the protocol"
Cohesion: 0.29
Nodes (6): 1. The URL is the state, 3. Above the table, 4. Every value is a link, 5. One RPC per table, 6. States, Admin tables: the protocol

### Community 58 - "app/players/page.tsx"
Cohesion: 0.33
Nodes (4): metadata, PlayersPage(), SearchHit, src_app_players_players_module

## Knowledge Gaps
- **350 isolated node(s):** `nextConfig`, `name`, `private`, `node`, `version` (+345 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 444 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `banner-form.tsx`, `server.ts`, `registration.ts`, `package.json`, `player/[id]/page.tsx`, `dashboard/page.tsx`, `player-table.tsx`, `award/page.tsx`, `announcements/[id]/actions.ts`, `app/page.tsx`, `table-query.ts`, `createClient`, `server/page.tsx`, `users/[id]/page.tsx`, `audit/page.tsx`, `achievements/[id]/page.tsx`, `images.ts`, `icons.tsx`, `staff-gate.ts`, `commu/team/page.tsx`, `about/page.tsx`, `dbErrorCode`, `app/events/[id]/page.tsx`, `admin/page.tsx`, `src_app_admin_admin_module`, `announcements/[id]/page.tsx`, `site-header.tsx`, `PixelIcon`, `players/actions.ts`, `admin-nav.tsx`, `register/page.tsx`, `app/players/page.tsx`?**
  _High betweenness centrality (0.224) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `banner-form.tsx`, `server.ts`, `registration.ts`, `player/[id]/page.tsx`, `next`, `dashboard/page.tsx`, `player-table.tsx`, `award/page.tsx`, `announcements/[id]/actions.ts`, `vitest`, `server/page.tsx`, `users/[id]/page.tsx`, `audit/page.tsx`, `achievements/[id]/page.tsx`, `images.ts`, `staff-gate.ts`, `commu/team/page.tsx`, `dbErrorCode`, `app/events/[id]/page.tsx`, `admin/page.tsx`, `src_app_admin_admin_module`, `announcements/[id]/page.tsx`, `site-header.tsx`, `PixelIcon`, `players/actions.ts`, `admin-nav.tsx`, `register/page.tsx`, `app/players/page.tsx`?**
  _High betweenness centrality (0.207) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `banner-form.tsx`, `server.ts`, `registration.ts`, `package.json`, `player/[id]/page.tsx`, `next`, `local-mocks.mjs`, `dashboard/page.tsx`, `player-table.tsx`, `award/page.tsx`, `announcements/[id]/actions.ts`, `table-query.ts`, `server/page.tsx`, `users/[id]/page.tsx`, `audit/page.tsx`, `achievements/[id]/page.tsx`, `commu/events/[id]/actions.test.ts`, `dbErrorCode`, `app/events/[id]/page.tsx`, `players/actions.ts`, `admin-nav.tsx`, `register/page.tsx`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _350 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `banner-form.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0960960960960961 - nodes in this community are weakly interconnected._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.057539682539682536 - nodes in this community are weakly interconnected._
- **Should `registration.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06497175141242938 - nodes in this community are weakly interconnected._