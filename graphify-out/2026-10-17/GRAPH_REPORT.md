# Graph Report - chulacraft-web  (2026-10-17)

## Corpus Check
- 250 files · ~186,017 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 29 file(s) not represented in the graph (top: .css 23, (none) 2, .toml 2)

## Summary
- 1025 nodes · 2498 edges · 62 communities (47 shown, 15 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 75 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `be052fb2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- verify/page.tsx
- server.ts
- minecraft/route.ts
- package.json
- player/[id]/page.tsx
- compilerOptions
- icons.tsx
- devDependencies
- local-mocks.mjs
- ChulaCraft Web Version 1.0
- Tables
- chula.ts
- next_dev_types_root_params_d
- vitest
- award/page.tsx
- Chulacraft registration runbook
- CLAUDE.md
- supabase/README.md
- announcements/[id]/page.tsx
- server-status.ts
- PixelIcon
- privacy/page.tsx
- app/events/page.tsx
- engines
- server/page.tsx
- users/[id]/page.tsx
- ref_next_dev_types_routes_d_ts
- audit/page.tsx
- dependencies
- scripts
- settings/page.tsx
- next_dev_types_routes_d
- overrides
- commu/events/[id]/actions.ts
- src_app_about_you_about_you_module
- Phases
- next_types_root_params_d
- next_types_routes_d
- src_app_auth_error_auth_error_module
- src_app_not_found_module
- createClient
- submit-button.tsx
- next
- allowScripts
- admin/page.tsx
- restore/page.tsx
- app/events/[id]/page.tsx
- app/layout.tsx
- src_app_admin_admin_module
- achievements/[id]/page.tsx
- commu/announcements/page.tsx
- registration.ts
- announcement-banner.tsx
- reconcile-identities.test.ts
- staff-gate.ts
- app/events/[id]/actions.ts
- register/page.tsx
- dev-login/route.ts
- reports/page.tsx
- app/players/page.tsx
- discordName
- next.config.ts

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 114 edges
2. `next` - 82 edges
3. `PixelIcon()` - 43 edges
4. `dbErrorCode()` - 40 edges
5. `vitest` - 36 edges
6. `react` - 20 edges
7. `when()` - 19 edges
8. `createAdminClient()` - 16 edges
9. `compilerOptions` - 16 edges
10. `requireArea()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Task 2: CSV helper + export route` --references--> `dbErrorCode()`  [INFERRED]
  docs/superpowers/plans/2026-10-16-v1.1-phase2a-players-table.md → src/lib/db-error.ts
- `Local mock services` --references--> `reconcileIdentities()`  [INFERRED]
  README.md → src/lib/reconcile-identities.ts
- `Server actions` --references--> `decideAppeal()`  [INFERRED]
  docs/api.md → src/app/admin/appeals/actions.ts
- `Task 4: Bulk actions` --references--> `selectionParam()`  [INFERRED]
  docs/superpowers/plans/2026-10-16-v1.1-phase2a-players-table.md → src/app/admin/commu/achievements/selection.ts
- `Task 3: Players table with filters, sort, infinite scroll` --references--> `StatRow()`  [INFERRED]
  docs/superpowers/plans/2026-10-16-v1.1-phase2a-players-table.md → src/app/admin/overview.tsx

## Import Cycles
- None detected.

## Communities (62 total, 15 thin omitted)

### Community 0 - "verify/page.tsx"
Cohesion: 0.29
Nodes (7): metadata, { getUser, getUserIdentities, rpc, redirect, reconcileIdentities }, page(), VerifyPage(), src_app_verify_verify_module, StepProgress(), linkErrorMessage()

### Community 1 - "server.ts"
Cohesion: 0.06
Nodes (45): @supabase/ssr, authErrorResponse(), GET(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok, AuthErrorPage(), metadata, src_app_home_module (+37 more)

### Community 2 - "minecraft/route.ts"
Cohesion: 0.10
Nodes (33): `/api/registration/minecraft` — player's Minecraft accounts, AdminUserPage(), DELETE(), GET(), PATCH(), POST(), Profile, resolveMinecraftProfile() (+25 more)

### Community 3 - "package.json"
Cohesion: 0.14
Nodes (14): name, private, version, @emnapi/core, @emnapi/runtime, eslint, eslint-config-next, @eslint/js (+6 more)

### Community 4 - "player/[id]/page.tsx"
Cohesion: 0.15
Nodes (22): blockPlayer(), finish(), playerId(), removeFriend(), reportPlayer(), respondFriendRequest(), sendFriendRequest(), ask() (+14 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "icons.tsx"
Cohesion: 0.17
Nodes (10): AdminEventsPage(), metadata, GoogleSignInButton(), LinkGoogleButton(), useGoogle(), start(), CUIcon(), GoogleIcon() (+2 more)

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
Cohesion: 0.24
Nodes (14): @supabase/supabase-js, unlinkPersonalGoogle(), SettingsPage(), WelcomePage(), byAge(), classifyIdentities(), identityEmail(), isChulaEmail() (+6 more)

### Community 13 - "vitest"
Cohesion: 0.05
Nodes (74): RFC-4180, 1. The URL is the state, 2. Columns declare what they can do, 3. Above the table, 4. Every value is a link, 5. One RPC per table, 6. States, Admin tables: the protocol (+66 more)

### Community 14 - "award/page.tsx"
Cohesion: 0.15
Nodes (23): addPlayers(), awardId(), confirmAward(), fail(), prefillInterested(), previewAward(), m, unique() (+15 more)

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.22
Nodes (8): Chulacraft registration runbook, Daily stats, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 18 - "announcements/[id]/page.tsx"
Cohesion: 0.19
Nodes (14): deleteAnnouncement(), postedId(), refresh(), saveAnnouncement(), SEVERITIES, form(), m, valid() (+6 more)

### Community 19 - "server-status.ts"
Cohesion: 0.30
Nodes (12): ref_node_dns, ref_node_net, packet(), parseStatusResponse(), pingServer(), readVarInt(), resolveTarget(), ServerStatus (+4 more)

### Community 20 - "PixelIcon"
Cohesion: 0.12
Nodes (18): APPEAL_ERRORS, BanCard(), date(), MyBan, src_app_dashboard_dashboard_module, metadata, Profile, Social (+10 more)

### Community 21 - "privacy/page.tsx"
Cohesion: 0.23
Nodes (9): collected, metadata, PrivacyPage(), metadata, TermsPage(), LEGAL_EFFECTIVE_DATE, LegalPage(), src_components_legal_page_module (+1 more)

### Community 22 - "app/events/page.tsx"
Cohesion: 0.20
Nodes (8): src_app_about_about_module, gallery, metadata, values, src_app_events_events_module, EventsPage(), metadata, discordCommunityUrl

### Community 24 - "server/page.tsx"
Cohesion: 0.11
Nodes (31): ref_node_crypto, ACTIONS, openConsole(), serverAction(), m, redirected(), ConsoleAction, grant() (+23 more)

### Community 25 - "users/[id]/page.tsx"
Cohesion: 0.07
Nodes (45): react, BAN_DURATIONS, banUser(), finish(), liftBan(), markGuest(), PRIVACY_LEVELS, resetChula() (+37 more)

### Community 27 - "audit/page.tsx"
Cohesion: 0.23
Nodes (9): AdminAuditPage(), bangkokDay(), ENTITIES, Entry, metadata, Params, describeChange(), PRIVACY_FIELDS (+1 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom, sharp, @supabase/ssr (+2 more)

### Community 29 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, db:types, dev, dev:mocks, lint, start, test (+3 more)

### Community 30 - "settings/page.tsx"
Cohesion: 0.19
Nodes (12): ServiceUnavailable(), AboutYouPage(), metadata, metadata, Privacy, PRIVACY_ERRORS, metadata, Step (+4 more)

### Community 33 - "commu/events/[id]/actions.ts"
Cohesion: 0.10
Nodes (23): deleteAchievement(), finish(), postedId(), revokeAward(), saveAchievement(), form(), m, valid() (+15 more)

### Community 35 - "Phases"
Cohesion: 0.15
Nodes (12): ChulaCraft Web v1.1 — Roadmap Spec, Decisions already made, Deferred (needs Minecraft server endpoint), Global constraints (every phase), Phase 1 — Quick fixes & admin navigation  → `plans/2026-10-16-v1.1-phase1-quick-fixes.md`, Phase 2 — Admin power tools, Phase 3 — Design system & UI redesign, Phase 4 — Content without a developer (+4 more)

### Community 40 - "createClient"
Cohesion: 0.24
Nodes (15): Server actions, Moderation, finish(), LEVELS, otherId(), removeFriend(), respondFriendRequest(), submitAppeal() (+7 more)

### Community 41 - "submit-button.tsx"
Cohesion: 0.22
Nodes (7): AdminAppealsPage(), DONE, ERRORS, metadata, metadata, Props, SubmitButton()

### Community 42 - "next"
Cohesion: 0.21
Nodes (6): next, signOut(), Brand(), SignOutButton(), HeaderShell(), NavLinks()

### Community 44 - "admin/page.tsx"
Cohesion: 0.24
Nodes (10): Task 5: Clickable dashboard numbers + real Unverified / Guest cards, StatRow(), Stats, timeSince(), Tool, ToolCards(), Activity, AdminPage() (+2 more)

### Community 45 - "restore/page.tsx"
Cohesion: 0.22
Nodes (7): restoreAccount(), m, redirected(), ERRORS, metadata, RemovedRow, RestorePage()

### Community 46 - "app/events/[id]/page.tsx"
Cohesion: 0.07
Nodes (35): react-dom, EventForm(), onCover(), pickFile(), EventFormValues, LOADED_AT, noSubscribe(), shrink() (+27 more)

### Community 47 - "app/layout.tsx"
Cohesion: 0.29
Nodes (7): @vercel/analytics, src_app_globals, metadata, bodyFont, displayFont, monoFont, thaiFont

### Community 49 - "achievements/[id]/page.tsx"
Cohesion: 0.21
Nodes (12): AdminAchievementPage(), DONE, ERRORS, metadata, publicImageUrl(), AdminAchievementsPage(), metadata, AdminEventPage() (+4 more)

### Community 50 - "commu/announcements/page.tsx"
Cohesion: 0.50
Nodes (4): AdminAnnouncementsPage(), ERRORS, metadata, state()

### Community 51 - "registration.ts"
Cohesion: 0.36
Nodes (6): decideAppeal(), handleReport(), dbErrorCode(), MINECRAFT_USERNAME_PATTERN, SyncStatus, UUID

### Community 52 - "announcement-banner.tsx"
Cohesion: 0.29
Nodes (7): src_app_announcements_announcements_module, AnnouncementsPage(), metadata, AnnouncementBanner(), dismissedId(), subscribe(), SEVERITY

### Community 53 - "reconcile-identities.test.ts"
Cohesion: 0.17
Nodes (8): admin, cu, discord, gmail, m, query, run(), session

### Community 54 - "staff-gate.ts"
Cohesion: 0.07
Nodes (33): Final, Global Constraints, Review Focus, Task 2: Hero copy, Task 3: Readable admin stat numbers, Task 4: Move community admin to `/admin/commu/*`, Task 5: Grouped admin nav, v1.1 Phase 1 — Quick Fixes & Admin Navigation Implementation Plan (+25 more)

### Community 55 - "app/events/[id]/actions.ts"
Cohesion: 0.31
Nodes (8): eventId(), signInPath(), form(), interested(), m, redirected(), toggleInterest(), UPCOMING_EVENTS_TAG

### Community 56 - "register/page.tsx"
Cohesion: 0.31
Nodes (6): metadata, RegisterPage(), { getUser, redirect }, src_app_register_register_module, DiscordAuthButton(), DiscordIcon()

### Community 57 - "dev-login/route.ts"
Cohesion: 0.48
Nodes (4): GET(), SiteFooter(), DEV_LOGIN_ENABLED, DEV_USERS

### Community 58 - "reports/page.tsx"
Cohesion: 0.33
Nodes (5): AdminReportsPage(), CATEGORIES, DONE, ERRORS, metadata

### Community 59 - "app/players/page.tsx"
Cohesion: 0.33
Nodes (4): metadata, PlayersPage(), SearchHit, src_app_players_players_module

### Community 60 - "discordName"
Cohesion: 0.60
Nodes (5): Task 1: Show the Discord name everywhere, DashboardPage(), SiteHeader(), discordAvatar(), discordName()

## Knowledge Gaps
- **308 isolated node(s):** `nextConfig`, `name`, `private`, `node`, `version` (+303 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 398 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `verify/page.tsx`, `server.ts`, `minecraft/route.ts`, `package.json`, `player/[id]/page.tsx`, `icons.tsx`, `vitest`, `award/page.tsx`, `announcements/[id]/page.tsx`, `PixelIcon`, `privacy/page.tsx`, `app/events/page.tsx`, `server/page.tsx`, `users/[id]/page.tsx`, `audit/page.tsx`, `settings/page.tsx`, `commu/events/[id]/actions.ts`, `createClient`, `submit-button.tsx`, `admin/page.tsx`, `restore/page.tsx`, `app/events/[id]/page.tsx`, `app/layout.tsx`, `achievements/[id]/page.tsx`, `commu/announcements/page.tsx`, `registration.ts`, `announcement-banner.tsx`, `staff-gate.ts`, `app/events/[id]/actions.ts`, `register/page.tsx`, `dev-login/route.ts`, `reports/page.tsx`, `app/players/page.tsx`, `next.config.ts`?**
  _High betweenness centrality (0.259) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `verify/page.tsx`, `server.ts`, `minecraft/route.ts`, `player/[id]/page.tsx`, `icons.tsx`, `chula.ts`, `vitest`, `award/page.tsx`, `announcements/[id]/page.tsx`, `app/events/page.tsx`, `server/page.tsx`, `users/[id]/page.tsx`, `audit/page.tsx`, `settings/page.tsx`, `commu/events/[id]/actions.ts`, `submit-button.tsx`, `next`, `admin/page.tsx`, `restore/page.tsx`, `app/events/[id]/page.tsx`, `achievements/[id]/page.tsx`, `commu/announcements/page.tsx`, `registration.ts`, `announcement-banner.tsx`, `staff-gate.ts`, `app/events/[id]/actions.ts`, `register/page.tsx`, `dev-login/route.ts`, `reports/page.tsx`, `app/players/page.tsx`, `discordName`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `verify/page.tsx`, `server.ts`, `minecraft/route.ts`, `package.json`, `player/[id]/page.tsx`, `chula.ts`, `award/page.tsx`, `announcements/[id]/page.tsx`, `server-status.ts`, `privacy/page.tsx`, `server/page.tsx`, `users/[id]/page.tsx`, `audit/page.tsx`, `commu/events/[id]/actions.ts`, `createClient`, `restore/page.tsx`, `app/events/[id]/page.tsx`, `registration.ts`, `reconcile-identities.test.ts`, `staff-gate.ts`, `app/events/[id]/actions.ts`, `register/page.tsx`, `next.config.ts`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _308 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05687645687645688 - nodes in this community are weakly interconnected._
- **Should `minecraft/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09759759759759759 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.14166666666666666 - nodes in this community are weakly interconnected._