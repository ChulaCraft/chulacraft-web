# Graph Report - chulacraft-web  (2026-10-22)

## Corpus Check
- 439 files · ~321,659 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 41 file(s) not represented in the graph (top: .css 33, (none) 2, .toml 2)

## Summary
- 2004 nodes · 5622 edges · 116 communities (103 shown, 13 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 235 edges (avg confidence: 0.92)
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
- banners/page.tsx
- compilerOptions
- ref_node_crypto
- devDependencies
- local-mocks.mjs
- ChulaCraft Web Version 1.0
- events.tsx
- LegalPage
- site-pages.ts
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
- server.ts
- Tasks
- users/[id]/page.tsx
- achievements/[id]/page.tsx
- player/[id]/page.tsx
- dependencies
- scripts
- createClient
- insights/page.tsx
- register/page.tsx
- member-preview.tsx
- welcome/page.tsx
- Phases
- next
- reconcile-identities.test.ts
- @playwright/test
- timed
- server-status.ts
- command-search.tsx
- react
- Endpoints
- line-chart.tsx
- player/[id]/actions.ts
- ics.ts
- team/[id]/page.tsx
- admin/settings/page.tsx
- achievement-grid.tsx
- @playwright/test
- admin/players/page.tsx
- Tasks
- showcase
- app/settings/page.tsx
- ops.spec.ts
- v1.1 Phase 5 — Achievements & engagement
- insights.spec.ts
- bot-contract-phase5.md
- registration.ts
- about/page.tsx
- Tables
- site-content.ts
- PixelIcon
- app/events/[id]/check-in/actions.ts
- announcements/[id]/actions.ts
- admin-nav.tsx
- event-card.tsx
- dashboard/actions.test.ts
- error/page.tsx
- dbErrorCode
- ops
- staffCan
- ProfileBanner
- manager-key.mjs
- checkIn
- Discord bot contract: settings and automatic tasks (v1.1 phase 7)
- event-form.tsx
- chart-frame.tsx
- Performance baseline (v1.1 Phase 7, Task 6)
- app/events/[id]/page.tsx
- health/route.ts
- Task 7: fixes for the pages that missed
- v1.1 Phase 7 — Ops console, performance, hardening
- Tasks
- lighthouse.mjs
- charts.test.tsx
- proxy.ts
- requireVerifiedUser
- commu/events/[id]/check-in/actions.ts
- app/events/[id]/actions.ts
- error-screen.tsx
- cache.spec.ts
- insights-fixture.mjs
- ops-bot.spec.ts
- achievements/[id]/actions.test.ts
- app/players/page.tsx
- reportError
- markdown.tsx
- Review Focus
- scanner.tsx
- commu/events/[id]/actions.test.ts
- Web API
- checkin-qr.tsx
- allowScripts
- database.types.ts
- engines
- app/events/[id]/check-in/page.tsx
- Keyboard-only pass: register and report-player

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 192 edges
2. `PixelIcon()` - 135 edges
3. `next` - 129 edges
4. `timed()` - 95 edges
5. `vitest` - 66 edges
6. `dbErrorCode()` - 63 edges
7. `SubmitButton()` - 51 edges
8. `ConfirmAction()` - 43 edges
9. `react` - 38 edges
10. `publicImageUrl()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Audit` --references--> `ops()`  [INFERRED]
  docs/database.md → scripts/local-mocks.mjs
- `Insights (v1.1 phase 6)` --references--> `code()`  [INFERRED]
  docs/database.md → src/app/admin/commu/events/[id]/check-in/actions.ts
- `5. Migration `20261027000001_event_attendance.sql` + `event_attendance.test.sql`` --references--> `code()`  [INFERRED]
  docs/superpowers/plans/2026-10-22-v1.1-phase5-engagement.md → src/app/admin/commu/events/[id]/check-in/actions.ts
- `Task 5: Clickable dashboard numbers + real Unverified / Guest cards` --references--> `StatRow()`  [INFERRED]
  docs/superpowers/plans/2026-10-16-v1.1-phase2a-players-table.md → src/app/admin/overview.tsx
- `6. Players tile strip + docs` --references--> `MetricTile()`  [INFERRED]
  docs/superpowers/plans/2026-10-22-v1.1-phase6-insights.md → src/components/charts/metric-tile.tsx

## Import Cycles
- None detected.

## Communities (116 total, 13 thin omitted)

### Community 0 - "vitest"
Cohesion: 0.25
Nodes (4): nextConfig, vitest, m, ROW

### Community 1 - "bot/page.tsx"
Cohesion: 0.09
Nodes (35): KINDS, limit(), saveBotSetting(), setBotJobEnabled(), m, CheckLine(), GROUPS, JOB_ERRORS (+27 more)

### Community 2 - "minecraft/route.ts"
Cohesion: 0.16
Nodes (21): `/api/registration/minecraft` — player's Minecraft accounts, DELETE(), fail(), GET(), PATCH(), POST(), Profile, record() (+13 more)

### Community 3 - "package.json"
Cohesion: 0.12
Nodes (16): name, private, version, @axe-core/playwright, @emnapi/core, @emnapi/runtime, eslint, eslint-config-next (+8 more)

### Community 4 - "banners/page.tsx"
Cohesion: 0.09
Nodes (31): sharp, shots, Checked, checkFile(), deleteBanner(), saveBanner(), colors, gif() (+23 more)

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
Nodes (23): RFC-6455, ACTION_BITS, addEnv(), backups, codes, consoles, DISCORD_USERS, escapeHtml() (+15 more)

### Community 9 - "ChulaCraft Web Version 1.0"
Cohesion: 0.10
Nodes (19): Architecture, Chula verification (Google), ChulaCraft Web Version 1.0, Commands, Current implementation caveats, Deployment, Discord authentication, Environment (+11 more)

### Community 10 - "events.tsx"
Cohesion: 0.19
Nodes (35): countValues(), earliest(), playerStats(), snapValues(), stat, Window, Panel(), CommunityPanel() (+27 more)

### Community 11 - "LegalPage"
Cohesion: 0.24
Nodes (11): render(), metadata, Page(), metadata, Page(), metadata, Page(), LegalPage() (+3 more)

### Community 12 - "site-pages.ts"
Cohesion: 0.21
Nodes (12): normal(), savePage(), m, run(), AdminPagesPage(), metadata, effectiveDate(), DEFAULT_PAGES (+4 more)

### Community 13 - "ops/page.tsx"
Cohesion: 0.06
Nodes (80): Call waterfall per page (one request, ms per call, in completion order), 4. `/admin/ops` list + detail + website + backups UI, openConsole(), opsAction(), SERVICE_ACTIONS, TARGETS, m, redirected() (+72 more)

### Community 14 - "dbErrorCode"
Cohesion: 0.15
Nodes (23): addPlayers(), awardId(), confirmAward(), fail(), prefillInterested(), previewAward(), m, unique() (+15 more)

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.15
Nodes (12): Chulacraft registration runbook, Daily stats, Normal operations, Ops console, backups and restore, `OPS_HEALTH_TOKEN` (website health probe), Restore a Supabase dump, Restore a world backup, Roles and Chula verification (+4 more)

### Community 18 - "dashboard/page.tsx"
Cohesion: 0.12
Nodes (19): submitAppeal(), APPEAL_ERRORS, BanCard(), date(), MyBan, Banner, BANNER_ERRORS, DashboardPage() (+11 more)

### Community 19 - "createClient"
Cohesion: 0.45
Nodes (11): addGalleryImage(), alt(), deleteGalleryGroup(), deleteGalleryImage(), fail(), finish(), moveGalleryGroup(), moveGalleryImage() (+3 more)

### Community 20 - "player/[id]/opengraph-image.tsx"
Cohesion: 0.12
Nodes (25): alt, contentType, Image(), size, when(), alt, contentType, Image() (+17 more)

### Community 21 - "contrast.test.ts"
Cohesion: 0.15
Nodes (16): chartThemes, contrast(), css, dark, fromOklab(), lightBlock, luminance(), printBlock (+8 more)

### Community 22 - "supabase-stub.mjs"
Cohesion: 0.16
Nodes (14): AREAS, BOT_JOBS, BOT_SETTINGS, botTick(), INSIGHTS_AREA, json(), NAMES, readJson() (+6 more)

### Community 23 - "server.ts"
Cohesion: 0.17
Nodes (17): Decisions, @supabase/ssr, authErrorResponse(), GET(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok, robots(), BoundedFetchTimeoutError (+9 more)

### Community 24 - "Tasks"
Cohesion: 0.15
Nodes (12): `GET /service/:id/status` (STATUS), 2. Manager contract + mocks, 3. Access RPC, token bits, `src/lib/ops.ts`, 6. Measure (no fixes yet), 8. Stale-cache guard (only if Task 7 added caching), 9. Audit gates: axe, Lighthouse, SEO metadata, keyboard pass, Global Constraints, Review Focus (+4 more)

### Community 25 - "users/[id]/page.tsx"
Cohesion: 0.08
Nodes (40): BAN_DURATIONS, banUser(), finish(), grantBanner(), liftBan(), markGuest(), PRIVACY_LEVELS, resetChula() (+32 more)

### Community 26 - "achievements/[id]/page.tsx"
Cohesion: 0.19
Nodes (18): Decisions, finish(), postedId(), revokeAward(), saveAchievement(), BUCKET, EXTENSIONS, imageError() (+10 more)

### Community 27 - "player/[id]/page.tsx"
Cohesion: 0.27
Nodes (9): Avatar(), ERRORS, generateMetadata(), loadCard(), mcHead(), PlayerCard, PlayerPage(), CATEGORIES (+1 more)

### Community 28 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, @emnapi/core, @emnapi/runtime, next, qrcode, react, react-dom, sharp (+3 more)

### Community 29 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, db:types, dev, dev:mocks, lint, start, test (+3 more)

### Community 30 - "createClient"
Cohesion: 0.07
Nodes (65): AdminAppealsPage(), DONE, ERRORS, metadata, deleteAchievement(), AdminAchievementPage(), DONE, ERRORS (+57 more)

### Community 31 - "insights/page.tsx"
Cohesion: 0.12
Nodes (28): `GET /service/:id/uptime?days=7` (STATUS), 5. `/admin/insights` page, panels, print, nav, File Structure, DATE, dayList(), lastFinite(), longDay(), makeWindow() (+20 more)

### Community 32 - "register/page.tsx"
Cohesion: 0.20
Nodes (13): metadata, RegisterPage(), { getUser, redirect }, DiscordAuthButton(), signIn(), GoogleSignInButton(), LinkGoogleButton(), useGoogle() (+5 more)

### Community 33 - "member-preview.tsx"
Cohesion: 0.14
Nodes (25): AnnouncementPreview(), Saved, GroupPreview(), MemberPreview(), PagePreview(), SettingsPreview(), AnnouncementsPage(), metadata (+17 more)

### Community 34 - "welcome/page.tsx"
Cohesion: 0.18
Nodes (13): react-dom, signOut(), ServiceUnavailable(), AboutYouPage(), metadata, metadata, { getUser, getUserIdentities, rpc, redirect, reconcileIdentities }, page() (+5 more)

### Community 35 - "Phases"
Cohesion: 0.15
Nodes (12): ChulaCraft Web v1.1 — Roadmap Spec, Decisions already made, Deferred (needs Minecraft server endpoint), Global constraints (every phase), Phase 1 — Quick fixes & admin navigation  → `plans/2026-10-16-v1.1-phase1-quick-fixes.md`, Phase 2 — Admin power tools, Phase 3 — Design system & UI redesign, Phase 4 — Content without a developer (+4 more)

### Community 36 - "next"
Cohesion: 0.09
Nodes (28): Task 1: Show the Discord name everywhere, next, @vercel/analytics, GET(), metadata, RootLayout(), AnnouncementBanner(), dismissedId() (+20 more)

### Community 37 - "reconcile-identities.test.ts"
Cohesion: 0.15
Nodes (9): admin, cu, discord, f, gmail, m, query, run() (+1 more)

### Community 38 - "@playwright/test"
Cohesion: 0.25
Nodes (4): AuditOptions, auditPage(), accessToken, routes

### Community 39 - "timed"
Cohesion: 0.19
Nodes (15): Layout(), Layout(), metadata, NewEventPage(), AdminEventsPage(), metadata, Layout(), Layout() (+7 more)

### Community 40 - "server-status.ts"
Cohesion: 0.30
Nodes (10): packet(), parseStatusResponse(), pingServer(), readVarInt(), resolveTarget(), ServerStatus, statusRequest(), reply (+2 more)

### Community 41 - "command-search.tsx"
Cohesion: 0.33
Nodes (5): adminSearch(), day(), SearchHit, m, Item

### Community 42 - "react"
Cohesion: 0.16
Nodes (18): react, GET(), HeroStage(), HomeHero(), HomePage(), loadUpcomingEvents(), metadata, steps() (+10 more)

### Community 43 - "Endpoints"
Cohesion: 0.11
Nodes (20): Aliases, Console WebSocket `/service/:id/console` (CONSOLE_READ; CONSOLE_WRITE to send), Conventions, Docker socket proxy, Endpoints, Errors, `GET /service/:id/image` (STATUS), `GET /service/:id/metrics?hours=24` (STATUS) (+12 more)

### Community 44 - "line-chart.tsx"
Cohesion: 0.13
Nodes (35): DAY, finite(), formatDay(), LineChart(), onKeyDown(), onPointerMove(), lineLayout(), readout() (+27 more)

### Community 45 - "player/[id]/actions.ts"
Cohesion: 0.36
Nodes (10): blockPlayer(), finish(), playerId(), removeFriend(), reportPlayer(), respondFriendRequest(), sendFriendRequest(), ask() (+2 more)

### Community 46 - "ics.ts"
Cohesion: 0.20
Nodes (12): RFC-5545, GET(), encoder, escapeText(), eventIcs(), fold(), IcsEvent, icsFilename() (+4 more)

### Community 47 - "team/[id]/page.tsx"
Cohesion: 0.41
Nodes (11): deleteTeamGeneration(), deleteTeamMember(), fail(), finish(), moveTeamGeneration(), moveTeamMember(), playerIdFrom(), postedId() (+3 more)

### Community 48 - "admin/settings/page.tsx"
Cohesion: 0.17
Nodes (14): deleteDiscordRole(), finishRole(), saveDiscordRole(), saveSiteSettings(), SWITCHES, m, run(), ERRORS (+6 more)

### Community 49 - "achievement-grid.tsx"
Cohesion: 0.23
Nodes (13): Role, AchievementGrid(), AchievementGroup, achievementImage(), day(), EventHistory(), EventVisit, ShowcaseRow() (+5 more)

### Community 50 - "@playwright/test"
Cohesion: 0.17
Nodes (14): @playwright/test, ADMIN, PUBLIC, WIDTHS, accessToken, resetVisualSession(), VISUAL_EVENT_ID, VISUAL_HIDDEN_PLAYER_ID (+6 more)

### Community 51 - "admin/players/page.tsx"
Cohesion: 0.05
Nodes (72): RFC-4180, 1. The URL is the state, 2. Columns declare what they can do, 3. Above the table, 4. Every value is a link, 5. One RPC per table, 6. States, Admin tables: the protocol (+64 more)

### Community 52 - "Tasks"
Cohesion: 0.10
Nodes (23): 0. Pre-check: pgcrypto location, 10. Migration `20261029000001_notifications.sql` + `notifications.test.sql`, 11. Bell UI, 12. Contract doc + mocks, 13. Verify, 4. Migration `20261026000002_achievement_discord_roles.sql` + `achievement_discord_roles.test.sql`, 8. Migration `20261028000001_event_reminders.sql` + `event_reminders.test.sql`, 9. Event form, `.ics`, button (+15 more)

### Community 53 - "showcase"
Cohesion: 0.29
Nodes (7): 1. Migration `20261026000001_achievement_rarity.sql` + `achievement_rarity.test.sql`, 2. Admin + cards, 3. Showcase UI, A. Rarity tier + showcase, showcase(), badge(), group()

### Community 54 - "app/settings/page.tsx"
Cohesion: 0.13
Nodes (24): @supabase/supabase-js, unlinkPersonalGoogle(), metadata, Privacy, PRIVACY_ERRORS, SettingsPage(), metadata, Step (+16 more)

### Community 55 - "ops.spec.ts"
Cohesion: 0.10
Nodes (12): 1. Migration `20261030000001_insights.sql` + `insights.test.sql`, 2. Migration `20261030000002_funnel_failures.sql` + recording, 3. Insights TS core: range, series, CSV, tabs, 4. SVG chart components, 6. Players tile strip + docs, Global Constraints, Review Focus, Spec coverage (+4 more)

### Community 56 - "v1.1 Phase 5 — Achievements & engagement"
Cohesion: 0.10
Nodes (20): `GET /events/[id]/check-in/start?t=<token>`, Badge roles, `discord_role_queue()`, `discord_role_queue_done(p_items jsonb)` → `integer`, Acceptance criteria, ADR (draft), Changelog (consensus final), Changelog (consensus rev 2) (+12 more)

### Community 58 - "bot-contract-phase5.md"
Cohesion: 0.14
Nodes (12): `event_reminder_sent(p_event_id uuid, p_offset_minutes integer)` → `boolean`, Event reminders, `event_reminders_queue()`, Local mock, Message, Rules for the bot, ChulaCraft developer docs, Environment variables (+4 more)

### Community 59 - "registration.ts"
Cohesion: 0.15
Nodes (19): checkName(), ConfirmDialog(), NameForm(), submit(), Pending, RegistrationPanel(), confirm(), send() (+11 more)

### Community 60 - "about/page.tsx"
Cohesion: 0.19
Nodes (9): AboutPage(), builtInGallery, metadata, values, GalleryPage(), metadata, GalleryGrid(), Shot (+1 more)

### Community 61 - "Tables"
Cohesion: 0.13
Nodes (16): Accounts and identity, Audit, Content, Database, Discord bot settings and tasks (v1.1 phase 7), Engagement (v1.1 phase 5), Insights (v1.1 phase 6), Minecraft whitelist (+8 more)

### Community 62 - "site-content.ts"
Cohesion: 0.19
Nodes (12): dynamic, sitemap(), STATIC_ROUTES, anonClient(), DEFAULT_DISCORD_URL, GalleryGroup, GalleryImage, Rows (+4 more)

### Community 63 - "PixelIcon"
Cohesion: 0.09
Nodes (26): AdminAuditPage(), bangkokDay(), ENTITIES, Entry, metadata, Params, ERRORS, metadata (+18 more)

### Community 64 - "app/events/[id]/check-in/actions.ts"
Cohesion: 0.21
Nodes (10): GET(), call(), GET(), call(), m, checkInPath(), COOKIE_BASE, NEXT_COOKIE (+2 more)

### Community 65 - "announcements/[id]/actions.ts"
Cohesion: 0.27
Nodes (9): deleteAnnouncement(), postedId(), refresh(), saveAnnouncement(), SEVERITIES, form(), m, valid() (+1 more)

### Community 66 - "admin-nav.tsx"
Cohesion: 0.29
Nodes (9): Task 5: Grouped admin nav, 7. Fix the pages that missed (scope set by Task 6), AdminNav(), ALL_GROUPS, AdminNavGroup(), isActive(), Link, groupsFor() (+1 more)

### Community 67 - "event-card.tsx"
Cohesion: 0.16
Nodes (15): metadata, matches(), metadata, PAGES, PlayerHit, SearchPage(), dayBadge(), endTime() (+7 more)

### Community 68 - "dashboard/actions.test.ts"
Cohesion: 0.23
Nodes (14): Moderation, finish(), LEVELS, otherId(), removeFriend(), respondFriendRequest(), setBanner(), setShowcase() (+6 more)

### Community 69 - "error/page.tsx"
Cohesion: 0.36
Nodes (7): AuthErrorPage(), metadata, AUTH_FAILURE_REASONS, authFailureMessage(), AuthFailureReason, classifyOAuthCallbackFailure(), safeAuthFailureReason()

### Community 70 - "dbErrorCode"
Cohesion: 0.26
Nodes (7): decideAppeal(), handleReport(), restoreAccount(), m, redirected(), dbErrorCode(), UUID

### Community 71 - "ops"
Cohesion: 0.27
Nodes (10): checkToken(), log(), readFrames(), sendFrame(), serviceMetrics(), serviceStatus(), serviceUptime(), startManager() (+2 more)

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
Cohesion: 0.29
Nodes (7): `/admin/commu/events/[id]/check-in` (page), `/events/[id]/check-in` (page), `GET /api/dev-login?as=<user>` — local only, `GET /auth/callback?code=…`, `GET /check-in/continue`, `GET /events/[id]/calendar.ics`, HTTP endpoints

### Community 76 - "Discord bot contract: settings and automatic tasks (v1.1 phase 7)"
Cohesion: 0.15
Nodes (13): Admin side (for reference), After applying settings: `bot_settings_report(p_items jsonb)` → `integer`, Discord bot contract: settings and automatic tasks (v1.1 phase 7), Every poll: `bot_config()` → `jsonb`, Every task run: `bot_job_report(p_job, p_started_at, p_finished_at, p_ok, p_items, p_error)` → `void`, Local mock, Role safety, Rules for the bot (+5 more)

### Community 77 - "event-form.tsx"
Cohesion: 0.23
Nodes (9): EventForm(), onCover(), pickFile(), LOADED_AT, noSubscribe(), REMINDER_PRESETS, ReminderState, shrink() (+1 more)

### Community 78 - "chart-frame.tsx"
Cohesion: 0.30
Nodes (8): cell(), ChartColumn, ChartFrame(), CsvButton(), download(), cell(), cols, toCsv()

### Community 79 - "Performance baseline (v1.1 Phase 7, Task 6)"
Cohesion: 0.25
Nodes (7): Admin pages: server response, local production build (ms), MANUAL: kaikub to fill (no dashboard access), Method, Performance baseline (v1.1 Phase 7, Task 6), Public pages: Lighthouse mobile (local production build, anonymous), Read this first: what these numbers are and are not, Verdict (provisional)

### Community 80 - "app/events/[id]/page.tsx"
Cohesion: 0.38
Nodes (9): clock(), day(), ends(), ERRORS, EventDetail, EventPage(), generateMetadata(), loadEvent() (+1 more)

### Community 81 - "health/route.ts"
Cohesion: 0.53
Nodes (4): digest(), GET(), get(), m

### Community 82 - "Task 7: fixes for the pages that missed"
Cohesion: 0.22
Nodes (9): Client-side fixes (the actual cause), Diagnosis: what the LCP is made of, Fix 1: region alignment (MANUAL, not applied), Fix 2: collapse sequential awaits (not applicable), Fix 3: public content caching (not added), Fix 4: admin `loading.tsx` (not applicable), Fix round 1: keep LCP, bring home CLS back to <= 0.1, Follow-up (a11y, not fixed here) (+1 more)

### Community 83 - "v1.1 Phase 7 — Ops console, performance, hardening"
Cohesion: 0.25
Nodes (11): Error capture and health, Error capture (v1.1 phase 7), 1. Website error capture + health endpoint, Decisions, File Structure, onRequestError(), AppErrorKind, fingerprint() (+3 more)

### Community 84 - "Tasks"
Cohesion: 0.18
Nodes (10): 1. Announcement images, 2. Gallery, 3. Team page, 4. Site settings, 5. Verify, Already covered (no work), Answers (kaikub, 2026-10-17) and what was built, Revision (kaikub, 2026-10-17, same day) (+2 more)

### Community 85 - "lighthouse.mjs"
Cohesion: 0.33
Nodes (4): base, [baseArg, eventArg, playerArg], pages, rows

### Community 86 - "charts.test.tsx"
Cohesion: 0.23
Nodes (14): Funnel(), STEP_LABELS, BarChart(), BarDatum, barRows(), barWidths(), shown(), barReadout() (+6 more)

### Community 87 - "proxy.ts"
Cohesion: 0.43
Nodes (6): updateSession(), withCsp(), buildCsp(), config, proxy(), supabaseOrigin()

### Community 89 - "requireVerifiedUser"
Cohesion: 0.60
Nodes (3): AdminLayout(), metadata, requireVerifiedUser()

### Community 90 - "commu/events/[id]/check-in/actions.ts"
Cohesion: 0.27
Nodes (12): Server actions, awardAttendees(), checkInPlayer(), code(), finish(), page(), postedId(), removeAttendance() (+4 more)

### Community 91 - "app/events/[id]/actions.ts"
Cohesion: 0.31
Nodes (8): eventId(), signInPath(), form(), interested(), m, redirected(), toggleInterest(), UPCOMING_EVENTS_TAG

### Community 92 - "error-screen.tsx"
Cohesion: 0.32
Nodes (5): metadata, NotFoundPage(), Action, ErrorScreen(), Href

### Community 94 - "insights-fixture.mjs"
Cohesion: 0.57
Nodes (6): at(), day(), FACULTIES, insightsFixture(), snapshots(), today()

### Community 97 - "achievements/[id]/actions.test.ts"
Cohesion: 0.40
Nodes (3): form(), m, valid()

### Community 98 - "app/players/page.tsx"
Cohesion: 0.40
Nodes (4): Avatar(), metadata, PlayersPage(), SearchHit

### Community 99 - "reportError"
Cohesion: 0.36
Nodes (4): Error(), GlobalError(), reportError(), seen

### Community 100 - "markdown.tsx"
Cohesion: 0.47
Nodes (7): block(), cells(), inline(), Markdown(), table(), html(), withBreaks()

### Community 101 - "Review Focus"
Cohesion: 0.25
Nodes (7): Final, Global Constraints, Review Focus, Task 2: Hero copy, Task 3: Readable admin stat numbers, Task 4: Move community admin to `/admin/commu/*`, v1.1 Phase 1 — Quick Fixes & Admin Navigation Implementation Plan

### Community 102 - "scanner.tsx"
Cohesion: 0.23
Nodes (11): ScanResult, Avatar(), Camera, Detector, DetectorClass, ERRORS, Scanner(), fallBack() (+3 more)

### Community 103 - "commu/events/[id]/actions.test.ts"
Cohesion: 0.33
Nodes (3): form(), m, valid()

### Community 104 - "Web API"
Cohesion: 0.40
Nodes (5): `/admin/ops` (pages), Insights, Metadata routes (SEO), Pages, Web API

### Community 105 - "checkin-qr.tsx"
Cohesion: 0.19
Nodes (12): 5. Migration `20261027000001_event_attendance.sql` + `event_attendance.test.sql`, 6. Staff check-in page `/admin/commu/events/[id]/check-in`, 7. Player side, C. Check-in and attendance, nextToken(), CheckinQr(), load(), clock() (+4 more)

### Community 106 - "allowScripts"
Cohesion: 0.33
Nodes (4): allowScripts, unrs-resolver@1.12.2, overrides, postcss

### Community 107 - "database.types.ts"
Cohesion: 0.20
Nodes (9): CompositeTypes, Constants, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables, TablesInsert (+1 more)

### Community 110 - "app/events/[id]/check-in/page.tsx"
Cohesion: 0.33
Nodes (4): ERRORS, EventSummary, metadata, when()

### Community 112 - "Keyboard-only pass: register and report-player"
Cohesion: 0.50
Nodes (3): Human confirmation pending (kaikub), Keyboard-only pass: register and report-player, Steps and result

## Knowledge Gaps
- **11 isolated node(s):** `@emnapi/core`, `@emnapi/runtime`, `@types/node`, `@types/qrcode`, `@types/react` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 699 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `vitest`, `bot/page.tsx`, `minecraft/route.ts`, `package.json`, `banners/page.tsx`, `LegalPage`, `site-pages.ts`, `ops/page.tsx`, `dbErrorCode`, `dashboard/page.tsx`, `createClient`, `player/[id]/opengraph-image.tsx`, `server.ts`, `users/[id]/page.tsx`, `achievements/[id]/page.tsx`, `player/[id]/page.tsx`, `createClient`, `insights/page.tsx`, `register/page.tsx`, `member-preview.tsx`, `welcome/page.tsx`, `timed`, `command-search.tsx`, `react`, `line-chart.tsx`, `player/[id]/actions.ts`, `team/[id]/page.tsx`, `admin/settings/page.tsx`, `achievement-grid.tsx`, `admin/players/page.tsx`, `Tasks`, `app/settings/page.tsx`, `about/page.tsx`, `site-content.ts`, `PixelIcon`, `app/events/[id]/check-in/actions.ts`, `announcements/[id]/actions.ts`, `admin-nav.tsx`, `event-card.tsx`, `dashboard/actions.test.ts`, `error/page.tsx`, `dbErrorCode`, `event-form.tsx`, `app/events/[id]/page.tsx`, `v1.1 Phase 7 — Ops console, performance, hardening`, `proxy.ts`, `requireVerifiedUser`, `commu/events/[id]/check-in/actions.ts`, `app/events/[id]/actions.ts`, `error-screen.tsx`, `app/players/page.tsx`, `checkin-qr.tsx`, `app/events/[id]/check-in/page.tsx`?**
  _High betweenness centrality (0.220) - this node is a cross-community bridge._
- **What connects `@emnapi/core`, `@emnapi/runtime`, `@types/node` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `bot/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08668076109936575 - nodes in this community are weakly interconnected._
- **Why does `createClient()` connect `createClient` to `bot/page.tsx`, `minecraft/route.ts`, `banners/page.tsx`, `events.tsx`, `site-pages.ts`, `ops/page.tsx`, `dbErrorCode`, `dashboard/page.tsx`, `createClient`, `player/[id]/opengraph-image.tsx`, `server.ts`, `users/[id]/page.tsx`, `achievements/[id]/page.tsx`, `player/[id]/page.tsx`, `insights/page.tsx`, `register/page.tsx`, `member-preview.tsx`, `welcome/page.tsx`, `next`, `timed`, `command-search.tsx`, `player/[id]/actions.ts`, `ics.ts`, `team/[id]/page.tsx`, `admin/settings/page.tsx`, `admin/players/page.tsx`, `Tasks`, `app/settings/page.tsx`, `v1.1 Phase 5 — Achievements & engagement`, `PixelIcon`, `app/events/[id]/check-in/actions.ts`, `announcements/[id]/actions.ts`, `event-card.tsx`, `dashboard/actions.test.ts`, `dbErrorCode`, `app/events/[id]/page.tsx`, `requireVerifiedUser`, `commu/events/[id]/check-in/actions.ts`, `app/events/[id]/actions.ts`, `app/players/page.tsx`, `checkin-qr.tsx`, `app/events/[id]/check-in/page.tsx`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.12418300653594772 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `vitest` to `bot/page.tsx`, `minecraft/route.ts`, `package.json`, `banners/page.tsx`, `ref_node_crypto`, `LegalPage`, `site-pages.ts`, `ops/page.tsx`, `dbErrorCode`, `player/[id]/opengraph-image.tsx`, `contrast.test.ts`, `server.ts`, `users/[id]/page.tsx`, `insights/page.tsx`, `register/page.tsx`, `welcome/page.tsx`, `reconcile-identities.test.ts`, `timed`, `server-status.ts`, `command-search.tsx`, `line-chart.tsx`, `player/[id]/actions.ts`, `ics.ts`, `admin/settings/page.tsx`, `admin/players/page.tsx`, `showcase`, `app/settings/page.tsx`, `v1.1 Phase 5 — Achievements & engagement`, `registration.ts`, `PixelIcon`, `app/events/[id]/check-in/actions.ts`, `announcements/[id]/actions.ts`, `dashboard/actions.test.ts`, `error/page.tsx`, `dbErrorCode`, `staffCan`, `chart-frame.tsx`, `health/route.ts`, `v1.1 Phase 7 — Ops console, performance, hardening`, `commu/events/[id]/check-in/actions.ts`, `app/events/[id]/actions.ts`, `achievements/[id]/actions.test.ts`, `reportError`, `markdown.tsx`, `commu/events/[id]/actions.test.ts`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Should `banners/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08637873754152824 - nodes in this community are weakly interconnected._