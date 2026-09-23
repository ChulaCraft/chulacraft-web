# Graph Report - chulacraft-web  (2026-09-24)

## Corpus Check
- 88 files · ~2,977,253 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 14 file(s) not represented in the graph (top: .css 8, (none) 2, .example 1)

## Summary
- 354 nodes · 608 edges · 24 communities (14 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `527dedb7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app/page.tsx
- cucallback/route.ts
- minecraft/route.ts
- package.json
- next
- compilerOptions
- ChulaCraft Redesign Implementation Plan
- devDependencies
- audit-page.ts
- ChulaCraft Web
- ChulaCraft Visual Redesign Audit Report
- app/layout.tsx
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

## God Nodes (most connected - your core abstractions)
1. `next` - 31 edges
2. `createClient()` - 30 edges
3. `compilerOptions` - 16 edges
4. `ChulaCraft Web` - 13 edges
5. `createBoundedFetch()` - 12 edges
6. `getPublicSupabaseEnvironment()` - 12 edges
7. `createClient()` - 11 edges
8. `save()` - 10 edges
9. `ChulaCraft Visual Redesign Audit Report` - 10 edges
10. `ChulaCraft Redesign Implementation Plan` - 10 edges

## Surprising Connections (you probably didn't know these)
- `AdminLayout()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/layout.tsx → src/lib/supabase/server.ts
- `AdminPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/page.tsx → src/lib/supabase/server.ts
- `RestorePage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/restore/page.tsx → src/lib/supabase/server.ts
- `AdminUserPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/users/[id]/page.tsx → src/lib/supabase/server.ts
- `GET()` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/registration/minecraft/route.ts → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (24 total, 10 thin omitted)

### Community 0 - "app/page.tsx"
Cohesion: 0.09
Nodes (25): react, src_app_about_about_module, communityRoles, metadata, serverQualities, values, src_app_home_module, features (+17 more)

### Community 1 - "cucallback/route.ts"
Cohesion: 0.08
Nodes (40): nextConfig, ref_node_url, @supabase/ssr, vitest, authErrorResponse(), GET(), { exchangeCodeForSession }, authErrorResponse() (+32 more)

### Community 2 - "minecraft/route.ts"
Cohesion: 0.12
Nodes (27): DELETE(), GET(), ipAttempts, ipRateLimited(), PATCH(), POST(), Profile, resolveMinecraftProfile() (+19 more)

### Community 3 - "package.json"
Cohesion: 0.05
Nodes (38): allowScripts, unrs-resolver@1.12.2, dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom (+30 more)

### Community 4 - "next"
Cohesion: 0.12
Nodes (24): next, @supabase/supabase-js, src_app_admin_admin_module, AdminLayout(), AdminPage(), UserRow, restoreAccount(), ERRORS (+16 more)

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

### Community 11 - "app/layout.tsx"
Cohesion: 0.36
Nodes (5): src_app_globals, metadata, inter, minecraftia, rajdhani

### Community 14 - "Visual TODO"
Cohesion: 0.25
Nodes (7): About, Accepted final differences, Auth error and not found, Home, Register, Shared system, Visual TODO

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.29
Nodes (6): Chulacraft registration runbook, Normal operations, Roles and Chula SSO, Safe launch order, Secret incident response, Troubleshooting and recovery

## Knowledge Gaps
- **153 isolated node(s):** `nextConfig`, `name`, `private`, `version`, `dev` (+148 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 189 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `app/page.tsx`, `cucallback/route.ts`, `minecraft/route.ts`, `package.json`, `app/layout.tsx`?**
  _High betweenness centrality (0.220) - this node is a cross-community bridge._
- **Why does `createClient()` connect `next` to `cucallback/route.ts`, `minecraft/route.ts`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _153 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08502024291497975 - nodes in this community are weakly interconnected._
- **Should `cucallback/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07627118644067797 - nodes in this community are weakly interconnected._
- **Should `minecraft/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11827956989247312 - nodes in this community are weakly interconnected._