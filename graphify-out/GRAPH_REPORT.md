# Graph Report - chulacraft-web  (2026-10-04)

## Corpus Check
- 132 files · ~2,347,142 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .css 12, (none) 2, .toml 2)

## Summary
- 501 nodes · 947 edges · 42 communities (22 shown, 20 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9f059918`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- icons.tsx
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
- about/page.tsx
- dependencies
- scripts
- site-header.tsx
- allowScripts
- overrides
- src_app_about_you_about_you_module
- PRD: Auto-assign Discord `verified` role
- next_types_root_params_d
- next_types_routes_d
- src_app_auth_error_auth_error_module
- src_app_not_found_module
- reconcile-identities.test.ts

## God Nodes (most connected - your core abstractions)
1. `next` - 39 edges
2. `createClient()` - 34 edges
3. `PixelIcon()` - 20 edges
4. `createAdminClient()` - 18 edges
5. `compilerOptions` - 16 edges
6. `vitest` - 14 edges
7. `classifyIdentities()` - 13 edges
8. `ChulaCraft Web` - 13 edges
9. `reconcileIdentities()` - 12 edges
10. `requireVerifiedUser()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/dev-login/route.ts → src/lib/supabase/server.ts
- `DashboardPage()` --indirect_call--> `toRegistrationView()`  [INFERRED]
  src/app/dashboard/page.tsx → src/lib/registration.ts
- `AboutYouForm()` --indirect_call--> `saveProfile()`  [INFERRED]
  src/app/register/details/about-you-form.tsx → src/app/register/details/actions.ts
- `run()` --calls--> `reconcileIdentities()`  [EXTRACTED]
  src/lib/reconcile-identities.test.ts → src/lib/reconcile-identities.ts
- `AdminLayout()` --calls--> `requireVerifiedUser()`  [EXTRACTED]
  src/app/admin/layout.tsx → src/lib/verified-user.ts

## Import Cycles
- None detected.

## Communities (42 total, 20 thin omitted)

### Community 0 - "icons.tsx"
Cohesion: 0.10
Nodes (23): react-dom, src_app_home_module, features, steps, RegisterPage(), { getUser, redirect }, src_app_register_register_module, CopyButton() (+15 more)

### Community 1 - "callback/route.ts"
Cohesion: 0.09
Nodes (26): nextConfig, ref_node_url, @supabase/ssr, vitest, authErrorResponse(), GET(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok (+18 more)

### Community 2 - "minecraft/route.ts"
Cohesion: 0.10
Nodes (32): DELETE(), GET(), ipAttempts, ipRateLimited(), PATCH(), POST(), Profile, resolveMinecraftProfile() (+24 more)

### Community 3 - "package.json"
Cohesion: 0.14
Nodes (14): name, private, version, @emnapi/core, @emnapi/runtime, eslint, eslint-config-next, @eslint/js (+6 more)

### Community 4 - "createClient"
Cohesion: 0.09
Nodes (37): react, src_app_admin_admin_module, StatRow(), Stats, timeSince(), Tool, ToolCards(), when() (+29 more)

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
Cohesion: 0.11
Nodes (33): next, @supabase/supabase-js, AdminLayout(), unlinkPersonalGoogle(), src_app_dashboard_dashboard_module, DashboardPage(), Profile, ServiceUnavailable() (+25 more)

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
Cohesion: 0.19
Nodes (15): AboutYouForm(), onSubmit(), src_app_register_details_about_you_module, FACULTIES, facultyRole(), ProfileDetails, ProfileErrors, STUDY_LEVELS (+7 more)

### Community 27 - "about/page.tsx"
Cohesion: 0.14
Nodes (14): src_app_about_about_module, gallery, metadata, values, collected, metadata, PrivacyPage(), metadata (+6 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom, sharp, @supabase/ssr (+2 more)

### Community 29 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, lint, start, test, test:visual, test:visual:list (+1 more)

### Community 30 - "site-header.tsx"
Cohesion: 0.10
Nodes (16): @vercel/analytics, GET(), signOut(), src_app_globals, metadata, Brand(), SignOutButton(), SiteFooter() (+8 more)

### Community 35 - "PRD: Auto-assign Discord `verified` role"
Cohesion: 0.14
Nodes (13): 1. Problem, 2. Goal, 3. Scope, 4. User stories, 5.1 Database (chulacraft-web, new migration), 5.2 Bot (chulacraft-discord), 5.3 Discord server setup, 5. Design (+5 more)

### Community 40 - "reconcile-identities.test.ts"
Cohesion: 0.17
Nodes (8): admin, cu, discord, gmail, m, query, run(), session

## Knowledge Gaps
- **194 isolated node(s):** `nextConfig`, `name`, `private`, `version`, `dev` (+189 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 253 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `icons.tsx`, `callback/route.ts`, `minecraft/route.ts`, `package.json`, `createClient`, `about-you-form.tsx`, `about/page.tsx`, `site-header.tsx`?**
  _High betweenness centrality (0.202) - this node is a cross-community bridge._
- **Why does `vitest` connect `callback/route.ts` to `icons.tsx`, `minecraft/route.ts`, `package.json`, `createClient`, `reconcile-identities.test.ts`, `next`, `about-you-form.tsx`, `about/page.tsx`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `icons.tsx`, `callback/route.ts`, `minecraft/route.ts`, `next`, `site-header.tsx`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _194 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `icons.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0957983193277311 - nodes in this community are weakly interconnected._
- **Should `callback/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08668076109936575 - nodes in this community are weakly interconnected._
- **Should `minecraft/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0990990990990991 - nodes in this community are weakly interconnected._