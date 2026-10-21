# Graph Report - chulacraft-web  (2026-10-21)

## Corpus Check
- 309 files · ~218,128 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 33 file(s) not represented in the graph (top: .css 27, (none) 2, .toml 2)

## Summary
- 1261 nodes · 3504 edges · 58 communities (55 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 89 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f338b1e3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- banner-form.tsx
- error/page.tsx
- minecraft/route.ts
- package.json
- player/[id]/page.tsx
- compilerOptions
- PixelIcon
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
- images.ts
- react
- dashboard/page.tsx
- createClient
- site-content.ts
- announcements/[id]/actions.ts
- server/page.tsx
- users/[id]/page.tsx
- registration-panel.tsx
- chula.ts
- dependencies
- scripts
- dashboard/actions.ts
- PixelIcon
- reconcile-identities.test.ts
- admin/settings/page.tsx
- server.ts
- Phases
- achievements/[id]/actions.ts
- database.types.ts
- HTTP endpoints
- allowScripts
- players/actions.ts
- staff-gate.ts
- verify/page.tsx
- team/actions.ts
- next
- event-form.tsx
- app/events/[id]/page.tsx
- announcement-banner.tsx
- SubmitButton
- params.ts
- audit-page.ts
- player-table.tsx
- table-query.ts
- Review Focus
- settings/actions.ts
- middleware.ts
- Admin tables: the protocol
- callback/route.test.ts

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 158 edges
2. `PixelIcon()` - 112 edges
3. `next` - 105 edges
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

## Communities (58 total, 3 thin omitted)

### Community 0 - "banner-form.tsx"
Cohesion: 0.06
Nodes (43): 1. Announcement images, 2. Gallery, 3. Team page, 4. Site settings, 5. Verify, Already covered (no work), Answers (kaikub, 2026-10-17) and what was built, Decisions (+35 more)

### Community 1 - "error/page.tsx"
Cohesion: 0.16
Nodes (13): AuthErrorPage(), metadata, Error(), metadata, NotFoundPage(), Action, ErrorScreen(), Href (+5 more)

### Community 2 - "minecraft/route.ts"
Cohesion: 0.23
Nodes (16): `/api/registration/minecraft` — player's Minecraft accounts, DELETE(), GET(), PATCH(), POST(), Profile, resolveMinecraftProfile(), runtime (+8 more)

### Community 3 - "package.json"
Cohesion: 0.12
Nodes (17): engines, node, name, overrides, postcss, private, version, @emnapi/core (+9 more)

### Community 4 - "player/[id]/page.tsx"
Cohesion: 0.07
Nodes (40): 1. `eventHistory()` helper + test, 2. `ProfileBanner` component, 3. Public player page (`src/app/player/[id]/page.tsx`), 4. Report dialog, 5. Profile page (`src/app/dashboard/page.tsx`), 6. Motion, 7. Verify, Addendum — profile banners (2026-10-17, kaikub request) (+32 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "PixelIcon"
Cohesion: 0.06
Nodes (38): AdminAppealsPage(), DONE, ERRORS, metadata, AdminAuditPage(), bangkokDay(), ENTITIES, Entry (+30 more)

### Community 7 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, @eslint/js, @playwright/test, @types/node, @types/react, @types/react-dom (+3 more)

### Community 8 - "local-mocks.mjs"
Cohesion: 0.07
Nodes (35): RFC-6455, ACTION_BITS, addEnv(), checkToken(), codes, consoles, DISCORD_USERS, env (+27 more)

### Community 9 - "ChulaCraft Web Version 1.0"
Cohesion: 0.10
Nodes (19): Architecture, Chula verification (Google), ChulaCraft Web Version 1.0, Commands, Current implementation caveats, Deployment, Discord authentication, Environment (+11 more)

### Community 10 - "Tables"
Cohesion: 0.11
Nodes (16): Accounts and identity, Audit, Content, Database, Minecraft whitelist, Other services that use this database, Player-readable tables, RPC functions (+8 more)

### Community 11 - "next"
Cohesion: 0.08
Nodes (30): react-dom, @vercel/analytics, builtInGallery, metadata, values, GET(), metadata, RootLayout() (+22 more)

### Community 12 - "vitest"
Cohesion: 0.14
Nodes (14): RFC-4180, nextConfig, vitest, GET(), get(), m, rpcArgs(), Cell (+6 more)

### Community 13 - "admin/players/page.tsx"
Cohesion: 0.31
Nodes (11): 2. Columns declare what they can do, AdminPlayersPage(), metadata, hrefFor(), Ctx, FilterChips(), FilterPanel(), KeepState() (+3 more)

### Community 14 - "dbErrorCode"
Cohesion: 0.08
Nodes (43): Pages, Server actions, Web API, decideAppeal(), addPlayers(), awardId(), confirmAward(), fail() (+35 more)

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.22
Nodes (8): Chulacraft registration runbook, Daily stats, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 18 - "images.ts"
Cohesion: 0.18
Nodes (11): BUCKET, EXTENSIONS, imageError(), Storage, deleteEvent(), finish(), postedId(), saveEvent() (+3 more)

### Community 19 - "react"
Cohesion: 0.18
Nodes (16): react, GET(), HeroStage(), HomeHero(), HomePage(), loadUpcomingEvents(), steps(), upcomingEvents (+8 more)

### Community 20 - "dashboard/page.tsx"
Cohesion: 0.16
Nodes (15): APPEAL_ERRORS, BanCard(), date(), MyBan, Banner, BANNER_ERRORS, DashboardPage(), metadata (+7 more)

### Community 21 - "createClient"
Cohesion: 0.31
Nodes (14): addGalleryImage(), alt(), deleteGalleryGroup(), deleteGalleryImage(), fail(), finish(), moveGalleryGroup(), moveGalleryImage() (+6 more)

### Community 22 - "site-content.ts"
Cohesion: 0.11
Nodes (23): AboutPage(), GalleryPage(), metadata, metadata, TeamPage(), GalleryGrid(), Shot, TeamCard() (+15 more)

### Community 23 - "announcements/[id]/actions.ts"
Cohesion: 0.25
Nodes (10): uploadPicture(), deleteAnnouncement(), postedId(), refresh(), saveAnnouncement(), SEVERITIES, form(), m (+2 more)

### Community 24 - "server/page.tsx"
Cohesion: 0.13
Nodes (26): ACTIONS, openConsole(), serverAction(), m, redirected(), ConsoleAction, grant(), managerFetch() (+18 more)

### Community 25 - "users/[id]/page.tsx"
Cohesion: 0.06
Nodes (51): BAN_DURATIONS, banUser(), finish(), grantBanner(), liftBan(), markGuest(), PRIVACY_LEVELS, resetChula() (+43 more)

### Community 26 - "registration-panel.tsx"
Cohesion: 0.21
Nodes (13): checkName(), ConfirmDialog(), NameForm(), submit(), Pending, RegistrationPanel(), add(), confirm() (+5 more)

### Community 27 - "chula.ts"
Cohesion: 0.17
Nodes (21): Task 1: Show the Discord name everywhere, @supabase/supabase-js, unlinkPersonalGoogle(), metadata, Privacy, PRIVACY_ERRORS, SettingsPage(), byAge() (+13 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom, sharp, @supabase/ssr (+2 more)

### Community 29 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, db:types, dev, dev:mocks, lint, start, test (+3 more)

### Community 30 - "dashboard/actions.ts"
Cohesion: 0.24
Nodes (13): Moderation, finish(), LEVELS, otherId(), removeFriend(), respondFriendRequest(), setBanner(), allPublic() (+5 more)

### Community 31 - "PixelIcon"
Cohesion: 0.18
Nodes (16): AdminLayout(), metadata, myRole, ServiceUnavailable(), AboutYouForm(), Field(), AboutYouPage(), metadata (+8 more)

### Community 32 - "reconcile-identities.test.ts"
Cohesion: 0.17
Nodes (8): admin, cu, discord, gmail, m, query, run(), session

### Community 33 - "admin/settings/page.tsx"
Cohesion: 0.29
Nodes (15): AnnouncementPreview(), Saved, GroupPreview(), MemberPreview(), PagePreview(), AdminSettingsPage(), ERRORS, metadata (+7 more)

### Community 34 - "server.ts"
Cohesion: 0.22
Nodes (13): @supabase/ssr, authErrorResponse(), GET(), BoundedFetchTimeoutError, createBoundedFetch(), getPublicSupabaseEnvironment(), getSecretSupabaseEnvironment(), getSiteUrl() (+5 more)

### Community 35 - "Phases"
Cohesion: 0.15
Nodes (12): ChulaCraft Web v1.1 — Roadmap Spec, Decisions already made, Deferred (needs Minecraft server endpoint), Global constraints (every phase), Phase 1 — Quick fixes & admin navigation  → `plans/2026-10-16-v1.1-phase1-quick-fixes.md`, Phase 2 — Admin power tools, Phase 3 — Design system & UI redesign, Phase 4 — Content without a developer (+4 more)

### Community 36 - "achievements/[id]/actions.ts"
Cohesion: 0.17
Nodes (11): deleteAchievement(), finish(), postedId(), revokeAward(), saveAchievement(), form(), m, valid() (+3 more)

### Community 37 - "database.types.ts"
Cohesion: 0.13
Nodes (14): ERRORS, metadata, RemovedRow, RestorePage(), CompositeTypes, Constants, Database, DatabaseWithoutInternals (+6 more)

### Community 38 - "HTTP endpoints"
Cohesion: 0.67
Nodes (3): `GET /api/dev-login?as=<user>` — local only, `GET /auth/callback?code=…`, HTTP endpoints

### Community 40 - "players/actions.ts"
Cohesion: 0.27
Nodes (11): Task 4: Bulk actions, bulkBan(), bulkMarkGuest(), BulkResult, each(), m, AchievementOption, BulkBar() (+3 more)

### Community 41 - "staff-gate.ts"
Cohesion: 0.07
Nodes (30): Final, Global Constraints, Review Focus, Task 2: Hero copy, Task 3: Readable admin stat numbers, Task 4: Move community admin to `/admin/commu/*`, Task 5: Grouped admin nav, v1.1 Phase 1 — Quick Fixes & Admin Navigation Implementation Plan (+22 more)

### Community 42 - "verify/page.tsx"
Cohesion: 0.21
Nodes (12): metadata, { getUser, getUserIdentities, rpc, redirect, reconcileIdentities }, page(), VerifyPage(), GoogleSignInButton(), LinkGoogleButton(), useGoogle(), start() (+4 more)

### Community 43 - "team/actions.ts"
Cohesion: 0.21
Nodes (18): deleteTeamGeneration(), deleteTeamMember(), fail(), finish(), moveTeamGeneration(), moveTeamMember(), playerIdFrom(), postedId() (+10 more)

### Community 44 - "next"
Cohesion: 0.11
Nodes (27): next, normal(), savePage(), m, run(), AdminPagesPage(), metadata, AdminEditPage() (+19 more)

### Community 45 - "event-form.tsx"
Cohesion: 0.21
Nodes (11): IMAGE_TYPES, EventForm(), onCover(), pickFile(), EventFormValues, LOADED_AT, noSubscribe(), shrink() (+3 more)

### Community 46 - "app/events/[id]/page.tsx"
Cohesion: 0.07
Nodes (35): clock(), day(), ends(), ERRORS, EventDetail, EventPage(), generateMetadata(), loadEvent() (+27 more)

### Community 47 - "announcement-banner.tsx"
Cohesion: 0.24
Nodes (8): AnnouncementsPage(), metadata, AnnouncementBanner(), dismissedId(), subscribe(), AnnouncementItem(), Props, SEVERITY

### Community 48 - "SubmitButton"
Cohesion: 0.15
Nodes (23): AdminAchievementPage(), DONE, ERRORS, metadata, publicImageUrl(), AdminAnnouncementPage(), DONE, ERRORS (+15 more)

### Community 49 - "params.ts"
Cohesion: 0.23
Nodes (10): activeView(), BASE, COLUMNS, EMPTY, playersHref(), same(), VIEWS, Filters (+2 more)

### Community 50 - "audit-page.ts"
Cohesion: 0.22
Nodes (5): @playwright/test, AuditOptions, auditPage(), accessToken, routes

### Community 51 - "player-table.tsx"
Cohesion: 0.36
Nodes (9): Task 3: Players table with filters, sort, infinite scroll, loadPlayers(), PlayerRow, readPlayers(), day(), joined(), kind(), PlayerTable() (+1 more)

### Community 52 - "table-query.ts"
Cohesion: 0.33
Nodes (8): Column, isDay(), nextSort(), one(), Option, readTable(), COLUMNS, read()

### Community 53 - "Review Focus"
Cohesion: 0.22
Nodes (8): Final, Global Constraints, Review Focus, Task 1: `admin_list_players` RPC, Task 2: CSV helper + export route, Task 5: Clickable dashboard numbers + real Unverified / Guest cards, Task 6: Daily stats snapshot (for Phase 6 charts), v1.1 Phase 2a — Players Table, Filters, Bulk Actions, CSV, Daily Stats

### Community 54 - "settings/actions.ts"
Cohesion: 0.36
Nodes (6): saveSiteSettings(), SWITCHES, m, run(), SETTING_DEFAULTS, SETTING_KEYS

### Community 55 - "middleware.ts"
Cohesion: 0.43
Nodes (6): updateSession(), withCsp(), buildCsp(), config, proxy(), supabaseOrigin()

### Community 56 - "Admin tables: the protocol"
Cohesion: 0.29
Nodes (6): 1. The URL is the state, 3. Above the table, 4. Every value is a link, 5. One RPC per table, 6. States, Admin tables: the protocol

### Community 57 - "callback/route.test.ts"
Cohesion: 0.40
Nodes (3): signOut(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok

## Knowledge Gaps
- **9 isolated node(s):** `@emnapi/core`, `@emnapi/runtime`, `@types/node`, `@types/react`, `@types/react-dom` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 436 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `banner-form.tsx`, `error/page.tsx`, `minecraft/route.ts`, `package.json`, `player/[id]/page.tsx`, `PixelIcon`, `next`, `vitest`, `admin/players/page.tsx`, `dbErrorCode`, `images.ts`, `react`, `dashboard/page.tsx`, `createClient`, `site-content.ts`, `announcements/[id]/actions.ts`, `server/page.tsx`, `users/[id]/page.tsx`, `chula.ts`, `dashboard/actions.ts`, `PixelIcon`, `admin/settings/page.tsx`, `server.ts`, `achievements/[id]/actions.ts`, `database.types.ts`, `players/actions.ts`, `staff-gate.ts`, `verify/page.tsx`, `team/actions.ts`, `event-form.tsx`, `app/events/[id]/page.tsx`, `announcement-banner.tsx`, `SubmitButton`, `player-table.tsx`, `settings/actions.ts`, `middleware.ts`, `callback/route.test.ts`?**
  _High betweenness centrality (0.228) - this node is a cross-community bridge._
- **What connects `@emnapi/core`, `@emnapi/runtime`, `@types/node` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `banner-form.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.061495457721872815 - nodes in this community are weakly interconnected._
- **Why does `createClient()` connect `users/[id]/page.tsx` to `banner-form.tsx`, `minecraft/route.ts`, `player/[id]/page.tsx`, `PixelIcon`, `next`, `vitest`, `admin/players/page.tsx`, `dbErrorCode`, `images.ts`, `createClient`, `announcements/[id]/actions.ts`, `server/page.tsx`, `chula.ts`, `dashboard/actions.ts`, `PixelIcon`, `admin/settings/page.tsx`, `server.ts`, `achievements/[id]/actions.ts`, `database.types.ts`, `players/actions.ts`, `staff-gate.ts`, `verify/page.tsx`, `team/actions.ts`, `next`, `event-form.tsx`, `app/events/[id]/page.tsx`, `announcement-banner.tsx`, `SubmitButton`, `player-table.tsx`, `settings/actions.ts`, `callback/route.test.ts`?**
  _High betweenness centrality (0.194) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.11695906432748537 - nodes in this community are weakly interconnected._
- **Why does `PixelIcon()` connect `PixelIcon` to `banner-form.tsx`, `player/[id]/page.tsx`, `PixelIcon`, `next`, `admin/players/page.tsx`, `dbErrorCode`, `react`, `dashboard/page.tsx`, `createClient`, `server/page.tsx`, `users/[id]/page.tsx`, `registration-panel.tsx`, `chula.ts`, `admin/settings/page.tsx`, `achievements/[id]/actions.ts`, `database.types.ts`, `staff-gate.ts`, `verify/page.tsx`, `team/actions.ts`, `next`, `event-form.tsx`, `app/events/[id]/page.tsx`, `announcement-banner.tsx`, `SubmitButton`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Should `player/[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07184325108853411 - nodes in this community are weakly interconnected._