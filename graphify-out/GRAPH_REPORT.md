# Graph Report - chulacraft-web  (2026-10-17)

## Corpus Check
- 303 files · ~211,984 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 32 file(s) not represented in the graph (top: .css 26, (none) 2, .toml 2)

## Summary
- 1249 nodes · 3239 edges · 58 communities (45 shown, 13 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 89 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `df181884`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- banner-form.tsx
- server.ts
- registration.ts
- package.json
- player/[id]/page.tsx
- compilerOptions
- next
- devDependencies
- local-mocks.mjs
- ChulaCraft Web Version 1.0
- Tables
- dashboard/page.tsx
- next_dev_types_root_params_d
- vitest
- award/page.tsx
- Chulacraft registration runbook
- CLAUDE.md
- supabase/README.md
- about-you-form.tsx
- app/page.tsx
- submit-button.tsx
- createClient
- requireVerifiedUser
- engines
- server/page.tsx
- users/[id]/page.tsx
- ref_next_dev_types_routes_d_ts
- audit/page.tsx
- dependencies
- scripts
- dbErrorCode
- next_dev_types_routes_d
- overrides
- dashboard/actions.ts
- src_app_about_you_about_you_module
- Phases
- next_types_root_params_d
- next_types_routes_d
- src_app_auth_error_auth_error_module
- src_app_not_found_module
- welcome/page.tsx
- staff-gate.ts
- chula.ts
- team/[id]/page.tsx
- site-content.ts
- reports/page.tsx
- app/events/[id]/page.tsx
- src_app_admin_admin_module
- icons.tsx
- announcements/[id]/page.tsx
- site-header.tsx
- app/settings/page.tsx
- reconcile-identities.test.ts
- Review Focus
- command-search.tsx
- admin-nav.tsx
- sign-out-button.tsx
- app/players/page.tsx

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 156 edges
2. `next` - 103 edges
3. `PixelIcon()` - 52 edges
4. `dbErrorCode()` - 52 edges
5. `vitest` - 41 edges
6. `react` - 24 edges
7. `SubmitButton()` - 23 edges
8. `publicImageUrl()` - 22 edges
9. `when()` - 19 edges
10. `requireArea()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `2. Gallery` --references--> `ConfirmAction()`  [INFERRED]
  docs/superpowers/plans/2026-10-17-v1.1-phase4-content.md → src/components/confirm-action.tsx
- `Task 2: CSV helper + export route` --references--> `dbErrorCode()`  [INFERRED]
  docs/superpowers/plans/2026-10-16-v1.1-phase2a-players-table.md → src/lib/db-error.ts
- `Local mock services` --references--> `reconcileIdentities()`  [INFERRED]
  README.md → src/lib/reconcile-identities.ts
- `Server actions` --references--> `decideAppeal()`  [INFERRED]
  docs/api.md → src/app/admin/appeals/actions.ts
- `Decisions` --references--> `publicImageUrl()`  [INFERRED]
  docs/superpowers/plans/2026-10-17-v1.1-phase4-content.md → src/app/admin/commu/achievements/images.ts

## Import Cycles
- None detected.

## Communities (58 total, 13 thin omitted)

### Community 0 - "banner-form.tsx"
Cohesion: 0.10
Nodes (28): sharp, Checked, checkFile(), deleteBanner(), saveBanner(), colors, gif(), m (+20 more)

### Community 1 - "server.ts"
Cohesion: 0.08
Nodes (33): @supabase/ssr, authErrorResponse(), GET(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok, AuthErrorPage(), metadata, AUTH_FAILURE_REASONS (+25 more)

### Community 2 - "registration.ts"
Cohesion: 0.09
Nodes (35): `/api/registration/minecraft` — player's Minecraft accounts, `GET /api/dev-login?as=<user>` — local only, `GET /auth/callback?code=…`, HTTP endpoints, DELETE(), GET(), PATCH(), POST() (+27 more)

### Community 3 - "package.json"
Cohesion: 0.13
Nodes (15): allowScripts, unrs-resolver@1.12.2, name, private, version, @emnapi/core, @emnapi/runtime, eslint (+7 more)

### Community 4 - "player/[id]/page.tsx"
Cohesion: 0.07
Nodes (43): 1. `eventHistory()` helper + test, 2. `ProfileBanner` component, 3. Public player page (`src/app/player/[id]/page.tsx`), 4. Report dialog, 5. Profile page (`src/app/dashboard/page.tsx`), 6. Motion, 7. Verify, Addendum — profile banners (2026-10-17, kaikub request) (+35 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "next"
Cohesion: 0.07
Nodes (25): nextConfig, next, ref_node_url, @vercel/analytics, src_app_announcements_announcements_module, AnnouncementsPage(), metadata, GET() (+17 more)

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
Cohesion: 0.11
Nodes (17): Accounts and identity, Audit, Content, Database, Minecraft whitelist, Moderation, Other services that use this database, Player-readable tables (+9 more)

### Community 11 - "dashboard/page.tsx"
Cohesion: 0.13
Nodes (19): Task 1: Show the Discord name everywhere, APPEAL_ERRORS, BanCard(), date(), MyBan, src_app_dashboard_dashboard_module, Banner, BANNER_ERRORS (+11 more)

### Community 13 - "vitest"
Cohesion: 0.05
Nodes (74): RFC-4180, 1. The URL is the state, 2. Columns declare what they can do, 3. Above the table, 4. Every value is a link, 5. One RPC per table, 6. States, Admin tables: the protocol (+66 more)

### Community 14 - "award/page.tsx"
Cohesion: 0.15
Nodes (24): addPlayers(), awardId(), confirmAward(), fail(), prefillInterested(), previewAward(), m, unique() (+16 more)

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.22
Nodes (8): Chulacraft registration runbook, Daily stats, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 18 - "about-you-form.tsx"
Cohesion: 0.14
Nodes (21): AboutYouForm(), onSubmit(), src_app_register_details_about_you_module, saveProfile(), SaveProfileState, AboutYouPage(), metadata, StepProgress() (+13 more)

### Community 19 - "app/page.tsx"
Cohesion: 0.07
Nodes (38): ref_node_dns, ref_node_net, GET(), src_app_events_events_module, EventsPage(), metadata, HomeHero(), src_app_home_module (+30 more)

### Community 20 - "submit-button.tsx"
Cohesion: 0.13
Nodes (14): DONE, ERRORS, metadata, metadata, ERRORS, metadata, RemovedRow, RestorePage() (+6 more)

### Community 21 - "createClient"
Cohesion: 0.30
Nodes (17): addGalleryImage(), alt(), deleteGalleryGroup(), deleteGalleryImage(), fail(), finish(), moveGalleryGroup(), moveGalleryImage() (+9 more)

### Community 22 - "requireVerifiedUser"
Cohesion: 0.48
Nodes (5): AdminLayout(), metadata, myRole, isStaff(), requireVerifiedUser()

### Community 24 - "server/page.tsx"
Cohesion: 0.11
Nodes (31): ref_node_crypto, ACTIONS, openConsole(), serverAction(), m, redirected(), ConsoleAction, grant() (+23 more)

### Community 25 - "users/[id]/page.tsx"
Cohesion: 0.11
Nodes (28): BAN_DURATIONS, banUser(), finish(), grantBanner(), liftBan(), markGuest(), PRIVACY_LEVELS, resetChula() (+20 more)

### Community 27 - "audit/page.tsx"
Cohesion: 0.23
Nodes (9): AdminAuditPage(), bangkokDay(), ENTITIES, Entry, metadata, Params, describeChange(), PRIVACY_FIELDS (+1 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom, sharp, @supabase/ssr (+2 more)

### Community 29 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, db:types, dev, dev:mocks, lint, start, test (+3 more)

### Community 30 - "dbErrorCode"
Cohesion: 0.05
Nodes (49): 1. Announcement images, 2. Gallery, 3. Team page, 4. Site settings, 5. Verify, Already covered (no work), Answers (kaikub, 2026-10-17) and what was built, Decisions (+41 more)

### Community 33 - "dashboard/actions.ts"
Cohesion: 0.20
Nodes (16): Pages, Server actions, Web API, finish(), LEVELS, otherId(), removeFriend(), respondFriendRequest() (+8 more)

### Community 35 - "Phases"
Cohesion: 0.15
Nodes (12): ChulaCraft Web v1.1 — Roadmap Spec, Decisions already made, Deferred (needs Minecraft server endpoint), Global constraints (every phase), Phase 1 — Quick fixes & admin navigation  → `plans/2026-10-16-v1.1-phase1-quick-fixes.md`, Phase 2 — Admin power tools, Phase 3 — Design system & UI redesign, Phase 4 — Content without a developer (+4 more)

### Community 40 - "welcome/page.tsx"
Cohesion: 0.19
Nodes (12): metadata, Step, StepKind, WelcomePage(), src_app_welcome_welcome_module, GoogleSignInButton(), LinkGoogleButton(), useGoogle() (+4 more)

### Community 41 - "staff-gate.ts"
Cohesion: 0.15
Nodes (12): Layout(), Layout(), Layout(), Layout(), Layout(), Layout(), Layout(), Layout() (+4 more)

### Community 42 - "chula.ts"
Cohesion: 0.28
Nodes (12): @supabase/supabase-js, unlinkPersonalGoogle(), byAge(), classifyIdentities(), identityEmail(), isChulaEmail(), LINK_ERRORS, LinkError (+4 more)

### Community 43 - "team/[id]/page.tsx"
Cohesion: 0.09
Nodes (42): AnnouncementPreview(), Saved, GroupPreview(), deleteTeamGeneration(), deleteTeamMember(), fail(), finish(), moveTeamGeneration() (+34 more)

### Community 44 - "site-content.ts"
Cohesion: 0.05
Nodes (54): src_app_about_about_module, AboutPage(), builtInGallery, metadata, values, normal(), savePage(), m (+46 more)

### Community 45 - "reports/page.tsx"
Cohesion: 0.29
Nodes (6): handleReport(), AdminReportsPage(), CATEGORIES, DONE, ERRORS, metadata

### Community 46 - "app/events/[id]/page.tsx"
Cohesion: 0.05
Nodes (47): react-dom, IMAGE_TYPES, EventForm(), onCover(), pickFile(), EventFormValues, LOADED_AT, noSubscribe() (+39 more)

### Community 47 - "src_app_admin_admin_module"
Cohesion: 0.17
Nodes (3): src_app_admin_admin_module, AdminEventsPage(), metadata

### Community 48 - "icons.tsx"
Cohesion: 0.12
Nodes (23): AdminAppealsPage(), DONE, ERRORS, metadata, AdminAchievementsPage(), metadata, AdminAnnouncementsPage(), ERRORS (+15 more)

### Community 49 - "announcements/[id]/page.tsx"
Cohesion: 0.20
Nodes (12): AdminAchievementPage(), publicImageUrl(), AdminAnnouncementPage(), DONE, ERRORS, metadata, AdminEventPage(), DONE (+4 more)

### Community 50 - "site-header.tsx"
Cohesion: 0.29
Nodes (6): react, AnnouncementBanner(), dismissedId(), subscribe(), Brand(), HeaderShell()

### Community 51 - "app/settings/page.tsx"
Cohesion: 0.19
Nodes (12): ServiceUnavailable(), metadata, Privacy, PRIVACY_ERRORS, SettingsPage(), metadata, { getUser, getUserIdentities, rpc, redirect, reconcileIdentities }, page() (+4 more)

### Community 52 - "reconcile-identities.test.ts"
Cohesion: 0.17
Nodes (8): admin, cu, discord, gmail, m, query, run(), session

### Community 53 - "Review Focus"
Cohesion: 0.25
Nodes (7): Final, Global Constraints, Review Focus, Task 2: Hero copy, Task 3: Readable admin stat numbers, Task 4: Move community admin to `/admin/commu/*`, v1.1 Phase 1 — Quick Fixes & Admin Navigation Implementation Plan

### Community 54 - "command-search.tsx"
Cohesion: 0.31
Nodes (7): adminSearch(), day(), SearchHit, m, CommandSearch(), Item, src_app_admin_search_search_module

### Community 55 - "admin-nav.tsx"
Cohesion: 0.47
Nodes (5): Task 5: Grouped admin nav, AdminNav(), ALL_GROUPS, groupsFor(), NavLinks()

### Community 58 - "app/players/page.tsx"
Cohesion: 0.33
Nodes (4): metadata, PlayersPage(), SearchHit, src_app_players_players_module

## Knowledge Gaps
- **358 isolated node(s):** `nextConfig`, `name`, `private`, `node`, `version` (+353 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 452 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `banner-form.tsx`, `server.ts`, `registration.ts`, `package.json`, `player/[id]/page.tsx`, `dashboard/page.tsx`, `vitest`, `award/page.tsx`, `about-you-form.tsx`, `app/page.tsx`, `submit-button.tsx`, `createClient`, `requireVerifiedUser`, `server/page.tsx`, `users/[id]/page.tsx`, `audit/page.tsx`, `dbErrorCode`, `dashboard/actions.ts`, `welcome/page.tsx`, `staff-gate.ts`, `team/[id]/page.tsx`, `site-content.ts`, `reports/page.tsx`, `app/events/[id]/page.tsx`, `src_app_admin_admin_module`, `icons.tsx`, `announcements/[id]/page.tsx`, `site-header.tsx`, `app/settings/page.tsx`, `command-search.tsx`, `sign-out-button.tsx`, `app/players/page.tsx`?**
  _High betweenness centrality (0.267) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `banner-form.tsx`, `server.ts`, `registration.ts`, `player/[id]/page.tsx`, `next`, `dashboard/page.tsx`, `vitest`, `award/page.tsx`, `app/page.tsx`, `submit-button.tsx`, `requireVerifiedUser`, `server/page.tsx`, `users/[id]/page.tsx`, `audit/page.tsx`, `dbErrorCode`, `dashboard/actions.ts`, `staff-gate.ts`, `chula.ts`, `team/[id]/page.tsx`, `site-content.ts`, `reports/page.tsx`, `app/events/[id]/page.tsx`, `src_app_admin_admin_module`, `icons.tsx`, `announcements/[id]/page.tsx`, `site-header.tsx`, `app/settings/page.tsx`, `command-search.tsx`, `sign-out-button.tsx`, `app/players/page.tsx`?**
  _High betweenness centrality (0.190) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `banner-form.tsx`, `server.ts`, `registration.ts`, `package.json`, `player/[id]/page.tsx`, `next`, `award/page.tsx`, `about-you-form.tsx`, `app/page.tsx`, `server/page.tsx`, `users/[id]/page.tsx`, `audit/page.tsx`, `dbErrorCode`, `dashboard/actions.ts`, `staff-gate.ts`, `chula.ts`, `site-content.ts`, `app/events/[id]/page.tsx`, `app/settings/page.tsx`, `reconcile-identities.test.ts`, `command-search.tsx`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _358 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `banner-form.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0990990990990991 - nodes in this community are weakly interconnected._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0841813135985199 - nodes in this community are weakly interconnected._
- **Should `registration.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09487179487179487 - nodes in this community are weakly interconnected._