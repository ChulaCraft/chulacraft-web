# Graph Report - chulacraft-web  (2026-10-05)

## Corpus Check
- 198 files · ~160,350 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 27 file(s) not represented in the graph (top: .css 21, (none) 2, .toml 2)

## Summary
- 801 nodes · 1930 edges · 45 communities (31 shown, 14 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 40 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `abbc5e93`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- createClient
- server.ts
- registration.ts
- package.json
- error-screen.tsx
- compilerOptions
- dbErrorCode
- devDependencies
- visual-audit.spec.ts
- ChulaCraft Web
- server-address-card.tsx
- settings/page.tsx
- next_dev_types_root_params_d
- supabase-stub.mjs
- award/page.tsx
- Chulacraft registration runbook
- CLAUDE.md
- supabase/README.md
- app/events/[id]/page.tsx
- Plan: server status, announcements, bans/appeals, reports, audit log
- overview.tsx
- when
- PixelIcon
- engines
- server/page.tsx
- dashboard/page.tsx
- ref_next_dev_types_routes_d_ts
- register/page.tsx
- dependencies
- scripts
- site-header.tsx
- next_dev_types_routes_d
- overrides
- users/[id]/page.tsx
- src_app_about_you_about_you_module
- PRD: Auto-assign Discord `verified` role
- next_types_root_params_d
- next_types_routes_d
- src_app_auth_error_auth_error_module
- src_app_not_found_module
- src_app_admin_admin_module
- audit/page.tsx
- achievements/events/[id]/page.tsx
- next
- icons.tsx

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 100 edges
2. `next` - 70 edges
3. `PixelIcon()` - 40 edges
4. `dbErrorCode()` - 34 edges
5. `vitest` - 28 edges
6. `when()` - 19 edges
7. `createAdminClient()` - 16 edges
8. `compilerOptions` - 16 edges
9. `SubmitButton()` - 15 edges
10. `react` - 14 edges

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

## Communities (45 total, 14 thin omitted)

### Community 0 - "createClient"
Cohesion: 0.10
Nodes (32): BAN_DURATIONS, banUser(), finish(), liftBan(), markGuest(), resetChula(), setRole(), setWhitelisted() (+24 more)

### Community 1 - "server.ts"
Cohesion: 0.09
Nodes (34): @supabase/ssr, authErrorResponse(), GET(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok, src_app_home_module, HomePage(), loadUpcomingEvents() (+26 more)

### Community 2 - "registration.ts"
Cohesion: 0.10
Nodes (34): AdminUserPage(), DELETE(), GET(), PATCH(), POST(), Profile, resolveMinecraftProfile(), runtime (+26 more)

### Community 3 - "package.json"
Cohesion: 0.12
Nodes (16): allowScripts, unrs-resolver@1.12.2, name, private, version, @emnapi/core, @emnapi/runtime, eslint (+8 more)

### Community 4 - "error-screen.tsx"
Cohesion: 0.18
Nodes (10): AuthErrorPage(), Action, ErrorScreen(), Href, src_components_error_screen_module, AUTH_FAILURE_REASONS, authFailureMessage(), AuthFailureReason (+2 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "dbErrorCode"
Cohesion: 0.06
Nodes (41): nextConfig, ref_node_url, vitest, deleteEvent(), finish(), postedId(), saveEvent(), form() (+33 more)

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
Cohesion: 0.06
Nodes (47): @supabase/supabase-js, finish(), LEVELS, otherId(), removeFriend(), respondFriendRequest(), allPublic(), form() (+39 more)

### Community 14 - "award/page.tsx"
Cohesion: 0.16
Nodes (22): addPlayers(), awardId(), confirmAward(), fail(), prefillInterested(), previewAward(), m, unique() (+14 more)

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.25
Nodes (7): Chulacraft registration runbook, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 18 - "app/events/[id]/page.tsx"
Cohesion: 0.08
Nodes (29): src_app_events_events_module, eventId(), signInPath(), form(), interested(), m, redirected(), toggleInterest() (+21 more)

### Community 19 - "Plan: server status, announcements, bans/appeals, reports, audit log"
Cohesion: 0.12
Nodes (16): Constraints from `chulacraft-server-manager`, Open questions, Order and size, Other repos involved, Permission bits, Phase 0 — Split the whitelist worker into its own repo, Phase 1 — Live server status (#1), Phase 2 — Announcements (#3) (+8 more)

### Community 20 - "overview.tsx"
Cohesion: 0.18
Nodes (14): StatRow(), Stats, timeSince(), Tool, ToolCards(), Activity, AdminPage(), AdminPlayersPage() (+6 more)

### Community 21 - "when"
Cohesion: 0.20
Nodes (11): AdminAchievementPage(), publicImageUrl(), AdminAchievementsPage(), AdminAppealsPage(), DONE, ERRORS, when(), AdminReportsPage() (+3 more)

### Community 22 - "PixelIcon"
Cohesion: 0.23
Nodes (9): EventForm(), onCover(), pickFile(), EventFormValues, LOADED_AT, noSubscribe(), shrink(), toIso() (+1 more)

### Community 24 - "server/page.tsx"
Cohesion: 0.14
Nodes (25): ref_node_crypto, ACTIONS, openConsole(), serverAction(), m, redirected(), ConsoleAction, grant() (+17 more)

### Community 25 - "dashboard/page.tsx"
Cohesion: 0.08
Nodes (38): AdminLayout(), submitAppeal(), APPEAL_ERRORS, BanCard(), date(), MyBan, src_app_dashboard_dashboard_module, DashboardPage() (+30 more)

### Community 27 - "register/page.tsx"
Cohesion: 0.08
Nodes (28): react-dom, src_app_about_about_module, gallery, metadata, values, collected, metadata, PrivacyPage() (+20 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom, sharp, @supabase/ssr (+2 more)

### Community 29 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, db:types, dev, lint, start, test, test:visual (+2 more)

### Community 30 - "site-header.tsx"
Cohesion: 0.08
Nodes (24): react, @vercel/analytics, src_app_announcements_announcements_module, AnnouncementsPage(), metadata, GET(), signOut(), src_app_globals (+16 more)

### Community 33 - "users/[id]/page.tsx"
Cohesion: 0.21
Nodes (11): DONE, ERRORS, Detail, DONE, ERRORS, BODY, RoleControl(), ConfirmAction() (+3 more)

### Community 35 - "PRD: Auto-assign Discord `verified` role"
Cohesion: 0.14
Nodes (13): 1. Problem, 2. Goal, 3. Scope, 4. User stories, 5.1 Database (chulacraft-web, new migration), 5.2 Bot (chulacraft-discord), 5.3 Discord server setup, 5. Design (+5 more)

### Community 41 - "audit/page.tsx"
Cohesion: 0.29
Nodes (7): AdminAuditPage(), bangkokDay(), ENTITIES, Entry, Params, describeChange(), PROFILE_FIELDS

### Community 42 - "achievements/events/[id]/page.tsx"
Cohesion: 0.29
Nodes (7): AdminEventPage(), DONE, ERRORS, AdminAnnouncementPage(), DONE, ERRORS, bangkokInput()

### Community 43 - "next"
Cohesion: 0.25
Nodes (7): next, AdminAnnouncementsPage(), ERRORS, state(), ERRORS, RemovedRow, RestorePage()

### Community 44 - "icons.tsx"
Cohesion: 0.33
Nodes (3): IconProps, PIXEL_PATHS, PixelIconName

## Knowledge Gaps
- **242 isolated node(s):** `nextConfig`, `name`, `private`, `node`, `version` (+237 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 325 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `createClient`, `server.ts`, `registration.ts`, `package.json`, `error-screen.tsx`, `dbErrorCode`, `server-address-card.tsx`, `settings/page.tsx`, `award/page.tsx`, `app/events/[id]/page.tsx`, `overview.tsx`, `when`, `PixelIcon`, `server/page.tsx`, `dashboard/page.tsx`, `register/page.tsx`, `site-header.tsx`, `users/[id]/page.tsx`, `audit/page.tsx`, `achievements/events/[id]/page.tsx`?**
  _High betweenness centrality (0.248) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `users/[id]/page.tsx`, `registration.ts`, `server.ts`, `dbErrorCode`, `audit/page.tsx`, `achievements/events/[id]/page.tsx`, `next`, `settings/page.tsx`, `award/page.tsx`, `app/events/[id]/page.tsx`, `overview.tsx`, `when`, `server/page.tsx`, `dashboard/page.tsx`, `register/page.tsx`, `site-header.tsx`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Why does `vitest` connect `dbErrorCode` to `createClient`, `server.ts`, `registration.ts`, `package.json`, `error-screen.tsx`, `audit/page.tsx`, `server-address-card.tsx`, `settings/page.tsx`, `award/page.tsx`, `app/events/[id]/page.tsx`, `server/page.tsx`, `dashboard/page.tsx`, `register/page.tsx`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _242 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.10042283298097252 - nodes in this community are weakly interconnected._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09082125603864734 - nodes in this community are weakly interconnected._
- **Should `registration.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09871794871794871 - nodes in this community are weakly interconnected._