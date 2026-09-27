# Graph Report - chulacraft-web  (2026-09-27)

## Corpus Check
- 99 files · ~2,985,391 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: .css 9, (none) 2, .toml 2)

## Summary
- 393 nodes · 729 edges · 29 communities (18 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `670fcc78`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- next
- callback/route.ts
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
- privacy/page.tsx
- ref_next_dev_types_routes_d_ts
- app/layout.tsx
- reconcile-identities.test.ts

## God Nodes (most connected - your core abstractions)
1. `next` - 34 edges
2. `createClient()` - 27 edges
3. `compilerOptions` - 16 edges
4. `classifyIdentities()` - 13 edges
5. `ChulaCraft Web` - 13 edges
6. `vitest` - 12 edges
7. `reconcileIdentities()` - 12 edges
8. `createAdminClient()` - 12 edges
9. `save()` - 11 edges
10. `identityEmail()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `AdminLayout()` --calls--> `requireVerifiedUser()`  [EXTRACTED]
  src/app/admin/layout.tsx → src/lib/verified-user.ts
- `DashboardPage()` --indirect_call--> `toRegistrationView()`  [INFERRED]
  src/app/dashboard/page.tsx → src/lib/registration.ts
- `run()` --calls--> `reconcileIdentities()`  [EXTRACTED]
  src/lib/reconcile-identities.test.ts → src/lib/reconcile-identities.ts
- `AdminPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/page.tsx → src/lib/supabase/server.ts
- `RestorePage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/restore/page.tsx → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (29 total, 11 thin omitted)

### Community 0 - "next"
Cohesion: 0.09
Nodes (28): next, react, src_app_about_about_module, communityRoles, metadata, serverQualities, values, AdminLayout() (+20 more)

### Community 1 - "callback/route.ts"
Cohesion: 0.09
Nodes (26): nextConfig, ref_node_url, @supabase/ssr, vitest, authErrorResponse(), GET(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok (+18 more)

### Community 2 - "minecraft/route.ts"
Cohesion: 0.11
Nodes (31): DELETE(), GET(), ipAttempts, ipRateLimited(), PATCH(), POST(), Profile, resolveMinecraftProfile() (+23 more)

### Community 3 - "package.json"
Cohesion: 0.05
Nodes (37): allowScripts, unrs-resolver@1.12.2, dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom (+29 more)

### Community 4 - "createClient"
Cohesion: 0.19
Nodes (16): src_app_admin_admin_module, AdminPage(), UserRow, restoreAccount(), ERRORS, RemovedRow, RestorePage(), finish() (+8 more)

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
Cohesion: 0.22
Nodes (7): ref_node_fs, ref_node_path, @playwright/test, AuditOptions, auditPage(), accessToken, routes

### Community 9 - "ChulaCraft Web"
Cohesion: 0.11
Nodes (18): Architecture, Chula verification (Google), ChulaCraft Web, Commands, Current implementation caveats, Deployment, Discord authentication, Environment (+10 more)

### Community 10 - "ChulaCraft Visual Redesign Audit Report"
Cohesion: 0.12
Nodes (16): 1. Design asset inventory, 2. Existing website inventory, 3. Route-to-reference mapping, 4. Design-system interpretation, 5. Functional constraints, 6. Risks, 7. Uncertainties, 8. Agent disagreements and challenges (+8 more)

### Community 11 - "dashboard/page.tsx"
Cohesion: 0.17
Nodes (21): @supabase/supabase-js, unlinkPersonalGoogle(), src_app_dashboard_dashboard_module, DashboardPage(), ServiceUnavailable(), { getUser, getUserIdentities, rpc, redirect, reconcileIdentities }, page(), VerifyPage() (+13 more)

### Community 12 - "next-env.d.ts"
Cohesion: 0.50
Nodes (3): NOTE: This file should not be edited, next_types_root_params_d, next_types_routes_d

### Community 14 - "Visual TODO"
Cohesion: 0.25
Nodes (7): About, Accepted final differences, Auth error and not found, Home, Register, Shared system, Visual TODO

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.25
Nodes (7): Chulacraft registration runbook, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 25 - "privacy/page.tsx"
Cohesion: 0.17
Nodes (12): react-dom, collected, metadata, PrivacyPage(), RegisterPage(), { getUser, redirect }, metadata, TermsPage() (+4 more)

### Community 27 - "app/layout.tsx"
Cohesion: 0.31
Nodes (6): @vercel/analytics, src_app_globals, metadata, inter, minecraftia, rajdhani

### Community 28 - "reconcile-identities.test.ts"
Cohesion: 0.17
Nodes (8): admin, cu, discord, gmail, m, query, run(), session

## Knowledge Gaps
- **168 isolated node(s):** `nextConfig`, `name`, `private`, `version`, `dev` (+163 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 208 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `callback/route.ts`, `minecraft/route.ts`, `package.json`, `createClient`, `dashboard/page.tsx`, `privacy/page.tsx`, `app/layout.tsx`?**
  _High betweenness centrality (0.201) - this node is a cross-community bridge._
- **Why does `vitest` connect `callback/route.ts` to `minecraft/route.ts`, `package.json`, `dashboard/page.tsx`, `privacy/page.tsx`, `reconcile-identities.test.ts`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _168 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.09178743961352658 - nodes in this community are weakly interconnected._
- **Should `callback/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09390243902439024 - nodes in this community are weakly interconnected._
- **Should `minecraft/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10793650793650794 - nodes in this community are weakly interconnected._