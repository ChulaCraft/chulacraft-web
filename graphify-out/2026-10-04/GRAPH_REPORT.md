# Graph Report - chulacraft-web  (2026-10-04)

## Corpus Check
- 124 files · ~2,343,854 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .css 12, (none) 2, .toml 2)

## Summary
- 498 nodes · 978 edges · 39 communities (21 shown, 18 thin omitted)
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
- next_types_root_params_d
- src_app_about_you_about_you_module
- ChulaCraft — Redesign + Implementation Plan
- next_types_routes_d
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
- `5. Gap analysis: what the design needs vs. what the DB has` --references--> `unlinkPersonalGoogle()`  [INFERRED]
  docs/redesign-plan.md → src/app/dashboard/actions.ts
- `Phase 3 — Onboarding flow` --references--> `saveProfile()`  [INFERRED]
  docs/redesign-plan.md → src/app/register/details/actions.ts
- `Phase 4 — Player dashboard` --references--> `saveProfile()`  [INFERRED]
  docs/redesign-plan.md → src/app/register/details/actions.ts
- `Phase 2 — Public pages` --references--> `ErrorScreen()`  [INFERRED]
  docs/redesign-plan.md → src/components/error-screen.tsx
- `GET()` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/dev-login/route.ts → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (39 total, 18 thin omitted)

### Community 0 - "next"
Cohesion: 0.06
Nodes (51): next, react, src_app_about_about_module, gallery, metadata, values, AdminLayout(), GET() (+43 more)

### Community 1 - "server.ts"
Cohesion: 0.12
Nodes (24): nextConfig, ref_node_url, @supabase/ssr, vitest, authErrorResponse(), GET(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok (+16 more)

### Community 2 - "minecraft/route.ts"
Cohesion: 0.09
Nodes (33): DELETE(), GET(), ipAttempts, ipRateLimited(), PATCH(), POST(), Profile, resolveMinecraftProfile() (+25 more)

### Community 3 - "package.json"
Cohesion: 0.14
Nodes (14): name, private, version, @emnapi/core, @emnapi/runtime, eslint, eslint-config-next, @eslint/js (+6 more)

### Community 4 - "createClient"
Cohesion: 0.09
Nodes (36): src_app_admin_admin_module, StatRow(), Stats, timeSince(), Tool, ToolCards(), when(), Activity (+28 more)

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
Cohesion: 0.11
Nodes (24): @supabase/supabase-js, unlinkPersonalGoogle(), src_app_dashboard_dashboard_module, DashboardPage(), Profile, WelcomePage(), byAge(), classifyIdentities() (+16 more)

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
Cohesion: 0.13
Nodes (18): Phase 1 — Foundation, Phase 2 — Public pages, Phase 3 — Onboarding flow, Phase 4 — Player dashboard, Phase 5 — Admin restyle (existing data only), Phase 6 — PR 1 checks, PR 1 — Redesign, AboutYouForm() (+10 more)

### Community 27 - "privacy/page.tsx"
Cohesion: 0.20
Nodes (11): react-dom, collected, metadata, PrivacyPage(), metadata, TermsPage(), LEGAL_EFFECTIVE_DATE, LegalPage() (+3 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom, sharp, @supabase/ssr (+2 more)

### Community 29 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, lint, start, test, test:visual, test:visual:list (+1 more)

### Community 30 - "app/layout.tsx"
Cohesion: 0.31
Nodes (6): @vercel/analytics, src_app_globals, metadata, bodyFont, displayFont, monoFont

### Community 35 - "ChulaCraft — Redesign + Implementation Plan"
Cohesion: 0.11
Nodes (18): 1. Goal, 2. Design → route map, 3. Design system (Phase 1), 4. ERD — current (as of migration `20261003000001`), 5. Gap analysis: what the design needs vs. what the DB has, 6.1 Schema diff, 6.2 Verification model (new), 6.3 RPC changes (+10 more)

## Knowledge Gaps
- **198 isolated node(s):** `nextConfig`, `name`, `private`, `version`, `dev` (+193 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 252 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `server.ts`, `minecraft/route.ts`, `package.json`, `createClient`, `dashboard/page.tsx`, `about-you-form.tsx`, `privacy/page.tsx`, `app/layout.tsx`?**
  _High betweenness centrality (0.197) - this node is a cross-community bridge._
- **Why does `unlinkPersonalGoogle()` connect `dashboard/page.tsx` to `server.ts`, `ChulaCraft — Redesign + Implementation Plan`, `createClient`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `ChulaCraft — Redesign + Implementation Plan` connect `ChulaCraft — Redesign + Implementation Plan` to `about-you-form.tsx`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _198 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.05871725383920506 - nodes in this community are weakly interconnected._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11561561561561562 - nodes in this community are weakly interconnected._
- **Should `minecraft/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09358974358974359 - nodes in this community are weakly interconnected._