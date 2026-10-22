# Graph Report - chulacraft-web  (2026-10-22)

## Corpus Check
- 348 files · ~259,089 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 36 file(s) not represented in the graph (top: .css 30, (none) 2, .toml 2)

## Summary
- 1500 nodes · 4084 edges · 84 communities (80 shown, 4 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 157 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0bb2ea7a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Tasks
- error/page.tsx
- registration.ts
- package.json
- banner-form.tsx
- compilerOptions
- src_app_admin_admin_module
- devDependencies
- local-mocks.mjs
- ChulaCraft Web Version 1.0
- ChulaCraft developer docs
- app/layout.tsx
- params.ts
- table-query.ts
- dbErrorCode
- Chulacraft registration runbook
- CLAUDE.md
- supabase/README.md
- ProfileBanner
- register/page.tsx
- dashboard/page.tsx
- ConfirmAction
- v1.1 Phase 5 — Achievements & engagement
- player/[id]/actions.ts
- server/page.tsx
- createClient
- dbErrorCode
- app/settings/page.tsx
- dependencies
- scripts
- commu/events/[id]/check-in/actions.ts
- createClient
- callback/route.ts
- server.ts
- vitest
- Phases
- [slug]/page.tsx
- player/[id]/page.tsx
- ics.ts
- admin/page.tsx
- players/actions.ts
- staff-gate.ts
- server-address-card.tsx
- PixelIcon
- site-content.ts
- achievement-grid.tsx
- event-card.tsx
- member-preview.tsx
- announcements/[id]/page.tsx
- engines
- allowScripts
- player-table.tsx
- admin/players/page.tsx
- Review Focus
- admin/settings/page.tsx
- react
- Admin tables: the protocol
- LegalPage
- site-header.tsx
- SubmitButton
- staff.ts
- notification-bell.tsx
- server/page.tsx
- PixelIcon
- app/events/[id]/actions.ts
- Tasks
- app/events/[id]/page.tsx
- table-query.ts
- showcase
- database.types.ts
- app/events/[id]/check-in/page.tsx
- vitest
- markdown.tsx
- app/events/[id]/check-in/actions.ts
- HTTP endpoints
- scanner.tsx
- Tables
- command-search.tsx
- error/page.tsx
- start/route.test.ts
- Review Focus
- Discord bot contract (v1.1 phase 5)
- admin-nav-group.tsx

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 181 edges
2. `PixelIcon()` - 121 edges
3. `next` - 116 edges
4. `dbErrorCode()` - 58 edges
5. `SubmitButton()` - 51 edges
6. `vitest` - 49 edges
7. `ConfirmAction()` - 38 edges
8. `react` - 32 edges
9. `publicImageUrl()` - 22 edges
10. `DashboardPage()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `5. Migration `20261027000001_event_attendance.sql` + `event_attendance.test.sql`` --references--> `code()`  [INFERRED]
  docs/superpowers/plans/2026-10-22-v1.1-phase5-engagement.md → src/app/admin/commu/events/[id]/check-in/actions.ts
- `Task 5: Clickable dashboard numbers + real Unverified / Guest cards` --references--> `StatRow()`  [INFERRED]
  docs/superpowers/plans/2026-10-16-v1.1-phase2a-players-table.md → src/app/admin/overview.tsx
- `2. Manager contract + mocks` --references--> `POST()`  [INFERRED]
  docs/superpowers/plans/2026-10-22-v1.1-phase7-ops-hardening.md → src/app/api/registration/minecraft/route.ts
- ``GET /events/[id]/check-in/start?t=<token>`` --references--> `checkIn()`  [INFERRED]
  docs/api.md → src/app/events/[id]/check-in/actions.ts
- `Changelog (consensus final)` --references--> `checkIn()`  [INFERRED]
  docs/superpowers/plans/2026-10-22-v1.1-phase5-engagement.md → src/app/events/[id]/check-in/actions.ts

## Import Cycles
- None detected.

## Communities (84 total, 4 thin omitted)

### Community 0 - "Tasks"
Cohesion: 0.12
Nodes (17): 0. Pre-check: pgcrypto location, 10. Migration `20261029000001_notifications.sql` + `notifications.test.sql`, 11. Bell UI, 12. Contract doc + mocks, 13. Verify, 4. Migration `20261026000002_achievement_discord_roles.sql` + `achievement_discord_roles.test.sql`, 5. Migration `20261027000001_event_attendance.sql` + `event_attendance.test.sql`, 7. Player side (+9 more)

### Community 1 - "error/page.tsx"
Cohesion: 0.20
Nodes (7): next, Error(), metadata, NotFoundPage(), Action, ErrorScreen(), Href

### Community 2 - "registration.ts"
Cohesion: 0.10
Nodes (36): `/api/registration/minecraft` — player's Minecraft accounts, DELETE(), GET(), PATCH(), POST(), Profile, resolveMinecraftProfile(), runtime (+28 more)

### Community 3 - "package.json"
Cohesion: 0.13
Nodes (15): name, private, version, @emnapi/core, @emnapi/runtime, eslint, eslint-config-next, @eslint/js (+7 more)

### Community 4 - "banner-form.tsx"
Cohesion: 0.08
Nodes (32): sharp, shots, MAX_IMAGE_BYTES, Checked, checkFile(), deleteBanner(), saveBanner(), colors (+24 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "src_app_admin_admin_module"
Cohesion: 0.15
Nodes (5): BLANK, metadata, TEAM_DONE, TEAM_ERRORS, metadata

### Community 7 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, eslint, eslint-config-next, @eslint/js, @playwright/test, @types/node, @types/qrcode, @types/react (+4 more)

### Community 8 - "local-mocks.mjs"
Cohesion: 0.05
Nodes (43): RFC-6455, @playwright/test, ACTION_BITS, addEnv(), checkToken(), codes, consoles, DISCORD_USERS (+35 more)

### Community 9 - "ChulaCraft Web Version 1.0"
Cohesion: 0.10
Nodes (19): Architecture, Chula verification (Google), ChulaCraft Web Version 1.0, Commands, Current implementation caveats, Deployment, Discord authentication, Environment (+11 more)

### Community 10 - "ChulaCraft developer docs"
Cohesion: 0.20
Nodes (8): Pages, Web API, ChulaCraft developer docs, Environment variables, Everyday commands, Keeping these docs true, Rules every change must keep, System at a glance

### Community 11 - "app/layout.tsx"
Cohesion: 0.17
Nodes (12): @vercel/analytics, GET(), metadata, RootLayout(), Brand(), COLUMNS, SiteFooter(), DEV_LOGIN_ENABLED (+4 more)

### Community 12 - "params.ts"
Cohesion: 0.43
Nodes (6): loadPlayers(), GET(), get(), m, readPlayers(), rpcArgs()

### Community 13 - "table-query.ts"
Cohesion: 0.31
Nodes (11): 2. Columns declare what they can do, AdminPlayersPage(), metadata, hrefFor(), Ctx, FilterChips(), FilterPanel(), KeepState() (+3 more)

### Community 14 - "dbErrorCode"
Cohesion: 0.15
Nodes (24): addPlayers(), awardId(), confirmAward(), fail(), prefillInterested(), previewAward(), m, unique() (+16 more)

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.22
Nodes (8): Chulacraft registration runbook, Daily stats, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 18 - "ProfileBanner"
Cohesion: 0.18
Nodes (13): 1. `eventHistory()` helper + test, 2. `ProfileBanner` component, 3. Public player page (`src/app/player/[id]/page.tsx`), 4. Report dialog, 5. Profile page (`src/app/dashboard/page.tsx`), 6. Motion, 7. Verify, Addendum — profile banners (2026-10-17, kaikub request) (+5 more)

### Community 19 - "register/page.tsx"
Cohesion: 0.19
Nodes (11): AboutPage(), builtInGallery, metadata, values, metadata, RegisterPage(), { getUser, redirect }, DiscordAuthButton() (+3 more)

### Community 20 - "dashboard/page.tsx"
Cohesion: 0.13
Nodes (18): submitAppeal(), APPEAL_ERRORS, BanCard(), date(), MyBan, Banner, BANNER_ERRORS, DashboardPage() (+10 more)

### Community 21 - "ConfirmAction"
Cohesion: 0.14
Nodes (19): AwardAttendees(), CheckinQr(), clock(), Closed(), ERRORS, View, WindowState, AdminCheckInPage() (+11 more)

### Community 22 - "v1.1 Phase 5 — Achievements & engagement"
Cohesion: 0.14
Nodes (15): Badge roles, `discord_role_queue()`, `discord_role_queue_done(p_items jsonb)` → `integer`, Acceptance criteria, ADR (draft), Changelog (consensus final), Changelog (consensus rev 2), Decisions (+7 more)

### Community 23 - "player/[id]/actions.ts"
Cohesion: 0.36
Nodes (10): blockPlayer(), finish(), playerId(), removeFriend(), reportPlayer(), respondFriendRequest(), sendFriendRequest(), ask() (+2 more)

### Community 24 - "server/page.tsx"
Cohesion: 0.08
Nodes (35): 1. Website error capture + health endpoint, 2. Manager contract + mocks, 3. Access RPC, token bits, `src/lib/ops.ts`, 5. Discord bot settings + automatic tasks (`/admin/ops/bot`), 6. Measure (no fixes yet), 8. Stale-cache guard (only if Task 7 added caching), 9. Audit gates: axe, Lighthouse, SEO metadata, keyboard pass, Decisions (+27 more)

### Community 25 - "createClient"
Cohesion: 0.07
Nodes (45): Decisions, BAN_DURATIONS, banUser(), finish(), grantBanner(), liftBan(), markGuest(), PRIVACY_LEVELS (+37 more)

### Community 26 - "dbErrorCode"
Cohesion: 0.06
Nodes (46): Decisions, decideAppeal(), finish(), postedId(), revokeAward(), saveAchievement(), form(), m (+38 more)

### Community 27 - "app/settings/page.tsx"
Cohesion: 0.06
Nodes (59): Moderation, @supabase/supabase-js, finish(), LEVELS, otherId(), removeFriend(), respondFriendRequest(), setBanner() (+51 more)

### Community 28 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, @emnapi/core, @emnapi/runtime, next, qrcode, react, react-dom, sharp (+3 more)

### Community 29 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, db:types, dev, dev:mocks, lint, start, test (+3 more)

### Community 30 - "commu/events/[id]/check-in/actions.ts"
Cohesion: 0.25
Nodes (14): Server actions, 6. Staff check-in page `/admin/commu/events/[id]/check-in`, awardAttendees(), checkInPlayer(), code(), finish(), nextToken(), page() (+6 more)

### Community 31 - "createClient"
Cohesion: 0.30
Nodes (17): addGalleryImage(), alt(), deleteGalleryGroup(), deleteGalleryImage(), fail(), finish(), moveGalleryGroup(), moveGalleryImage() (+9 more)

### Community 32 - "callback/route.ts"
Cohesion: 0.23
Nodes (12): @supabase/ssr, authErrorResponse(), GET(), signIn(), start(), getPublicSupabaseEnvironment(), getSiteUrl(), names (+4 more)

### Community 33 - "server.ts"
Cohesion: 0.09
Nodes (16): metadata, NewEventPage(), AdminEventsPage(), metadata, ERRORS, metadata, RemovedRow, RestorePage() (+8 more)

### Community 34 - "vitest"
Cohesion: 0.13
Nodes (15): RFC-4180, 1. Migration `20261030000001_insights.sql` + `insights.test.sql`, 2. Migration `20261030000002_funnel_failures.sql` + recording, 3. Insights TS core: range, series, CSV, tabs, 4. SVG chart components, 5. `/admin/insights` page, panels, print, nav, 6. Players tile strip + docs, File Structure (+7 more)

### Community 35 - "Phases"
Cohesion: 0.15
Nodes (12): ChulaCraft Web v1.1 — Roadmap Spec, Decisions already made, Deferred (needs Minecraft server endpoint), Global constraints (every phase), Phase 1 — Quick fixes & admin navigation  → `plans/2026-10-16-v1.1-phase1-quick-fixes.md`, Phase 2 — Admin power tools, Phase 3 — Design system & UI redesign, Phase 4 — Content without a developer (+4 more)

### Community 36 - "[slug]/page.tsx"
Cohesion: 0.22
Nodes (12): normal(), savePage(), m, run(), AdminPagesPage(), metadata, effectiveDate(), DEFAULT_PAGES (+4 more)

### Community 37 - "player/[id]/page.tsx"
Cohesion: 0.29
Nodes (9): Avatar(), ERRORS, generateMetadata(), loadCard(), mcHead(), PlayerCard, PlayerPage(), EventHistory() (+1 more)

### Community 38 - "ics.ts"
Cohesion: 0.20
Nodes (12): RFC-5545, GET(), encoder, escapeText(), eventIcs(), fold(), IcsEvent, icsFilename() (+4 more)

### Community 39 - "admin/page.tsx"
Cohesion: 0.21
Nodes (10): AdminAuditPage(), bangkokDay(), ENTITIES, Entry, metadata, Params, AdminUserPage(), describeChange() (+2 more)

### Community 40 - "players/actions.ts"
Cohesion: 0.40
Nodes (8): Task 4: Bulk actions, bulkBan(), bulkMarkGuest(), BulkResult, each(), m, BulkBar(), say()

### Community 41 - "staff-gate.ts"
Cohesion: 0.22
Nodes (9): Layout(), Layout(), Layout(), Layout(), Layout(), Layout(), Layout(), Layout() (+1 more)

### Community 42 - "server-address-card.tsx"
Cohesion: 0.23
Nodes (13): ServerAddressRow(), ServerStatus, StatusBadge(), packet(), parseStatusResponse(), pingServer(), readVarInt(), resolveTarget() (+5 more)

### Community 43 - "PixelIcon"
Cohesion: 0.16
Nodes (15): EXTENSIONS, IMAGE_TYPES, publicImageUrl(), Storage, AdminAnnouncementPage(), DONE, ERRORS, metadata (+7 more)

### Community 44 - "site-content.ts"
Cohesion: 0.20
Nodes (12): GET(), anonClient(), DEFAULT_DISCORD_URL, GalleryGroup, GalleryImage, Rows, SettingKey, siteSettings() (+4 more)

### Community 45 - "achievement-grid.tsx"
Cohesion: 0.24
Nodes (11): Role, ShowcasePicker(), AchievementGrid(), achievementImage(), day(), ShowcaseRow(), Tier, TIER_LABELS (+3 more)

### Community 46 - "event-card.tsx"
Cohesion: 0.16
Nodes (16): EventsPage(), metadata, matches(), metadata, PAGES, PlayerHit, SearchPage(), dayBadge() (+8 more)

### Community 47 - "member-preview.tsx"
Cohesion: 0.10
Nodes (31): AnnouncementPreview(), Saved, GroupPreview(), MemberPreview(), PagePreview(), SettingsPreview(), AnnouncementsPage(), metadata (+23 more)

### Community 48 - "announcements/[id]/page.tsx"
Cohesion: 0.23
Nodes (9): EventForm(), onCover(), pickFile(), LOADED_AT, noSubscribe(), REMINDER_PRESETS, ReminderState, shrink() (+1 more)

### Community 50 - "allowScripts"
Cohesion: 0.33
Nodes (4): allowScripts, unrs-resolver@1.12.2, overrides, postcss

### Community 51 - "player-table.tsx"
Cohesion: 0.21
Nodes (12): AchievementOption, BulkPermissions, BASE, COLUMNS, day(), joined(), kind(), PlayerTable() (+4 more)

### Community 52 - "admin/players/page.tsx"
Cohesion: 0.29
Nodes (8): activeView(), EMPTY, PAGE_SIZE, playersHref(), same(), VIEWS, Filters, TableState

### Community 53 - "Review Focus"
Cohesion: 0.18
Nodes (10): Final, Global Constraints, Review Focus, Task 1: `admin_list_players` RPC, Task 2: CSV helper + export route, Task 3: Players table with filters, sort, infinite scroll, Task 5: Clickable dashboard numbers + real Unverified / Guest cards, Task 6: Daily stats snapshot (for Phase 6 charts) (+2 more)

### Community 54 - "admin/settings/page.tsx"
Cohesion: 0.17
Nodes (14): deleteDiscordRole(), finishRole(), saveDiscordRole(), saveSiteSettings(), SWITCHES, m, run(), ERRORS (+6 more)

### Community 55 - "react"
Cohesion: 0.25
Nodes (10): react, HeroStage(), HomeHero(), HomePage(), loadUpcomingEvents(), steps(), upcomingEvents, PlayOnView() (+2 more)

### Community 56 - "Admin tables: the protocol"
Cohesion: 0.29
Nodes (6): 1. The URL is the state, 3. Above the table, 4. Every value is a link, 5. One RPC per table, 6. States, Admin tables: the protocol

### Community 57 - "LegalPage"
Cohesion: 0.25
Nodes (10): render(), metadata, Page(), metadata, Page(), metadata, Page(), LegalPage() (+2 more)

### Community 58 - "site-header.tsx"
Cohesion: 0.24
Nodes (13): AnnouncementBanner(), dismissedId(), subscribe(), SignOutButton(), SubmitButton(), Avatar(), SiteHeader(), HeaderShell() (+5 more)

### Community 59 - "SubmitButton"
Cohesion: 0.16
Nodes (15): deleteAchievement(), AdminAchievementPage(), DONE, ERRORS, metadata, MetaFields(), metadata, NewAchievementPage() (+7 more)

### Community 60 - "staff.ts"
Cohesion: 0.26
Nodes (11): AdminNav(), ALL_GROUPS, groupsFor(), AdminLayout(), metadata, myRole, Area, AREAS (+3 more)

### Community 61 - "notification-bell.tsx"
Cohesion: 0.26
Nodes (9): NotificationItem, openNotifications(), OpenNotificationsResult, describe(), NotificationBell(), load(), toggle(), relative() (+1 more)

### Community 62 - "server/page.tsx"
Cohesion: 0.21
Nodes (10): 4. `/admin/ops` list + detail + website + backups UI, AdminServerPage(), DONE, ERRORS, metadata, Status, TONE, uptime() (+2 more)

### Community 63 - "PixelIcon"
Cohesion: 0.13
Nodes (25): AdminAppealsPage(), DONE, ERRORS, metadata, AdminAchievementsPage(), metadata, AdminAnnouncementsPage(), ERRORS (+17 more)

### Community 64 - "app/events/[id]/actions.ts"
Cohesion: 0.27
Nodes (9): load(), eventId(), signInPath(), form(), interested(), m, redirected(), toggleInterest() (+1 more)

### Community 65 - "Tasks"
Cohesion: 0.18
Nodes (10): 1. Announcement images, 2. Gallery, 3. Team page, 4. Site settings, 5. Verify, Already covered (no work), Answers (kaikub, 2026-10-17) and what was built, Revision (kaikub, 2026-10-17, same day) (+2 more)

### Community 66 - "app/events/[id]/page.tsx"
Cohesion: 0.33
Nodes (10): clock(), day(), ends(), ERRORS, EventDetail, EventPage(), generateMetadata(), loadEvent() (+2 more)

### Community 67 - "table-query.ts"
Cohesion: 0.31
Nodes (9): Column, isDay(), nextSort(), one(), Option, paramsOf(), readTable(), COLUMNS (+1 more)

### Community 68 - "showcase"
Cohesion: 0.24
Nodes (9): 1. Migration `20261026000001_achievement_rarity.sql` + `achievement_rarity.test.sql`, 2. Admin + cards, 3. Showcase UI, A. Rarity tier + showcase, setShowcase(), AchievementGroup, showcase(), badge() (+1 more)

### Community 70 - "database.types.ts"
Cohesion: 0.20
Nodes (9): CompositeTypes, Constants, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables, TablesInsert (+1 more)

### Community 71 - "app/events/[id]/check-in/page.tsx"
Cohesion: 0.18
Nodes (7): checkIn(), m, redirected(), ERRORS, EventSummary, metadata, when()

### Community 72 - "vitest"
Cohesion: 0.17
Nodes (7): nextConfig, vitest, signOut(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok, m, ROW

### Community 73 - "markdown.tsx"
Cohesion: 0.40
Nodes (8): react-dom, block(), cells(), inline(), Markdown(), table(), html(), withBreaks()

### Community 74 - "app/events/[id]/check-in/actions.ts"
Cohesion: 0.28
Nodes (8): Risks and mitigations, GET(), call(), checkInPath(), COOKIE_BASE, NEXT_COOKIE, PROOF_COOKIE, safeNext()

### Community 75 - "HTTP endpoints"
Cohesion: 0.25
Nodes (8): `/admin/commu/events/[id]/check-in` (page), `/events/[id]/check-in` (page), `GET /api/dev-login?as=<user>` — local only, `GET /auth/callback?code=…`, `GET /check-in/continue`, `GET /events/[id]/calendar.ics`, `GET /events/[id]/check-in/start?t=<token>`, HTTP endpoints

### Community 76 - "scanner.tsx"
Cohesion: 0.23
Nodes (11): ScanResult, Avatar(), Camera, Detector, DetectorClass, ERRORS, Scanner(), fallBack() (+3 more)

### Community 77 - "Tables"
Cohesion: 0.18
Nodes (11): Accounts and identity, Audit, Content, Database, Engagement (v1.1 phase 5), Minecraft whitelist, Other services that use this database, Player-readable tables (+3 more)

### Community 78 - "command-search.tsx"
Cohesion: 0.31
Nodes (6): adminSearch(), day(), SearchHit, m, CommandSearch(), Item

### Community 79 - "error/page.tsx"
Cohesion: 0.36
Nodes (7): AuthErrorPage(), metadata, AUTH_FAILURE_REASONS, authFailureMessage(), AuthFailureReason, classifyOAuthCallbackFailure(), safeAuthFailureReason()

### Community 80 - "start/route.test.ts"
Cohesion: 0.50
Nodes (3): GET(), call(), m

### Community 81 - "Review Focus"
Cohesion: 0.22
Nodes (8): Final, Global Constraints, Review Focus, Task 1: Show the Discord name everywhere, Task 2: Hero copy, Task 3: Readable admin stat numbers, Task 4: Move community admin to `/admin/commu/*`, v1.1 Phase 1 — Quick Fixes & Admin Navigation Implementation Plan

### Community 82 - "Discord bot contract (v1.1 phase 5)"
Cohesion: 0.25
Nodes (7): Discord bot contract (v1.1 phase 5), `event_reminder_sent(p_event_id uuid, p_offset_minutes integer)` → `boolean`, Event reminders, `event_reminders_queue()`, Local mock, Message, Rules for the bot

### Community 83 - "admin-nav-group.tsx"
Cohesion: 0.40
Nodes (5): Task 5: Grouped admin nav, 7. Fix the pages that missed (scope set by Task 6), AdminNavGroup(), isActive(), Link

## Knowledge Gaps
- **11 isolated node(s):** `@emnapi/core`, `@emnapi/runtime`, `@types/node`, `@types/qrcode`, `@types/react` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 526 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `error/page.tsx` to `registration.ts`, `package.json`, `banner-form.tsx`, `src_app_admin_admin_module`, `app/layout.tsx`, `table-query.ts`, `dbErrorCode`, `register/page.tsx`, `dashboard/page.tsx`, `ConfirmAction`, `player/[id]/actions.ts`, `server/page.tsx`, `createClient`, `dbErrorCode`, `app/settings/page.tsx`, `commu/events/[id]/check-in/actions.ts`, `createClient`, `callback/route.ts`, `server.ts`, `[slug]/page.tsx`, `player/[id]/page.tsx`, `admin/page.tsx`, `players/actions.ts`, `staff-gate.ts`, `server-address-card.tsx`, `PixelIcon`, `achievement-grid.tsx`, `event-card.tsx`, `member-preview.tsx`, `announcements/[id]/page.tsx`, `player-table.tsx`, `admin/settings/page.tsx`, `react`, `LegalPage`, `site-header.tsx`, `SubmitButton`, `staff.ts`, `notification-bell.tsx`, `server/page.tsx`, `PixelIcon`, `app/events/[id]/actions.ts`, `app/events/[id]/page.tsx`, `app/events/[id]/check-in/page.tsx`, `vitest`, `app/events/[id]/check-in/actions.ts`, `command-search.tsx`, `error/page.tsx`, `start/route.test.ts`, `admin-nav-group.tsx`?**
  _High betweenness centrality (0.234) - this node is a cross-community bridge._
- **What connects `@emnapi/core`, `@emnapi/runtime`, `@types/node` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Tasks` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Why does `createClient()` connect `createClient` to `registration.ts`, `banner-form.tsx`, `src_app_admin_admin_module`, `app/layout.tsx`, `params.ts`, `table-query.ts`, `dbErrorCode`, `register/page.tsx`, `dashboard/page.tsx`, `ConfirmAction`, `player/[id]/actions.ts`, `server/page.tsx`, `createClient`, `dbErrorCode`, `app/settings/page.tsx`, `commu/events/[id]/check-in/actions.ts`, `callback/route.ts`, `server.ts`, `[slug]/page.tsx`, `player/[id]/page.tsx`, `ics.ts`, `admin/page.tsx`, `players/actions.ts`, `staff-gate.ts`, `PixelIcon`, `event-card.tsx`, `member-preview.tsx`, `admin/settings/page.tsx`, `site-header.tsx`, `SubmitButton`, `staff.ts`, `notification-bell.tsx`, `server/page.tsx`, `PixelIcon`, `app/events/[id]/actions.ts`, `app/events/[id]/page.tsx`, `showcase`, `app/events/[id]/check-in/page.tsx`, `vitest`, `app/events/[id]/check-in/actions.ts`, `command-search.tsx`, `start/route.test.ts`?**
  _High betweenness centrality (0.189) - this node is a cross-community bridge._
- **Should `registration.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09513742071881606 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `vitest` to `registration.ts`, `package.json`, `banner-form.tsx`, `local-mocks.mjs`, `params.ts`, `dbErrorCode`, `register/page.tsx`, `player/[id]/actions.ts`, `server/page.tsx`, `createClient`, `dbErrorCode`, `app/settings/page.tsx`, `commu/events/[id]/check-in/actions.ts`, `callback/route.ts`, `vitest`, `[slug]/page.tsx`, `ics.ts`, `admin/page.tsx`, `players/actions.ts`, `server-address-card.tsx`, `admin/players/page.tsx`, `admin/settings/page.tsx`, `LegalPage`, `staff.ts`, `app/events/[id]/actions.ts`, `table-query.ts`, `showcase`, `app/events/[id]/check-in/page.tsx`, `markdown.tsx`, `app/events/[id]/check-in/actions.ts`, `command-search.tsx`, `error/page.tsx`, `start/route.test.ts`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.1323529411764706 - nodes in this community are weakly interconnected._