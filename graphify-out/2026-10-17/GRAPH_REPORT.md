# Graph Report - chulacraft-web  (2026-10-17)

## Corpus Check
- 228 files · ~178,506 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 28 file(s) not represented in the graph (top: .css 22, (none) 2, .toml 2)

## Summary
- 969 nodes · 2312 edges · 58 communities (44 shown, 14 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 74 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a035062e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- users/[id]/page.tsx
- server.ts
- registration.ts
- package.json
- createClient
- compilerOptions
- commu/announcements/page.tsx
- devDependencies
- local-mocks.mjs
- ChulaCraft Web Version 1.0
- Tables
- chula.ts
- next_dev_types_root_params_d
- player-table.tsx
- award/page.tsx
- Chulacraft registration runbook
- CLAUDE.md
- supabase/README.md
- app/events/[id]/page.tsx
- react
- PixelIcon
- welcome/page.tsx
- announcements/[id]/page.tsx
- engines
- server/page.tsx
- about-you-form.tsx
- ref_next_dev_types_routes_d_ts
- error-screen.tsx
- dependencies
- scripts
- app/layout.tsx
- next_dev_types_routes_d
- overrides
- commu/events/[id]/actions.ts
- src_app_about_you_about_you_module
- Phases
- next_types_root_params_d
- next_types_routes_d
- src_app_auth_error_auth_error_module
- src_app_not_found_module
- src_app_admin_admin_module
- commu/events/[id]/page.tsx
- verify/page.tsx
- allowScripts
- audit/page.tsx
- overview.tsx
- next
- app/players/page.tsx
- achievements/[id]/page.tsx
- reports/page.tsx
- dev-login/route.ts
- details/page.tsx
- appeals/page.tsx
- reconcile-identities.test.ts
- site-header.tsx
- announcement-banner.tsx
- Review Focus
- icons.tsx

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 108 edges
2. `next` - 80 edges
3. `PixelIcon()` - 41 edges
4. `dbErrorCode()` - 39 edges
5. `vitest` - 33 edges
6. `when()` - 19 edges
7. `react` - 16 edges
8. `createAdminClient()` - 16 edges
9. `compilerOptions` - 16 edges
10. `SubmitButton()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Task 2: CSV helper + export route` --references--> `dbErrorCode()`  [INFERRED]
  docs/superpowers/plans/2026-10-16-v1.1-phase2a-players-table.md → src/lib/db-error.ts
- `Local mock services` --references--> `reconcileIdentities()`  [INFERRED]
  README.md → src/lib/reconcile-identities.ts
- `Task 4: Bulk actions` --references--> `selectionParam()`  [INFERRED]
  docs/superpowers/plans/2026-10-16-v1.1-phase2a-players-table.md → src/app/admin/commu/achievements/selection.ts
- `Server actions` --references--> `serverAction()`  [INFERRED]
  docs/api.md → src/app/admin/server/actions.ts
- `Server actions` --references--> `openConsole()`  [INFERRED]
  docs/api.md → src/app/admin/server/actions.ts

## Import Cycles
- None detected.

## Communities (58 total, 14 thin omitted)

### Community 0 - "users/[id]/page.tsx"
Cohesion: 0.14
Nodes (19): BAN_DURATIONS, banUser(), finish(), liftBan(), markGuest(), resetChula(), setRole(), setWhitelisted() (+11 more)

### Community 1 - "server.ts"
Cohesion: 0.06
Nodes (49): @supabase/ssr, vitest, ERRORS, metadata, RemovedRow, RestorePage(), authErrorResponse(), GET() (+41 more)

### Community 2 - "registration.ts"
Cohesion: 0.10
Nodes (36): `/api/registration/minecraft` — player's Minecraft accounts, AdminUserPage(), DELETE(), GET(), PATCH(), POST(), Profile, resolveMinecraftProfile() (+28 more)

### Community 3 - "package.json"
Cohesion: 0.14
Nodes (14): name, private, version, @emnapi/core, @emnapi/runtime, eslint, eslint-config-next, @eslint/js (+6 more)

### Community 4 - "createClient"
Cohesion: 0.07
Nodes (48): Server actions, Moderation, decideAppeal(), handleReport(), restoreAccount(), m, redirected(), signOut() (+40 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "commu/announcements/page.tsx"
Cohesion: 0.50
Nodes (4): AdminAnnouncementsPage(), ERRORS, metadata, state()

### Community 7 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, @eslint/js, @playwright/test, @types/node, @types/react, @types/react-dom (+3 more)

### Community 8 - "local-mocks.mjs"
Cohesion: 0.07
Nodes (35): RFC-6455, ref_node_child_process, ref_node_fs, ref_node_http, ref_node_path, @playwright/test, shots, ACTION_BITS (+27 more)

### Community 9 - "ChulaCraft Web Version 1.0"
Cohesion: 0.10
Nodes (19): Architecture, Chula verification (Google), ChulaCraft Web Version 1.0, Commands, Current implementation caveats, Deployment, Discord authentication, Environment (+11 more)

### Community 10 - "Tables"
Cohesion: 0.09
Nodes (21): `GET /api/dev-login?as=<user>` — local only, `GET /auth/callback?code=…`, HTTP endpoints, Pages, Web API, Accounts and identity, Audit, Content (+13 more)

### Community 11 - "chula.ts"
Cohesion: 0.25
Nodes (14): @supabase/supabase-js, unlinkPersonalGoogle(), SettingsPage(), byAge(), classifyIdentities(), identityEmail(), isChulaEmail(), LINK_ERRORS (+6 more)

### Community 13 - "player-table.tsx"
Cohesion: 0.05
Nodes (71): RFC-4180, 1. The URL is the state, 2. Columns declare what they can do, 3. Above the table, 4. Every value is a link, 5. One RPC per table, 6. States, Admin tables: the protocol (+63 more)

### Community 14 - "award/page.tsx"
Cohesion: 0.15
Nodes (23): addPlayers(), awardId(), confirmAward(), fail(), prefillInterested(), previewAward(), m, unique() (+15 more)

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.22
Nodes (8): Chulacraft registration runbook, Daily stats, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 18 - "app/events/[id]/page.tsx"
Cohesion: 0.06
Nodes (34): src_app_about_about_module, gallery, metadata, values, src_app_events_events_module, src_app_events_id_event_module, clock(), day() (+26 more)

### Community 19 - "react"
Cohesion: 0.15
Nodes (19): ref_node_dns, ref_node_net, react, CopyButton(), src_components_copy_button_module, serverAddress, ServerAddressRow(), ServerStatus (+11 more)

### Community 20 - "PixelIcon"
Cohesion: 0.13
Nodes (18): APPEAL_ERRORS, BanCard(), date(), MyBan, src_app_dashboard_dashboard_module, metadata, Profile, Social (+10 more)

### Community 21 - "welcome/page.tsx"
Cohesion: 0.24
Nodes (10): Task 1: Show the Discord name everywhere, DashboardPage(), metadata, Step, StepKind, WelcomePage(), src_app_welcome_welcome_module, SiteHeader() (+2 more)

### Community 22 - "announcements/[id]/page.tsx"
Cohesion: 0.19
Nodes (14): deleteAnnouncement(), postedId(), refresh(), saveAnnouncement(), SEVERITIES, form(), m, valid() (+6 more)

### Community 24 - "server/page.tsx"
Cohesion: 0.11
Nodes (31): ref_node_crypto, ACTIONS, openConsole(), serverAction(), m, redirected(), ConsoleAction, grant() (+23 more)

### Community 25 - "about-you-form.tsx"
Cohesion: 0.18
Nodes (17): AboutYouForm(), onSubmit(), src_app_register_details_about_you_module, saveProfile(), SaveProfileState, FACULTIES, facultyRole(), ProfileDetails (+9 more)

### Community 27 - "error-screen.tsx"
Cohesion: 0.22
Nodes (5): metadata, Action, ErrorScreen(), Href, src_components_error_screen_module

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom, sharp, @supabase/ssr (+2 more)

### Community 29 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, db:types, dev, dev:mocks, lint, start, test (+3 more)

### Community 30 - "app/layout.tsx"
Cohesion: 0.27
Nodes (7): @vercel/analytics, src_app_globals, metadata, SiteFooter(), bodyFont, displayFont, monoFont

### Community 33 - "commu/events/[id]/actions.ts"
Cohesion: 0.07
Nodes (31): deleteAchievement(), finish(), postedId(), revokeAward(), saveAchievement(), form(), m, valid() (+23 more)

### Community 35 - "Phases"
Cohesion: 0.15
Nodes (12): ChulaCraft Web v1.1 — Roadmap Spec, Decisions already made, Deferred (needs Minecraft server endpoint), Global constraints (every phase), Phase 1 — Quick fixes & admin navigation  → `plans/2026-10-16-v1.1-phase1-quick-fixes.md`, Phase 2 — Admin power tools, Phase 3 — Design system & UI redesign, Phase 4 — Content without a developer (+4 more)

### Community 41 - "commu/events/[id]/page.tsx"
Cohesion: 0.29
Nodes (9): AdminAchievementPage(), publicImageUrl(), AdminAchievementsPage(), metadata, AdminEventPage(), DONE, ERRORS, metadata (+1 more)

### Community 42 - "verify/page.tsx"
Cohesion: 0.25
Nodes (7): react-dom, metadata, { getUser, getUserIdentities, rpc, redirect, reconcileIdentities }, page(), VerifyPage(), src_app_verify_verify_module, SignOutButton()

### Community 44 - "audit/page.tsx"
Cohesion: 0.25
Nodes (8): AdminAuditPage(), bangkokDay(), ENTITIES, Entry, metadata, Params, describeChange(), PROFILE_FIELDS

### Community 45 - "overview.tsx"
Cohesion: 0.27
Nodes (9): Stats, timeSince(), Tool, ToolCards(), Activity, AdminPage(), metadata, playersHref() (+1 more)

### Community 46 - "next"
Cohesion: 0.29
Nodes (3): nextConfig, next, ref_node_url

### Community 47 - "app/players/page.tsx"
Cohesion: 0.33
Nodes (4): metadata, PlayersPage(), SearchHit, src_app_players_players_module

### Community 48 - "achievements/[id]/page.tsx"
Cohesion: 0.22
Nodes (8): DONE, ERRORS, metadata, metadata, ConfirmAction(), Props, Props, SubmitButton()

### Community 49 - "reports/page.tsx"
Cohesion: 0.33
Nodes (5): AdminReportsPage(), CATEGORIES, DONE, ERRORS, metadata

### Community 50 - "dev-login/route.ts"
Cohesion: 0.60
Nodes (3): GET(), DEV_LOGIN_ENABLED, DEV_USERS

### Community 51 - "details/page.tsx"
Cohesion: 0.29
Nodes (7): AdminLayout(), metadata, AboutYouPage(), metadata, StepProgress(), toStudyLevel(), requireVerifiedUser()

### Community 52 - "appeals/page.tsx"
Cohesion: 0.40
Nodes (4): AdminAppealsPage(), DONE, ERRORS, metadata

### Community 53 - "reconcile-identities.test.ts"
Cohesion: 0.17
Nodes (8): admin, cu, discord, gmail, m, query, run(), session

### Community 54 - "site-header.tsx"
Cohesion: 0.27
Nodes (6): Task 5: Grouped admin nav, AdminNav(), GROUPS, Brand(), HeaderShell(), NavLinks()

### Community 55 - "announcement-banner.tsx"
Cohesion: 0.29
Nodes (7): src_app_announcements_announcements_module, AnnouncementsPage(), metadata, AnnouncementBanner(), dismissedId(), subscribe(), SEVERITY

### Community 56 - "Review Focus"
Cohesion: 0.25
Nodes (7): Final, Global Constraints, Review Focus, Task 2: Hero copy, Task 3: Readable admin stat numbers, Task 4: Move community admin to `/admin/commu/*`, v1.1 Phase 1 — Quick Fixes & Admin Navigation Implementation Plan

### Community 59 - "icons.tsx"
Cohesion: 0.12
Nodes (16): AdminEventsPage(), metadata, LEVEL_OPTIONS, metadata, Privacy, PRIVACY_ERRORS, PRIVACY_FIELDS, GoogleSignInButton() (+8 more)

## Knowledge Gaps
- **303 isolated node(s):** `nextConfig`, `name`, `private`, `node`, `version` (+298 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 391 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `users/[id]/page.tsx`, `server.ts`, `registration.ts`, `package.json`, `createClient`, `commu/announcements/page.tsx`, `player-table.tsx`, `award/page.tsx`, `app/events/[id]/page.tsx`, `react`, `PixelIcon`, `welcome/page.tsx`, `announcements/[id]/page.tsx`, `server/page.tsx`, `about-you-form.tsx`, `error-screen.tsx`, `app/layout.tsx`, `commu/events/[id]/actions.ts`, `commu/events/[id]/page.tsx`, `verify/page.tsx`, `audit/page.tsx`, `overview.tsx`, `app/players/page.tsx`, `achievements/[id]/page.tsx`, `reports/page.tsx`, `dev-login/route.ts`, `details/page.tsx`, `appeals/page.tsx`, `site-header.tsx`, `announcement-banner.tsx`, `icons.tsx`?**
  _High betweenness centrality (0.264) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `users/[id]/page.tsx`, `server.ts`, `registration.ts`, `commu/announcements/page.tsx`, `chula.ts`, `player-table.tsx`, `award/page.tsx`, `app/events/[id]/page.tsx`, `welcome/page.tsx`, `announcements/[id]/page.tsx`, `server/page.tsx`, `commu/events/[id]/actions.ts`, `commu/events/[id]/page.tsx`, `verify/page.tsx`, `audit/page.tsx`, `overview.tsx`, `app/players/page.tsx`, `achievements/[id]/page.tsx`, `reports/page.tsx`, `dev-login/route.ts`, `details/page.tsx`, `appeals/page.tsx`, `site-header.tsx`, `announcement-banner.tsx`, `icons.tsx`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **Why does `vitest` connect `server.ts` to `users/[id]/page.tsx`, `commu/events/[id]/actions.ts`, `registration.ts`, `package.json`, `createClient`, `verify/page.tsx`, `chula.ts`, `audit/page.tsx`, `player-table.tsx`, `award/page.tsx`, `next`, `app/events/[id]/page.tsx`, `react`, `reconcile-identities.test.ts`, `announcements/[id]/page.tsx`, `server/page.tsx`, `about-you-form.tsx`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _303 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `users/[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1396011396011396 - nodes in this community are weakly interconnected._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05834464043419267 - nodes in this community are weakly interconnected._
- **Should `registration.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0975609756097561 - nodes in this community are weakly interconnected._