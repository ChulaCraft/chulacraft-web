# Graph Report - chulacraft-web  (2026-10-04)

## Corpus Check
- 130 files · ~2,347,248 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .css 12, (none) 2, .toml 2)

## Summary
- 497 nodes · 983 edges · 41 communities (22 shown, 19 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `933c4d9e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- next
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
- dashboard/page.tsx
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
- privacy/page.tsx
- dependencies
- scripts
- app/layout.tsx
- allowScripts
- overrides
- src_app_about_you_about_you_module
- PRD: Auto-assign Discord `verified` role
- next_dev_types_root_params_d
- dev-login/route.ts
- src_app_auth_error_auth_error_module
- src_app_not_found_module
- next_dev_types_routes_d

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
- `AdminLayout()` --calls--> `requireVerifiedUser()`  [EXTRACTED]
  src/app/admin/layout.tsx → src/lib/verified-user.ts
- `AdminPlayersPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/players/page.tsx → src/lib/supabase/server.ts
- `RestorePage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/restore/page.tsx → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (41 total, 19 thin omitted)

### Community 0 - "next"
Cohesion: 0.07
Nodes (44): next, react, src_app_about_about_module, gallery, metadata, values, AdminLayout(), ServiceUnavailable() (+36 more)

### Community 1 - "server.ts"
Cohesion: 0.11
Nodes (22): @supabase/ssr, authErrorResponse(), GET(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok, AuthErrorPage(), ErrorScreen(), AUTH_FAILURE_REASONS (+14 more)

### Community 2 - "minecraft/route.ts"
Cohesion: 0.09
Nodes (34): nextConfig, ref_node_url, vitest, DELETE(), GET(), ipAttempts, ipRateLimited(), PATCH() (+26 more)

### Community 3 - "package.json"
Cohesion: 0.14
Nodes (14): name, private, version, @emnapi/core, @emnapi/runtime, eslint, eslint-config-next, @eslint/js (+6 more)

### Community 4 - "createClient"
Cohesion: 0.08
Nodes (37): src_app_admin_admin_module, StatRow(), Stats, timeSince(), Tool, ToolCards(), when(), Activity (+29 more)

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

### Community 11 - "dashboard/page.tsx"
Cohesion: 0.10
Nodes (28): @supabase/supabase-js, unlinkPersonalGoogle(), src_app_dashboard_dashboard_module, DashboardPage(), Profile, { getUser, getUserIdentities, rpc, redirect, reconcileIdentities }, page(), VerifyPage() (+20 more)

### Community 12 - "next-env.d.ts"
Cohesion: 0.50
Nodes (3): NOTE: This file should not be edited, next_types_root_params_d, next_types_routes_d

### Community 14 - "Visual TODO"
Cohesion: 0.25
Nodes (7): About, Accepted final differences, Auth error and not found, Home, Register, Shared system, Visual TODO

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.25
Nodes (7): Chulacraft registration runbook, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 25 - "about-you-form.tsx"
Cohesion: 0.18
Nodes (17): AboutYouForm(), onSubmit(), src_app_register_details_about_you_module, saveProfile(), SaveProfileState, FACULTIES, facultyRole(), ProfileDetails (+9 more)

### Community 27 - "privacy/page.tsx"
Cohesion: 0.16
Nodes (12): react-dom, collected, metadata, PrivacyPage(), RegisterPage(), { getUser, redirect }, metadata, TermsPage() (+4 more)

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
- **195 isolated node(s):** `nextConfig`, `name`, `private`, `version`, `dev` (+190 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 252 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `server.ts`, `minecraft/route.ts`, `package.json`, `createClient`, `dev-login/route.ts`, `dashboard/page.tsx`, `about-you-form.tsx`, `privacy/page.tsx`, `app/layout.tsx`?**
  _High betweenness centrality (0.185) - this node is a cross-community bridge._
- **Why does `vitest` connect `minecraft/route.ts` to `server.ts`, `package.json`, `createClient`, `dashboard/page.tsx`, `about-you-form.tsx`, `privacy/page.tsx`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `@playwright/test` connect `visual-audit.spec.ts` to `package.json`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _195 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.07293594964827842 - nodes in this community are weakly interconnected._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1126984126984127 - nodes in this community are weakly interconnected._
- **Should `minecraft/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08826945412311266 - nodes in this community are weakly interconnected._