# Graph Report - chulacraft-web  (2026-10-17)

## Corpus Check
- 245 files · ~184,094 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 29 file(s) not represented in the graph (top: .css 23, (none) 2, .toml 2)

## Summary
- 1011 nodes · 2455 edges · 54 communities (41 shown, 13 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 75 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `291ffb9f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- table-query.ts
- server.ts
- registration.ts
- package.json
- player/[id]/page.tsx
- compilerOptions
- staff-gate.ts
- devDependencies
- local-mocks.mjs
- ChulaCraft Web Version 1.0
- Tables
- settings/page.tsx
- next_dev_types_root_params_d
- player-table.tsx
- award/page.tsx
- Chulacraft registration runbook
- CLAUDE.md
- supabase/README.md
- announcements/[id]/page.tsx
- server-status.ts
- dashboard/page.tsx
- icons.tsx
- vitest
- engines
- server/page.tsx
- createClient
- ref_next_dev_types_routes_d_ts
- dbErrorCode
- dependencies
- scripts
- details/page.tsx
- next_dev_types_routes_d
- overrides
- achievements/[id]/page.tsx
- src_app_about_you_about_you_module
- Phases
- next_types_root_params_d
- next_types_routes_d
- src_app_auth_error_auth_error_module
- src_app_not_found_module
- dashboard/actions.ts
- src_app_admin_admin_module
- PixelIcon
- allowScripts
- commu/events/[id]/actions.ts
- Review Focus
- app/events/[id]/page.tsx
- next
- players/actions.ts
- Admin tables: the protocol
- achievements/[id]/actions.test.ts
- HTTP endpoints
- reconcile-identities.ts
- admin-nav.tsx

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
- `1. The URL is the state` --references--> `readTable()`  [INFERRED]
  docs/admin-tables.md → src/lib/table-query.ts
- `Task 4: Bulk actions` --references--> `selectionParam()`  [INFERRED]
  docs/superpowers/plans/2026-10-16-v1.1-phase2a-players-table.md → src/app/admin/commu/achievements/selection.ts
- `Task 3: Players table with filters, sort, infinite scroll` --references--> `StatRow()`  [INFERRED]
  docs/superpowers/plans/2026-10-16-v1.1-phase2a-players-table.md → src/app/admin/overview.tsx

## Import Cycles
- None detected.

## Communities (54 total, 13 thin omitted)

### Community 0 - "table-query.ts"
Cohesion: 0.20
Nodes (16): 2. Columns declare what they can do, Ctx, FilterChips(), FilterPanel(), keysOf(), src_components_data_table_module, SortHeader(), Column (+8 more)

### Community 1 - "server.ts"
Cohesion: 0.08
Nodes (38): @supabase/ssr, signOut(), authErrorResponse(), GET(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok, src_app_home_module, HomePage() (+30 more)

### Community 2 - "registration.ts"
Cohesion: 0.10
Nodes (33): `/api/registration/minecraft` — player's Minecraft accounts, DELETE(), GET(), PATCH(), POST(), Profile, resolveMinecraftProfile(), runtime (+25 more)

### Community 3 - "package.json"
Cohesion: 0.14
Nodes (14): name, private, version, @emnapi/core, @emnapi/runtime, eslint, eslint-config-next, @eslint/js (+6 more)

### Community 4 - "player/[id]/page.tsx"
Cohesion: 0.15
Nodes (22): blockPlayer(), finish(), playerId(), removeFriend(), reportPlayer(), respondFriendRequest(), sendFriendRequest(), ask() (+14 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "staff-gate.ts"
Cohesion: 0.20
Nodes (11): Layout(), Layout(), Layout(), AdminLayout(), metadata, Layout(), Layout(), Layout() (+3 more)

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
Cohesion: 0.11
Nodes (16): Accounts and identity, Audit, Content, Database, Minecraft whitelist, Other services that use this database, Player-readable tables, RPC functions (+8 more)

### Community 11 - "settings/page.tsx"
Cohesion: 0.15
Nodes (22): Task 1: Show the Discord name everywhere, @supabase/supabase-js, unlinkPersonalGoogle(), metadata, Privacy, PRIVACY_ERRORS, SettingsPage(), metadata (+14 more)

### Community 13 - "player-table.tsx"
Cohesion: 0.16
Nodes (24): Task 3: Players table with filters, sort, infinite scroll, loadPlayers(), AdminPlayersPage(), metadata, activeView(), BASE, COLUMNS, EMPTY (+16 more)

### Community 14 - "award/page.tsx"
Cohesion: 0.15
Nodes (24): addPlayers(), awardId(), confirmAward(), fail(), prefillInterested(), previewAward(), m, unique() (+16 more)

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.22
Nodes (8): Chulacraft registration runbook, Daily stats, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 18 - "announcements/[id]/page.tsx"
Cohesion: 0.19
Nodes (13): deleteAnnouncement(), postedId(), refresh(), saveAnnouncement(), SEVERITIES, form(), m, valid() (+5 more)

### Community 19 - "server-status.ts"
Cohesion: 0.30
Nodes (12): ref_node_dns, ref_node_net, packet(), parseStatusResponse(), pingServer(), readVarInt(), resolveTarget(), ServerStatus (+4 more)

### Community 20 - "dashboard/page.tsx"
Cohesion: 0.14
Nodes (14): metadata, APPEAL_ERRORS, BanCard(), date(), MyBan, src_app_dashboard_dashboard_module, metadata, Profile (+6 more)

### Community 21 - "icons.tsx"
Cohesion: 0.06
Nodes (33): src_app_about_about_module, gallery, metadata, values, metadata, PlayersPage(), SearchHit, src_app_players_players_module (+25 more)

### Community 22 - "vitest"
Cohesion: 0.19
Nodes (12): RFC-4180, vitest, GET(), get(), m, rpcArgs(), Cell, toCsv() (+4 more)

### Community 24 - "server/page.tsx"
Cohesion: 0.11
Nodes (31): ref_node_crypto, ACTIONS, openConsole(), serverAction(), m, redirected(), ConsoleAction, grant() (+23 more)

### Community 25 - "createClient"
Cohesion: 0.06
Nodes (56): react, AdminEventsPage(), metadata, ERRORS, metadata, RemovedRow, RestorePage(), BAN_DURATIONS (+48 more)

### Community 27 - "dbErrorCode"
Cohesion: 0.25
Nodes (8): Server actions, decideAppeal(), handleReport(), restoreAccount(), m, redirected(), submitAppeal(), dbErrorCode()

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom, sharp, @supabase/ssr (+2 more)

### Community 29 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, db:types, dev, dev:mocks, lint, start, test (+3 more)

### Community 30 - "details/page.tsx"
Cohesion: 0.36
Nodes (6): DashboardPage(), AboutYouPage(), metadata, StepProgress(), toStudyLevel(), requireVerifiedUser()

### Community 33 - "achievements/[id]/page.tsx"
Cohesion: 0.19
Nodes (15): deleteAchievement(), finish(), postedId(), revokeAward(), saveAchievement(), DONE, ERRORS, metadata (+7 more)

### Community 35 - "Phases"
Cohesion: 0.15
Nodes (12): ChulaCraft Web v1.1 — Roadmap Spec, Decisions already made, Deferred (needs Minecraft server endpoint), Global constraints (every phase), Phase 1 — Quick fixes & admin navigation  → `plans/2026-10-16-v1.1-phase1-quick-fixes.md`, Phase 2 — Admin power tools, Phase 3 — Design system & UI redesign, Phase 4 — Content without a developer (+4 more)

### Community 40 - "dashboard/actions.ts"
Cohesion: 0.26
Nodes (12): Moderation, finish(), LEVELS, otherId(), removeFriend(), respondFriendRequest(), allPublic(), form() (+4 more)

### Community 41 - "src_app_admin_admin_module"
Cohesion: 0.06
Nodes (40): src_app_admin_admin_module, AdminAppealsPage(), DONE, ERRORS, metadata, AdminAuditPage(), bangkokDay(), ENTITIES (+32 more)

### Community 42 - "PixelIcon"
Cohesion: 0.18
Nodes (10): react-dom, ServiceUnavailable(), metadata, { getUser, getUserIdentities, rpc, redirect, reconcileIdentities }, page(), VerifyPage(), src_app_verify_verify_module, Brand() (+2 more)

### Community 44 - "commu/events/[id]/actions.ts"
Cohesion: 0.23
Nodes (8): deleteEvent(), finish(), postedId(), saveEvent(), form(), m, valid(), instant()

### Community 45 - "Review Focus"
Cohesion: 0.22
Nodes (8): Final, Global Constraints, Review Focus, Task 1: `admin_list_players` RPC, Task 2: CSV helper + export route, Task 5: Clickable dashboard numbers + real Unverified / Guest cards, Task 6: Daily stats snapshot (for Phase 6 charts), v1.1 Phase 2a — Players Table, Filters, Bulk Actions, CSV, Daily Stats

### Community 46 - "app/events/[id]/page.tsx"
Cohesion: 0.06
Nodes (38): EventForm(), onCover(), pickFile(), EventFormValues, LOADED_AT, noSubscribe(), shrink(), toIso() (+30 more)

### Community 47 - "next"
Cohesion: 0.06
Nodes (32): nextConfig, next, ref_node_url, @vercel/analytics, src_app_announcements_announcements_module, AnnouncementsPage(), metadata, GET() (+24 more)

### Community 48 - "players/actions.ts"
Cohesion: 0.31
Nodes (10): Task 4: Bulk actions, bulkBan(), bulkMarkGuest(), BulkResult, each(), m, AchievementOption, BulkBar() (+2 more)

### Community 49 - "Admin tables: the protocol"
Cohesion: 0.29
Nodes (6): 1. The URL is the state, 3. Above the table, 4. Every value is a link, 5. One RPC per table, 6. States, Admin tables: the protocol

### Community 50 - "achievements/[id]/actions.test.ts"
Cohesion: 0.33
Nodes (3): form(), m, valid()

### Community 51 - "HTTP endpoints"
Cohesion: 0.40
Nodes (5): `GET /api/dev-login?as=<user>` — local only, `GET /auth/callback?code=…`, HTTP endpoints, Pages, Web API

### Community 53 - "reconcile-identities.ts"
Cohesion: 0.14
Nodes (13): LinkError, identityChange(), logFirstSeen(), Outcome, reconcileIdentities(), admin, cu, discord (+5 more)

### Community 54 - "admin-nav.tsx"
Cohesion: 0.10
Nodes (21): Final, Global Constraints, Review Focus, Task 2: Hero copy, Task 3: Readable admin stat numbers, Task 4: Move community admin to `/admin/commu/*`, Task 5: Grouped admin nav, v1.1 Phase 1 — Quick Fixes & Admin Navigation Implementation Plan (+13 more)

## Knowledge Gaps
- **307 isolated node(s):** `nextConfig`, `name`, `private`, `node`, `version` (+302 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 396 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `table-query.ts`, `server.ts`, `registration.ts`, `package.json`, `player/[id]/page.tsx`, `staff-gate.ts`, `settings/page.tsx`, `player-table.tsx`, `award/page.tsx`, `announcements/[id]/page.tsx`, `dashboard/page.tsx`, `icons.tsx`, `server/page.tsx`, `createClient`, `dbErrorCode`, `details/page.tsx`, `achievements/[id]/page.tsx`, `dashboard/actions.ts`, `src_app_admin_admin_module`, `PixelIcon`, `commu/events/[id]/actions.ts`, `app/events/[id]/page.tsx`, `players/actions.ts`, `admin-nav.tsx`?**
  _High betweenness centrality (0.256) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `server.ts`, `registration.ts`, `player/[id]/page.tsx`, `staff-gate.ts`, `settings/page.tsx`, `player-table.tsx`, `award/page.tsx`, `announcements/[id]/page.tsx`, `icons.tsx`, `vitest`, `server/page.tsx`, `dbErrorCode`, `details/page.tsx`, `achievements/[id]/page.tsx`, `dashboard/actions.ts`, `src_app_admin_admin_module`, `PixelIcon`, `commu/events/[id]/actions.ts`, `app/events/[id]/page.tsx`, `next`, `players/actions.ts`, `admin-nav.tsx`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `table-query.ts`, `server.ts`, `registration.ts`, `package.json`, `player/[id]/page.tsx`, `settings/page.tsx`, `player-table.tsx`, `award/page.tsx`, `announcements/[id]/page.tsx`, `server-status.ts`, `icons.tsx`, `server/page.tsx`, `createClient`, `dbErrorCode`, `dashboard/actions.ts`, `src_app_admin_admin_module`, `PixelIcon`, `commu/events/[id]/actions.ts`, `app/events/[id]/page.tsx`, `next`, `players/actions.ts`, `achievements/[id]/actions.test.ts`, `reconcile-identities.ts`, `admin-nav.tsx`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _307 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07619738751814223 - nodes in this community are weakly interconnected._
- **Should `registration.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10256410256410256 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.14166666666666666 - nodes in this community are weakly interconnected._