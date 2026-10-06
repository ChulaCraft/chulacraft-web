# Graph Report - chulacraft-web  (2026-10-06)

## Corpus Check
- 200 files · ~163,668 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 27 file(s) not represented in the graph (top: .css 21, (none) 2, .toml 2)

## Summary
- 857 nodes · 2009 edges · 51 communities (37 shown, 14 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4ff3789c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- users/[id]/page.tsx
- server.ts
- registration.ts
- package.json
- createClient
- compilerOptions
- achievements/events/[id]/page.tsx
- devDependencies
- local-mocks.mjs
- ChulaCraft Web
- server-address-card.tsx
- verify/page.tsx
- next_dev_types_root_params_d
- error/page.tsx
- dbErrorCode
- Chulacraft registration runbook
- CLAUDE.md
- supabase/README.md
- app/events/[id]/page.tsx
- Plan: server status, announcements, bans/appeals, reports, audit log
- overview.tsx
- when
- announcements/[id]/page.tsx
- engines
- server/page.tsx
- about-you-form.tsx
- ref_next_dev_types_routes_d_ts
- privacy/page.tsx
- dependencies
- scripts
- next
- next_dev_types_routes_d
- overrides
- dashboard/page.tsx
- src_app_about_you_about_you_module
- PRD: Auto-assign Discord `verified` role
- next_types_root_params_d
- next_types_routes_d
- src_app_auth_error_auth_error_module
- src_app_not_found_module
- src_app_admin_admin_module
- audit/page.tsx
- dev-login/route.ts
- allowScripts
- icons.tsx
- app/layout.tsx
- sign-out-button.tsx
- admin/players/page.tsx
- announcement-banner.tsx
- database.types.ts
- about/page.tsx

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 100 edges
2. `next` - 74 edges
3. `PixelIcon()` - 40 edges
4. `dbErrorCode()` - 34 edges
5. `vitest` - 28 edges
6. `when()` - 19 edges
7. `createAdminClient()` - 16 edges
8. `compilerOptions` - 16 edges
9. `SubmitButton()` - 15 edges
10. `reconcileIdentities()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Local mock services` --references--> `reconcileIdentities()`  [INFERRED]
  README.md → src/lib/reconcile-identities.ts
- `RestorePage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/restore/page.tsx → src/lib/supabase/server.ts
- `AnnouncementsPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/announcements/page.tsx → src/lib/supabase/server.ts
- `GET()` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/dev-login/route.ts → src/lib/supabase/server.ts
- `EventsPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/events/page.tsx → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (51 total, 14 thin omitted)

### Community 0 - "users/[id]/page.tsx"
Cohesion: 0.14
Nodes (20): react, BAN_DURATIONS, banUser(), finish(), liftBan(), markGuest(), resetChula(), setRole() (+12 more)

### Community 1 - "server.ts"
Cohesion: 0.09
Nodes (32): @supabase/ssr, authErrorResponse(), GET(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok, src_app_home_module, HomePage(), loadUpcomingEvents() (+24 more)

### Community 2 - "registration.ts"
Cohesion: 0.08
Nodes (41): AdminUserPage(), DELETE(), GET(), PATCH(), POST(), Profile, resolveMinecraftProfile(), runtime (+33 more)

### Community 3 - "package.json"
Cohesion: 0.14
Nodes (14): name, private, version, @emnapi/core, @emnapi/runtime, eslint, eslint-config-next, @eslint/js (+6 more)

### Community 4 - "createClient"
Cohesion: 0.15
Nodes (22): blockPlayer(), finish(), playerId(), removeFriend(), reportPlayer(), respondFriendRequest(), sendFriendRequest(), ask() (+14 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "achievements/events/[id]/page.tsx"
Cohesion: 0.06
Nodes (40): EventForm(), onCover(), pickFile(), EventFormValues, LOADED_AT, noSubscribe(), shrink(), toIso() (+32 more)

### Community 7 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, @eslint/js, @playwright/test, @types/node, @types/react, @types/react-dom (+3 more)

### Community 8 - "local-mocks.mjs"
Cohesion: 0.07
Nodes (35): RFC-6455, ref_node_child_process, ref_node_fs, ref_node_http, ref_node_path, @playwright/test, shots, ACTION_BITS (+27 more)

### Community 9 - "ChulaCraft Web"
Cohesion: 0.10
Nodes (19): Architecture, Chula verification (Google), ChulaCraft Web, Commands, Current implementation caveats, Deployment, Discord authentication, Environment (+11 more)

### Community 10 - "server-address-card.tsx"
Cohesion: 0.18
Nodes (17): ref_node_dns, ref_node_net, CopyButton(), serverAddress, ServerAddressRow(), ServerStatus, StatusBadge(), packet() (+9 more)

### Community 11 - "verify/page.tsx"
Cohesion: 0.07
Nodes (41): @supabase/supabase-js, AdminLayout(), metadata, unlinkPersonalGoogle(), DashboardPage(), ServiceUnavailable(), AboutYouPage(), metadata (+33 more)

### Community 13 - "error/page.tsx"
Cohesion: 0.15
Nodes (11): AuthErrorPage(), metadata, metadata, Action, ErrorScreen(), Href, src_components_error_screen_module, AUTH_FAILURE_REASONS (+3 more)

### Community 14 - "dbErrorCode"
Cohesion: 0.10
Nodes (31): vitest, addPlayers(), awardId(), confirmAward(), fail(), prefillInterested(), previewAward(), m (+23 more)

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
Cohesion: 0.31
Nodes (8): StatRow(), Stats, timeSince(), Tool, ToolCards(), Activity, AdminPage(), metadata

### Community 21 - "when"
Cohesion: 0.16
Nodes (12): AdminAchievementsPage(), metadata, AdminAppealsPage(), DONE, ERRORS, metadata, when(), AdminReportsPage() (+4 more)

### Community 22 - "announcements/[id]/page.tsx"
Cohesion: 0.19
Nodes (14): deleteAnnouncement(), postedId(), refresh(), saveAnnouncement(), SEVERITIES, form(), m, valid() (+6 more)

### Community 24 - "server/page.tsx"
Cohesion: 0.11
Nodes (31): ref_node_crypto, ACTIONS, openConsole(), serverAction(), m, redirected(), ConsoleAction, grant() (+23 more)

### Community 25 - "about-you-form.tsx"
Cohesion: 0.18
Nodes (17): AboutYouForm(), onSubmit(), src_app_register_details_about_you_module, saveProfile(), SaveProfileState, FACULTIES, facultyRole(), ProfileDetails (+9 more)

### Community 27 - "privacy/page.tsx"
Cohesion: 0.24
Nodes (9): collected, metadata, PrivacyPage(), metadata, TermsPage(), LEGAL_EFFECTIVE_DATE, LegalPage(), src_components_legal_page_module (+1 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom, sharp, @supabase/ssr (+2 more)

### Community 29 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, db:types, dev, dev:mocks, lint, start, test (+3 more)

### Community 30 - "next"
Cohesion: 0.24
Nodes (6): nextConfig, next, ref_node_url, Brand(), HeaderShell(), NavLinks()

### Community 33 - "dashboard/page.tsx"
Cohesion: 0.09
Nodes (31): metadata, finish(), LEVELS, otherId(), removeFriend(), respondFriendRequest(), submitAppeal(), allPublic() (+23 more)

### Community 35 - "PRD: Auto-assign Discord `verified` role"
Cohesion: 0.14
Nodes (13): 1. Problem, 2. Goal, 3. Scope, 4. User stories, 5.1 Database (chulacraft-web, new migration), 5.2 Bot (chulacraft-discord), 5.3 Discord server setup, 5. Design (+5 more)

### Community 41 - "audit/page.tsx"
Cohesion: 0.25
Nodes (8): AdminAuditPage(), bangkokDay(), ENTITIES, Entry, metadata, Params, describeChange(), PROFILE_FIELDS

### Community 42 - "dev-login/route.ts"
Cohesion: 0.60
Nodes (3): GET(), DEV_LOGIN_ENABLED, DEV_USERS

### Community 44 - "icons.tsx"
Cohesion: 0.18
Nodes (9): AdminAnnouncementsPage(), ERRORS, metadata, state(), src_components_copy_button_module, IconProps, PIXEL_PATHS, PixelIcon() (+1 more)

### Community 45 - "app/layout.tsx"
Cohesion: 0.24
Nodes (8): @vercel/analytics, src_app_globals, metadata, SiteFooter(), SiteHeader(), bodyFont, displayFont, monoFont

### Community 46 - "sign-out-button.tsx"
Cohesion: 0.25
Nodes (5): react-dom, signOut(), RegisterPage(), { getUser, redirect }, SignOutButton()

### Community 47 - "admin/players/page.tsx"
Cohesion: 0.27
Nodes (8): AdminPlayersPage(), Fn, kind(), metadata, Newest, UserRow, VerificationBadge(), VerificationKind

### Community 48 - "announcement-banner.tsx"
Cohesion: 0.29
Nodes (7): src_app_announcements_announcements_module, AnnouncementsPage(), metadata, AnnouncementBanner(), dismissedId(), subscribe(), SEVERITY

### Community 49 - "database.types.ts"
Cohesion: 0.13
Nodes (14): ERRORS, metadata, RemovedRow, RestorePage(), CompositeTypes, Constants, Database, DatabaseWithoutInternals (+6 more)

### Community 50 - "about/page.tsx"
Cohesion: 0.33
Nodes (4): src_app_about_about_module, gallery, metadata, values

## Knowledge Gaps
- **280 isolated node(s):** `nextConfig`, `name`, `private`, `node`, `version` (+275 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 363 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `users/[id]/page.tsx`, `server.ts`, `registration.ts`, `package.json`, `createClient`, `achievements/events/[id]/page.tsx`, `server-address-card.tsx`, `verify/page.tsx`, `error/page.tsx`, `dbErrorCode`, `app/events/[id]/page.tsx`, `overview.tsx`, `when`, `announcements/[id]/page.tsx`, `server/page.tsx`, `about-you-form.tsx`, `privacy/page.tsx`, `dashboard/page.tsx`, `audit/page.tsx`, `dev-login/route.ts`, `icons.tsx`, `app/layout.tsx`, `sign-out-button.tsx`, `admin/players/page.tsx`, `announcement-banner.tsx`, `database.types.ts`, `about/page.tsx`?**
  _High betweenness centrality (0.261) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `users/[id]/page.tsx`, `server.ts`, `registration.ts`, `achievements/events/[id]/page.tsx`, `verify/page.tsx`, `dbErrorCode`, `app/events/[id]/page.tsx`, `overview.tsx`, `when`, `announcements/[id]/page.tsx`, `server/page.tsx`, `next`, `dashboard/page.tsx`, `audit/page.tsx`, `dev-login/route.ts`, `icons.tsx`, `app/layout.tsx`, `sign-out-button.tsx`, `admin/players/page.tsx`, `announcement-banner.tsx`, `database.types.ts`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Why does `vitest` connect `dbErrorCode` to `users/[id]/page.tsx`, `server.ts`, `registration.ts`, `package.json`, `dashboard/page.tsx`, `createClient`, `achievements/events/[id]/page.tsx`, `audit/page.tsx`, `server-address-card.tsx`, `verify/page.tsx`, `error/page.tsx`, `sign-out-button.tsx`, `app/events/[id]/page.tsx`, `announcements/[id]/page.tsx`, `server/page.tsx`, `about-you-form.tsx`, `privacy/page.tsx`, `next`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _280 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `users/[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13756613756613756 - nodes in this community are weakly interconnected._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0898989898989899 - nodes in this community are weakly interconnected._
- **Should `registration.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08244680851063829 - nodes in this community are weakly interconnected._