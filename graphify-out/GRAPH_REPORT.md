# Graph Report - chulacraft-web  (2026-10-31)

## Corpus Check
- 442 files · ~324,514 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 41 file(s) not represented in the graph (top: .css 33, (none) 2, .toml 2)

## Summary
- 2026 nodes · 5657 edges · 99 communities (92 shown, 7 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 240 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4ef19d4d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- banners/actions.test.ts
- bot/page.tsx
- minecraft/route.ts
- package.json
- banner-form.tsx
- compilerOptions
- getSiteUrl
- devDependencies
- local-mocks.mjs
- ChulaCraft Web Version 1.0
- events.tsx
- site-content.ts
- commu/announcements/page.tsx
- ops/page.tsx
- dbErrorCode
- Chulacraft registration runbook
- CLAUDE.md
- supabase/README.md
- dashboard/page.tsx
- add
- player/[id]/opengraph-image.tsx
- contrast.test.ts
- supabase-stub.mjs
- server.ts
- Tasks
- users/[id]/page.tsx
- achievements/[id]/page.tsx
- player/[id]/page.tsx
- dependencies
- scripts
- commu/events/[id]/check-in/page.tsx
- proxy.ts
- metric-tile.tsx
- member-preview.tsx
- PixelIcon
- Phases
- site-header.tsx
- reconcile-identities.test.ts
- cache.spec.ts
- timed
- notifications/actions.test.ts
- src_app_admin_admin_module
- react
- Endpoints
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
- ChulaCraft developer docs
- registration.ts
- Tables
- Tasks
- PixelIcon
- app/events/[id]/check-in/page.tsx
- announcements/[id]/actions.ts
- event-card.tsx
- dashboard/actions.test.ts
- safeNext
- dbErrorCode
- staffCan
- ProfileBanner
- manager-key.mjs
- checkIn
- Discord bot contract: settings and automatic tasks (v1.1 phase 7)
- event-form.tsx
- chart-frame.tsx
- app/events/[id]/page.tsx
- health/route.ts
- Performance baseline (v1.1 Phase 7, Task 6)
- app-errors.ts
- Tasks
- charts.test.tsx
- ops.spec.ts
- commu/events/[id]/check-in/actions.ts
- app/events/[id]/actions.ts
- Event reminders
- icons.tsx
- error/page.tsx
- markdown.tsx
- Review Focus
- scanner.tsx
- commu/events/[id]/page.tsx
- checkin-qr.tsx
- database.types.ts
- next
- Keyboard-only pass: register and report-player
- [service]/page.tsx

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 192 edges
2. `PixelIcon()` - 135 edges
3. `next` - 129 edges
4. `timed()` - 96 edges
5. `vitest` - 67 edges
6. `dbErrorCode()` - 63 edges
7. `SubmitButton()` - 51 edges
8. `ConfirmAction()` - 43 edges
9. `react` - 38 edges
10. `publicImageUrl()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Ops console (with `npm run dev:mocks`)` --references--> `ops()`  [INFERRED]
  docs/manual-check-v1.1-phases-5-7.md → scripts/local-mocks.mjs
- `Insights (v1.1 phase 6)` --references--> `code()`  [INFERRED]
  docs/database.md → src/app/admin/commu/events/[id]/check-in/actions.ts
- `5. Migration `20261027000001_event_attendance.sql` + `event_attendance.test.sql`` --references--> `code()`  [INFERRED]
  docs/superpowers/plans/2026-10-22-v1.1-phase5-engagement.md → src/app/admin/commu/events/[id]/check-in/actions.ts
- `Task 5: Clickable dashboard numbers + real Unverified / Guest cards` --references--> `StatRow()`  [INFERRED]
  docs/superpowers/plans/2026-10-16-v1.1-phase2a-players-table.md → src/app/admin/overview.tsx
- ``GET /events/[id]/check-in/start?t=<token>`` --references--> `checkIn()`  [INFERRED]
  docs/api.md → src/app/events/[id]/check-in/actions.ts

## Import Cycles
- None detected.

## Communities (99 total, 7 thin omitted)

### Community 0 - "banners/actions.test.ts"
Cohesion: 0.20
Nodes (7): sharp, shots, colors, gif(), m, png(), raw()

### Community 1 - "bot/page.tsx"
Cohesion: 0.09
Nodes (38): 5. Discord bot settings + automatic tasks (`/admin/ops/bot`), KINDS, limit(), saveBotSetting(), setBotJobEnabled(), m, CheckLine(), GROUPS (+30 more)

### Community 2 - "minecraft/route.ts"
Cohesion: 0.15
Nodes (21): `/api/registration/minecraft` — player's Minecraft accounts, DELETE(), fail(), GET(), PATCH(), POST(), Profile, record() (+13 more)

### Community 3 - "package.json"
Cohesion: 0.09
Nodes (21): allowScripts, unrs-resolver@1.12.2, engines, node, name, overrides, postcss, private (+13 more)

### Community 4 - "banner-form.tsx"
Cohesion: 0.15
Nodes (23): imageKey(), Checked, checkFile(), deleteBanner(), saveBanner(), BannerForm(), clearFile(), onFile() (+15 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "getSiteUrl"
Cohesion: 0.21
Nodes (9): robots(), dynamic, sitemap(), STATIC_ROUTES, getSiteUrl(), names, originalValues, anonClient() (+1 more)

### Community 7 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, @axe-core/playwright, eslint, eslint-config-next, @eslint/js, @playwright/test, @types/node, @types/qrcode (+5 more)

### Community 8 - "local-mocks.mjs"
Cohesion: 0.06
Nodes (48): RFC-6455, Audit, base, [baseArg, eventArg, playerArg], pages, rows, ACTION_BITS, addEnv() (+40 more)

### Community 9 - "ChulaCraft Web Version 1.0"
Cohesion: 0.10
Nodes (19): Architecture, Chula verification (Google), ChulaCraft Web Version 1.0, Commands, Current implementation caveats, Deployment, Discord authentication, Environment (+11 more)

### Community 10 - "events.tsx"
Cohesion: 0.19
Nodes (36): countValues(), earliest(), playerStats(), snapValues(), stat, Window, metadata, Panel() (+28 more)

### Community 11 - "site-content.ts"
Cohesion: 0.06
Nodes (49): normal(), savePage(), m, run(), AdminPagesPage(), metadata, AdminEditPage(), DONE (+41 more)

### Community 12 - "commu/announcements/page.tsx"
Cohesion: 0.40
Nodes (5): `GET /service/:id/status` (STATUS), AdminAnnouncementsPage(), ERRORS, metadata, state()

### Community 13 - "ops/page.tsx"
Cohesion: 0.12
Nodes (34): File Structure, bytes(), Outcome(), percent(), loadServices(), Actions(), BITS, COPY (+26 more)

### Community 14 - "dbErrorCode"
Cohesion: 0.15
Nodes (24): addPlayers(), awardId(), confirmAward(), fail(), prefillInterested(), previewAward(), m, unique() (+16 more)

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.14
Nodes (13): Chulacraft registration runbook, Daily stats, Normal operations, Ops console, backups and restore, `OPS_HEALTH_TOKEN` (website health probe), Release order (ops console), Restore a Supabase dump, Restore a world backup (+5 more)

### Community 18 - "dashboard/page.tsx"
Cohesion: 0.10
Nodes (26): AdminAchievementPage(), MetaFields(), metadata, NewAchievementPage(), submitAppeal(), APPEAL_ERRORS, BanCard(), date() (+18 more)

### Community 19 - "add"
Cohesion: 0.29
Nodes (8): Badge roles, `discord_role_queue()`, `discord_role_queue_done(p_items jsonb)` → `integer`, 4. Migration `20261026000002_achievement_discord_roles.sql` + `achievement_discord_roles.test.sql`, Acceptance criteria, B. Discord roles, Risks and mitigations, add()

### Community 20 - "player/[id]/opengraph-image.tsx"
Cohesion: 0.12
Nodes (26): alt, contentType, Image(), size, when(), alt, contentType, Image() (+18 more)

### Community 21 - "contrast.test.ts"
Cohesion: 0.15
Nodes (16): chartThemes, contrast(), css, dark, fromOklab(), lightBlock, luminance(), printBlock (+8 more)

### Community 22 - "supabase-stub.mjs"
Cohesion: 0.13
Nodes (20): at(), day(), FACULTIES, insightsFixture(), snapshots(), today(), AREAS, BOT_JOBS (+12 more)

### Community 23 - "server.ts"
Cohesion: 0.31
Nodes (11): Decisions, @supabase/ssr, authErrorResponse(), GET(), createBoundedFetch(), getPublicSupabaseEnvironment(), getSecretSupabaseEnvironment(), createClient() (+3 more)

### Community 24 - "Tasks"
Cohesion: 0.17
Nodes (12): 2. Manager contract + mocks, 3. Access RPC, token bits, `src/lib/ops.ts`, 4. `/admin/ops` list + detail + website + backups UI, 6. Measure (no fixes yet), 8. Stale-cache guard (only if Task 7 added caching), 9. Audit gates: axe, Lighthouse, SEO metadata, keyboard pass, Global Constraints, Spec coverage (+4 more)

### Community 25 - "users/[id]/page.tsx"
Cohesion: 0.05
Nodes (72): addGalleryImage(), alt(), deleteGalleryGroup(), deleteGalleryImage(), fail(), finish(), moveGalleryGroup(), moveGalleryImage() (+64 more)

### Community 26 - "achievements/[id]/page.tsx"
Cohesion: 0.15
Nodes (16): deleteAchievement(), finish(), postedId(), revokeAward(), saveAchievement(), form(), m, valid() (+8 more)

### Community 27 - "player/[id]/page.tsx"
Cohesion: 0.31
Nodes (8): Avatar(), ERRORS, generateMetadata(), loadCard(), mcHead(), PlayerCard, PlayerPage(), toEventHistory()

### Community 28 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, @emnapi/core, @emnapi/runtime, next, qrcode, react, react-dom, sharp (+3 more)

### Community 29 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, db:types, dev, dev:mocks, lint, start, test (+3 more)

### Community 30 - "commu/events/[id]/check-in/page.tsx"
Cohesion: 0.31
Nodes (8): AwardAttendees(), WindowState, AdminCheckInPage(), Avatar(), ERRORS, metadata, METHODS, windowState()

### Community 31 - "proxy.ts"
Cohesion: 0.43
Nodes (6): updateSession(), withCsp(), buildCsp(), config, proxy(), supabaseOrigin()

### Community 32 - "metric-tile.tsx"
Cohesion: 0.27
Nodes (10): 6. Players tile strip + docs, ARROW, deltaText(), MetricTile(), SPOKEN, linearScale(), finite(), sparkLabel() (+2 more)

### Community 33 - "member-preview.tsx"
Cohesion: 0.06
Nodes (60): publicImageUrl(), uploadPicture(), AnnouncementPreview(), Saved, AdminAnnouncementPage(), DONE, ERRORS, metadata (+52 more)

### Community 34 - "PixelIcon"
Cohesion: 0.22
Nodes (13): react-dom, ServiceUnavailable(), AboutYouPage(), metadata, metadata, { getUser, getUserIdentities, rpc, redirect, reconcileIdentities }, page(), VerifyPage() (+5 more)

### Community 35 - "Phases"
Cohesion: 0.15
Nodes (12): ChulaCraft Web v1.1 — Roadmap Spec, Decisions already made, Deferred (needs Minecraft server endpoint), Global constraints (every phase), Phase 1 — Quick fixes & admin navigation  → `plans/2026-10-16-v1.1-phase1-quick-fixes.md`, Phase 2 — Admin power tools, Phase 3 — Design system & UI redesign, Phase 4 — Content without a developer (+4 more)

### Community 36 - "site-header.tsx"
Cohesion: 0.19
Nodes (14): GET(), RootLayout(), Brand(), COLUMNS, SiteFooter(), Avatar(), SiteHeader(), HeaderShell() (+6 more)

### Community 37 - "reconcile-identities.test.ts"
Cohesion: 0.15
Nodes (9): admin, cu, discord, f, gmail, m, query, run() (+1 more)

### Community 39 - "timed"
Cohesion: 0.20
Nodes (15): Layout(), Layout(), AdminEventsPage(), metadata, Layout(), AdminLayout(), metadata, Layout() (+7 more)

### Community 41 - "src_app_admin_admin_module"
Cohesion: 0.10
Nodes (14): Task 5: Grouped admin nav, 7. Fix the pages that missed (scope set by Task 6), AdminNav(), ALL_GROUPS, AdminNavGroup(), isActive(), Link, groupsFor() (+6 more)

### Community 42 - "react"
Cohesion: 0.17
Nodes (17): react, GET(), HeroStage(), HomeHero(), HomePage(), loadUpcomingEvents(), metadata, steps() (+9 more)

### Community 43 - "Endpoints"
Cohesion: 0.05
Nodes (35): `/admin/ops` (pages), Audits and SEO, Before deploying (release order matters), Bot settings (`/admin/ops/bot`, with `node scripts/local-mocks.mjs --bot` against local Supabase), Known follow-ups (not blocking, from review), Ops console (with `npm run dev:mocks`), Performance (needs Vercel/Supabase dashboards — not reachable from the dev machine), Phase 5: engagement (rarity, Discord roles, check-in, reminders, bell) (+27 more)

### Community 44 - "line-chart.tsx"
Cohesion: 0.15
Nodes (28): EMPTY, Tile, DAY, finite(), formatDay(), LineChart(), onKeyDown(), onPointerMove() (+20 more)

### Community 45 - "player/[id]/actions.ts"
Cohesion: 0.36
Nodes (10): blockPlayer(), finish(), playerId(), removeFriend(), reportPlayer(), respondFriendRequest(), sendFriendRequest(), ask() (+2 more)

### Community 46 - "ics.ts"
Cohesion: 0.20
Nodes (12): RFC-5545, GET(), encoder, escapeText(), eventIcs(), fold(), IcsEvent, icsFilename() (+4 more)

### Community 47 - "app/layout.tsx"
Cohesion: 0.33
Nodes (6): @vercel/analytics, metadata, bodyFont, bodyFontRegular, displayFont, monoFont

### Community 48 - "ops/actions.ts"
Cohesion: 0.16
Nodes (17): openConsole(), opsAction(), SERVICE_ACTIONS, TARGETS, m, redirected(), ServiceConsole(), send() (+9 more)

### Community 49 - "achievement-grid.tsx"
Cohesion: 0.19
Nodes (14): Role, AchievementGrid(), achievementImage(), day(), EventHistory(), EventVisit, ShowcaseRow(), Tier (+6 more)

### Community 50 - "@playwright/test"
Cohesion: 0.16
Nodes (15): @axe-core/playwright, @playwright/test, ADMIN, PUBLIC, WIDTHS, accessToken, resetVisualSession(), VISUAL_EVENT_ID (+7 more)

### Community 51 - "admin/players/page.tsx"
Cohesion: 0.05
Nodes (73): RFC-4180, 1. The URL is the state, 2. Columns declare what they can do, 3. Above the table, 4. Every value is a link, 5. One RPC per table, 6. States, Admin tables: the protocol (+65 more)

### Community 52 - "notification-bell.tsx"
Cohesion: 0.26
Nodes (9): NotificationItem, openNotifications(), OpenNotificationsResult, describe(), NotificationBell(), load(), toggle(), relative() (+1 more)

### Community 53 - "showcase"
Cohesion: 0.28
Nodes (8): 1. Migration `20261026000001_achievement_rarity.sql` + `achievement_rarity.test.sql`, 2. Admin + cards, 3. Showcase UI, A. Rarity tier + showcase, AchievementGroup, showcase(), badge(), group()

### Community 54 - "app/settings/page.tsx"
Cohesion: 0.21
Nodes (17): Task 1: Show the Discord name everywhere, @supabase/supabase-js, unlinkPersonalGoogle(), WelcomePage(), byAge(), classifyIdentities(), discordAvatar(), discordName() (+9 more)

### Community 55 - "data.ts"
Cohesion: 0.09
Nodes (33): 1. Migration `20261030000001_insights.sql` + `insights.test.sql`, 2. Migration `20261030000002_funnel_failures.sql` + recording, 3. Insights TS core: range, series, CSV, tabs, 4. SVG chart components, 5. `/admin/insights` page, panels, print, nav, File Structure, Global Constraints, Review Focus (+25 more)

### Community 56 - "v1.1 Phase 5 — Achievements & engagement"
Cohesion: 0.20
Nodes (9): ADR (draft), Changelog (consensus final), Changelog (consensus rev 2), Open questions (defaults used above), Out of scope, RALPLAN-DR summary (mode: SHORT), Requirements summary, v1.1 Phase 5 — Achievements & engagement (+1 more)

### Community 57 - "insights.spec.ts"
Cohesion: 0.11
Nodes (5): AuditOptions, auditPage(), accessToken, accessToken, routes

### Community 58 - "ChulaCraft developer docs"
Cohesion: 0.23
Nodes (6): ChulaCraft developer docs, Environment variables, Everyday commands, Keeping these docs true, Rules every change must keep, System at a glance

### Community 59 - "registration.ts"
Cohesion: 0.12
Nodes (25): metadata, Privacy, PRIVACY_ERRORS, SettingsPage(), checkName(), ConfirmDialog(), NameForm(), submit() (+17 more)

### Community 61 - "Tables"
Cohesion: 0.15
Nodes (15): Accounts and identity, Content, Database, Discord bot settings and tasks (v1.1 phase 7), Engagement (v1.1 phase 5), Error capture (v1.1 phase 7), Insights (v1.1 phase 6), Minecraft whitelist (+7 more)

### Community 62 - "Tasks"
Cohesion: 0.17
Nodes (12): 0. Pre-check: pgcrypto location, 10. Migration `20261029000001_notifications.sql` + `notifications.test.sql`, 11. Bell UI, 12. Contract doc + mocks, 13. Verify, 8. Migration `20261028000001_event_reminders.sql` + `event_reminders.test.sql`, 9. Event form, `.ics`, button, D. Reminders and calendar (+4 more)

### Community 63 - "PixelIcon"
Cohesion: 0.08
Nodes (31): decideAppeal(), AdminAppealsPage(), DONE, ERRORS, metadata, AdminAuditPage(), bangkokDay(), ENTITIES (+23 more)

### Community 64 - "app/events/[id]/check-in/page.tsx"
Cohesion: 0.14
Nodes (15): checkIn(), m, redirected(), CheckInPage(), ERRORS, EventSummary, metadata, when() (+7 more)

### Community 65 - "announcements/[id]/actions.ts"
Cohesion: 0.27
Nodes (9): BUCKET, deleteAnnouncement(), postedId(), refresh(), saveAnnouncement(), SEVERITIES, form(), m (+1 more)

### Community 67 - "event-card.tsx"
Cohesion: 0.16
Nodes (16): EventsPage(), metadata, matches(), metadata, PAGES, PlayerHit, SearchPage(), dayBadge() (+8 more)

### Community 68 - "dashboard/actions.test.ts"
Cohesion: 0.23
Nodes (14): Moderation, finish(), LEVELS, otherId(), removeFriend(), respondFriendRequest(), setBanner(), setShowcase() (+6 more)

### Community 69 - "safeNext"
Cohesion: 0.27
Nodes (6): `GET /check-in/continue`, 7. Player side, Decisions, GET(), call(), safeNext()

### Community 70 - "dbErrorCode"
Cohesion: 0.19
Nodes (6): nextConfig, vitest, restoreAccount(), m, redirected(), dbErrorCode()

### Community 72 - "staffCan"
Cohesion: 0.31
Nodes (7): TabId, TABS, Area, AREAS, isStaff(), ROLE_LABELS, staffCan()

### Community 73 - "ProfileBanner"
Cohesion: 0.18
Nodes (13): 1. `eventHistory()` helper + test, 2. `ProfileBanner` component, 3. Public player page (`src/app/player/[id]/page.tsx`), 4. Report dialog, 5. Profile page (`src/app/dashboard/page.tsx`), 6. Motion, 7. Verify, Addendum — profile banners (2026-10-17, kaikub request) (+5 more)

### Community 74 - "manager-key.mjs"
Cohesion: 0.50
Nodes (3): der, seed, visualManagerKey

### Community 75 - "checkIn"
Cohesion: 0.18
Nodes (11): `/admin/commu/events/[id]/check-in` (page), `/events/[id]/check-in` (page), `GET /api/dev-login?as=<user>` — local only, `GET /auth/callback?code=…`, `GET /events/[id]/calendar.ics`, `GET /events/[id]/check-in/start?t=<token>`, HTTP endpoints, Insights (+3 more)

### Community 76 - "Discord bot contract: settings and automatic tasks (v1.1 phase 7)"
Cohesion: 0.15
Nodes (13): Admin side (for reference), After applying settings: `bot_settings_report(p_items jsonb)` → `integer`, Discord bot contract: settings and automatic tasks (v1.1 phase 7), Every poll: `bot_config()` → `jsonb`, Every task run: `bot_job_report(p_job, p_started_at, p_finished_at, p_ok, p_items, p_error)` → `void`, Local mock, Role safety, Rules for the bot (+5 more)

### Community 77 - "event-form.tsx"
Cohesion: 0.17
Nodes (12): IMAGE_TYPES, EventForm(), onCover(), pickFile(), LOADED_AT, noSubscribe(), REMINDER_PRESETS, ReminderState (+4 more)

### Community 78 - "chart-frame.tsx"
Cohesion: 0.33
Nodes (7): cell(), ChartColumn, ChartFrame(), CsvButton(), cell(), cols, toCsv()

### Community 80 - "app/events/[id]/page.tsx"
Cohesion: 0.38
Nodes (9): clock(), day(), ends(), ERRORS, EventDetail, EventPage(), generateMetadata(), loadEvent() (+1 more)

### Community 81 - "health/route.ts"
Cohesion: 0.53
Nodes (4): digest(), GET(), get(), m

### Community 82 - "Performance baseline (v1.1 Phase 7, Task 6)"
Cohesion: 0.10
Nodes (19): Admin pages: server response, local production build (ms), Auditing `/player/[id]` signed in (final fix wave), Call waterfall per page (one request, ms per call, in completion order), Client-side fixes (the actual cause), Diagnosis: what the LCP is made of, Fix 1: region alignment (MANUAL, not applied), Fix 2: collapse sequential awaits (not applicable), Fix 3: public content caching (not added) (+11 more)

### Community 83 - "app-errors.ts"
Cohesion: 0.09
Nodes (23): Error capture and health, 1. Website error capture + health endpoint, Decisions, Review Focus, fail(), limited(), POST(), m (+15 more)

### Community 84 - "Tasks"
Cohesion: 0.17
Nodes (11): 1. Announcement images, 2. Gallery, 3. Team page, 4. Site settings, 5. Verify, Already covered (no work), Answers (kaikub, 2026-10-17) and what was built, Decisions (+3 more)

### Community 86 - "charts.test.tsx"
Cohesion: 0.25
Nodes (14): STEP_LABELS, BarChart(), BarDatum, barRows(), barWidths(), shown(), barReadout(), BarRow (+6 more)

### Community 90 - "commu/events/[id]/check-in/actions.ts"
Cohesion: 0.25
Nodes (12): Server actions, awardAttendees(), checkInPlayer(), code(), finish(), page(), postedId(), removeAttendance() (+4 more)

### Community 91 - "app/events/[id]/actions.ts"
Cohesion: 0.31
Nodes (8): eventId(), signInPath(), form(), interested(), m, redirected(), toggleInterest(), UPCOMING_EVENTS_TAG

### Community 94 - "Event reminders"
Cohesion: 0.29
Nodes (7): Discord bot contract (v1.1 phase 5), `event_reminder_sent(p_event_id uuid, p_offset_minutes integer)` → `boolean`, Event reminders, `event_reminders_queue()`, Local mock, Message, Rules for the bot

### Community 98 - "icons.tsx"
Cohesion: 0.11
Nodes (20): AboutPage(), builtInGallery, metadata, values, metadata, RegisterPage(), { getUser, redirect }, DiscordAuthButton() (+12 more)

### Community 99 - "error/page.tsx"
Cohesion: 0.18
Nodes (12): AuthErrorPage(), metadata, metadata, NotFoundPage(), Action, ErrorScreen(), Href, AUTH_FAILURE_REASONS (+4 more)

### Community 100 - "markdown.tsx"
Cohesion: 0.47
Nodes (7): block(), cells(), inline(), Markdown(), table(), html(), withBreaks()

### Community 101 - "Review Focus"
Cohesion: 0.25
Nodes (7): Final, Global Constraints, Review Focus, Task 2: Hero copy, Task 3: Readable admin stat numbers, Task 4: Move community admin to `/admin/commu/*`, v1.1 Phase 1 — Quick Fixes & Admin Navigation Implementation Plan

### Community 102 - "scanner.tsx"
Cohesion: 0.21
Nodes (11): ScanResult, Avatar(), Camera, Detector, DetectorClass, ERRORS, Scanner(), fallBack() (+3 more)

### Community 103 - "commu/events/[id]/page.tsx"
Cohesion: 0.18
Nodes (11): deleteEvent(), finish(), postedId(), saveEvent(), form(), m, valid(), DONE (+3 more)

### Community 105 - "checkin-qr.tsx"
Cohesion: 0.25
Nodes (10): 5. Migration `20261027000001_event_attendance.sql` + `event_attendance.test.sql`, 6. Staff check-in page `/admin/commu/events/[id]/check-in`, C. Check-in and attendance, nextToken(), CheckinQr(), load(), clock(), Closed() (+2 more)

### Community 107 - "database.types.ts"
Cohesion: 0.20
Nodes (9): CompositeTypes, Constants, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables, TablesInsert (+1 more)

### Community 110 - "next"
Cohesion: 0.14
Nodes (7): next, signOut(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok, metadata, Step, StepKind

### Community 112 - "Keyboard-only pass: register and report-player"
Cohesion: 0.50
Nodes (3): Human confirmation pending (kaikub), Keyboard-only pass: register and report-player, Steps and result

### Community 114 - "[service]/page.tsx"
Cohesion: 0.12
Nodes (24): BACKUP, BackupChip(), Chip, DONE, ERRORS, JOB, SERVICE, sinceLine() (+16 more)

## Knowledge Gaps
- **11 isolated node(s):** `@emnapi/core`, `@emnapi/runtime`, `@types/node`, `@types/qrcode`, `@types/react` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 709 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `bot/page.tsx`, `minecraft/route.ts`, `package.json`, `banner-form.tsx`, `getSiteUrl`, `events.tsx`, `site-content.ts`, `commu/announcements/page.tsx`, `ops/page.tsx`, `dbErrorCode`, `dashboard/page.tsx`, `player/[id]/opengraph-image.tsx`, `server.ts`, `users/[id]/page.tsx`, `achievements/[id]/page.tsx`, `player/[id]/page.tsx`, `commu/events/[id]/check-in/page.tsx`, `proxy.ts`, `metric-tile.tsx`, `member-preview.tsx`, `PixelIcon`, `site-header.tsx`, `timed`, `src_app_admin_admin_module`, `react`, `player/[id]/actions.ts`, `app/layout.tsx`, `ops/actions.ts`, `achievement-grid.tsx`, `admin/players/page.tsx`, `notification-bell.tsx`, `app/settings/page.tsx`, `registration.ts`, `PixelIcon`, `app/events/[id]/check-in/page.tsx`, `announcements/[id]/actions.ts`, `event-card.tsx`, `dashboard/actions.test.ts`, `safeNext`, `dbErrorCode`, `event-form.tsx`, `app/events/[id]/page.tsx`, `app-errors.ts`, `commu/events/[id]/check-in/actions.ts`, `app/events/[id]/actions.ts`, `icons.tsx`, `error/page.tsx`, `commu/events/[id]/page.tsx`, `checkin-qr.tsx`, `[service]/page.tsx`?**
  _High betweenness centrality (0.210) - this node is a cross-community bridge._
- **What connects `@emnapi/core`, `@emnapi/runtime`, `@types/node` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `bot/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0851063829787234 - nodes in this community are weakly interconnected._
- **Why does `createClient()` connect `users/[id]/page.tsx` to `bot/page.tsx`, `minecraft/route.ts`, `banner-form.tsx`, `events.tsx`, `site-content.ts`, `commu/announcements/page.tsx`, `ops/page.tsx`, `dbErrorCode`, `dashboard/page.tsx`, `player/[id]/opengraph-image.tsx`, `server.ts`, `achievements/[id]/page.tsx`, `player/[id]/page.tsx`, `commu/events/[id]/check-in/page.tsx`, `member-preview.tsx`, `PixelIcon`, `site-header.tsx`, `timed`, `src_app_admin_admin_module`, `player/[id]/actions.ts`, `ics.ts`, `ops/actions.ts`, `admin/players/page.tsx`, `notification-bell.tsx`, `app/settings/page.tsx`, `registration.ts`, `PixelIcon`, `app/events/[id]/check-in/page.tsx`, `announcements/[id]/actions.ts`, `event-card.tsx`, `dashboard/actions.test.ts`, `dbErrorCode`, `event-form.tsx`, `app/events/[id]/page.tsx`, `commu/events/[id]/check-in/actions.ts`, `app/events/[id]/actions.ts`, `icons.tsx`, `commu/events/[id]/page.tsx`, `checkin-qr.tsx`, `next`, `[service]/page.tsx`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09486166007905138 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `dbErrorCode` to `banners/actions.test.ts`, `bot/page.tsx`, `minecraft/route.ts`, `package.json`, `getSiteUrl`, `local-mocks.mjs`, `site-content.ts`, `ops/page.tsx`, `dbErrorCode`, `player/[id]/opengraph-image.tsx`, `contrast.test.ts`, `users/[id]/page.tsx`, `achievements/[id]/page.tsx`, `PixelIcon`, `reconcile-identities.test.ts`, `timed`, `notifications/actions.test.ts`, `src_app_admin_admin_module`, `line-chart.tsx`, `player/[id]/actions.ts`, `ics.ts`, `ops/actions.ts`, `admin/players/page.tsx`, `showcase`, `app/settings/page.tsx`, `data.ts`, `registration.ts`, `PixelIcon`, `app/events/[id]/check-in/page.tsx`, `announcements/[id]/actions.ts`, `dashboard/actions.test.ts`, `safeNext`, `staffCan`, `chart-frame.tsx`, `health/route.ts`, `app-errors.ts`, `charts.test.tsx`, `commu/events/[id]/check-in/actions.ts`, `app/events/[id]/actions.ts`, `icons.tsx`, `error/page.tsx`, `markdown.tsx`, `commu/events/[id]/page.tsx`, `next`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Should `banner-form.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14814814814814814 - nodes in this community are weakly interconnected._