# Graph Report - chulacraft-web  (2026-10-05)

## Corpus Check
- 165 files · ~143,497 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 26 file(s) not represented in the graph (top: .css 20, (none) 2, .toml 2)

## Summary
- 699 nodes · 1595 edges · 37 communities (22 shown, 15 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5a283a8f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- player/[id]/page.tsx
- server.ts
- registration.ts
- package.json
- createClient
- compilerOptions
- achievements/events/[id]/actions.ts
- devDependencies
- visual-audit.spec.ts
- ChulaCraft Web
- server-status.ts
- settings/page.tsx
- next_dev_types_root_params_d
- supabase-stub.mjs
- dbErrorCode
- Chulacraft registration runbook
- CLAUDE.md
- supabase/README.md
- app/events/[id]/page.tsx
- Plan: server status, announcements, bans/appeals, reports, audit log
- src_app_loading_module
- engines
- ref_node_crypto
- dashboard/page.tsx
- ref_next_dev_types_routes_d_ts
- icons.tsx
- dependencies
- scripts
- next
- next_dev_types_routes_d
- overrides
- src_app_about_you_about_you_module
- PRD: Auto-assign Discord `verified` role
- next_types_root_params_d
- next_types_routes_d
- src_app_auth_error_auth_error_module
- src_app_not_found_module

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 73 edges
2. `next` - 58 edges
3. `PixelIcon()` - 31 edges
4. `dbErrorCode()` - 26 edges
5. `vitest` - 25 edges
6. `createAdminClient()` - 16 edges
7. `compilerOptions` - 16 edges
8. `reconcileIdentities()` - 14 edges
9. `requireVerifiedUser()` - 14 edges
10. `classifyIdentities()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/dev-login/route.ts → src/lib/supabase/server.ts
- `EventsPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/events/page.tsx → src/lib/supabase/server.ts
- `SettingsPage()` --indirect_call--> `toRegistrationView()`  [INFERRED]
  src/app/settings/page.tsx → src/lib/registration.ts
- `finish()` --calls--> `dbErrorCode()`  [EXTRACTED]
  src/app/admin/achievements/[id]/actions.ts → src/lib/db-error.ts
- `saveAchievement()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/achievements/[id]/actions.ts → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (37 total, 15 thin omitted)

### Community 0 - "player/[id]/page.tsx"
Cohesion: 0.19
Nodes (16): blockPlayer(), finish(), playerId(), removeFriend(), respondFriendRequest(), sendFriendRequest(), ask(), form() (+8 more)

### Community 1 - "server.ts"
Cohesion: 0.08
Nodes (35): @supabase/ssr, authErrorResponse(), GET(), AuthErrorPage(), Action, ErrorScreen(), src_components_error_screen_module, AUTH_FAILURE_REASONS (+27 more)

### Community 2 - "registration.ts"
Cohesion: 0.10
Nodes (33): DELETE(), GET(), PATCH(), POST(), Profile, resolveMinecraftProfile(), runtime, save() (+25 more)

### Community 3 - "package.json"
Cohesion: 0.12
Nodes (16): allowScripts, unrs-resolver@1.12.2, name, private, version, @emnapi/core, @emnapi/runtime, eslint (+8 more)

### Community 4 - "createClient"
Cohesion: 0.06
Nodes (53): AdminEventPage(), bangkokInput(), DONE, ERRORS, deleteAchievement(), AdminAchievementPage(), DONE, ERRORS (+45 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "achievements/events/[id]/actions.ts"
Cohesion: 0.07
Nodes (30): EventForm(), onCover(), pickFile(), EventFormValues, LOADED_AT, noSubscribe(), shrink(), toIso() (+22 more)

### Community 7 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, @eslint/js, @playwright/test, @types/node, @types/react, @types/react-dom (+3 more)

### Community 8 - "visual-audit.spec.ts"
Cohesion: 0.16
Nodes (10): ref_node_child_process, ref_node_fs, ref_node_path, @playwright/test, shots, page(), AuditOptions, auditPage() (+2 more)

### Community 9 - "ChulaCraft Web"
Cohesion: 0.11
Nodes (18): Architecture, Chula verification (Google), ChulaCraft Web, Commands, Current implementation caveats, Deployment, Discord authentication, Environment (+10 more)

### Community 10 - "server-status.ts"
Cohesion: 0.30
Nodes (12): ref_node_dns, ref_node_net, packet(), parseStatusResponse(), pingServer(), readVarInt(), resolveTarget(), ServerStatus (+4 more)

### Community 11 - "settings/page.tsx"
Cohesion: 0.06
Nodes (48): react-dom, @supabase/supabase-js, finish(), LEVELS, otherId(), removeFriend(), respondFriendRequest(), allPublic() (+40 more)

### Community 14 - "dbErrorCode"
Cohesion: 0.10
Nodes (30): nextConfig, ref_node_url, vitest, addPlayers(), awardId(), confirmAward(), fail(), prefillInterested() (+22 more)

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.25
Nodes (7): Chulacraft registration runbook, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 18 - "app/events/[id]/page.tsx"
Cohesion: 0.06
Nodes (41): src_app_about_about_module, gallery, metadata, values, src_app_events_events_module, eventId(), signInPath(), form() (+33 more)

### Community 19 - "Plan: server status, announcements, bans/appeals, reports, audit log"
Cohesion: 0.17
Nodes (11): Constraints from `chulacraft-server-manager`, Open questions, Order and size, Other repos involved, Phase 0 — Split the whitelist worker into its own repo, Phase 1 — Live server status (#1), Phase 2 — Announcements (#3), Phase 3 — Bans & appeals (#8) (+3 more)

### Community 25 - "dashboard/page.tsx"
Cohesion: 0.09
Nodes (32): AdminLayout(), DashboardPage(), Profile, Social, SOCIAL_DONE, SOCIAL_ERRORS, SocialPerson, AboutYouForm() (+24 more)

### Community 27 - "icons.tsx"
Cohesion: 0.09
Nodes (28): react, src_app_home_module, HomePage(), loadUpcomingEvents(), steps, upcomingEvents, RegisterPage(), { getUser, redirect } (+20 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom, sharp, @supabase/ssr (+2 more)

### Community 29 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, db:types, dev, lint, start, test, test:visual (+2 more)

### Community 30 - "next"
Cohesion: 0.10
Nodes (19): next, @vercel/analytics, GET(), signOut(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok, src_app_globals, metadata (+11 more)

### Community 35 - "PRD: Auto-assign Discord `verified` role"
Cohesion: 0.14
Nodes (13): 1. Problem, 2. Goal, 3. Scope, 4. User stories, 5.1 Database (chulacraft-web, new migration), 5.2 Bot (chulacraft-discord), 5.3 Discord server setup, 5. Design (+5 more)

## Knowledge Gaps
- **212 isolated node(s):** `nextConfig`, `name`, `private`, `node`, `version` (+207 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 292 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `player/[id]/page.tsx`, `server.ts`, `registration.ts`, `package.json`, `createClient`, `achievements/events/[id]/actions.ts`, `settings/page.tsx`, `dbErrorCode`, `app/events/[id]/page.tsx`, `dashboard/page.tsx`, `icons.tsx`?**
  _High betweenness centrality (0.249) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `player/[id]/page.tsx`, `server.ts`, `registration.ts`, `achievements/events/[id]/actions.ts`, `settings/page.tsx`, `dbErrorCode`, `app/events/[id]/page.tsx`, `dashboard/page.tsx`, `icons.tsx`, `next`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Why does `vitest` connect `dbErrorCode` to `player/[id]/page.tsx`, `server.ts`, `registration.ts`, `package.json`, `createClient`, `achievements/events/[id]/actions.ts`, `server-status.ts`, `settings/page.tsx`, `app/events/[id]/page.tsx`, `dashboard/page.tsx`, `icons.tsx`, `next`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _212 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07686274509803921 - nodes in this community are weakly interconnected._
- **Should `registration.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10121457489878542 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.12418300653594772 - nodes in this community are weakly interconnected._