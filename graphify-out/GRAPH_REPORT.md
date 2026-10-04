# Graph Report - chulacraft-web  (2026-10-04)

## Corpus Check
- 126 files · ~2,342,607 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .css 12, (none) 2, .toml 2)

## Summary
- 501 nodes · 976 edges · 40 communities (22 shown, 18 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `da3e793a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- icons.tsx
- server.ts
- minecraft/route.ts
- package.json
- createClient
- compilerOptions
- ChulaCraft Redesign Implementation Plan
- devDependencies
- visual-audit.spec.ts
- ChulaCraft Web
- ChulaCraft Visual Redesign Audit Report
- next
- next-env.d.ts
- supabase-stub.mjs
- Visual TODO
- Chulacraft registration runbook
- CLAUDE.md
- supabase/README.md
- cycle-01/report.md
- cycle-02/report.md
- cycle-03/report.md
- cycle-04/report.md
- cycle-05/report.md
- cycle-06/report.md
- ref_node_crypto
- about-you-form.tsx
- ref_next_dev_types_routes_d_ts
- 3. Findings in detail
- dependencies
- scripts
- app/layout.tsx
- allowScripts
- overrides
- next_types_root_params_d
- src_app_about_you_about_you_module
- PRD: Auto-assign Discord `verified` role
- next_types_routes_d
- dev-login/route.ts
- src_app_auth_error_auth_error_module
- src_app_not_found_module

## God Nodes (most connected - your core abstractions)
1. `next` - 38 edges
2. `createClient()` - 32 edges
3. `PixelIcon()` - 20 edges
4. `createAdminClient()` - 18 edges
5. `compilerOptions` - 16 edges
6. `vitest` - 14 edges
7. `SiteHeader()` - 13 edges
8. `classifyIdentities()` - 13 edges
9. `ChulaCraft Web` - 13 edges
10. `SiteFooter()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/dev-login/route.ts → src/lib/supabase/server.ts
- `DashboardPage()` --indirect_call--> `toRegistrationView()`  [INFERRED]
  src/app/dashboard/page.tsx → src/lib/registration.ts
- `run()` --calls--> `reconcileIdentities()`  [EXTRACTED]
  src/lib/reconcile-identities.test.ts → src/lib/reconcile-identities.ts
- `AdminLayout()` --calls--> `requireVerifiedUser()`  [EXTRACTED]
  src/app/admin/layout.tsx → src/lib/verified-user.ts
- `AdminPlayersPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/players/page.tsx → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (40 total, 18 thin omitted)

### Community 0 - "icons.tsx"
Cohesion: 0.06
Nodes (34): react-dom, src_app_about_about_module, gallery, metadata, values, src_app_home_module, features, steps (+26 more)

### Community 1 - "server.ts"
Cohesion: 0.11
Nodes (22): @supabase/ssr, authErrorResponse(), GET(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok, AuthErrorPage(), ErrorScreen(), signOut() (+14 more)

### Community 2 - "minecraft/route.ts"
Cohesion: 0.09
Nodes (34): DELETE(), GET(), ipAttempts, ipRateLimited(), PATCH(), POST(), Profile, resolveMinecraftProfile() (+26 more)

### Community 3 - "package.json"
Cohesion: 0.14
Nodes (14): name, private, version, @emnapi/core, @emnapi/runtime, eslint, eslint-config-next, @eslint/js (+6 more)

### Community 4 - "createClient"
Cohesion: 0.09
Nodes (36): react, src_app_admin_admin_module, StatRow(), Stats, timeSince(), Tool, ToolCards(), when() (+28 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "ChulaCraft Redesign Implementation Plan"
Cohesion: 0.10
Nodes (19): 1. Objective and Scope, 2. Delivery Rules, 3. Implementation Task Graph, 4. Safe Parallelism, 5. Visual QA and Fix Loop, 6. Separate Functional Review, 7. Verification Gates, 8. Fresh Blind Final Review (+11 more)

### Community 7 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, @eslint/js, @playwright/test, @types/node, @types/react, @types/react-dom (+3 more)

### Community 8 - "visual-audit.spec.ts"
Cohesion: 0.18
Nodes (9): ref_node_child_process, ref_node_fs, ref_node_path, @playwright/test, shots, AuditOptions, auditPage(), accessToken (+1 more)

### Community 9 - "ChulaCraft Web"
Cohesion: 0.11
Nodes (18): Architecture, Chula verification (Google), ChulaCraft Web, Commands, Current implementation caveats, Deployment, Discord authentication, Environment (+10 more)

### Community 10 - "ChulaCraft Visual Redesign Audit Report"
Cohesion: 0.12
Nodes (16): 1. Design asset inventory, 2. Existing website inventory, 3. Route-to-reference mapping, 4. Design-system interpretation, 5. Functional constraints, 6. Risks, 7. Uncertainties, 8. Agent disagreements and challenges (+8 more)

### Community 11 - "next"
Cohesion: 0.10
Nodes (40): next, @supabase/supabase-js, AdminLayout(), unlinkPersonalGoogle(), src_app_dashboard_dashboard_module, DashboardPage(), Profile, ServiceUnavailable() (+32 more)

### Community 12 - "next-env.d.ts"
Cohesion: 0.50
Nodes (3): next_dev_types_root_params_d, next_dev_types_routes_d, NOTE: This file should not be edited

### Community 14 - "Visual TODO"
Cohesion: 0.25
Nodes (7): About, Accepted final differences, Auth error and not found, Home, Register, Shared system, Visual TODO

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.25
Nodes (7): Chulacraft registration runbook, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 25 - "about-you-form.tsx"
Cohesion: 0.09
Nodes (21): nextConfig, ref_node_url, vitest, AboutYouForm(), onSubmit(), src_app_register_details_about_you_module, saveProfile(), SaveProfileState (+13 more)

### Community 27 - "3. Findings in detail"
Cohesion: 0.13
Nodes (14): 1. Executive summary, 2. Target profile (recon), 3. Findings in detail, 4. Attacks attempted and blocked, 5. What I did, step by step, 6. Results summary, F-01 — Anonymous SELECT grant on `minecraft_registrations` (Low), F-02 — Schema and column metadata disclosure (Low) (+6 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom, sharp, @supabase/ssr (+2 more)

### Community 29 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, lint, start, test, test:visual, test:visual:list (+1 more)

### Community 30 - "app/layout.tsx"
Cohesion: 0.31
Nodes (6): @vercel/analytics, src_app_globals, metadata, bodyFont, displayFont, monoFont

### Community 35 - "PRD: Auto-assign Discord `verified` role"
Cohesion: 0.14
Nodes (13): 1. Problem, 2. Goal, 3. Scope, 4. User stories, 5.1 Database (chulacraft-web, new migration), 5.2 Bot (chulacraft-discord), 5.3 Discord server setup, 5. Design (+5 more)

### Community 37 - "dev-login/route.ts"
Cohesion: 0.60
Nodes (3): GET(), DEV_LOGIN_ENABLED, DEV_USERS

## Knowledge Gaps
- **204 isolated node(s):** `nextConfig`, `name`, `private`, `version`, `dev` (+199 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 259 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `icons.tsx`, `server.ts`, `minecraft/route.ts`, `package.json`, `createClient`, `dev-login/route.ts`, `about-you-form.tsx`, `app/layout.tsx`?**
  _High betweenness centrality (0.176) - this node is a cross-community bridge._
- **Why does `vitest` connect `about-you-form.tsx` to `icons.tsx`, `server.ts`, `minecraft/route.ts`, `package.json`, `createClient`, `next`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `icons.tsx`, `server.ts`, `minecraft/route.ts`, `dev-login/route.ts`, `next`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _204 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `icons.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06485671191553545 - nodes in this community are weakly interconnected._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11428571428571428 - nodes in this community are weakly interconnected._
- **Should `minecraft/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09268292682926829 - nodes in this community are weakly interconnected._