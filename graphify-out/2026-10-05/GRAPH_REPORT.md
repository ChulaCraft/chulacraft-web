# Graph Report - chulacraft-web  (2026-10-05)

## Corpus Check
- 160 files · ~139,975 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 26 file(s) not represented in the graph (top: .css 20, (none) 2, .toml 2)

## Summary
- 661 nodes · 1523 edges · 36 communities (22 shown, 14 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e186a9c1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dashboard/page.tsx
- server.ts
- registration.ts
- package.json
- users/[id]/page.tsx
- compilerOptions
- next
- devDependencies
- visual-audit.spec.ts
- ChulaCraft Web
- createClient
- settings/page.tsx
- next_dev_types_root_params_d
- supabase-stub.mjs
- award/actions.ts
- Chulacraft registration runbook
- CLAUDE.md
- supabase/README.md
- app/events/[id]/page.tsx
- auth-error.ts
- engines
- ref_node_crypto
- about-you-form.tsx
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
2. `next` - 56 edges
3. `PixelIcon()` - 30 edges
4. `dbErrorCode()` - 26 edges
5. `vitest` - 24 edges
6. `createAdminClient()` - 16 edges
7. `compilerOptions` - 16 edges
8. `reconcileIdentities()` - 14 edges
9. `requireVerifiedUser()` - 14 edges
10. `classifyIdentities()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `RestorePage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/restore/page.tsx → src/lib/supabase/server.ts
- `GET()` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/dev-login/route.ts → src/lib/supabase/server.ts
- `EventsPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/events/page.tsx → src/lib/supabase/server.ts
- `SettingsPage()` --indirect_call--> `toRegistrationView()`  [INFERRED]
  src/app/settings/page.tsx → src/lib/registration.ts
- `saveAchievement()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/achievements/[id]/actions.ts → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (36 total, 14 thin omitted)

### Community 0 - "dashboard/page.tsx"
Cohesion: 0.11
Nodes (24): finish(), LEVELS, otherId(), removeFriend(), respondFriendRequest(), allPublic(), form(), m (+16 more)

### Community 1 - "server.ts"
Cohesion: 0.08
Nodes (36): @supabase/ssr, authErrorResponse(), GET(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok, src_app_home_module, HomePage(), loadUpcomingEvents() (+28 more)

### Community 2 - "registration.ts"
Cohesion: 0.10
Nodes (35): AdminUserPage(), DELETE(), GET(), PATCH(), POST(), Profile, resolveMinecraftProfile(), runtime (+27 more)

### Community 3 - "package.json"
Cohesion: 0.12
Nodes (16): allowScripts, unrs-resolver@1.12.2, name, private, version, @emnapi/core, @emnapi/runtime, eslint (+8 more)

### Community 4 - "users/[id]/page.tsx"
Cohesion: 0.08
Nodes (33): react, StatRow(), Stats, timeSince(), Tool, ToolCards(), Activity, AdminPage() (+25 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "next"
Cohesion: 0.06
Nodes (43): next, deleteEvent(), finish(), instant(), postedId(), saveEvent(), form(), m (+35 more)

### Community 7 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, @eslint/js, @playwright/test, @types/node, @types/react, @types/react-dom (+3 more)

### Community 8 - "visual-audit.spec.ts"
Cohesion: 0.18
Nodes (9): ref_node_child_process, ref_node_fs, ref_node_path, @playwright/test, shots, AuditOptions, auditPage(), accessToken (+1 more)

### Community 9 - "ChulaCraft Web"
Cohesion: 0.11
Nodes (18): Architecture, Chula verification (Google), ChulaCraft Web, Commands, Current implementation caveats, Deployment, Discord authentication, Environment (+10 more)

### Community 10 - "createClient"
Cohesion: 0.14
Nodes (21): signOut(), blockPlayer(), finish(), playerId(), removeFriend(), respondFriendRequest(), sendFriendRequest(), ask() (+13 more)

### Community 11 - "settings/page.tsx"
Cohesion: 0.06
Nodes (41): nextConfig, ref_node_url, @supabase/supabase-js, vitest, AdminLayout(), unlinkPersonalGoogle(), src_app_dashboard_dashboard_module, LEVEL_OPTIONS (+33 more)

### Community 14 - "award/actions.ts"
Cohesion: 0.16
Nodes (22): addPlayers(), awardId(), confirmAward(), fail(), prefillInterested(), previewAward(), m, unique() (+14 more)

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.25
Nodes (7): Chulacraft registration runbook, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 18 - "app/events/[id]/page.tsx"
Cohesion: 0.08
Nodes (29): src_app_events_events_module, eventId(), signInPath(), form(), interested(), m, redirected(), toggleInterest() (+21 more)

### Community 21 - "auth-error.ts"
Cohesion: 0.22
Nodes (9): AuthErrorPage(), Action, ErrorScreen(), src_components_error_screen_module, AUTH_FAILURE_REASONS, authFailureMessage(), AuthFailureReason, classifyOAuthCallbackFailure() (+1 more)

### Community 25 - "about-you-form.tsx"
Cohesion: 0.18
Nodes (17): AboutYouForm(), onSubmit(), src_app_register_details_about_you_module, saveProfile(), SaveProfileState, FACULTIES, facultyRole(), ProfileDetails (+9 more)

### Community 27 - "icons.tsx"
Cohesion: 0.06
Nodes (37): react-dom, src_app_about_about_module, gallery, metadata, values, ServiceUnavailable(), collected, metadata (+29 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom, sharp, @supabase/ssr (+2 more)

### Community 29 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, db:types, dev, lint, start, test, test:visual (+2 more)

### Community 30 - "app/layout.tsx"
Cohesion: 0.18
Nodes (11): @vercel/analytics, GET(), src_app_globals, metadata, SiteFooter(), SiteHeader(), DEV_LOGIN_ENABLED, DEV_USERS (+3 more)

### Community 35 - "PRD: Auto-assign Discord `verified` role"
Cohesion: 0.14
Nodes (13): 1. Problem, 2. Goal, 3. Scope, 4. User stories, 5.1 Database (chulacraft-web, new migration), 5.2 Bot (chulacraft-discord), 5.3 Discord server setup, 5. Design (+5 more)

## Knowledge Gaps
- **199 isolated node(s):** `nextConfig`, `name`, `private`, `node`, `version` (+194 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 276 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `dashboard/page.tsx`, `server.ts`, `registration.ts`, `package.json`, `users/[id]/page.tsx`, `createClient`, `settings/page.tsx`, `award/actions.ts`, `app/events/[id]/page.tsx`, `auth-error.ts`, `about-you-form.tsx`, `icons.tsx`, `app/layout.tsx`?**
  _High betweenness centrality (0.255) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `dashboard/page.tsx`, `server.ts`, `registration.ts`, `users/[id]/page.tsx`, `next`, `settings/page.tsx`, `award/actions.ts`, `app/events/[id]/page.tsx`, `icons.tsx`, `app/layout.tsx`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `vitest` connect `settings/page.tsx` to `dashboard/page.tsx`, `server.ts`, `registration.ts`, `package.json`, `users/[id]/page.tsx`, `next`, `createClient`, `award/actions.ts`, `app/events/[id]/page.tsx`, `auth-error.ts`, `about-you-form.tsx`, `icons.tsx`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _199 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dashboard/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11494252873563218 - nodes in this community are weakly interconnected._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08163265306122448 - nodes in this community are weakly interconnected._
- **Should `registration.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09634146341463415 - nodes in this community are weakly interconnected._