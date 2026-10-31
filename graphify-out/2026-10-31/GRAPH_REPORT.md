# Graph Report - chulacraft-web  (2026-10-22)

## Corpus Check
- 441 files · ~323,413 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 41 file(s) not represented in the graph (top: .css 33, (none) 2, .toml 2)

## Summary
- 2014 nodes · 5643 edges · 113 communities (106 shown, 7 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 237 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d071e91a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- vitest
- bot/page.tsx
- minecraft/route.ts
- package.json
- banner-form.tsx
- compilerOptions
- ref_node_crypto
- devDependencies
- local-mocks.mjs
- ChulaCraft Web Version 1.0
- events.tsx
- site-content.ts
- createClient
- ops/page.tsx
- dbErrorCode
- Chulacraft registration runbook
- CLAUDE.md
- supabase/README.md
- dashboard/page.tsx
- createClient
- player/[id]/opengraph-image.tsx
- contrast.test.ts
- supabase-stub.mjs
- callback/route.ts
- Tasks
- users/[id]/page.tsx
- achievements/[id]/page.tsx
- player/[id]/page.tsx
- dependencies
- scripts
- SubmitButton
- insights/page.tsx
- metric-tile.tsx
- member-preview.tsx
- welcome/page.tsx
- Phases
- site-header.tsx
- reconcile-identities.test.ts
- @playwright/test
- timed
- bot/actions.ts
- command-search.tsx
- react
- Ops manager contract
- line-chart.tsx
- player/[id]/actions.ts
- ics.ts
- app/layout.tsx
- ops/actions.ts
- achievement-grid.tsx
- @playwright/test
- admin/players/page.tsx
- notification-bell.tsx
- showcase
- app/settings/page.tsx
- data.ts
- v1.1 Phase 5 — Achievements & engagement
- insights.spec.ts
- bot-contract-phase5.md
- registration.ts
- Endpoints
- Tables
- Tasks
- PixelIcon
- app/events/[id]/check-in/actions.ts
- announcements/[id]/actions.ts
- admin-nav.tsx
- event-card.tsx
- dashboard/actions.test.ts
- checkIn
- dbErrorCode
- ops
- staffCan
- ProfileBanner
- @playwright/test
- checkIn
- Discord bot contract: settings and automatic tasks (v1.1 phase 7)
- event-form.tsx
- chart-frame.tsx
- mcsv-token.ts
- app/events/[id]/page.tsx
- health/route.ts
- Performance baseline (v1.1 Phase 7, Task 6)
- v1.1 Phase 7 — Ops console, performance, hardening
- Tasks
- lighthouse.mjs
- charts.test.tsx
- banners/page.tsx
- ops.spec.ts
- commu/events/[id]/check-in/actions.ts
- app/events/[id]/actions.ts
- instrumentation.test.ts
- ChulaCraft developer docs
- Event reminders
- src_app_admin_admin_module
- ops-bot.spec.ts
- achievements/[id]/actions.test.ts
- icons.tsx
- reportError
- markdown.tsx
- Review Focus
- scanner.tsx
- commu/events/[id]/actions.test.ts
- Database
- checkin-qr.tsx
- allowScripts
- database.types.ts
- engines
- announcement-banner.tsx
- next
- Keyboard-only pass: register and report-player
- [service]/page.tsx

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 192 edges
2. `PixelIcon()` - 135 edges
3. `next` - 129 edges
4. `timed()` - 95 edges
5. `vitest` - 67 edges
6. `dbErrorCode()` - 63 edges
7. `SubmitButton()` - 51 edges
8. `ConfirmAction()` - 43 edges
9. `react` - 38 edges
10. `publicImageUrl()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Insights (v1.1 phase 6)` --references--> `code()`  [INFERRED]
  docs/database.md → src/app/admin/commu/events/[id]/check-in/actions.ts
- `5. Migration `20261027000001_event_attendance.sql` + `event_attendance.test.sql`` --references--> `code()`  [INFERRED]
  docs/superpowers/plans/2026-10-22-v1.1-phase5-engagement.md → src/app/admin/commu/events/[id]/check-in/actions.ts
- `Task 5: Clickable dashboard numbers + real Unverified / Guest cards` --references--> `StatRow()`  [INFERRED]
  docs/superpowers/plans/2026-10-16-v1.1-phase2a-players-table.md → src/app/admin/overview.tsx
- ``GET /events/[id]/check-in/start?t=<token>`` --references--> `checkIn()`  [INFERRED]
  docs/api.md → src/app/events/[id]/check-in/actions.ts
- `Changelog (consensus final)` --references--> `checkIn()`  [INFERRED]
  docs/superpowers/plans/2026-10-22-v1.1-phase5-engagement.md → src/app/events/[id]/check-in/actions.ts

## Import Cycles
- None detected.

## Communities (113 total, 7 thin omitted)

### Community 0 - "vitest"
Cohesion: 0.15
Nodes (11): nextConfig, react-dom, vitest, signOut(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok, { getUser, getUserIdentities, rpc, redirect, reconcileIdentities }, page() (+3 more)

### Community 1 - "bot/page.tsx"
Cohesion: 0.11
Nodes (32): CheckLine(), GROUPS, JOB_ERRORS, JobRows(), lastRun(), loadOverview(), metadata, NOUN (+24 more)

### Community 2 - "minecraft/route.ts"
Cohesion: 0.15
Nodes (21): `/api/registration/minecraft` — player's Minecraft accounts, DELETE(), fail(), GET(), PATCH(), POST(), Profile, record() (+13 more)

### Community 3 - "package.json"
Cohesion: 0.12
Nodes (16): name, private, version, @axe-core/playwright, @emnapi/core, @emnapi/runtime, eslint, eslint-config-next (+8 more)

### Community 4 - "banner-form.tsx"
Cohesion: 0.23
Nodes (13): Checked, checkFile(), saveBanner(), BLOCKS, FORMATS, Initial, PROBLEMS, BANNER_HEIGHT (+5 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "ref_node_crypto"
Cohesion: 0.31
Nodes (6): fail(), limited(), POST(), m, ok, windows

### Community 7 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, @axe-core/playwright, eslint, eslint-config-next, @eslint/js, @playwright/test, @types/node, @types/qrcode (+5 more)

### Community 8 - "local-mocks.mjs"
Cohesion: 0.10
Nodes (28): RFC-6455, ACTION_BITS, addEnv(), backups, checkToken(), codes, consoles, DISCORD_USERS (+20 more)

### Community 9 - "ChulaCraft Web Version 1.0"
Cohesion: 0.10
Nodes (19): Architecture, Chula verification (Google), ChulaCraft Web Version 1.0, Commands, Current implementation caveats, Deployment, Discord authentication, Environment (+11 more)

### Community 10 - "events.tsx"
Cohesion: 0.18
Nodes (34): countValues(), earliest(), playerStats(), snapValues(), stat, Window, Panel(), CommunityPanel() (+26 more)

### Community 11 - "site-content.ts"
Cohesion: 0.06
Nodes (45): normal(), savePage(), m, run(), AdminPagesPage(), metadata, deleteDiscordRole(), finishRole() (+37 more)

### Community 12 - "createClient"
Cohesion: 0.11
Nodes (34): AdminAppealsPage(), deleteAchievement(), AdminAchievementPage(), DONE, ERRORS, metadata, publicImageUrl(), MetaFields() (+26 more)

### Community 13 - "ops/page.tsx"
Cohesion: 0.12
Nodes (36): 4. `/admin/ops` list + detail + website + backups UI, BackupChip(), UptimeBar(), loadBackups(), loadServices(), metadata, OpsPage(), ServiceRow() (+28 more)

### Community 14 - "dbErrorCode"
Cohesion: 0.15
Nodes (23): addPlayers(), awardId(), confirmAward(), fail(), prefillInterested(), previewAward(), m, unique() (+15 more)

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.14
Nodes (13): Chulacraft registration runbook, Daily stats, Normal operations, Ops console, backups and restore, `OPS_HEALTH_TOKEN` (website health probe), Release order (ops console), Restore a Supabase dump, Restore a world backup (+5 more)

### Community 18 - "dashboard/page.tsx"
Cohesion: 0.11
Nodes (20): submitAppeal(), APPEAL_ERRORS, BanCard(), date(), MyBan, Banner, BANNER_ERRORS, DashboardPage() (+12 more)

### Community 19 - "createClient"
Cohesion: 0.45
Nodes (11): addGalleryImage(), alt(), deleteGalleryGroup(), deleteGalleryImage(), fail(), finish(), moveGalleryGroup(), moveGalleryImage() (+3 more)

### Community 20 - "player/[id]/opengraph-image.tsx"
Cohesion: 0.08
Nodes (32): sharp, shots, colors, gif(), m, png(), raw(), alt (+24 more)

### Community 21 - "contrast.test.ts"
Cohesion: 0.15
Nodes (16): chartThemes, contrast(), css, dark, fromOklab(), lightBlock, luminance(), printBlock (+8 more)

### Community 22 - "supabase-stub.mjs"
Cohesion: 0.13
Nodes (20): at(), day(), FACULTIES, insightsFixture(), snapshots(), today(), AREAS, BOT_JOBS (+12 more)

### Community 23 - "callback/route.ts"
Cohesion: 0.18
Nodes (15): Decisions, authErrorResponse(), GET(), AuthErrorPage(), metadata, AUTH_FAILURE_REASONS, authFailureMessage(), AuthFailureReason (+7 more)

### Community 24 - "Tasks"
Cohesion: 0.18
Nodes (10): 2. Manager contract + mocks, 3. Access RPC, token bits, `src/lib/ops.ts`, 6. Measure (no fixes yet), 8. Stale-cache guard (only if Task 7 added caching), 9. Audit gates: axe, Lighthouse, SEO metadata, keyboard pass, Global Constraints, Review Focus, Spec coverage (+2 more)

### Community 25 - "users/[id]/page.tsx"
Cohesion: 0.08
Nodes (43): BAN_DURATIONS, banUser(), finish(), grantBanner(), liftBan(), markGuest(), PRIVACY_LEVELS, resetChula() (+35 more)

### Community 26 - "achievements/[id]/page.tsx"
Cohesion: 0.19
Nodes (17): Decisions, finish(), postedId(), revokeAward(), saveAchievement(), BUCKET, EXTENSIONS, imageError() (+9 more)

### Community 27 - "player/[id]/page.tsx"
Cohesion: 0.26
Nodes (10): Avatar(), ERRORS, generateMetadata(), loadCard(), mcHead(), PlayerCard, PlayerPage(), CATEGORIES (+2 more)

### Community 28 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, @emnapi/core, @emnapi/runtime, next, qrcode, react, react-dom, sharp (+3 more)

### Community 29 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, db:types, dev, dev:mocks, lint, start, test (+3 more)

### Community 30 - "SubmitButton"
Cohesion: 0.12
Nodes (27): IMAGE_TYPES, DONE, ERRORS, metadata, AwardAttendees(), AdminCheckInPage(), Avatar(), ERRORS (+19 more)

### Community 31 - "insights/page.tsx"
Cohesion: 0.19
Nodes (17): 5. `/admin/insights` page, panels, print, nav, File Structure, InsightsPage(), metadata, one(), RANGES, tabHref(), DAYS (+9 more)

### Community 32 - "metric-tile.tsx"
Cohesion: 0.27
Nodes (10): 6. Players tile strip + docs, ARROW, deltaText(), MetricTile(), SPOKEN, linearScale(), finite(), sparkLabel() (+2 more)

### Community 33 - "member-preview.tsx"
Cohesion: 0.08
Nodes (46): AnnouncementPreview(), Saved, GroupPreview(), deleteTeamGeneration(), deleteTeamMember(), fail(), finish(), moveTeamGeneration() (+38 more)

### Community 34 - "welcome/page.tsx"
Cohesion: 0.16
Nodes (16): ServiceUnavailable(), AboutYouPage(), metadata, metadata, metadata, Step, StepKind, WelcomePage() (+8 more)

### Community 35 - "Phases"
Cohesion: 0.15
Nodes (12): ChulaCraft Web v1.1 — Roadmap Spec, Decisions already made, Deferred (needs Minecraft server endpoint), Global constraints (every phase), Phase 1 — Quick fixes & admin navigation  → `plans/2026-10-16-v1.1-phase1-quick-fixes.md`, Phase 2 — Admin power tools, Phase 3 — Design system & UI redesign, Phase 4 — Content without a developer (+4 more)

### Community 36 - "site-header.tsx"
Cohesion: 0.31
Nodes (10): Task 1: Show the Discord name everywhere, Brand(), Avatar(), SiteHeader(), HeaderShell(), isActive(), MainNav(), NavItem (+2 more)

### Community 37 - "reconcile-identities.test.ts"
Cohesion: 0.15
Nodes (9): admin, cu, discord, f, gmail, m, query, run() (+1 more)

### Community 38 - "@playwright/test"
Cohesion: 0.25
Nodes (4): AuditOptions, auditPage(), accessToken, routes

### Community 39 - "timed"
Cohesion: 0.23
Nodes (13): Layout(), Layout(), Layout(), AdminLayout(), metadata, Layout(), Layout(), Layout() (+5 more)

### Community 40 - "bot/actions.ts"
Cohesion: 0.24
Nodes (8): 5. Discord bot settings + automatic tasks (`/admin/ops/bot`), KINDS, limit(), saveBotSetting(), setBotJobEnabled(), m, SettingKind, validateSettingValue()

### Community 41 - "command-search.tsx"
Cohesion: 0.33
Nodes (5): adminSearch(), day(), SearchHit, m, Item

### Community 42 - "react"
Cohesion: 0.07
Nodes (41): react, AboutPage(), builtInGallery, metadata, values, GET(), GET(), HeroStage() (+33 more)

### Community 43 - "Ops manager contract"
Cohesion: 0.20
Nodes (10): Conventions, Docker socket proxy, Errors, `GET /services` (STATUS), Health probe: `GET /api/ops/health` (website), Ops manager contract, Permission bits, Restore is manual (+2 more)

### Community 44 - "line-chart.tsx"
Cohesion: 0.14
Nodes (29): EMPTY, Tile, BarDatum, DAY, finite(), formatDay(), LineChart(), onKeyDown() (+21 more)

### Community 45 - "player/[id]/actions.ts"
Cohesion: 0.36
Nodes (10): blockPlayer(), finish(), playerId(), removeFriend(), reportPlayer(), respondFriendRequest(), sendFriendRequest(), ask() (+2 more)

### Community 46 - "ics.ts"
Cohesion: 0.20
Nodes (12): RFC-5545, GET(), encoder, escapeText(), eventIcs(), fold(), IcsEvent, icsFilename() (+4 more)

### Community 47 - "app/layout.tsx"
Cohesion: 0.27
Nodes (8): @vercel/analytics, metadata, RootLayout(), SiteFooter(), bodyFont, bodyFontRegular, displayFont, monoFont

### Community 48 - "ops/actions.ts"
Cohesion: 0.25
Nodes (8): openConsole(), opsAction(), SERVICE_ACTIONS, TARGETS, m, redirected(), managerErrorCode(), SERVICE_ID

### Community 49 - "achievement-grid.tsx"
Cohesion: 0.23
Nodes (12): Role, ShowcasePicker(), AchievementGrid(), achievementImage(), day(), EventHistory(), ShowcaseRow(), Tier (+4 more)

### Community 50 - "@playwright/test"
Cohesion: 0.17
Nodes (13): ADMIN, PUBLIC, WIDTHS, accessToken, resetVisualSession(), VISUAL_EVENT_ID, VISUAL_HIDDEN_PLAYER_ID, VISUAL_PLAYER_ID (+5 more)

### Community 51 - "admin/players/page.tsx"
Cohesion: 0.05
Nodes (72): RFC-4180, 1. The URL is the state, 2. Columns declare what they can do, 3. Above the table, 4. Every value is a link, 5. One RPC per table, 6. States, Admin tables: the protocol (+64 more)

### Community 52 - "notification-bell.tsx"
Cohesion: 0.20
Nodes (11): NotificationItem, openNotifications(), OpenNotificationsResult, m, ROW, describe(), NotificationBell(), load() (+3 more)

### Community 53 - "showcase"
Cohesion: 0.28
Nodes (8): 1. Migration `20261026000001_achievement_rarity.sql` + `achievement_rarity.test.sql`, 2. Admin + cards, 3. Showcase UI, A. Rarity tier + showcase, AchievementGroup, showcase(), badge(), group()

### Community 54 - "app/settings/page.tsx"
Cohesion: 0.25
Nodes (14): @supabase/supabase-js, unlinkPersonalGoogle(), SettingsPage(), byAge(), classifyIdentities(), identityEmail(), isChulaEmail(), LINK_ERRORS (+6 more)

### Community 55 - "data.ts"
Cohesion: 0.12
Nodes (23): `GET /service/:id/uptime?days=7` (STATUS), 1. Migration `20261030000001_insights.sql` + `insights.test.sql`, 2. Migration `20261030000002_funnel_failures.sql` + recording, 3. Insights TS core: range, series, CSV, tabs, 4. SVG chart components, Global Constraints, Review Focus, Spec coverage (+15 more)

### Community 56 - "v1.1 Phase 5 — Achievements & engagement"
Cohesion: 0.13
Nodes (17): Badge roles, `discord_role_queue()`, `discord_role_queue_done(p_items jsonb)` → `integer`, Acceptance criteria, ADR (draft), Changelog (consensus final), Changelog (consensus rev 2), Decisions (+9 more)

### Community 59 - "registration.ts"
Cohesion: 0.14
Nodes (22): metadata, Privacy, PRIVACY_ERRORS, checkName(), ConfirmDialog(), NameForm(), submit(), Pending (+14 more)

### Community 60 - "Endpoints"
Cohesion: 0.20
Nodes (10): Aliases, Console WebSocket `/service/:id/console` (CONSOLE_READ; CONSOLE_WRITE to send), Endpoints, `GET /service/:id/image` (STATUS), `GET /service/:id/metrics?hours=24` (STATUS), `GET /service/:id/rlog` (LOGS), `GET /service/:id/status` (STATUS), `POST /backups` (BACKUP_RUN) (+2 more)

### Community 61 - "Tables"
Cohesion: 0.22
Nodes (10): Accounts and identity, Content, Discord bot settings and tasks (v1.1 phase 7), Engagement (v1.1 phase 5), Insights (v1.1 phase 6), Minecraft whitelist, Social, Tables (+2 more)

### Community 62 - "Tasks"
Cohesion: 0.20
Nodes (10): 0. Pre-check: pgcrypto location, 10. Migration `20261029000001_notifications.sql` + `notifications.test.sql`, 11. Bell UI, 12. Contract doc + mocks, 13. Verify, 4. Migration `20261026000002_achievement_discord_roles.sql` + `achievement_discord_roles.test.sql`, B. Discord roles, E. Notification bell (+2 more)

### Community 63 - "PixelIcon"
Cohesion: 0.15
Nodes (17): AdminAuditPage(), bangkokDay(), ENTITIES, Entry, metadata, Params, StatRow(), Stats (+9 more)

### Community 64 - "app/events/[id]/check-in/actions.ts"
Cohesion: 0.17
Nodes (13): GET(), call(), GET(), call(), m, robots(), getSiteUrl(), names (+5 more)

### Community 65 - "announcements/[id]/actions.ts"
Cohesion: 0.29
Nodes (9): uploadPicture(), deleteAnnouncement(), postedId(), refresh(), saveAnnouncement(), SEVERITIES, form(), m (+1 more)

### Community 66 - "admin-nav.tsx"
Cohesion: 0.43
Nodes (6): Task 5: Grouped admin nav, 7. Fix the pages that missed (scope set by Task 6), AdminNavGroup(), isActive(), Link, NavLinks()

### Community 67 - "event-card.tsx"
Cohesion: 0.16
Nodes (17): EventsPage(), metadata, matches(), metadata, PAGES, PlayerHit, SearchPage(), dayBadge() (+9 more)

### Community 68 - "dashboard/actions.test.ts"
Cohesion: 0.23
Nodes (14): Moderation, finish(), LEVELS, otherId(), removeFriend(), respondFriendRequest(), setBanner(), setShowcase() (+6 more)

### Community 69 - "checkIn"
Cohesion: 0.22
Nodes (7): 5. Migration `20261027000001_event_attendance.sql` + `event_attendance.test.sql`, 6. Staff check-in page `/admin/commu/events/[id]/check-in`, 7. Player side, C. Check-in and attendance, checkIn(), m, redirected()

### Community 70 - "dbErrorCode"
Cohesion: 0.26
Nodes (7): decideAppeal(), handleReport(), restoreAccount(), m, redirected(), dbErrorCode(), UUID

### Community 71 - "ops"
Cohesion: 0.40
Nodes (6): Audit, serviceMetrics(), serviceStatus(), serviceUptime(), ops(), wave()

### Community 72 - "staffCan"
Cohesion: 0.29
Nodes (9): AdminNav(), ALL_GROUPS, groupsFor(), CommandSearch(), Area, AREAS, isStaff(), ROLE_LABELS (+1 more)

### Community 73 - "ProfileBanner"
Cohesion: 0.18
Nodes (13): 1. `eventHistory()` helper + test, 2. `ProfileBanner` component, 3. Public player page (`src/app/player/[id]/page.tsx`), 4. Report dialog, 5. Profile page (`src/app/dashboard/page.tsx`), 6. Motion, 7. Verify, Addendum — profile banners (2026-10-17, kaikub request) (+5 more)

### Community 74 - "@playwright/test"
Cohesion: 0.22
Nodes (5): @playwright/test, accessToken, der, seed, visualManagerKey

### Community 75 - "checkIn"
Cohesion: 0.15
Nodes (13): `/admin/commu/events/[id]/check-in` (page), Error capture and health, `/events/[id]/check-in` (page), `GET /api/dev-login?as=<user>` — local only, `GET /auth/callback?code=…`, `GET /check-in/continue`, `GET /events/[id]/calendar.ics`, `GET /events/[id]/check-in/start?t=<token>` (+5 more)

### Community 76 - "Discord bot contract: settings and automatic tasks (v1.1 phase 7)"
Cohesion: 0.15
Nodes (13): Admin side (for reference), After applying settings: `bot_settings_report(p_items jsonb)` → `integer`, Discord bot contract: settings and automatic tasks (v1.1 phase 7), Every poll: `bot_config()` → `jsonb`, Every task run: `bot_job_report(p_job, p_started_at, p_finished_at, p_ok, p_items, p_error)` → `void`, Local mock, Role safety, Rules for the bot (+5 more)

### Community 77 - "event-form.tsx"
Cohesion: 0.16
Nodes (13): 8. Migration `20261028000001_event_reminders.sql` + `event_reminders.test.sql`, 9. Event form, `.ics`, button, D. Reminders and calendar, EventForm(), onCover(), pickFile(), EventFormValues, LOADED_AT (+5 more)

### Community 78 - "chart-frame.tsx"
Cohesion: 0.30
Nodes (8): cell(), ChartColumn, ChartFrame(), CsvButton(), download(), cell(), cols, toCsv()

### Community 79 - "mcsv-token.ts"
Cohesion: 0.36
Nodes (7): b64url(), managerSocketOrigin(), managerUrl(), maskFor(), mintToken(), PERMISSION, { privateKey, publicKey }

### Community 80 - "app/events/[id]/page.tsx"
Cohesion: 0.38
Nodes (9): clock(), day(), ends(), ERRORS, EventDetail, EventPage(), generateMetadata(), loadEvent() (+1 more)

### Community 81 - "health/route.ts"
Cohesion: 0.43
Nodes (5): digest(), GET(), get(), m, opsHealth

### Community 82 - "Performance baseline (v1.1 Phase 7, Task 6)"
Cohesion: 0.10
Nodes (19): Admin pages: server response, local production build (ms), Auditing `/player/[id]` signed in (final fix wave), Call waterfall per page (one request, ms per call, in completion order), Client-side fixes (the actual cause), Diagnosis: what the LCP is made of, Fix 1: region alignment (MANUAL, not applied), Fix 2: collapse sequential awaits (not applicable), Fix 3: public content caching (not added) (+11 more)

### Community 83 - "v1.1 Phase 7 — Ops console, performance, hardening"
Cohesion: 0.33
Nodes (9): Error capture (v1.1 phase 7), 1. Website error capture + health endpoint, File Structure, AppErrorKind, fingerprint(), recordAppError(), scrub(), m (+1 more)

### Community 84 - "Tasks"
Cohesion: 0.18
Nodes (10): 1. Announcement images, 2. Gallery, 3. Team page, 4. Site settings, 5. Verify, Already covered (no work), Answers (kaikub, 2026-10-17) and what was built, Revision (kaikub, 2026-10-17, same day) (+2 more)

### Community 85 - "lighthouse.mjs"
Cohesion: 0.33
Nodes (4): base, [baseArg, eventArg, playerArg], pages, rows

### Community 86 - "charts.test.tsx"
Cohesion: 0.29
Nodes (12): STEP_LABELS, BarChart(), barRows(), barWidths(), shown(), barReadout(), BarRow, BarRows() (+4 more)

### Community 87 - "banners/page.tsx"
Cohesion: 0.24
Nodes (9): deleteBanner(), BannerForm(), clearFile(), onFile(), AdminBannersPage(), BLANK, DONE, ERRORS (+1 more)

### Community 90 - "commu/events/[id]/check-in/actions.ts"
Cohesion: 0.27
Nodes (12): Server actions, awardAttendees(), checkInPlayer(), code(), finish(), page(), postedId(), removeAttendance() (+4 more)

### Community 91 - "app/events/[id]/actions.ts"
Cohesion: 0.31
Nodes (8): eventId(), signInPath(), form(), interested(), m, redirected(), toggleInterest(), UPCOMING_EVENTS_TAG

### Community 92 - "instrumentation.test.ts"
Cohesion: 0.33
Nodes (4): Decisions, onRequestError(), m, request

### Community 93 - "ChulaCraft developer docs"
Cohesion: 0.33
Nodes (6): ChulaCraft developer docs, Environment variables, Everyday commands, Keeping these docs true, Rules every change must keep, System at a glance

### Community 94 - "Event reminders"
Cohesion: 0.50
Nodes (4): `event_reminder_sent(p_event_id uuid, p_offset_minutes integer)` → `boolean`, Event reminders, `event_reminders_queue()`, Message

### Community 95 - "src_app_admin_admin_module"
Cohesion: 0.14
Nodes (4): CATEGORIES, DONE, ERRORS, metadata

### Community 96 - "ops-bot.spec.ts"
Cohesion: 0.22
Nodes (4): `/admin/ops` (pages), Manager config, accessToken, bot()

### Community 97 - "achievements/[id]/actions.test.ts"
Cohesion: 0.40
Nodes (3): form(), m, valid()

### Community 98 - "icons.tsx"
Cohesion: 0.12
Nodes (11): ERRORS, metadata, ROLE_DONE, ROLE_ERRORS, Avatar(), metadata, PlayersPage(), SearchHit (+3 more)

### Community 99 - "reportError"
Cohesion: 0.18
Nodes (9): Error(), GlobalError(), metadata, NotFoundPage(), Action, ErrorScreen(), Href, reportError() (+1 more)

### Community 100 - "markdown.tsx"
Cohesion: 0.47
Nodes (7): block(), cells(), inline(), Markdown(), table(), html(), withBreaks()

### Community 101 - "Review Focus"
Cohesion: 0.25
Nodes (7): Final, Global Constraints, Review Focus, Task 2: Hero copy, Task 3: Readable admin stat numbers, Task 4: Move community admin to `/admin/commu/*`, v1.1 Phase 1 — Quick Fixes & Admin Navigation Implementation Plan

### Community 102 - "scanner.tsx"
Cohesion: 0.21
Nodes (11): ScanResult, Avatar(), Camera, Detector, DetectorClass, ERRORS, Scanner(), fallBack() (+3 more)

### Community 103 - "commu/events/[id]/actions.test.ts"
Cohesion: 0.33
Nodes (3): form(), m, valid()

### Community 104 - "Database"
Cohesion: 0.50
Nodes (4): Database, Other services that use this database, Player-readable tables, RPC functions

### Community 105 - "checkin-qr.tsx"
Cohesion: 0.33
Nodes (8): nextToken(), CheckinQr(), load(), clock(), Closed(), ERRORS, View, WindowState

### Community 106 - "allowScripts"
Cohesion: 0.33
Nodes (4): allowScripts, unrs-resolver@1.12.2, overrides, postcss

### Community 107 - "database.types.ts"
Cohesion: 0.12
Nodes (20): @supabase/ssr, signIn(), start(), getPublicSupabaseEnvironment(), createClient(), CompositeTypes, Constants, DatabaseWithoutInternals (+12 more)

### Community 109 - "announcement-banner.tsx"
Cohesion: 0.83
Nodes (3): AnnouncementBanner(), dismissedId(), subscribe()

### Community 110 - "next"
Cohesion: 0.11
Nodes (13): next, DONE, ERRORS, metadata, ERRORS, metadata, RemovedRow, CheckInPage() (+5 more)

### Community 112 - "Keyboard-only pass: register and report-player"
Cohesion: 0.50
Nodes (3): Human confirmation pending (kaikub), Keyboard-only pass: register and report-player, Steps and result

### Community 114 - "[service]/page.tsx"
Cohesion: 0.11
Nodes (23): BACKUP, bytes(), Chip, DONE, ERRORS, JOB, Outcome(), percent() (+15 more)

## Knowledge Gaps
- **11 isolated node(s):** `@emnapi/core`, `@emnapi/runtime`, `@types/node`, `@types/qrcode`, `@types/react` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 702 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `vitest`, `bot/page.tsx`, `minecraft/route.ts`, `package.json`, `banner-form.tsx`, `site-content.ts`, `createClient`, `ops/page.tsx`, `dbErrorCode`, `dashboard/page.tsx`, `createClient`, `player/[id]/opengraph-image.tsx`, `callback/route.ts`, `users/[id]/page.tsx`, `achievements/[id]/page.tsx`, `player/[id]/page.tsx`, `SubmitButton`, `insights/page.tsx`, `metric-tile.tsx`, `member-preview.tsx`, `welcome/page.tsx`, `site-header.tsx`, `timed`, `bot/actions.ts`, `command-search.tsx`, `react`, `player/[id]/actions.ts`, `app/layout.tsx`, `ops/actions.ts`, `achievement-grid.tsx`, `admin/players/page.tsx`, `notification-bell.tsx`, `app/settings/page.tsx`, `registration.ts`, `PixelIcon`, `app/events/[id]/check-in/actions.ts`, `announcements/[id]/actions.ts`, `admin-nav.tsx`, `event-card.tsx`, `dashboard/actions.test.ts`, `dbErrorCode`, `event-form.tsx`, `app/events/[id]/page.tsx`, `banners/page.tsx`, `commu/events/[id]/check-in/actions.ts`, `app/events/[id]/actions.ts`, `instrumentation.test.ts`, `src_app_admin_admin_module`, `icons.tsx`, `reportError`, `checkin-qr.tsx`, `database.types.ts`, `announcement-banner.tsx`, `[service]/page.tsx`?**
  _High betweenness centrality (0.207) - this node is a cross-community bridge._
- **What connects `@emnapi/core`, `@emnapi/runtime`, `@types/node` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `vitest` be split into smaller, more focused modules?**
  _Cohesion score 0.14705882352941177 - nodes in this community are weakly interconnected._
- **Why does `createClient()` connect `createClient` to `vitest`, `bot/page.tsx`, `minecraft/route.ts`, `banner-form.tsx`, `events.tsx`, `site-content.ts`, `ops/page.tsx`, `dbErrorCode`, `dashboard/page.tsx`, `createClient`, `player/[id]/opengraph-image.tsx`, `callback/route.ts`, `users/[id]/page.tsx`, `achievements/[id]/page.tsx`, `player/[id]/page.tsx`, `SubmitButton`, `insights/page.tsx`, `member-preview.tsx`, `welcome/page.tsx`, `site-header.tsx`, `timed`, `bot/actions.ts`, `command-search.tsx`, `react`, `player/[id]/actions.ts`, `ics.ts`, `admin/players/page.tsx`, `notification-bell.tsx`, `app/settings/page.tsx`, `PixelIcon`, `app/events/[id]/check-in/actions.ts`, `announcements/[id]/actions.ts`, `event-card.tsx`, `dashboard/actions.test.ts`, `checkIn`, `dbErrorCode`, `app/events/[id]/page.tsx`, `banners/page.tsx`, `commu/events/[id]/check-in/actions.ts`, `app/events/[id]/actions.ts`, `src_app_admin_admin_module`, `icons.tsx`, `checkin-qr.tsx`, `database.types.ts`, `next`, `[service]/page.tsx`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Should `bot/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10510510510510511 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `vitest` to `bot/page.tsx`, `minecraft/route.ts`, `package.json`, `banner-form.tsx`, `ref_node_crypto`, `site-content.ts`, `ops/page.tsx`, `dbErrorCode`, `player/[id]/opengraph-image.tsx`, `contrast.test.ts`, `callback/route.ts`, `users/[id]/page.tsx`, `insights/page.tsx`, `reconcile-identities.test.ts`, `timed`, `bot/actions.ts`, `command-search.tsx`, `react`, `line-chart.tsx`, `player/[id]/actions.ts`, `ics.ts`, `ops/actions.ts`, `admin/players/page.tsx`, `notification-bell.tsx`, `showcase`, `app/settings/page.tsx`, `data.ts`, `v1.1 Phase 5 — Achievements & engagement`, `PixelIcon`, `app/events/[id]/check-in/actions.ts`, `announcements/[id]/actions.ts`, `dashboard/actions.test.ts`, `checkIn`, `dbErrorCode`, `staffCan`, `chart-frame.tsx`, `mcsv-token.ts`, `health/route.ts`, `v1.1 Phase 7 — Ops console, performance, hardening`, `charts.test.tsx`, `commu/events/[id]/check-in/actions.ts`, `app/events/[id]/actions.ts`, `instrumentation.test.ts`, `achievements/[id]/actions.test.ts`, `reportError`, `markdown.tsx`, `commu/events/[id]/actions.test.ts`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.12418300653594772 - nodes in this community are weakly interconnected._