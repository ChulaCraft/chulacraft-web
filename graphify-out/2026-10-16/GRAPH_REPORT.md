# Graph Report - chulacraft-web  (2026-10-16)

## Corpus Check
- 209 files · ~166,912 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 27 file(s) not represented in the graph (top: .css 21, (none) 2, .toml 2)

## Summary
- 888 nodes · 2087 edges · 50 communities (36 shown, 14 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ca8fb70c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- users/[id]/page.tsx
- server.ts
- registration.ts
- package.json
- player/[id]/page.tsx
- compilerOptions
- dbErrorCode
- devDependencies
- local-mocks.mjs
- ChulaCraft Web Version 1.0
- dashboard/actions.ts
- settings/page.tsx
- next_dev_types_root_params_d
- src_app_loading_module
- award/page.tsx
- Chulacraft registration runbook
- CLAUDE.md
- supabase/README.md
- app/events/[id]/page.tsx
- server-address-card.tsx
- overview.tsx
- when
- announcements/[id]/page.tsx
- engines
- server/page.tsx
- dashboard/page.tsx
- ref_next_dev_types_routes_d_ts
- event-form.tsx
- dependencies
- scripts
- next
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
- createClient
- commu/events/[id]/actions.ts
- allowScripts
- audit/page.tsx
- PixelIcon
- commu/events/[id]/actions.test.ts
- icons.tsx
- commu/announcements/page.tsx
- database.types.ts

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 102 edges
2. `next` - 76 edges
3. `PixelIcon()` - 41 edges
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
- `Server actions` --references--> `decideAppeal()`  [INFERRED]
  docs/api.md → src/app/admin/appeals/actions.ts
- `Server actions` --references--> `handleReport()`  [INFERRED]
  docs/api.md → src/app/admin/reports/actions.ts
- `Server actions` --references--> `restoreAccount()`  [INFERRED]
  docs/api.md → src/app/admin/restore/actions.ts
- `Server actions` --references--> `serverAction()`  [INFERRED]
  docs/api.md → src/app/admin/server/actions.ts

## Import Cycles
- None detected.

## Communities (50 total, 14 thin omitted)

### Community 0 - "users/[id]/page.tsx"
Cohesion: 0.14
Nodes (20): react, BAN_DURATIONS, banUser(), finish(), liftBan(), markGuest(), resetChula(), setRole() (+12 more)

### Community 1 - "server.ts"
Cohesion: 0.09
Nodes (35): @supabase/ssr, vitest, authErrorResponse(), GET(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok, AuthErrorPage(), metadata (+27 more)

### Community 2 - "registration.ts"
Cohesion: 0.09
Nodes (36): `/api/registration/minecraft` — player's Minecraft accounts, AdminUserPage(), DELETE(), GET(), PATCH(), POST(), Profile, resolveMinecraftProfile() (+28 more)

### Community 3 - "package.json"
Cohesion: 0.14
Nodes (14): name, private, version, @emnapi/core, @emnapi/runtime, eslint, eslint-config-next, @eslint/js (+6 more)

### Community 4 - "player/[id]/page.tsx"
Cohesion: 0.19
Nodes (17): blockPlayer(), finish(), playerId(), removeFriend(), reportPlayer(), respondFriendRequest(), sendFriendRequest(), ask() (+9 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "dbErrorCode"
Cohesion: 0.26
Nodes (7): decideAppeal(), handleReport(), restoreAccount(), m, redirected(), dbErrorCode(), UUID

### Community 7 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, @eslint/js, @playwright/test, @types/node, @types/react, @types/react-dom (+3 more)

### Community 8 - "local-mocks.mjs"
Cohesion: 0.07
Nodes (35): RFC-6455, ref_node_child_process, ref_node_fs, ref_node_http, ref_node_path, @playwright/test, shots, ACTION_BITS (+27 more)

### Community 9 - "ChulaCraft Web Version 1.0"
Cohesion: 0.10
Nodes (19): Architecture, Chula verification (Google), ChulaCraft Web Version 1.0, Commands, Current implementation caveats, Deployment, Discord authentication, Environment (+11 more)

### Community 10 - "dashboard/actions.ts"
Cohesion: 0.07
Nodes (35): `GET /api/dev-login?as=<user>` — local only, `GET /auth/callback?code=…`, HTTP endpoints, Pages, Server actions, Web API, Accounts and identity, Audit (+27 more)

### Community 11 - "settings/page.tsx"
Cohesion: 0.05
Nodes (54): Final, Global Constraints, Review Focus, Task 1: Show the Discord name everywhere, Task 2: Hero copy, Task 3: Readable admin stat numbers, Task 4: Move community admin to `/admin/commu/*`, v1.1 Phase 1 — Quick Fixes & Admin Navigation Implementation Plan (+46 more)

### Community 14 - "award/page.tsx"
Cohesion: 0.15
Nodes (23): addPlayers(), awardId(), confirmAward(), fail(), prefillInterested(), previewAward(), m, unique() (+15 more)

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.25
Nodes (7): Chulacraft registration runbook, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 18 - "app/events/[id]/page.tsx"
Cohesion: 0.06
Nodes (42): react-dom, src_app_about_about_module, gallery, metadata, values, src_app_events_events_module, eventId(), signInPath() (+34 more)

### Community 19 - "server-address-card.tsx"
Cohesion: 0.16
Nodes (18): ref_node_dns, ref_node_net, CopyButton(), src_components_copy_button_module, serverAddress, ServerAddressRow(), ServerStatus, StatusBadge() (+10 more)

### Community 20 - "overview.tsx"
Cohesion: 0.31
Nodes (8): StatRow(), Stats, timeSince(), Tool, ToolCards(), Activity, AdminPage(), metadata

### Community 21 - "when"
Cohesion: 0.20
Nodes (10): AdminAppealsPage(), DONE, ERRORS, metadata, when(), AdminReportsPage(), CATEGORIES, DONE (+2 more)

### Community 22 - "announcements/[id]/page.tsx"
Cohesion: 0.21
Nodes (12): deleteAnnouncement(), postedId(), refresh(), saveAnnouncement(), SEVERITIES, form(), m, valid() (+4 more)

### Community 24 - "server/page.tsx"
Cohesion: 0.11
Nodes (31): ref_node_crypto, ACTIONS, openConsole(), serverAction(), m, redirected(), ConsoleAction, grant() (+23 more)

### Community 25 - "dashboard/page.tsx"
Cohesion: 0.07
Nodes (41): AdminLayout(), metadata, APPEAL_ERRORS, BanCard(), date(), MyBan, src_app_dashboard_dashboard_module, DashboardPage() (+33 more)

### Community 27 - "event-form.tsx"
Cohesion: 0.20
Nodes (10): IMAGE_TYPES, EventForm(), onCover(), pickFile(), EventFormValues, LOADED_AT, noSubscribe(), shrink() (+2 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom, sharp, @supabase/ssr (+2 more)

### Community 29 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, db:types, dev, dev:mocks, lint, start, test (+3 more)

### Community 30 - "next"
Cohesion: 0.05
Nodes (34): Task 5: Grouped admin nav, nextConfig, next, ref_node_url, @vercel/analytics, AdminNav(), GROUPS, src_app_announcements_announcements_module (+26 more)

### Community 33 - "achievements/[id]/page.tsx"
Cohesion: 0.13
Nodes (14): deleteAchievement(), finish(), postedId(), revokeAward(), saveAchievement(), form(), m, valid() (+6 more)

### Community 35 - "Phases"
Cohesion: 0.15
Nodes (12): ChulaCraft Web v1.1 — Roadmap Spec, Decisions already made, Deferred (needs Minecraft server endpoint), Global constraints (every phase), Phase 1 — Quick fixes & admin navigation  → `plans/2026-10-16-v1.1-phase1-quick-fixes.md`, Phase 2 — Admin power tools, Phase 3 — Design system & UI redesign, Phase 4 — Content without a developer (+4 more)

### Community 40 - "src_app_admin_admin_module"
Cohesion: 0.17
Nodes (3): src_app_admin_admin_module, AdminEventsPage(), metadata

### Community 41 - "createClient"
Cohesion: 0.26
Nodes (11): AdminAchievementPage(), publicImageUrl(), AdminAchievementsPage(), metadata, AdminAnnouncementPage(), AdminEventPage(), DONE, ERRORS (+3 more)

### Community 42 - "commu/events/[id]/actions.ts"
Cohesion: 0.32
Nodes (10): BUCKET, EXTENSIONS, imageError(), imageKey(), MAX_IMAGE_BYTES, toStatus(), deleteEvent(), finish() (+2 more)

### Community 44 - "audit/page.tsx"
Cohesion: 0.25
Nodes (8): AdminAuditPage(), bangkokDay(), ENTITIES, Entry, metadata, Params, describeChange(), PROFILE_FIELDS

### Community 45 - "PixelIcon"
Cohesion: 0.25
Nodes (9): AdminPlayersPage(), Fn, kind(), metadata, Newest, UserRow, PixelIcon(), VerificationBadge() (+1 more)

### Community 46 - "commu/events/[id]/actions.test.ts"
Cohesion: 0.33
Nodes (3): form(), m, valid()

### Community 47 - "icons.tsx"
Cohesion: 0.17
Nodes (7): metadata, PlayersPage(), SearchHit, src_app_players_players_module, IconProps, PIXEL_PATHS, PixelIconName

### Community 48 - "commu/announcements/page.tsx"
Cohesion: 0.50
Nodes (4): AdminAnnouncementsPage(), ERRORS, metadata, state()

### Community 49 - "database.types.ts"
Cohesion: 0.13
Nodes (14): ERRORS, metadata, RemovedRow, RestorePage(), CompositeTypes, Constants, Database, DatabaseWithoutInternals (+6 more)

## Knowledge Gaps
- **288 isolated node(s):** `nextConfig`, `name`, `private`, `node`, `version` (+283 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 373 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `users/[id]/page.tsx`, `server.ts`, `registration.ts`, `package.json`, `player/[id]/page.tsx`, `dbErrorCode`, `dashboard/actions.ts`, `settings/page.tsx`, `award/page.tsx`, `app/events/[id]/page.tsx`, `server-address-card.tsx`, `overview.tsx`, `when`, `announcements/[id]/page.tsx`, `server/page.tsx`, `dashboard/page.tsx`, `event-form.tsx`, `achievements/[id]/page.tsx`, `src_app_admin_admin_module`, `createClient`, `commu/events/[id]/actions.ts`, `audit/page.tsx`, `PixelIcon`, `icons.tsx`, `commu/announcements/page.tsx`, `database.types.ts`?**
  _High betweenness centrality (0.262) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `users/[id]/page.tsx`, `server.ts`, `registration.ts`, `player/[id]/page.tsx`, `dbErrorCode`, `dashboard/actions.ts`, `settings/page.tsx`, `award/page.tsx`, `app/events/[id]/page.tsx`, `overview.tsx`, `when`, `announcements/[id]/page.tsx`, `server/page.tsx`, `dashboard/page.tsx`, `next`, `achievements/[id]/page.tsx`, `src_app_admin_admin_module`, `commu/events/[id]/actions.ts`, `audit/page.tsx`, `PixelIcon`, `icons.tsx`, `commu/announcements/page.tsx`, `database.types.ts`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Why does `vitest` connect `server.ts` to `users/[id]/page.tsx`, `achievements/[id]/page.tsx`, `registration.ts`, `package.json`, `player/[id]/page.tsx`, `dbErrorCode`, `dashboard/actions.ts`, `settings/page.tsx`, `audit/page.tsx`, `commu/events/[id]/actions.test.ts`, `award/page.tsx`, `app/events/[id]/page.tsx`, `server-address-card.tsx`, `announcements/[id]/page.tsx`, `server/page.tsx`, `dashboard/page.tsx`, `next`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _288 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `users/[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13756613756613756 - nodes in this community are weakly interconnected._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08653061224489796 - nodes in this community are weakly interconnected._
- **Should `registration.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09191583610188261 - nodes in this community are weakly interconnected._