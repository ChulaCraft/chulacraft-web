# Graph Report - chulacraft-web  (2026-09-27)

## Corpus Check
- 95 files · ~2,984,024 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 15 file(s) not represented in the graph (top: .css 8, (none) 2, .toml 2)

## Summary
- 381 nodes · 697 edges · 28 communities (17 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `585198f8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- site-header.tsx
- callback/route.ts
- minecraft/route.ts
- package.json
- next
- compilerOptions
- ChulaCraft Redesign Implementation Plan
- devDependencies
- verify/page.test.tsx
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
- error/page.tsx
- ref_next_dev_types_routes_d_ts
- app/layout.tsx

## God Nodes (most connected - your core abstractions)
1. `next` - 31 edges
2. `createClient()` - 27 edges
3. `compilerOptions` - 16 edges
4. `classifyIdentities()` - 13 edges
5. `ChulaCraft Web` - 13 edges
6. `reconcileIdentities()` - 12 edges
7. `createAdminClient()` - 12 edges
8. `vitest` - 11 edges
9. `save()` - 11 edges
10. `identityEmail()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `AdminLayout()` --calls--> `requireVerifiedUser()`  [EXTRACTED]
  src/app/admin/layout.tsx → src/lib/verified-user.ts
- `RestorePage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/restore/page.tsx → src/lib/supabase/server.ts
- `DashboardPage()` --indirect_call--> `toRegistrationView()`  [INFERRED]
  src/app/dashboard/page.tsx → src/lib/registration.ts
- `AdminPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/page.tsx → src/lib/supabase/server.ts
- `AdminUserPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/users/[id]/page.tsx → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (28 total, 11 thin omitted)

### Community 0 - "site-header.tsx"
Cohesion: 0.09
Nodes (30): react, src_app_about_about_module, communityRoles, metadata, serverQualities, values, AdminLayout(), src_app_home_module (+22 more)

### Community 1 - "callback/route.ts"
Cohesion: 0.13
Nodes (18): nextConfig, ref_node_url, vitest, authErrorResponse(), GET(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok, classifyOAuthCallbackFailure() (+10 more)

### Community 2 - "minecraft/route.ts"
Cohesion: 0.10
Nodes (33): ERRORS, RemovedRow, RestorePage(), DELETE(), GET(), ipAttempts, ipRateLimited(), PATCH() (+25 more)

### Community 3 - "package.json"
Cohesion: 0.05
Nodes (38): allowScripts, unrs-resolver@1.12.2, dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom (+30 more)

### Community 4 - "next"
Cohesion: 0.25
Nodes (13): next, src_app_admin_admin_module, AdminPage(), UserRow, restoreAccount(), finish(), resetChula(), setRole() (+5 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "ChulaCraft Redesign Implementation Plan"
Cohesion: 0.10
Nodes (19): 1. Objective and Scope, 2. Delivery Rules, 3. Implementation Task Graph, 4. Safe Parallelism, 5. Visual QA and Fix Loop, 6. Separate Functional Review, 7. Verification Gates, 8. Fresh Blind Final Review (+11 more)

### Community 7 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, @eslint/js, @playwright/test, @types/node, @types/react, @types/react-dom (+3 more)

### Community 8 - "verify/page.test.tsx"
Cohesion: 0.12
Nodes (13): ref_node_fs, ref_node_path, @playwright/test, react-dom, RegisterPage(), { getUser, redirect }, { getUser, getUserIdentities, rpc, redirect, reconcileIdentities }, page() (+5 more)

### Community 9 - "ChulaCraft Web"
Cohesion: 0.11
Nodes (18): Architecture, Chula verification (Google), ChulaCraft Web, Commands, Current implementation caveats, Deployment, Discord authentication, Environment (+10 more)

### Community 10 - "ChulaCraft Visual Redesign Audit Report"
Cohesion: 0.12
Nodes (16): 1. Design asset inventory, 2. Existing website inventory, 3. Route-to-reference mapping, 4. Design-system interpretation, 5. Functional constraints, 6. Risks, 7. Uncertainties, 8. Agent disagreements and challenges (+8 more)

### Community 11 - "dashboard/page.tsx"
Cohesion: 0.12
Nodes (25): @supabase/supabase-js, unlinkPersonalGoogle(), src_app_dashboard_dashboard_module, DashboardPage(), ServiceUnavailable(), WelcomePage(), byAge(), classifyIdentities() (+17 more)

### Community 12 - "next-env.d.ts"
Cohesion: 0.50
Nodes (3): NOTE: This file should not be edited, next_types_root_params_d, next_types_routes_d

### Community 14 - "Visual TODO"
Cohesion: 0.25
Nodes (7): About, Accepted final differences, Auth error and not found, Home, Register, Shared system, Visual TODO

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.25
Nodes (7): Chulacraft registration runbook, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 25 - "error/page.tsx"
Cohesion: 0.23
Nodes (8): src_app_auth_error_auth_error_module, AuthErrorPage(), src_app_not_found_module, Brand(), AUTH_FAILURE_REASONS, authFailureMessage(), AuthFailureReason, safeAuthFailureReason()

### Community 27 - "app/layout.tsx"
Cohesion: 0.31
Nodes (6): @vercel/analytics, src_app_globals, metadata, inter, minecraftia, rajdhani

## Knowledge Gaps
- **164 isolated node(s):** `nextConfig`, `name`, `private`, `version`, `dev` (+159 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 204 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `site-header.tsx`, `callback/route.ts`, `minecraft/route.ts`, `package.json`, `dashboard/page.tsx`, `error/page.tsx`, `app/layout.tsx`?**
  _High betweenness centrality (0.186) - this node is a cross-community bridge._
- **Why does `vitest` connect `callback/route.ts` to `minecraft/route.ts`, `package.json`, `verify/page.test.tsx`, `dashboard/page.tsx`, `error/page.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _164 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `site-header.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0851063829787234 - nodes in this community are weakly interconnected._
- **Should `callback/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12807881773399016 - nodes in this community are weakly interconnected._
- **Should `minecraft/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09851551956815115 - nodes in this community are weakly interconnected._