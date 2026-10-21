# Graph Report - chulacraft-web  (2026-10-21)

## Corpus Check
- 310 files · ~219,233 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 34 file(s) not represented in the graph (top: .css 27, (none) 2, .toml 2)

## Summary
- 1263 nodes · 3518 edges · 57 communities (55 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 89 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6d1b9243`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- banners/actions.test.ts
- callback/route.ts
- minecraft/route.ts
- package.json
- player/[id]/page.tsx
- compilerOptions
- SubmitButton
- devDependencies
- local-mocks.mjs
- ChulaCraft Web Version 1.0
- Tables
- next
- vitest
- admin/players/page.tsx
- dbErrorCode
- Chulacraft registration runbook
- CLAUDE.md
- supabase/README.md
- commu/events/[id]/actions.test.ts
- icons.tsx
- dashboard/page.tsx
- createClient
- publicImageUrl
- announcements/[id]/actions.ts
- server/page.tsx
- users/[id]/page.tsx
- dbErrorCode
- chula.ts
- dependencies
- scripts
- dashboard/actions.ts
- PixelIcon
- reconcile-identities.test.ts
- admin/page.tsx
- about-you-form.tsx
- Phases
- images.ts
- database.types.ts
- staff.ts
- audit/page.tsx
- players/actions.ts
- staff-gate.ts
- Tasks
- team/actions.ts
- site-content.ts
- command-search.tsx
- app/events/[id]/page.tsx
- achievements/[id]/actions.test.ts
- commu/events/[id]/actions.ts
- params.ts
- audit-page.ts
- player-table.tsx
- table-query.ts
- Review Focus
- server.ts
- app/players/page.tsx
- Admin tables: the protocol

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 158 edges
2. `PixelIcon()` - 112 edges
3. `next` - 106 edges
4. `dbErrorCode()` - 52 edges
5. `SubmitButton()` - 45 edges
6. `vitest` - 41 edges
7. `ConfirmAction()` - 31 edges
8. `react` - 27 edges
9. `publicImageUrl()` - 22 edges
10. `when()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Task 5: Clickable dashboard numbers + real Unverified / Guest cards` --references--> `StatRow()`  [INFERRED]
  docs/superpowers/plans/2026-10-16-v1.1-phase2a-players-table.md → src/app/admin/overview.tsx
- `2. Gallery` --references--> `ConfirmAction()`  [INFERRED]
  docs/superpowers/plans/2026-10-17-v1.1-phase4-content.md → src/components/confirm-action.tsx
- `Task 2: CSV helper + export route` --references--> `dbErrorCode()`  [INFERRED]
  docs/superpowers/plans/2026-10-16-v1.1-phase2a-players-table.md → src/lib/db-error.ts
- `Local mock services` --references--> `reconcileIdentities()`  [INFERRED]
  README.md → src/lib/reconcile-identities.ts
- `1. The URL is the state` --references--> `readTable()`  [INFERRED]
  docs/admin-tables.md → src/lib/table-query.ts

## Import Cycles
- None detected.

## Communities (57 total, 2 thin omitted)

### Community 0 - "banners/actions.test.ts"
Cohesion: 0.20
Nodes (7): sharp, shots, colors, gif(), m, png(), raw()

### Community 1 - "callback/route.ts"
Cohesion: 0.08
Nodes (31): @supabase/ssr, signOut(), authErrorResponse(), GET(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok, AuthErrorPage(), metadata (+23 more)

### Community 2 - "minecraft/route.ts"
Cohesion: 0.11
Nodes (29): `/api/registration/minecraft` — player's Minecraft accounts, DELETE(), GET(), PATCH(), POST(), Profile, resolveMinecraftProfile(), runtime (+21 more)

### Community 3 - "package.json"
Cohesion: 0.10
Nodes (20): allowScripts, unrs-resolver@1.12.2, engines, node, name, overrides, postcss, private (+12 more)

### Community 4 - "player/[id]/page.tsx"
Cohesion: 0.05
Nodes (58): 1. `eventHistory()` helper + test, 2. `ProfileBanner` component, 3. Public player page (`src/app/player/[id]/page.tsx`), 4. Report dialog, 5. Profile page (`src/app/dashboard/page.tsx`), 6. Motion, 7. Verify, Addendum — profile banners (2026-10-17, kaikub request) (+50 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "SubmitButton"
Cohesion: 0.09
Nodes (21): AdminAppealsPage(), metadata, NewAchievementPage(), metadata, GALLERY_DONE, GALLERY_ERRORS, AdminGalleryPage(), metadata (+13 more)

### Community 7 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, @eslint/js, @playwright/test, @types/node, @types/react, @types/react-dom (+3 more)

### Community 8 - "local-mocks.mjs"
Cohesion: 0.10
Nodes (25): RFC-6455, ACTION_BITS, addEnv(), checkToken(), codes, consoles, DISCORD_USERS, env (+17 more)

### Community 9 - "ChulaCraft Web Version 1.0"
Cohesion: 0.10
Nodes (19): Architecture, Chula verification (Google), ChulaCraft Web Version 1.0, Commands, Current implementation caveats, Deployment, Discord authentication, Environment (+11 more)

### Community 10 - "Tables"
Cohesion: 0.09
Nodes (21): `GET /api/dev-login?as=<user>` — local only, `GET /auth/callback?code=…`, HTTP endpoints, Pages, Web API, Accounts and identity, Audit, Content (+13 more)

### Community 11 - "next"
Cohesion: 0.06
Nodes (42): Final, Global Constraints, Review Focus, Task 1: Show the Discord name everywhere, Task 2: Hero copy, Task 3: Readable admin stat numbers, Task 4: Move community admin to `/admin/commu/*`, Task 5: Grouped admin nav (+34 more)

### Community 12 - "vitest"
Cohesion: 0.17
Nodes (13): RFC-4180, vitest, GET(), get(), m, rpcArgs(), form(), interested() (+5 more)

### Community 13 - "admin/players/page.tsx"
Cohesion: 0.36
Nodes (9): AdminPlayersPage(), metadata, hrefFor(), Ctx, FilterChips(), FilterPanel(), KeepState(), keysOf() (+1 more)

### Community 14 - "dbErrorCode"
Cohesion: 0.15
Nodes (23): addPlayers(), awardId(), confirmAward(), fail(), prefillInterested(), previewAward(), m, unique() (+15 more)

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.22
Nodes (8): Chulacraft registration runbook, Daily stats, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 18 - "commu/events/[id]/actions.test.ts"
Cohesion: 0.33
Nodes (3): form(), m, valid()

### Community 19 - "icons.tsx"
Cohesion: 0.06
Nodes (45): react, react-dom, AboutPage(), builtInGallery, metadata, values, GET(), HeroStage() (+37 more)

### Community 20 - "dashboard/page.tsx"
Cohesion: 0.15
Nodes (16): APPEAL_ERRORS, BanCard(), date(), MyBan, Banner, BANNER_ERRORS, DashboardPage(), metadata (+8 more)

### Community 21 - "createClient"
Cohesion: 0.35
Nodes (14): AdminEventsPage(), metadata, addGalleryImage(), alt(), deleteGalleryGroup(), deleteGalleryImage(), fail(), finish() (+6 more)

### Community 22 - "publicImageUrl"
Cohesion: 0.32
Nodes (7): Decisions, publicImageUrl(), AdminAchievementsPage(), metadata, AdminGalleryGroupPage(), AdminTeamGenerationPage(), toCard()

### Community 23 - "announcements/[id]/actions.ts"
Cohesion: 0.18
Nodes (14): IMAGE_TYPES, uploadPicture(), deleteAnnouncement(), postedId(), refresh(), saveAnnouncement(), SEVERITIES, form() (+6 more)

### Community 24 - "server/page.tsx"
Cohesion: 0.11
Nodes (30): ACTIONS, openConsole(), serverAction(), m, redirected(), ConsoleAction, grant(), managerFetch() (+22 more)

### Community 25 - "users/[id]/page.tsx"
Cohesion: 0.11
Nodes (29): BAN_DURATIONS, banUser(), finish(), grantBanner(), liftBan(), markGuest(), PRIVACY_LEVELS, resetChula() (+21 more)

### Community 26 - "dbErrorCode"
Cohesion: 0.15
Nodes (16): decideAppeal(), DONE, ERRORS, metadata, handleReport(), restoreAccount(), m, redirected() (+8 more)

### Community 27 - "chula.ts"
Cohesion: 0.28
Nodes (12): @supabase/supabase-js, unlinkPersonalGoogle(), byAge(), classifyIdentities(), identityEmail(), isChulaEmail(), LINK_ERRORS, LinkError (+4 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom, sharp, @supabase/ssr (+2 more)

### Community 29 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, db:types, dev, dev:mocks, lint, start, test (+3 more)

### Community 30 - "dashboard/actions.ts"
Cohesion: 0.22
Nodes (15): Server actions, Moderation, finish(), LEVELS, otherId(), removeFriend(), respondFriendRequest(), setBanner() (+7 more)

### Community 31 - "PixelIcon"
Cohesion: 0.14
Nodes (23): ServiceUnavailable(), AboutYouPage(), metadata, metadata, Privacy, PRIVACY_ERRORS, SettingsPage(), metadata (+15 more)

### Community 32 - "reconcile-identities.test.ts"
Cohesion: 0.17
Nodes (8): admin, cu, discord, gmail, m, query, run(), session

### Community 33 - "admin/page.tsx"
Cohesion: 0.21
Nodes (14): AdminAnnouncementsPage(), ERRORS, metadata, state(), StatRow(), Stats, timeSince(), Tool (+6 more)

### Community 34 - "about-you-form.tsx"
Cohesion: 0.18
Nodes (18): AboutYouForm(), onSubmit(), Field(), saveProfile(), SaveProfileState, FACULTIES, facultyRole(), ProfileDetails (+10 more)

### Community 35 - "Phases"
Cohesion: 0.15
Nodes (12): ChulaCraft Web v1.1 — Roadmap Spec, Decisions already made, Deferred (needs Minecraft server endpoint), Global constraints (every phase), Phase 1 — Quick fixes & admin navigation  → `plans/2026-10-16-v1.1-phase1-quick-fixes.md`, Phase 2 — Admin power tools, Phase 3 — Design system & UI redesign, Phase 4 — Content without a developer (+4 more)

### Community 36 - "images.ts"
Cohesion: 0.14
Nodes (20): deleteAchievement(), finish(), postedId(), revokeAward(), saveAchievement(), AdminAchievementPage(), DONE, ERRORS (+12 more)

### Community 37 - "database.types.ts"
Cohesion: 0.20
Nodes (9): CompositeTypes, Constants, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables, TablesInsert (+1 more)

### Community 38 - "staff.ts"
Cohesion: 0.24
Nodes (12): AdminNav(), ALL_GROUPS, groupsFor(), AdminLayout(), metadata, CommandSearch(), myRole, Area (+4 more)

### Community 39 - "audit/page.tsx"
Cohesion: 0.23
Nodes (9): AdminAuditPage(), bangkokDay(), ENTITIES, Entry, metadata, Params, describeChange(), PRIVACY_FIELDS (+1 more)

### Community 40 - "players/actions.ts"
Cohesion: 0.31
Nodes (10): Task 4: Bulk actions, bulkBan(), bulkMarkGuest(), BulkResult, each(), m, AchievementOption, BulkBar() (+2 more)

### Community 41 - "staff-gate.ts"
Cohesion: 0.22
Nodes (9): Layout(), Layout(), Layout(), Layout(), Layout(), Layout(), Layout(), Layout() (+1 more)

### Community 42 - "Tasks"
Cohesion: 0.18
Nodes (10): 1. Announcement images, 2. Gallery, 3. Team page, 4. Site settings, 5. Verify, Already covered (no work), Answers (kaikub, 2026-10-17) and what was built, Revision (kaikub, 2026-10-17, same day) (+2 more)

### Community 43 - "team/actions.ts"
Cohesion: 0.23
Nodes (17): deleteTeamGeneration(), deleteTeamMember(), fail(), finish(), moveTeamGeneration(), moveTeamMember(), playerIdFrom(), postedId() (+9 more)

### Community 44 - "site-content.ts"
Cohesion: 0.06
Nodes (62): AnnouncementPreview(), Saved, GroupPreview(), MemberPreview(), normal(), savePage(), m, run() (+54 more)

### Community 45 - "command-search.tsx"
Cohesion: 0.33
Nodes (5): adminSearch(), day(), SearchHit, m, Item

### Community 46 - "app/events/[id]/page.tsx"
Cohesion: 0.06
Nodes (44): EventForm(), onCover(), pickFile(), EventFormValues, LOADED_AT, noSubscribe(), shrink(), toIso() (+36 more)

### Community 47 - "achievements/[id]/actions.test.ts"
Cohesion: 0.33
Nodes (3): form(), m, valid()

### Community 48 - "commu/events/[id]/actions.ts"
Cohesion: 0.25
Nodes (11): imageError(), deleteEvent(), finish(), postedId(), saveEvent(), AdminEventPage(), DONE, ERRORS (+3 more)

### Community 49 - "params.ts"
Cohesion: 0.23
Nodes (10): activeView(), BASE, COLUMNS, EMPTY, PAGE_SIZE, playersHref(), same(), VIEWS (+2 more)

### Community 50 - "audit-page.ts"
Cohesion: 0.22
Nodes (5): @playwright/test, AuditOptions, auditPage(), accessToken, routes

### Community 51 - "player-table.tsx"
Cohesion: 0.26
Nodes (12): Task 3: Players table with filters, sort, infinite scroll, loadPlayers(), PlayerRow, readPlayers(), day(), joined(), kind(), PlayerTable() (+4 more)

### Community 52 - "table-query.ts"
Cohesion: 0.29
Nodes (9): Column, isDay(), nextSort(), one(), Option, RawParams, readTable(), COLUMNS (+1 more)

### Community 53 - "Review Focus"
Cohesion: 0.22
Nodes (8): Final, Global Constraints, Review Focus, Task 1: `admin_list_players` RPC, Task 2: CSV helper + export route, Task 5: Clickable dashboard numbers + real Unverified / Guest cards, Task 6: Daily stats snapshot (for Phase 6 charts), v1.1 Phase 2a — Players Table, Filters, Bulk Actions, CSV, Daily Stats

### Community 54 - "server.ts"
Cohesion: 0.21
Nodes (9): saveSiteSettings(), SWITCHES, m, run(), AdminSettingsPage(), ERRORS, metadata, SavedSettings (+1 more)

### Community 55 - "app/players/page.tsx"
Cohesion: 0.40
Nodes (4): Avatar(), metadata, PlayersPage(), SearchHit

### Community 56 - "Admin tables: the protocol"
Cohesion: 0.25
Nodes (7): 1. The URL is the state, 2. Columns declare what they can do, 3. Above the table, 4. Every value is a link, 5. One RPC per table, 6. States, Admin tables: the protocol

## Knowledge Gaps
- **9 isolated node(s):** `@emnapi/core`, `@emnapi/runtime`, `@types/node`, `@types/react`, `@types/react-dom` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 436 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `callback/route.ts`, `minecraft/route.ts`, `package.json`, `player/[id]/page.tsx`, `SubmitButton`, `admin/players/page.tsx`, `dbErrorCode`, `icons.tsx`, `dashboard/page.tsx`, `createClient`, `publicImageUrl`, `announcements/[id]/actions.ts`, `server/page.tsx`, `users/[id]/page.tsx`, `dbErrorCode`, `dashboard/actions.ts`, `PixelIcon`, `admin/page.tsx`, `about-you-form.tsx`, `images.ts`, `staff.ts`, `audit/page.tsx`, `players/actions.ts`, `staff-gate.ts`, `team/actions.ts`, `site-content.ts`, `command-search.tsx`, `app/events/[id]/page.tsx`, `commu/events/[id]/actions.ts`, `player-table.tsx`, `server.ts`, `app/players/page.tsx`?**
  _High betweenness centrality (0.222) - this node is a cross-community bridge._
- **What connects `@emnapi/core`, `@emnapi/runtime`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `callback/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07712765957446809 - nodes in this community are weakly interconnected._
- **Why does `createClient()` connect `createClient` to `callback/route.ts`, `minecraft/route.ts`, `player/[id]/page.tsx`, `SubmitButton`, `next`, `vitest`, `admin/players/page.tsx`, `dbErrorCode`, `icons.tsx`, `publicImageUrl`, `announcements/[id]/actions.ts`, `server/page.tsx`, `users/[id]/page.tsx`, `dbErrorCode`, `chula.ts`, `dashboard/actions.ts`, `PixelIcon`, `admin/page.tsx`, `images.ts`, `staff.ts`, `audit/page.tsx`, `players/actions.ts`, `staff-gate.ts`, `team/actions.ts`, `site-content.ts`, `command-search.tsx`, `app/events/[id]/page.tsx`, `commu/events/[id]/actions.ts`, `player-table.tsx`, `server.ts`, `app/players/page.tsx`?**
  _High betweenness centrality (0.195) - this node is a cross-community bridge._
- **Should `minecraft/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11174242424242424 - nodes in this community are weakly interconnected._
- **Why does `PixelIcon()` connect `PixelIcon` to `minecraft/route.ts`, `player/[id]/page.tsx`, `SubmitButton`, `next`, `admin/players/page.tsx`, `dbErrorCode`, `icons.tsx`, `dashboard/page.tsx`, `createClient`, `publicImageUrl`, `announcements/[id]/actions.ts`, `server/page.tsx`, `users/[id]/page.tsx`, `dbErrorCode`, `admin/page.tsx`, `about-you-form.tsx`, `images.ts`, `staff.ts`, `audit/page.tsx`, `team/actions.ts`, `site-content.ts`, `command-search.tsx`, `app/events/[id]/page.tsx`, `commu/events/[id]/actions.ts`, `player-table.tsx`, `server.ts`, `app/players/page.tsx`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09956709956709957 - nodes in this community are weakly interconnected._