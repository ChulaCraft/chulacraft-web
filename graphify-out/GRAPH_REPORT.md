# Graph Report - chulacraft-web  (2026-10-06)

## Corpus Check
- 200 files · ~163,802 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 27 file(s) not represented in the graph (top: .css 21, (none) 2, .toml 2)

## Summary
- 858 nodes · 2017 edges · 43 communities (29 shown, 14 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4ff3789c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- createClient
- vitest
- registration.ts
- package.json
- player/[id]/page.tsx
- compilerOptions
- dbErrorCode
- devDependencies
- local-mocks.mjs
- ChulaCraft Web
- event-form.tsx
- settings/page.tsx
- next_dev_types_root_params_d
- src_app_loading_module
- award/page.tsx
- Chulacraft registration runbook
- CLAUDE.md
- supabase/README.md
- app/events/[id]/page.tsx
- Plan: server status, announcements, bans/appeals, reports, audit log
- overview.tsx
- achievements/events/[id]/page.tsx
- engines
- server/page.tsx
- dashboard/page.tsx
- ref_next_dev_types_routes_d_ts
- dependencies
- scripts
- next
- next_dev_types_routes_d
- overrides
- achievements/[id]/page.tsx
- src_app_about_you_about_you_module
- PRD: Auto-assign Discord `verified` role
- next_types_root_params_d
- next_types_routes_d
- src_app_auth_error_auth_error_module
- src_app_not_found_module
- src_app_admin_admin_module
- allowScripts
- admin/announcements/page.tsx
- icons.tsx
- server.ts

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 100 edges
2. `next` - 74 edges
3. `PixelIcon()` - 40 edges
4. `dbErrorCode()` - 34 edges
5. `vitest` - 28 edges
6. `when()` - 19 edges
7. `createAdminClient()` - 16 edges
8. `compilerOptions` - 16 edges
9. `SubmitButton()` - 15 edges
10. `reconcileIdentities()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Local mock services` --references--> `reconcileIdentities()`  [INFERRED]
  README.md → src/lib/reconcile-identities.ts
- `RestorePage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/restore/page.tsx → src/lib/supabase/server.ts
- `AnnouncementsPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/announcements/page.tsx → src/lib/supabase/server.ts
- `GET()` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/dev-login/route.ts → src/lib/supabase/server.ts
- `EventsPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/events/page.tsx → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (43 total, 14 thin omitted)

### Community 0 - "createClient"
Cohesion: 0.18
Nodes (18): BAN_DURATIONS, banUser(), finish(), liftBan(), markGuest(), resetChula(), setRole(), setWhitelisted() (+10 more)

### Community 1 - "vitest"
Cohesion: 0.07
Nodes (44): ref_node_dns, ref_node_net, @supabase/ssr, vitest, authErrorResponse(), GET(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok (+36 more)

### Community 2 - "registration.ts"
Cohesion: 0.10
Nodes (32): DELETE(), GET(), PATCH(), POST(), Profile, resolveMinecraftProfile(), runtime, save() (+24 more)

### Community 3 - "package.json"
Cohesion: 0.14
Nodes (14): name, private, version, @emnapi/core, @emnapi/runtime, eslint, eslint-config-next, @eslint/js (+6 more)

### Community 4 - "player/[id]/page.tsx"
Cohesion: 0.15
Nodes (22): blockPlayer(), finish(), playerId(), removeFriend(), reportPlayer(), respondFriendRequest(), sendFriendRequest(), ask() (+14 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "dbErrorCode"
Cohesion: 0.06
Nodes (43): deleteEvent(), finish(), postedId(), saveEvent(), form(), m, valid(), deleteAchievement() (+35 more)

### Community 7 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, @eslint/js, @playwright/test, @types/node, @types/react, @types/react-dom (+3 more)

### Community 8 - "local-mocks.mjs"
Cohesion: 0.07
Nodes (35): RFC-6455, ref_node_child_process, ref_node_fs, ref_node_http, ref_node_path, @playwright/test, shots, ACTION_BITS (+27 more)

### Community 9 - "ChulaCraft Web"
Cohesion: 0.10
Nodes (19): Architecture, Chula verification (Google), ChulaCraft Web, Commands, Current implementation caveats, Deployment, Discord authentication, Environment (+11 more)

### Community 10 - "event-form.tsx"
Cohesion: 0.22
Nodes (9): EventForm(), onCover(), pickFile(), EventFormValues, LOADED_AT, noSubscribe(), shrink(), toIso() (+1 more)

### Community 11 - "settings/page.tsx"
Cohesion: 0.05
Nodes (60): @supabase/supabase-js, finish(), LEVELS, otherId(), removeFriend(), respondFriendRequest(), allPublic(), form() (+52 more)

### Community 14 - "award/page.tsx"
Cohesion: 0.15
Nodes (23): addPlayers(), awardId(), confirmAward(), fail(), prefillInterested(), previewAward(), m, unique() (+15 more)

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.25
Nodes (7): Chulacraft registration runbook, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 18 - "app/events/[id]/page.tsx"
Cohesion: 0.05
Nodes (48): react-dom, src_app_about_about_module, gallery, metadata, values, src_app_events_events_module, eventId(), signInPath() (+40 more)

### Community 19 - "Plan: server status, announcements, bans/appeals, reports, audit log"
Cohesion: 0.12
Nodes (16): Constraints from `chulacraft-server-manager`, Open questions, Order and size, Other repos involved, Permission bits, Phase 0 — Split the whitelist worker into its own repo, Phase 1 — Live server status (#1), Phase 2 — Announcements (#3) (+8 more)

### Community 20 - "overview.tsx"
Cohesion: 0.23
Nodes (10): StatRow(), Stats, timeSince(), Tool, ToolCards(), Activity, AdminPage(), metadata (+2 more)

### Community 21 - "achievements/events/[id]/page.tsx"
Cohesion: 0.17
Nodes (14): AdminEventPage(), DONE, ERRORS, metadata, AdminAchievementPage(), publicImageUrl(), AdminAchievementsPage(), metadata (+6 more)

### Community 24 - "server/page.tsx"
Cohesion: 0.11
Nodes (31): ref_node_crypto, ACTIONS, openConsole(), serverAction(), m, redirected(), ConsoleAction, grant() (+23 more)

### Community 25 - "dashboard/page.tsx"
Cohesion: 0.08
Nodes (37): AdminLayout(), metadata, submitAppeal(), APPEAL_ERRORS, BanCard(), date(), MyBan, src_app_dashboard_dashboard_module (+29 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom, sharp, @supabase/ssr (+2 more)

### Community 29 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, db:types, dev, dev:mocks, lint, start, test (+3 more)

### Community 30 - "next"
Cohesion: 0.06
Nodes (31): nextConfig, next, ref_node_url, @vercel/analytics, src_app_announcements_announcements_module, AnnouncementsPage(), metadata, GET() (+23 more)

### Community 33 - "achievements/[id]/page.tsx"
Cohesion: 0.17
Nodes (11): react, DONE, ERRORS, metadata, metadata, BODY, RoleControl(), ConfirmAction() (+3 more)

### Community 35 - "PRD: Auto-assign Discord `verified` role"
Cohesion: 0.14
Nodes (13): 1. Problem, 2. Goal, 3. Scope, 4. User stories, 5.1 Database (chulacraft-web, new migration), 5.2 Bot (chulacraft-discord), 5.3 Discord server setup, 5. Design (+5 more)

### Community 40 - "src_app_admin_admin_module"
Cohesion: 0.17
Nodes (5): src_app_admin_admin_module, AdminAppealsPage(), DONE, ERRORS, metadata

### Community 44 - "admin/announcements/page.tsx"
Cohesion: 0.50
Nodes (4): AdminAnnouncementsPage(), ERRORS, metadata, state()

### Community 47 - "icons.tsx"
Cohesion: 0.11
Nodes (16): AdminPlayersPage(), Fn, kind(), metadata, Newest, UserRow, metadata, PlayersPage() (+8 more)

### Community 49 - "server.ts"
Cohesion: 0.11
Nodes (20): AdminAuditPage(), bangkokDay(), ENTITIES, Entry, metadata, Params, ERRORS, metadata (+12 more)

## Knowledge Gaps
- **280 isolated node(s):** `nextConfig`, `name`, `private`, `node`, `version` (+275 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 363 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `createClient`, `vitest`, `registration.ts`, `package.json`, `player/[id]/page.tsx`, `dbErrorCode`, `event-form.tsx`, `settings/page.tsx`, `award/page.tsx`, `app/events/[id]/page.tsx`, `overview.tsx`, `achievements/events/[id]/page.tsx`, `server/page.tsx`, `dashboard/page.tsx`, `achievements/[id]/page.tsx`, `src_app_admin_admin_module`, `admin/announcements/page.tsx`, `icons.tsx`, `server.ts`?**
  _High betweenness centrality (0.260) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `achievements/[id]/page.tsx`, `registration.ts`, `vitest`, `player/[id]/page.tsx`, `dbErrorCode`, `src_app_admin_admin_module`, `settings/page.tsx`, `admin/announcements/page.tsx`, `award/page.tsx`, `icons.tsx`, `server.ts`, `app/events/[id]/page.tsx`, `overview.tsx`, `achievements/events/[id]/page.tsx`, `server/page.tsx`, `dashboard/page.tsx`, `next`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `createClient`, `registration.ts`, `package.json`, `player/[id]/page.tsx`, `dbErrorCode`, `settings/page.tsx`, `award/page.tsx`, `app/events/[id]/page.tsx`, `overview.tsx`, `server/page.tsx`, `dashboard/page.tsx`, `next`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _280 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `vitest` be split into smaller, more focused modules?**
  _Cohesion score 0.06775956284153005 - nodes in this community are weakly interconnected._
- **Should `registration.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10384068278805121 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.14166666666666666 - nodes in this community are weakly interconnected._