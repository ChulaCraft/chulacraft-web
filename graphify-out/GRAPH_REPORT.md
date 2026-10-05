# Graph Report - chulacraft-web  (2026-10-05)

## Corpus Check
- 184 files · ~151,687 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 27 file(s) not represented in the graph (top: .css 21, (none) 2, .toml 2)

## Summary
- 766 nodes · 1788 edges · 44 communities (31 shown, 13 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a10f247c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- createClient
- vitest
- minecraft/route.ts
- package.json
- overview.tsx
- compilerOptions
- achievements/events/[id]/actions.ts
- devDependencies
- visual-audit.spec.ts
- ChulaCraft Web
- app/page.tsx
- dashboard/page.tsx
- next_dev_types_root_params_d
- supabase-stub.mjs
- registration.ts
- Chulacraft registration runbook
- CLAUDE.md
- supabase/README.md
- app/events/[id]/page.tsx
- Plan: server status, announcements, bans/appeals, reports, audit log
- announcements/[id]/page.tsx
- next
- users/[id]/page.tsx
- engines
- server/page.tsx
- about-you-form.tsx
- ref_next_dev_types_routes_d_ts
- register/page.tsx
- dependencies
- scripts
- site-header.tsx
- next_dev_types_routes_d
- overrides
- event-form.tsx
- src_app_about_you_about_you_module
- PRD: Auto-assign Discord `verified` role
- next_types_root_params_d
- next_types_routes_d
- src_app_auth_error_auth_error_module
- src_app_not_found_module
- achievements/events/[id]/page.tsx
- src_app_admin_admin_module
- icons.tsx
- PixelIcon

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 86 edges
2. `next` - 65 edges
3. `PixelIcon()` - 36 edges
4. `dbErrorCode()` - 29 edges
5. `vitest` - 28 edges
6. `createAdminClient()` - 16 edges
7. `compilerOptions` - 16 edges
8. `react` - 14 edges
9. `reconcileIdentities()` - 14 edges
10. `requireVerifiedUser()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `RestorePage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/restore/page.tsx → src/lib/supabase/server.ts
- `AnnouncementsPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/announcements/page.tsx → src/lib/supabase/server.ts
- `GET()` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/dev-login/route.ts → src/lib/supabase/server.ts
- `EventsPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/events/page.tsx → src/lib/supabase/server.ts
- `PlayersPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/players/page.tsx → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (44 total, 13 thin omitted)

### Community 0 - "createClient"
Cohesion: 0.10
Nodes (30): finish(), markGuest(), resetChula(), setRole(), setWhitelisted(), form(), m, whitelisted() (+22 more)

### Community 1 - "vitest"
Cohesion: 0.08
Nodes (31): nextConfig, ref_node_url, vitest, authErrorResponse(), GET(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok, AuthErrorPage() (+23 more)

### Community 2 - "minecraft/route.ts"
Cohesion: 0.11
Nodes (27): DELETE(), GET(), PATCH(), POST(), Profile, resolveMinecraftProfile(), runtime, save() (+19 more)

### Community 3 - "package.json"
Cohesion: 0.12
Nodes (16): allowScripts, unrs-resolver@1.12.2, name, private, version, @emnapi/core, @emnapi/runtime, eslint (+8 more)

### Community 4 - "overview.tsx"
Cohesion: 0.26
Nodes (9): StatRow(), Stats, timeSince(), Tool, ToolCards(), Activity, AdminPage(), describeChange() (+1 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "achievements/events/[id]/actions.ts"
Cohesion: 0.10
Nodes (22): deleteEvent(), finish(), postedId(), saveEvent(), form(), m, valid(), deleteAchievement() (+14 more)

### Community 7 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, @eslint/js, @playwright/test, @types/node, @types/react, @types/react-dom (+3 more)

### Community 8 - "visual-audit.spec.ts"
Cohesion: 0.18
Nodes (9): ref_node_child_process, ref_node_fs, ref_node_path, @playwright/test, shots, AuditOptions, auditPage(), accessToken (+1 more)

### Community 9 - "ChulaCraft Web"
Cohesion: 0.11
Nodes (18): Architecture, Chula verification (Google), ChulaCraft Web, Commands, Current implementation caveats, Deployment, Discord authentication, Environment (+10 more)

### Community 10 - "app/page.tsx"
Cohesion: 0.12
Nodes (24): ref_node_dns, ref_node_net, react, src_app_home_module, HomePage(), loadUpcomingEvents(), steps, upcomingEvents (+16 more)

### Community 11 - "dashboard/page.tsx"
Cohesion: 0.05
Nodes (58): @supabase/supabase-js, AdminLayout(), finish(), LEVELS, otherId(), removeFriend(), respondFriendRequest(), allPublic() (+50 more)

### Community 14 - "registration.ts"
Cohesion: 0.11
Nodes (30): addPlayers(), awardId(), confirmAward(), fail(), prefillInterested(), previewAward(), m, unique() (+22 more)

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.25
Nodes (7): Chulacraft registration runbook, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 18 - "app/events/[id]/page.tsx"
Cohesion: 0.08
Nodes (29): src_app_events_events_module, eventId(), signInPath(), form(), interested(), m, redirected(), toggleInterest() (+21 more)

### Community 19 - "Plan: server status, announcements, bans/appeals, reports, audit log"
Cohesion: 0.12
Nodes (16): Constraints from `chulacraft-server-manager`, Open questions, Order and size, Other repos involved, Permission bits, Phase 0 — Split the whitelist worker into its own repo, Phase 1 — Live server status (#1), Phase 2 — Announcements (#3) (+8 more)

### Community 20 - "announcements/[id]/page.tsx"
Cohesion: 0.20
Nodes (13): deleteAnnouncement(), postedId(), refresh(), saveAnnouncement(), SEVERITIES, form(), m, valid() (+5 more)

### Community 21 - "next"
Cohesion: 0.15
Nodes (14): next, ERRORS, RemovedRow, RestorePage(), CompositeTypes, Constants, Database, DatabaseWithoutInternals (+6 more)

### Community 22 - "users/[id]/page.tsx"
Cohesion: 0.23
Nodes (10): AdminUserPage(), Detail, DONE, ERRORS, BODY, RoleControl(), ConfirmAction(), Props (+2 more)

### Community 24 - "server/page.tsx"
Cohesion: 0.14
Nodes (25): ref_node_crypto, ACTIONS, openConsole(), serverAction(), m, redirected(), ConsoleAction, grant() (+17 more)

### Community 25 - "about-you-form.tsx"
Cohesion: 0.18
Nodes (17): AboutYouForm(), onSubmit(), src_app_register_details_about_you_module, saveProfile(), SaveProfileState, FACULTIES, facultyRole(), ProfileDetails (+9 more)

### Community 27 - "register/page.tsx"
Cohesion: 0.08
Nodes (29): react-dom, @supabase/ssr, src_app_about_about_module, gallery, metadata, values, collected, metadata (+21 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom, sharp, @supabase/ssr (+2 more)

### Community 29 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, db:types, dev, lint, start, test, test:visual (+2 more)

### Community 30 - "site-header.tsx"
Cohesion: 0.08
Nodes (23): @vercel/analytics, src_app_announcements_announcements_module, AnnouncementsPage(), metadata, GET(), signOut(), src_app_globals, metadata (+15 more)

### Community 33 - "event-form.tsx"
Cohesion: 0.24
Nodes (8): EventForm(), onCover(), pickFile(), EventFormValues, LOADED_AT, noSubscribe(), shrink(), toIso()

### Community 35 - "PRD: Auto-assign Discord `verified` role"
Cohesion: 0.14
Nodes (13): 1. Problem, 2. Goal, 3. Scope, 4. User stories, 5.1 Database (chulacraft-web, new migration), 5.2 Bot (chulacraft-discord), 5.3 Discord server setup, 5. Design (+5 more)

### Community 40 - "achievements/events/[id]/page.tsx"
Cohesion: 0.29
Nodes (9): AdminEventPage(), DONE, ERRORS, AdminAchievementPage(), DONE, ERRORS, publicImageUrl(), AdminAchievementsPage() (+1 more)

### Community 41 - "src_app_admin_admin_module"
Cohesion: 0.20
Nodes (4): src_app_admin_admin_module, AdminAnnouncementsPage(), ERRORS, state()

### Community 42 - "icons.tsx"
Cohesion: 0.18
Nodes (6): PlayersPage(), SearchHit, src_app_players_players_module, IconProps, PIXEL_PATHS, PixelIconName

### Community 43 - "PixelIcon"
Cohesion: 0.29
Nodes (8): AdminPlayersPage(), Fn, kind(), Newest, UserRow, PixelIcon(), VerificationBadge(), VerificationKind

## Knowledge Gaps
- **230 isolated node(s):** `nextConfig`, `name`, `private`, `node`, `version` (+225 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 312 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `createClient`, `vitest`, `minecraft/route.ts`, `package.json`, `overview.tsx`, `achievements/events/[id]/actions.ts`, `app/page.tsx`, `dashboard/page.tsx`, `registration.ts`, `app/events/[id]/page.tsx`, `announcements/[id]/page.tsx`, `users/[id]/page.tsx`, `server/page.tsx`, `about-you-form.tsx`, `register/page.tsx`, `site-header.tsx`, `event-form.tsx`, `achievements/events/[id]/page.tsx`, `src_app_admin_admin_module`, `icons.tsx`, `PixelIcon`?**
  _High betweenness centrality (0.248) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `vitest`, `minecraft/route.ts`, `overview.tsx`, `achievements/events/[id]/actions.ts`, `achievements/events/[id]/page.tsx`, `src_app_admin_admin_module`, `icons.tsx`, `PixelIcon`, `dashboard/page.tsx`, `registration.ts`, `app/events/[id]/page.tsx`, `announcements/[id]/page.tsx`, `next`, `users/[id]/page.tsx`, `server/page.tsx`, `register/page.tsx`, `site-header.tsx`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `createClient`, `minecraft/route.ts`, `package.json`, `overview.tsx`, `achievements/events/[id]/actions.ts`, `app/page.tsx`, `dashboard/page.tsx`, `registration.ts`, `app/events/[id]/page.tsx`, `announcements/[id]/page.tsx`, `server/page.tsx`, `about-you-form.tsx`, `register/page.tsx`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _230 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.1024390243902439 - nodes in this community are weakly interconnected._
- **Should `vitest` be split into smaller, more focused modules?**
  _Cohesion score 0.07890070921985816 - nodes in this community are weakly interconnected._
- **Should `minecraft/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10752688172043011 - nodes in this community are weakly interconnected._