# Graph Report - chulacraft-web  (2026-10-05)

## Corpus Check
- 196 files · ~159,966 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 27 file(s) not represented in the graph (top: .css 21, (none) 2, .toml 2)

## Summary
- 795 nodes · 1895 edges · 42 communities (28 shown, 14 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 40 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `abbc5e93`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- player/[id]/page.tsx
- server.ts
- minecraft/route.ts
- package.json
- createClient
- compilerOptions
- next
- devDependencies
- visual-audit.spec.ts
- ChulaCraft Web
- server-status.ts
- dashboard/page.tsx
- next_dev_types_root_params_d
- supabase-stub.mjs
- registration.ts
- Chulacraft registration runbook
- CLAUDE.md
- supabase/README.md
- app/page.tsx
- Plan: server status, announcements, bans/appeals, reports, audit log
- overview.tsx
- when
- src_app_loading_module
- engines
- server/page.tsx
- about-you-form.tsx
- ref_next_dev_types_routes_d_ts
- icons.tsx
- dependencies
- scripts
- app/layout.tsx
- next_dev_types_routes_d
- overrides
- achievements/events/[id]/page.tsx
- src_app_about_you_about_you_module
- PRD: Auto-assign Discord `verified` role
- next_types_root_params_d
- next_types_routes_d
- src_app_auth_error_auth_error_module
- src_app_not_found_module
- src_app_admin_admin_module
- audit/page.tsx

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 100 edges
2. `next` - 70 edges
3. `PixelIcon()` - 40 edges
4. `dbErrorCode()` - 34 edges
5. `vitest` - 28 edges
6. `when()` - 19 edges
7. `createAdminClient()` - 16 edges
8. `compilerOptions` - 16 edges
9. `react` - 14 edges
10. `reconcileIdentities()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `RestorePage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/restore/page.tsx → src/lib/supabase/server.ts
- `AnnouncementsPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/announcements/page.tsx → src/lib/supabase/server.ts
- `GET()` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/dev-login/route.ts → src/lib/supabase/server.ts
- `GET()` --indirect_call--> `toRegistrationView()`  [INFERRED]
  src/app/api/registration/minecraft/route.ts → src/lib/registration.ts
- `EventsPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/events/page.tsx → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (42 total, 14 thin omitted)

### Community 0 - "player/[id]/page.tsx"
Cohesion: 0.15
Nodes (22): blockPlayer(), finish(), playerId(), removeFriend(), reportPlayer(), respondFriendRequest(), sendFriendRequest(), ask() (+14 more)

### Community 1 - "server.ts"
Cohesion: 0.06
Nodes (43): nextConfig, ref_node_url, @supabase/ssr, vitest, signOut(), authErrorResponse(), GET(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities } (+35 more)

### Community 2 - "minecraft/route.ts"
Cohesion: 0.11
Nodes (26): DELETE(), GET(), PATCH(), POST(), Profile, resolveMinecraftProfile(), runtime, save() (+18 more)

### Community 3 - "package.json"
Cohesion: 0.12
Nodes (16): allowScripts, unrs-resolver@1.12.2, name, private, version, @emnapi/core, @emnapi/runtime, eslint (+8 more)

### Community 4 - "createClient"
Cohesion: 0.18
Nodes (18): BAN_DURATIONS, banUser(), finish(), liftBan(), markGuest(), resetChula(), setRole(), setWhitelisted() (+10 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "next"
Cohesion: 0.07
Nodes (33): next, EventForm(), onCover(), pickFile(), EventFormValues, LOADED_AT, noSubscribe(), shrink() (+25 more)

### Community 7 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, @eslint/js, @playwright/test, @types/node, @types/react, @types/react-dom (+3 more)

### Community 8 - "visual-audit.spec.ts"
Cohesion: 0.18
Nodes (9): ref_node_child_process, ref_node_fs, ref_node_path, @playwright/test, shots, AuditOptions, auditPage(), accessToken (+1 more)

### Community 9 - "ChulaCraft Web"
Cohesion: 0.11
Nodes (18): Architecture, Chula verification (Google), ChulaCraft Web, Commands, Current implementation caveats, Deployment, Discord authentication, Environment (+10 more)

### Community 10 - "server-status.ts"
Cohesion: 0.30
Nodes (12): ref_node_dns, ref_node_net, packet(), parseStatusResponse(), pingServer(), readVarInt(), resolveTarget(), ServerStatus (+4 more)

### Community 11 - "dashboard/page.tsx"
Cohesion: 0.05
Nodes (59): react-dom, @supabase/supabase-js, AdminLayout(), finish(), LEVELS, otherId(), removeFriend(), respondFriendRequest() (+51 more)

### Community 14 - "registration.ts"
Cohesion: 0.07
Nodes (45): addPlayers(), awardId(), confirmAward(), fail(), prefillInterested(), previewAward(), m, unique() (+37 more)

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.25
Nodes (7): Chulacraft registration runbook, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 18 - "app/page.tsx"
Cohesion: 0.07
Nodes (43): src_app_events_events_module, eventId(), signInPath(), form(), interested(), m, redirected(), toggleInterest() (+35 more)

### Community 19 - "Plan: server status, announcements, bans/appeals, reports, audit log"
Cohesion: 0.12
Nodes (16): Constraints from `chulacraft-server-manager`, Open questions, Order and size, Other repos involved, Permission bits, Phase 0 — Split the whitelist worker into its own repo, Phase 1 — Live server status (#1), Phase 2 — Announcements (#3) (+8 more)

### Community 20 - "overview.tsx"
Cohesion: 0.17
Nodes (15): StatRow(), Stats, timeSince(), Tool, ToolCards(), Activity, AdminPage(), AdminPlayersPage() (+7 more)

### Community 21 - "when"
Cohesion: 0.19
Nodes (12): AdminEventPage(), AdminAchievementPage(), publicImageUrl(), AdminAchievementsPage(), AdminAppealsPage(), DONE, ERRORS, when() (+4 more)

### Community 24 - "server/page.tsx"
Cohesion: 0.14
Nodes (25): ref_node_crypto, ACTIONS, openConsole(), serverAction(), m, redirected(), ConsoleAction, grant() (+17 more)

### Community 25 - "about-you-form.tsx"
Cohesion: 0.18
Nodes (17): AboutYouForm(), onSubmit(), src_app_register_details_about_you_module, saveProfile(), SaveProfileState, FACULTIES, facultyRole(), ProfileDetails (+9 more)

### Community 27 - "icons.tsx"
Cohesion: 0.05
Nodes (46): react, src_app_about_about_module, gallery, metadata, values, src_app_announcements_announcements_module, AnnouncementsPage(), metadata (+38 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom, sharp, @supabase/ssr (+2 more)

### Community 29 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, db:types, dev, lint, start, test, test:visual (+2 more)

### Community 30 - "app/layout.tsx"
Cohesion: 0.18
Nodes (11): @vercel/analytics, GET(), src_app_globals, metadata, SiteFooter(), SiteHeader(), DEV_LOGIN_ENABLED, DEV_USERS (+3 more)

### Community 33 - "achievements/events/[id]/page.tsx"
Cohesion: 0.19
Nodes (9): DONE, ERRORS, ERRORS, RemovedRow, RestorePage(), BODY, RoleControl(), ConfirmAction() (+1 more)

### Community 35 - "PRD: Auto-assign Discord `verified` role"
Cohesion: 0.14
Nodes (13): 1. Problem, 2. Goal, 3. Scope, 4. User stories, 5.1 Database (chulacraft-web, new migration), 5.2 Bot (chulacraft-discord), 5.3 Discord server setup, 5. Design (+5 more)

### Community 40 - "src_app_admin_admin_module"
Cohesion: 0.20
Nodes (4): src_app_admin_admin_module, AdminAnnouncementsPage(), ERRORS, state()

### Community 41 - "audit/page.tsx"
Cohesion: 0.29
Nodes (7): AdminAuditPage(), bangkokDay(), ENTITIES, Entry, Params, describeChange(), PROFILE_FIELDS

## Knowledge Gaps
- **240 isolated node(s):** `nextConfig`, `name`, `private`, `node`, `version` (+235 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 322 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `player/[id]/page.tsx`, `server.ts`, `achievements/events/[id]/page.tsx`, `package.json`, `createClient`, `minecraft/route.ts`, `src_app_admin_admin_module`, `audit/page.tsx`, `dashboard/page.tsx`, `registration.ts`, `app/page.tsx`, `overview.tsx`, `when`, `server/page.tsx`, `about-you-form.tsx`, `icons.tsx`, `app/layout.tsx`?**
  _High betweenness centrality (0.247) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `player/[id]/page.tsx`, `achievements/events/[id]/page.tsx`, `minecraft/route.ts`, `server.ts`, `next`, `src_app_admin_admin_module`, `audit/page.tsx`, `dashboard/page.tsx`, `registration.ts`, `app/page.tsx`, `overview.tsx`, `when`, `server/page.tsx`, `icons.tsx`, `app/layout.tsx`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Why does `vitest` connect `server.ts` to `player/[id]/page.tsx`, `minecraft/route.ts`, `package.json`, `createClient`, `next`, `audit/page.tsx`, `server-status.ts`, `dashboard/page.tsx`, `registration.ts`, `app/page.tsx`, `server/page.tsx`, `about-you-form.tsx`, `icons.tsx`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _240 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `player/[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1455026455026455 - nodes in this community are weakly interconnected._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06001984126984127 - nodes in this community are weakly interconnected._
- **Should `minecraft/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10804597701149425 - nodes in this community are weakly interconnected._