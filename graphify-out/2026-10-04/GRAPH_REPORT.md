# Graph Report - chulacraft-web  (2026-10-04)

## Corpus Check
- 122 files · ~2,343,039 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .css 12, (none) 2, .toml 2)

## Summary
- 487 nodes · 934 edges · 34 communities (17 shown, 17 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3445b18c`
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
- createAdminClient
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
- next.config.ts
- next_dev_types_root_params_d
- next_dev_types_routes_d
- src_app_about_you_about_you_module
- ChulaCraft — Redesign + Implementation Plan
- src_app_auth_error_auth_error_module
- src_app_not_found_module

## God Nodes (most connected - your core abstractions)
1. `next` - 37 edges
2. `createClient()` - 29 edges
3. `PixelIcon()` - 18 edges
4. `createAdminClient()` - 18 edges
5. `compilerOptions` - 16 edges
6. `vitest` - 14 edges
7. `SiteHeader()` - 13 edges
8. `classifyIdentities()` - 13 edges
9. `ChulaCraft Web` - 13 edges
10. `SiteFooter()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `5. Gap analysis: what the design needs vs. what the DB has` --references--> `unlinkPersonalGoogle()`  [INFERRED]
  docs/redesign-plan.md → src/app/dashboard/actions.ts
- `Phase 3 — Onboarding flow` --references--> `saveProfile()`  [INFERRED]
  docs/redesign-plan.md → src/app/register/details/actions.ts
- `Phase 4 — Player dashboard` --references--> `saveProfile()`  [INFERRED]
  docs/redesign-plan.md → src/app/register/details/actions.ts
- `Phase 2 — Public pages` --references--> `ErrorScreen()`  [INFERRED]
  docs/redesign-plan.md → src/components/error-screen.tsx
- `DashboardPage()` --indirect_call--> `toRegistrationView()`  [INFERRED]
  src/app/dashboard/page.tsx → src/lib/registration.ts

## Import Cycles
- None detected.

## Communities (34 total, 17 thin omitted)

### Community 0 - "next"
Cohesion: 0.07
Nodes (45): next, src_app_about_about_module, gallery, metadata, values, AdminLayout(), src_app_dashboard_dashboard_module, Profile (+37 more)

### Community 1 - "server.ts"
Cohesion: 0.12
Nodes (22): @supabase/ssr, authErrorResponse(), GET(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok, AuthErrorPage(), signOut(), AUTH_FAILURE_REASONS (+14 more)

### Community 2 - "minecraft/route.ts"
Cohesion: 0.07
Nodes (44): react-dom, vitest, DELETE(), GET(), ipAttempts, ipRateLimited(), PATCH(), POST() (+36 more)

### Community 3 - "package.json"
Cohesion: 0.05
Nodes (43): allowScripts, unrs-resolver@1.12.2, dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom (+35 more)

### Community 4 - "createClient"
Cohesion: 0.08
Nodes (30): react, src_app_admin_admin_module, AdminPlayersPage(), UserRow, restoreAccount(), ERRORS, RemovedRow, RestorePage() (+22 more)

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
Nodes (8): ref_node_fs, ref_node_path, @playwright/test, shots, AuditOptions, auditPage(), accessToken, routes

### Community 9 - "ChulaCraft Web"
Cohesion: 0.11
Nodes (18): Architecture, Chula verification (Google), ChulaCraft Web, Commands, Current implementation caveats, Deployment, Discord authentication, Environment (+10 more)

### Community 10 - "ChulaCraft Visual Redesign Audit Report"
Cohesion: 0.12
Nodes (16): 1. Design asset inventory, 2. Existing website inventory, 3. Route-to-reference mapping, 4. Design-system interpretation, 5. Functional constraints, 6. Risks, 7. Uncertainties, 8. Agent disagreements and challenges (+8 more)

### Community 11 - "createAdminClient"
Cohesion: 0.11
Nodes (26): @supabase/supabase-js, unlinkPersonalGoogle(), DashboardPage(), { getUser, getUserIdentities, rpc, redirect, reconcileIdentities }, page(), VerifyPage(), WelcomePage(), byAge() (+18 more)

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
Cohesion: 0.13
Nodes (18): Phase 1 — Foundation, Phase 2 — Public pages, Phase 3 — Onboarding flow, Phase 4 — Player dashboard, Phase 5 — Admin restyle (existing data only), Phase 6 — PR 1 checks, PR 1 — Redesign, AboutYouForm() (+10 more)

### Community 35 - "ChulaCraft — Redesign + Implementation Plan"
Cohesion: 0.11
Nodes (18): 1. Goal, 2. Design → route map, 3. Design system (Phase 1), 4. ERD — current (as of migration `20261003000001`), 5. Gap analysis: what the design needs vs. what the DB has, 6.1 Schema diff, 6.2 Verification model (new), 6.3 RPC changes (+10 more)

## Knowledge Gaps
- **196 isolated node(s):** `nextConfig`, `name`, `private`, `version`, `dev` (+191 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 251 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `server.ts`, `minecraft/route.ts`, `package.json`, `createClient`, `createAdminClient`, `about-you-form.tsx`, `next.config.ts`?**
  _High betweenness centrality (0.194) - this node is a cross-community bridge._
- **Why does `ChulaCraft — Redesign + Implementation Plan` connect `ChulaCraft — Redesign + Implementation Plan` to `about-you-form.tsx`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `unlinkPersonalGoogle()` connect `createAdminClient` to `next`, `ChulaCraft — Redesign + Implementation Plan`, `createClient`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _196 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.07135135135135136 - nodes in this community are weakly interconnected._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12100840336134454 - nodes in this community are weakly interconnected._
- **Should `minecraft/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06801346801346801 - nodes in this community are weakly interconnected._