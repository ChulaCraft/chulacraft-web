# Graph Report - chulacraft-web  (2026-10-05)

## Corpus Check
- 175 files · ~148,324 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 27 file(s) not represented in the graph (top: .css 21, (none) 2, .toml 2)

## Summary
- 730 nodes · 1689 edges · 37 communities (23 shown, 14 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a10f247c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- createClient
- server.ts
- registration.ts
- package.json
- next
- compilerOptions
- dbErrorCode
- devDependencies
- visual-audit.spec.ts
- ChulaCraft Web
- server-address-card.tsx
- settings/page.tsx
- next_dev_types_root_params_d
- supabase-stub.mjs
- award/actions.ts
- Chulacraft registration runbook
- CLAUDE.md
- supabase/README.md
- app/events/[id]/page.tsx
- Plan: server status, announcements, bans/appeals, reports, audit log
- auth-error.ts
- engines
- ref_node_crypto
- dashboard/page.tsx
- ref_next_dev_types_routes_d_ts
- register/page.tsx
- dependencies
- scripts
- site-header.tsx
- next_dev_types_routes_d
- overrides
- src_app_about_you_about_you_module
- PRD: Auto-assign Discord `verified` role
- next_types_root_params_d
- next_types_routes_d
- src_app_auth_error_auth_error_module
- src_app_not_found_module

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 82 edges
2. `next` - 63 edges
3. `PixelIcon()` - 34 edges
4. `dbErrorCode()` - 29 edges
5. `vitest` - 26 edges
6. `createAdminClient()` - 16 edges
7. `compilerOptions` - 16 edges
8. `reconcileIdentities()` - 14 edges
9. `requireVerifiedUser()` - 14 edges
10. `react` - 13 edges

## Surprising Connections (you probably didn't know these)
- `RestorePage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/restore/page.tsx → src/lib/supabase/server.ts
- `AnnouncementsPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/announcements/page.tsx → src/lib/supabase/server.ts
- `GET()` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/dev-login/route.ts → src/lib/supabase/server.ts
- `EventsPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/events/page.tsx → src/lib/supabase/server.ts
- `SettingsPage()` --indirect_call--> `toRegistrationView()`  [INFERRED]
  src/app/settings/page.tsx → src/lib/registration.ts

## Import Cycles
- None detected.

## Communities (37 total, 14 thin omitted)

### Community 0 - "createClient"
Cohesion: 0.10
Nodes (28): finish(), markGuest(), resetChula(), setRole(), setWhitelisted(), form(), m, whitelisted() (+20 more)

### Community 1 - "server.ts"
Cohesion: 0.09
Nodes (34): @supabase/ssr, authErrorResponse(), GET(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok, src_app_home_module, HomePage(), loadUpcomingEvents() (+26 more)

### Community 2 - "registration.ts"
Cohesion: 0.10
Nodes (34): AdminUserPage(), DELETE(), GET(), PATCH(), POST(), Profile, resolveMinecraftProfile(), runtime (+26 more)

### Community 3 - "package.json"
Cohesion: 0.12
Nodes (16): allowScripts, unrs-resolver@1.12.2, name, private, version, @emnapi/core, @emnapi/runtime, eslint (+8 more)

### Community 4 - "next"
Cohesion: 0.05
Nodes (58): next, react, EventForm(), onCover(), pickFile(), EventFormValues, LOADED_AT, noSubscribe() (+50 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "dbErrorCode"
Cohesion: 0.06
Nodes (38): nextConfig, ref_node_url, vitest, deleteEvent(), finish(), postedId(), saveEvent(), form() (+30 more)

### Community 7 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, @eslint/js, @playwright/test, @types/node, @types/react, @types/react-dom (+3 more)

### Community 8 - "visual-audit.spec.ts"
Cohesion: 0.18
Nodes (9): ref_node_child_process, ref_node_fs, ref_node_path, @playwright/test, shots, AuditOptions, auditPage(), accessToken (+1 more)

### Community 9 - "ChulaCraft Web"
Cohesion: 0.11
Nodes (18): Architecture, Chula verification (Google), ChulaCraft Web, Commands, Current implementation caveats, Deployment, Discord authentication, Environment (+10 more)

### Community 10 - "server-address-card.tsx"
Cohesion: 0.16
Nodes (18): ref_node_dns, ref_node_net, CopyButton(), src_components_copy_button_module, serverAddress, ServerAddressRow(), ServerStatus, StatusBadge() (+10 more)

### Community 11 - "settings/page.tsx"
Cohesion: 0.07
Nodes (44): @supabase/supabase-js, finish(), LEVELS, otherId(), removeFriend(), respondFriendRequest(), allPublic(), form() (+36 more)

### Community 14 - "award/actions.ts"
Cohesion: 0.15
Nodes (23): addPlayers(), awardId(), confirmAward(), fail(), prefillInterested(), previewAward(), m, unique() (+15 more)

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.25
Nodes (7): Chulacraft registration runbook, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 18 - "app/events/[id]/page.tsx"
Cohesion: 0.08
Nodes (29): src_app_events_events_module, eventId(), signInPath(), form(), interested(), m, redirected(), toggleInterest() (+21 more)

### Community 19 - "Plan: server status, announcements, bans/appeals, reports, audit log"
Cohesion: 0.15
Nodes (12): Constraints from `chulacraft-server-manager`, Open questions, Order and size, Other repos involved, Phase 0 — Split the whitelist worker into its own repo, Phase 1 — Live server status (#1), Phase 2 — Announcements (#3), Phase 2b — Downtime alerts (chulacraft-discord bot) (+4 more)

### Community 20 - "auth-error.ts"
Cohesion: 0.22
Nodes (9): AuthErrorPage(), Action, ErrorScreen(), src_components_error_screen_module, AUTH_FAILURE_REASONS, authFailureMessage(), AuthFailureReason, classifyOAuthCallbackFailure() (+1 more)

### Community 25 - "dashboard/page.tsx"
Cohesion: 0.08
Nodes (36): AdminLayout(), DashboardPage(), Profile, Social, SOCIAL_DONE, SOCIAL_ERRORS, SocialPerson, ServiceUnavailable() (+28 more)

### Community 27 - "register/page.tsx"
Cohesion: 0.09
Nodes (27): react-dom, src_app_about_about_module, gallery, metadata, values, collected, metadata, PrivacyPage() (+19 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom, sharp, @supabase/ssr (+2 more)

### Community 29 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, db:types, dev, lint, start, test, test:visual (+2 more)

### Community 30 - "site-header.tsx"
Cohesion: 0.08
Nodes (23): @vercel/analytics, src_app_announcements_announcements_module, AnnouncementsPage(), metadata, GET(), signOut(), src_app_globals, metadata (+15 more)

### Community 35 - "PRD: Auto-assign Discord `verified` role"
Cohesion: 0.14
Nodes (13): 1. Problem, 2. Goal, 3. Scope, 4. User stories, 5.1 Database (chulacraft-web, new migration), 5.2 Bot (chulacraft-discord), 5.3 Discord server setup, 5. Design (+5 more)

## Knowledge Gaps
- **219 isolated node(s):** `nextConfig`, `name`, `private`, `node`, `version` (+214 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 301 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `createClient`, `server.ts`, `registration.ts`, `package.json`, `dbErrorCode`, `server-address-card.tsx`, `settings/page.tsx`, `award/actions.ts`, `app/events/[id]/page.tsx`, `auth-error.ts`, `dashboard/page.tsx`, `register/page.tsx`, `site-header.tsx`?**
  _High betweenness centrality (0.251) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `server.ts`, `registration.ts`, `next`, `dbErrorCode`, `settings/page.tsx`, `award/actions.ts`, `app/events/[id]/page.tsx`, `dashboard/page.tsx`, `register/page.tsx`, `site-header.tsx`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `vitest` connect `dbErrorCode` to `createClient`, `server.ts`, `registration.ts`, `package.json`, `next`, `server-address-card.tsx`, `settings/page.tsx`, `award/actions.ts`, `app/events/[id]/page.tsx`, `auth-error.ts`, `dashboard/page.tsx`, `register/page.tsx`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _219 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.10256410256410256 - nodes in this community are weakly interconnected._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09082125603864734 - nodes in this community are weakly interconnected._
- **Should `registration.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09871794871794871 - nodes in this community are weakly interconnected._