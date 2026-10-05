# Graph Report - chulacraft-web  (2026-10-05)

## Corpus Check
- 162 files · ~141,261 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 26 file(s) not represented in the graph (top: .css 20, (none) 2, .toml 2)

## Summary
- 671 nodes · 1547 edges · 33 communities (19 shown, 14 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e186a9c1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- vitest
- registration.ts
- package.json
- createClient
- compilerOptions
- dbErrorCode
- devDependencies
- visual-audit.spec.ts
- ChulaCraft Web
- settings/page.tsx
- next_dev_types_root_params_d
- supabase-stub.mjs
- award/actions.ts
- Chulacraft registration runbook
- CLAUDE.md
- supabase/README.md
- app/events/[id]/page.tsx
- engines
- ref_node_crypto
- next
- ref_next_dev_types_routes_d_ts
- icons.tsx
- dependencies
- scripts
- app/layout.tsx
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
2. `next` - 57 edges
3. `PixelIcon()` - 31 edges
4. `dbErrorCode()` - 26 edges
5. `vitest` - 24 edges
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
- `PlayersPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/players/page.tsx → src/lib/supabase/server.ts
- `SettingsPage()` --indirect_call--> `toRegistrationView()`  [INFERRED]
  src/app/settings/page.tsx → src/lib/registration.ts
- `saveAchievement()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/achievements/[id]/actions.ts → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (33 total, 14 thin omitted)

### Community 1 - "vitest"
Cohesion: 0.07
Nodes (35): nextConfig, ref_node_url, @supabase/ssr, vitest, restoreAccount(), m, redirected(), signOut() (+27 more)

### Community 2 - "registration.ts"
Cohesion: 0.07
Nodes (47): DELETE(), GET(), PATCH(), POST(), Profile, resolveMinecraftProfile(), runtime, save() (+39 more)

### Community 3 - "package.json"
Cohesion: 0.12
Nodes (16): allowScripts, unrs-resolver@1.12.2, name, private, version, @emnapi/core, @emnapi/runtime, eslint (+8 more)

### Community 4 - "createClient"
Cohesion: 0.05
Nodes (60): react, AdminEventPage(), bangkokInput(), DONE, ERRORS, AdminAchievementPage(), DONE, ERRORS (+52 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "dbErrorCode"
Cohesion: 0.07
Nodes (32): EventForm(), onCover(), pickFile(), EventFormValues, LOADED_AT, noSubscribe(), shrink(), toIso() (+24 more)

### Community 7 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, @eslint/js, @playwright/test, @types/node, @types/react, @types/react-dom (+3 more)

### Community 8 - "visual-audit.spec.ts"
Cohesion: 0.18
Nodes (9): ref_node_child_process, ref_node_fs, ref_node_path, @playwright/test, shots, AuditOptions, auditPage(), accessToken (+1 more)

### Community 9 - "ChulaCraft Web"
Cohesion: 0.11
Nodes (18): Architecture, Chula verification (Google), ChulaCraft Web, Commands, Current implementation caveats, Deployment, Discord authentication, Environment (+10 more)

### Community 11 - "settings/page.tsx"
Cohesion: 0.07
Nodes (41): @supabase/supabase-js, finish(), LEVELS, otherId(), removeFriend(), respondFriendRequest(), allPublic(), form() (+33 more)

### Community 14 - "award/actions.ts"
Cohesion: 0.16
Nodes (22): addPlayers(), awardId(), confirmAward(), fail(), prefillInterested(), previewAward(), m, unique() (+14 more)

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.25
Nodes (7): Chulacraft registration runbook, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 18 - "app/events/[id]/page.tsx"
Cohesion: 0.08
Nodes (29): src_app_events_events_module, eventId(), signInPath(), form(), interested(), m, redirected(), toggleInterest() (+21 more)

### Community 25 - "next"
Cohesion: 0.06
Nodes (50): next, AdminLayout(), DashboardPage(), Profile, Social, SOCIAL_DONE, SOCIAL_ERRORS, SocialPerson (+42 more)

### Community 27 - "icons.tsx"
Cohesion: 0.06
Nodes (40): react-dom, src_app_about_about_module, gallery, metadata, values, src_app_home_module, HomePage(), loadUpcomingEvents() (+32 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom, sharp, @supabase/ssr (+2 more)

### Community 29 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, db:types, dev, lint, start, test, test:visual (+2 more)

### Community 30 - "app/layout.tsx"
Cohesion: 0.19
Nodes (10): @vercel/analytics, GET(), src_app_globals, metadata, SiteFooter(), DEV_LOGIN_ENABLED, DEV_USERS, bodyFont (+2 more)

### Community 35 - "PRD: Auto-assign Discord `verified` role"
Cohesion: 0.14
Nodes (13): 1. Problem, 2. Goal, 3. Scope, 4. User stories, 5.1 Database (chulacraft-web, new migration), 5.2 Bot (chulacraft-discord), 5.3 Discord server setup, 5. Design (+5 more)

## Knowledge Gaps
- **200 isolated node(s):** `nextConfig`, `name`, `private`, `node`, `version` (+195 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 278 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `vitest`, `registration.ts`, `package.json`, `createClient`, `dbErrorCode`, `settings/page.tsx`, `award/actions.ts`, `app/events/[id]/page.tsx`, `icons.tsx`, `app/layout.tsx`?**
  _High betweenness centrality (0.257) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `vitest`, `registration.ts`, `dbErrorCode`, `settings/page.tsx`, `award/actions.ts`, `app/events/[id]/page.tsx`, `next`, `icons.tsx`, `app/layout.tsx`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `registration.ts`, `package.json`, `createClient`, `dbErrorCode`, `settings/page.tsx`, `award/actions.ts`, `app/events/[id]/page.tsx`, `next`, `icons.tsx`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _200 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `vitest` be split into smaller, more focused modules?**
  _Cohesion score 0.06568832983927324 - nodes in this community are weakly interconnected._
- **Should `registration.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0677555958862674 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.12418300653594772 - nodes in this community are weakly interconnected._