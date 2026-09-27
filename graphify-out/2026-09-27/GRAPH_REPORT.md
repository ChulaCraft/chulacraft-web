# Graph Report - chulacraft-web  (2026-09-24)

## Corpus Check
- 95 files · ~2,978,937 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 15 file(s) not represented in the graph (top: .css 8, (none) 2, .toml 2)

## Summary
- 373 nodes · 675 edges · 27 communities (16 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5862e8c5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- site-header.tsx
- supabase/server.ts
- minecraft/route.ts
- package.json
- next
- compilerOptions
- ChulaCraft Redesign Implementation Plan
- devDependencies
- audit-page.ts
- ChulaCraft Web
- ChulaCraft Visual Redesign Audit Report
- next.config.ts
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
- cucallback/route.ts
- auth-error.ts
- ref_next_dev_types_routes_d_ts

## God Nodes (most connected - your core abstractions)
1. `next` - 33 edges
2. `createClient()` - 32 edges
3. `compilerOptions` - 16 edges
4. `ChulaCraft Web` - 13 edges
5. `createBoundedFetch()` - 12 edges
6. `getPublicSupabaseEnvironment()` - 12 edges
7. `vitest` - 11 edges
8. `save()` - 11 edges
9. `createAdminClient()` - 10 edges
10. `ChulaCraft Visual Redesign Audit Report` - 10 edges

## Surprising Connections (you probably didn't know these)
- `DashboardPage()` --indirect_call--> `toRegistrationView()`  [INFERRED]
  src/app/dashboard/page.tsx → src/lib/registration.ts
- `AdminLayout()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/layout.tsx → src/lib/supabase/server.ts
- `AdminPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/page.tsx → src/lib/supabase/server.ts
- `RestorePage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/restore/page.tsx → src/lib/supabase/server.ts
- `AdminUserPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/users/[id]/page.tsx → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (27 total, 11 thin omitted)

### Community 0 - "site-header.tsx"
Cohesion: 0.07
Nodes (34): react, src_app_about_about_module, communityRoles, metadata, serverQualities, values, src_app_dashboard_dashboard_module, ServiceUnavailable() (+26 more)

### Community 1 - "supabase/server.ts"
Cohesion: 0.14
Nodes (19): @supabase/ssr, vitest, authErrorResponse(), GET(), { exchangeCodeForSession }, GET(), start(), BoundedFetchTimeoutError (+11 more)

### Community 2 - "minecraft/route.ts"
Cohesion: 0.15
Nodes (24): DELETE(), GET(), ipAttempts, ipRateLimited(), PATCH(), POST(), Profile, resolveMinecraftProfile() (+16 more)

### Community 3 - "package.json"
Cohesion: 0.05
Nodes (40): allowScripts, unrs-resolver@1.12.2, dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom (+32 more)

### Community 4 - "next"
Cohesion: 0.11
Nodes (24): next, src_app_admin_admin_module, AdminLayout(), AdminPage(), UserRow, restoreAccount(), ERRORS, RemovedRow (+16 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "ChulaCraft Redesign Implementation Plan"
Cohesion: 0.10
Nodes (19): 1. Objective and Scope, 2. Delivery Rules, 3. Implementation Task Graph, 4. Safe Parallelism, 5. Visual QA and Fix Loop, 6. Separate Functional Review, 7. Verification Gates, 8. Fresh Blind Final Review (+11 more)

### Community 7 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, @eslint/js, @playwright/test, @types/node, @types/react, @types/react-dom (+3 more)

### Community 8 - "audit-page.ts"
Cohesion: 0.22
Nodes (7): ref_node_fs, ref_node_path, @playwright/test, AuditOptions, auditPage(), accessToken, routes

### Community 9 - "ChulaCraft Web"
Cohesion: 0.11
Nodes (18): Architecture, Chula SSO, ChulaCraft Web, Commands, Current implementation caveats, Deployment, Discord authentication, Environment (+10 more)

### Community 10 - "ChulaCraft Visual Redesign Audit Report"
Cohesion: 0.12
Nodes (16): 1. Design asset inventory, 2. Existing website inventory, 3. Route-to-reference mapping, 4. Design-system interpretation, 5. Functional constraints, 6. Risks, 7. Uncertainties, 8. Agent disagreements and challenges (+8 more)

### Community 12 - "next-env.d.ts"
Cohesion: 0.50
Nodes (3): NOTE: This file should not be edited, next_types_root_params_d, next_types_routes_d

### Community 14 - "Visual TODO"
Cohesion: 0.25
Nodes (7): About, Accepted final differences, Auth error and not found, Home, Register, Shared system, Visual TODO

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.29
Nodes (6): Chulacraft registration runbook, Normal operations, Roles and Chula SSO, Safe launch order, Secret incident response, Troubleshooting and recovery

### Community 24 - "cucallback/route.ts"
Cohesion: 0.14
Nodes (23): ref_node_crypto, authErrorResponse(), GET(), handle(), redirectTo(), signInLinkedUser(), stageLink(), location() (+15 more)

### Community 25 - "auth-error.ts"
Cohesion: 0.36
Nodes (7): src_app_auth_error_auth_error_module, AuthErrorPage(), AUTH_FAILURE_REASONS, authFailureMessage(), AuthFailureReason, classifyOAuthCallbackFailure(), safeAuthFailureReason()

## Knowledge Gaps
- **156 isolated node(s):** `nextConfig`, `name`, `private`, `version`, `dev` (+151 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 191 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `site-header.tsx`, `supabase/server.ts`, `minecraft/route.ts`, `package.json`, `next.config.ts`, `cucallback/route.ts`, `auth-error.ts`?**
  _High betweenness centrality (0.222) - this node is a cross-community bridge._
- **Why does `createClient()` connect `next` to `site-header.tsx`, `supabase/server.ts`, `minecraft/route.ts`, `package.json`, `cucallback/route.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `vitest` connect `supabase/server.ts` to `minecraft/route.ts`, `package.json`, `next.config.ts`, `cucallback/route.ts`, `auth-error.ts`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _156 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `site-header.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06957047791893527 - nodes in this community are weakly interconnected._
- **Should `supabase/server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14112903225806453 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.048726467331118496 - nodes in this community are weakly interconnected._