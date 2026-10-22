# Graph Report - chulacraft-web  (2026-10-22)

## Corpus Check
- 348 files · ~257,005 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 36 file(s) not represented in the graph (top: .css 30, (none) 2, .toml 2)

## Summary
- 1499 nodes · 4080 edges · 81 communities (77 shown, 4 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 154 edges (avg confidence: 0.91)
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
- Tables
- site-header.tsx
- params.ts
- table-query.ts
- dbErrorCode
- Chulacraft registration runbook
- CLAUDE.md
- supabase/README.md
- ProfileBanner
- icons.tsx
- dashboard/page.tsx
- SubmitButton
- v1.1 Phase 5 — Achievements & engagement
- player/[id]/actions.ts
- server/page.tsx
- createClient
- images.ts
- app/settings/page.tsx
- dependencies
- scripts
- commu/events/[id]/check-in/actions.ts
- team/[id]/page.tsx
- callback/route.ts
- next
- vitest
- Phases
- [slug]/page.tsx
- player/[id]/page.tsx
- ics.ts
- admin/page.tsx
- players/actions.ts
- staff-gate.ts
- minecraft/route.ts
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
- achievements/[id]/actions.ts
- Admin tables: the protocol
- LegalPage
- dbErrorCode
- icons.tsx
- team-card.tsx
- createBoundedFetch
- banners/actions.test.ts
- when
- app/events/[id]/actions.ts
- Tasks
- app/events/[id]/page.tsx
- table-query.ts
- showcase
- database.types.ts
- checkIn
- vitest
- markdown.tsx
- app/events/[id]/check-in/actions.ts
- HTTP endpoints
- safeNext
- commu/events/[id]/actions.test.ts
- app/events/[id]/check-in/page.tsx
- announcements/[id]/actions.test.ts
- start/route.test.ts

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 181 edges
2. `PixelIcon()` - 121 edges
3. `next` - 116 edges
4. `dbErrorCode()` - 58 edges
5. `SubmitButton()` - 51 edges
6. `vitest` - 49 edges
7. `ConfirmAction()` - 37 edges
8. `react` - 32 edges
9. `publicImageUrl()` - 22 edges
10. `DashboardPage()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Task 5: Clickable dashboard numbers + real Unverified / Guest cards` --references--> `StatRow()`  [INFERRED]
  docs/superpowers/plans/2026-10-16-v1.1-phase2a-players-table.md → src/app/admin/overview.tsx
- `2. Manager contract + mocks` --references--> `POST()`  [INFERRED]
  docs/superpowers/plans/2026-10-22-v1.1-phase7-ops-hardening.md → src/app/api/registration/minecraft/route.ts
- `11. Bell UI` --references--> `openNotifications()`  [INFERRED]
  docs/superpowers/plans/2026-10-22-v1.1-phase5-engagement.md → src/app/notifications/actions.ts
- `2. Gallery` --references--> `ConfirmAction()`  [INFERRED]
  docs/superpowers/plans/2026-10-17-v1.1-phase4-content.md → src/components/confirm-action.tsx
- `4. Migration `20261026000002_achievement_discord_roles.sql` + `achievement_discord_roles.test.sql`` --references--> `add()`  [INFERRED]
  docs/superpowers/plans/2026-10-22-v1.1-phase5-engagement.md → src/components/registration-panel.tsx

## Import Cycles
- None detected.

## Communities (81 total, 4 thin omitted)

### Community 0 - "Tasks"
Cohesion: 0.14
Nodes (14): 0. Pre-check: pgcrypto location, 10. Migration `20261029000001_notifications.sql` + `notifications.test.sql`, 11. Bell UI, 12. Contract doc + mocks, 13. Verify, 4. Migration `20261026000002_achievement_discord_roles.sql` + `achievement_discord_roles.test.sql`, 8. Migration `20261028000001_event_reminders.sql` + `event_reminders.test.sql`, 9. Event form, `.ics`, button (+6 more)

### Community 1 - "error/page.tsx"
Cohesion: 0.16
Nodes (13): AuthErrorPage(), metadata, Error(), metadata, NotFoundPage(), Action, ErrorScreen(), Href (+5 more)

### Community 2 - "registration.ts"
Cohesion: 0.15
Nodes (17): checkName(), ConfirmDialog(), NameForm(), submit(), Pending, RegistrationPanel(), confirm(), send() (+9 more)

### Community 3 - "package.json"
Cohesion: 0.13
Nodes (15): name, private, version, @emnapi/core, @emnapi/runtime, eslint, eslint-config-next, @eslint/js (+7 more)

### Community 4 - "banner-form.tsx"
Cohesion: 0.15
Nodes (22): Checked, checkFile(), deleteBanner(), saveBanner(), BannerForm(), clearFile(), onFile(), BLOCKS (+14 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "src_app_admin_admin_module"
Cohesion: 0.13
Nodes (5): ERRORS, metadata, RemovedRow, RestorePage(), MAX_MINECRAFT_ACCOUNTS

### Community 7 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, eslint, eslint-config-next, @eslint/js, @playwright/test, @types/node, @types/qrcode, @types/react (+4 more)

### Community 8 - "local-mocks.mjs"
Cohesion: 0.05
Nodes (43): RFC-6455, @playwright/test, ACTION_BITS, addEnv(), checkToken(), codes, consoles, DISCORD_USERS (+35 more)

### Community 9 - "ChulaCraft Web Version 1.0"
Cohesion: 0.10
Nodes (19): Architecture, Chula verification (Google), ChulaCraft Web Version 1.0, Commands, Current implementation caveats, Deployment, Discord authentication, Environment (+11 more)

### Community 10 - "Tables"
Cohesion: 0.07
Nodes (25): Pages, Web API, Discord bot contract (v1.1 phase 5), `event_reminder_sent(p_event_id uuid, p_offset_minutes integer)` → `boolean`, Event reminders, `event_reminders_queue()`, Local mock, Message (+17 more)

### Community 11 - "site-header.tsx"
Cohesion: 0.06
Nodes (42): Task 1: Show the Discord name everywhere, @vercel/analytics, AnnouncementsPage(), metadata, GET(), signOut(), metadata, RootLayout() (+34 more)

### Community 12 - "params.ts"
Cohesion: 0.39
Nodes (7): loadPlayers(), GET(), get(), m, readPlayers(), rpcArgs(), paramsOf()

### Community 13 - "table-query.ts"
Cohesion: 0.32
Nodes (10): 2. Columns declare what they can do, AdminPlayersPage(), Ctx, FilterChips(), FilterPanel(), KeepState(), keysOf(), SortHeader() (+2 more)

### Community 14 - "dbErrorCode"
Cohesion: 0.15
Nodes (24): addPlayers(), awardId(), confirmAward(), fail(), prefillInterested(), previewAward(), m, unique() (+16 more)

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.22
Nodes (8): Chulacraft registration runbook, Daily stats, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 18 - "ProfileBanner"
Cohesion: 0.14
Nodes (15): 1. `eventHistory()` helper + test, 2. `ProfileBanner` component, 3. Public player page (`src/app/player/[id]/page.tsx`), 4. Report dialog, 5. Profile page (`src/app/dashboard/page.tsx`), 6. Motion, 7. Verify, Addendum — profile banners (2026-10-17, kaikub request) (+7 more)

### Community 19 - "icons.tsx"
Cohesion: 0.08
Nodes (37): react, react-dom, AboutPage(), builtInGallery, metadata, values, GET(), HeroStage() (+29 more)

### Community 20 - "dashboard/page.tsx"
Cohesion: 0.13
Nodes (18): submitAppeal(), APPEAL_ERRORS, BanCard(), date(), MyBan, Banner, BANNER_ERRORS, DashboardPage() (+10 more)

### Community 21 - "SubmitButton"
Cohesion: 0.11
Nodes (27): AwardAttendees(), AdminCheckInPage(), Avatar(), ERRORS, metadata, METHODS, windowState(), AdminGalleryPage() (+19 more)

### Community 22 - "v1.1 Phase 5 — Achievements & engagement"
Cohesion: 0.18
Nodes (12): Badge roles, `discord_role_queue()`, `discord_role_queue_done(p_items jsonb)` → `integer`, Acceptance criteria, ADR (draft), Open questions (defaults used above), Out of scope, RALPLAN-DR summary (mode: SHORT) (+4 more)

### Community 23 - "player/[id]/actions.ts"
Cohesion: 0.36
Nodes (10): blockPlayer(), finish(), playerId(), removeFriend(), reportPlayer(), respondFriendRequest(), sendFriendRequest(), ask() (+2 more)

### Community 24 - "server/page.tsx"
Cohesion: 0.08
Nodes (40): 1. Website error capture + health endpoint, 2. Manager contract + mocks, 3. Access RPC, token bits, `src/lib/ops.ts`, 4. `/admin/ops` list + detail + website + backups UI, 5. Measure (no fixes yet), 7. Stale-cache guard (only if Task 6 added caching), 8. Audit gates: axe, Lighthouse, SEO metadata, keyboard pass, Decisions (+32 more)

### Community 25 - "createClient"
Cohesion: 0.07
Nodes (59): AdminEventsPage(), addGalleryImage(), alt(), deleteGalleryGroup(), deleteGalleryImage(), fail(), finish(), moveGalleryGroup() (+51 more)

### Community 26 - "images.ts"
Cohesion: 0.19
Nodes (18): Decisions, BUCKET, EXTENSIONS, imageError(), imageKey(), MAX_IMAGE_BYTES, Storage, uploadPicture() (+10 more)

### Community 27 - "app/settings/page.tsx"
Cohesion: 0.06
Nodes (58): Moderation, @supabase/supabase-js, finish(), LEVELS, otherId(), removeFriend(), respondFriendRequest(), setBanner() (+50 more)

### Community 28 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, @emnapi/core, @emnapi/runtime, next, qrcode, react, react-dom, sharp (+3 more)

### Community 29 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, db:types, dev, dev:mocks, lint, start, test (+3 more)

### Community 30 - "commu/events/[id]/check-in/actions.ts"
Cohesion: 0.09
Nodes (35): Server actions, 5. Migration `20261027000001_event_attendance.sql` + `event_attendance.test.sql`, 6. Staff check-in page `/admin/commu/events/[id]/check-in`, 7. Player side, C. Check-in and attendance, awardAttendees(), checkInPlayer(), code() (+27 more)

### Community 31 - "team/[id]/page.tsx"
Cohesion: 0.41
Nodes (11): deleteTeamGeneration(), deleteTeamMember(), fail(), finish(), moveTeamGeneration(), moveTeamMember(), playerIdFrom(), postedId() (+3 more)

### Community 32 - "callback/route.ts"
Cohesion: 0.16
Nodes (16): Decisions, @supabase/ssr, form(), whitelisted(), authErrorResponse(), GET(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok (+8 more)

### Community 33 - "next"
Cohesion: 0.15
Nodes (11): next, metadata, handleReport(), CATEGORIES, DONE, ERRORS, metadata, Avatar() (+3 more)

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
Cohesion: 0.31
Nodes (8): Avatar(), ERRORS, generateMetadata(), loadCard(), mcHead(), PlayerCard, PlayerPage(), toEventHistory()

### Community 38 - "ics.ts"
Cohesion: 0.20
Nodes (12): RFC-5545, GET(), encoder, escapeText(), eventIcs(), fold(), IcsEvent, icsFilename() (+4 more)

### Community 39 - "admin/page.tsx"
Cohesion: 0.15
Nodes (18): AdminAuditPage(), bangkokDay(), ENTITIES, Entry, metadata, Params, StatRow(), Stats (+10 more)

### Community 40 - "players/actions.ts"
Cohesion: 0.27
Nodes (11): Task 4: Bulk actions, bulkBan(), bulkMarkGuest(), BulkResult, each(), m, AchievementOption, BulkBar() (+3 more)

### Community 41 - "staff-gate.ts"
Cohesion: 0.06
Nodes (39): Final, Global Constraints, Review Focus, Task 2: Hero copy, Task 3: Readable admin stat numbers, Task 4: Move community admin to `/admin/commu/*`, Task 5: Grouped admin nav, v1.1 Phase 1 — Quick Fixes & Admin Navigation Implementation Plan (+31 more)

### Community 42 - "minecraft/route.ts"
Cohesion: 0.25
Nodes (15): `/api/registration/minecraft` — player's Minecraft accounts, DELETE(), GET(), PATCH(), POST(), Profile, resolveMinecraftProfile(), runtime (+7 more)

### Community 43 - "PixelIcon"
Cohesion: 0.19
Nodes (16): AdminAchievementPage(), publicImageUrl(), AdminAchievementsPage(), metadata, AdminAnnouncementPage(), DONE, ERRORS, metadata (+8 more)

### Community 44 - "site-content.ts"
Cohesion: 0.15
Nodes (15): GalleryPage(), metadata, GalleryGrid(), Shot, anonClient(), DEFAULT_DISCORD_URL, gallery, GalleryGroup (+7 more)

### Community 45 - "achievement-grid.tsx"
Cohesion: 0.27
Nodes (11): Role, AchievementGrid(), achievementImage(), day(), EventHistory(), ShowcaseRow(), Tier, TIER_LABELS (+3 more)

### Community 46 - "event-card.tsx"
Cohesion: 0.16
Nodes (16): EventsPage(), metadata, matches(), metadata, PAGES, PlayerHit, SearchPage(), dayBadge() (+8 more)

### Community 47 - "member-preview.tsx"
Cohesion: 0.40
Nodes (12): AnnouncementPreview(), Saved, GroupPreview(), MemberPreview(), PagePreview(), SettingsPreview(), copy(), checked() (+4 more)

### Community 48 - "announcements/[id]/page.tsx"
Cohesion: 0.17
Nodes (12): IMAGE_TYPES, EventForm(), onCover(), pickFile(), LOADED_AT, noSubscribe(), REMINDER_PRESETS, ReminderState (+4 more)

### Community 50 - "allowScripts"
Cohesion: 0.33
Nodes (4): allowScripts, unrs-resolver@1.12.2, overrides, postcss

### Community 51 - "player-table.tsx"
Cohesion: 0.33
Nodes (8): Engagement (v1.1 phase 5), day(), joined(), kind(), PlayerTable(), WHITELIST, VerificationBadge(), VerificationKind

### Community 52 - "admin/players/page.tsx"
Cohesion: 0.29
Nodes (10): metadata, activeView(), BASE, COLUMNS, EMPTY, hrefFor(), playersHref(), same() (+2 more)

### Community 53 - "Review Focus"
Cohesion: 0.18
Nodes (10): Final, Global Constraints, Review Focus, Task 1: `admin_list_players` RPC, Task 2: CSV helper + export route, Task 3: Players table with filters, sort, infinite scroll, Task 5: Clickable dashboard numbers + real Unverified / Guest cards, Task 6: Daily stats snapshot (for Phase 6 charts) (+2 more)

### Community 54 - "admin/settings/page.tsx"
Cohesion: 0.17
Nodes (14): deleteDiscordRole(), finishRole(), saveDiscordRole(), saveSiteSettings(), SWITCHES, m, run(), ERRORS (+6 more)

### Community 55 - "achievements/[id]/actions.ts"
Cohesion: 0.21
Nodes (9): deleteAchievement(), finish(), postedId(), revokeAward(), saveAchievement(), form(), m, valid() (+1 more)

### Community 56 - "Admin tables: the protocol"
Cohesion: 0.29
Nodes (6): 1. The URL is the state, 3. Above the table, 4. Every value is a link, 5. One RPC per table, 6. States, Admin tables: the protocol

### Community 57 - "LegalPage"
Cohesion: 0.25
Nodes (10): render(), metadata, Page(), metadata, Page(), metadata, Page(), LegalPage() (+2 more)

### Community 58 - "dbErrorCode"
Cohesion: 0.31
Nodes (5): decideAppeal(), restoreAccount(), m, redirected(), dbErrorCode()

### Community 59 - "icons.tsx"
Cohesion: 0.16
Nodes (9): DONE, ERRORS, metadata, MetaFields(), metadata, NewAchievementPage(), IconProps, PIXEL_PATHS (+1 more)

### Community 60 - "team-card.tsx"
Cohesion: 0.24
Nodes (9): metadata, TeamPage(), TeamCard(), TeamCardData, toCard(), team, TeamMember, TEAM_SECTIONS (+1 more)

### Community 61 - "createBoundedFetch"
Cohesion: 0.28
Nodes (8): BoundedFetchTimeoutError, createBoundedFetch(), updateSession(), withCsp(), buildCsp(), config, proxy(), supabaseOrigin()

### Community 62 - "banners/actions.test.ts"
Cohesion: 0.20
Nodes (7): sharp, shots, colors, gif(), m, png(), raw()

### Community 63 - "when"
Cohesion: 0.21
Nodes (10): AdminAppealsPage(), DONE, ERRORS, metadata, AdminAnnouncementsPage(), ERRORS, metadata, state() (+2 more)

### Community 64 - "app/events/[id]/actions.ts"
Cohesion: 0.31
Nodes (8): eventId(), signInPath(), form(), interested(), m, redirected(), toggleInterest(), UPCOMING_EVENTS_TAG

### Community 65 - "Tasks"
Cohesion: 0.18
Nodes (10): 1. Announcement images, 2. Gallery, 3. Team page, 4. Site settings, 5. Verify, Already covered (no work), Answers (kaikub, 2026-10-17) and what was built, Revision (kaikub, 2026-10-17, same day) (+2 more)

### Community 66 - "app/events/[id]/page.tsx"
Cohesion: 0.33
Nodes (10): clock(), day(), ends(), ERRORS, EventDetail, EventPage(), generateMetadata(), loadEvent() (+2 more)

### Community 67 - "table-query.ts"
Cohesion: 0.27
Nodes (9): Column, Filters, isDay(), one(), Option, readTable(), TableState, COLUMNS (+1 more)

### Community 68 - "showcase"
Cohesion: 0.28
Nodes (8): 1. Migration `20261026000001_achievement_rarity.sql` + `achievement_rarity.test.sql`, 2. Admin + cards, 3. Showcase UI, A. Rarity tier + showcase, AchievementGroup, showcase(), badge(), group()

### Community 70 - "database.types.ts"
Cohesion: 0.20
Nodes (9): CompositeTypes, Constants, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables, TablesInsert (+1 more)

### Community 71 - "checkIn"
Cohesion: 0.25
Nodes (6): `GET /events/[id]/check-in/start?t=<token>`, Changelog (consensus final), Decisions, checkIn(), m, redirected()

### Community 72 - "vitest"
Cohesion: 0.22
Nodes (4): nextConfig, vitest, m, ROW

### Community 73 - "markdown.tsx"
Cohesion: 0.47
Nodes (7): block(), cells(), inline(), Markdown(), table(), html(), withBreaks()

### Community 74 - "app/events/[id]/check-in/actions.ts"
Cohesion: 0.61
Nodes (4): checkInPath(), NEXT_COOKIE, PROOF_COOKIE, SECURE_COOKIES

### Community 75 - "HTTP endpoints"
Cohesion: 0.29
Nodes (7): `/admin/commu/events/[id]/check-in` (page), `/events/[id]/check-in` (page), `GET /api/dev-login?as=<user>` — local only, `GET /auth/callback?code=…`, `GET /check-in/continue`, `GET /events/[id]/calendar.ics`, HTTP endpoints

### Community 76 - "safeNext"
Cohesion: 0.33
Nodes (5): Changelog (consensus rev 2), psql(), GET(), call(), safeNext()

### Community 77 - "commu/events/[id]/actions.test.ts"
Cohesion: 0.33
Nodes (3): form(), m, valid()

### Community 78 - "app/events/[id]/check-in/page.tsx"
Cohesion: 0.33
Nodes (5): CheckInPage(), ERRORS, EventSummary, metadata, when()

### Community 79 - "announcements/[id]/actions.test.ts"
Cohesion: 0.50
Nodes (3): form(), m, valid()

### Community 80 - "start/route.test.ts"
Cohesion: 0.50
Nodes (3): GET(), call(), m

## Knowledge Gaps
- **11 isolated node(s):** `@emnapi/core`, `@emnapi/runtime`, `@types/node`, `@types/qrcode`, `@types/react` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 526 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `error/page.tsx`, `package.json`, `banner-form.tsx`, `src_app_admin_admin_module`, `site-header.tsx`, `table-query.ts`, `dbErrorCode`, `icons.tsx`, `dashboard/page.tsx`, `SubmitButton`, `player/[id]/actions.ts`, `server/page.tsx`, `createClient`, `images.ts`, `app/settings/page.tsx`, `commu/events/[id]/check-in/actions.ts`, `team/[id]/page.tsx`, `callback/route.ts`, `[slug]/page.tsx`, `player/[id]/page.tsx`, `admin/page.tsx`, `players/actions.ts`, `staff-gate.ts`, `minecraft/route.ts`, `PixelIcon`, `site-content.ts`, `achievement-grid.tsx`, `event-card.tsx`, `announcements/[id]/page.tsx`, `player-table.tsx`, `admin/players/page.tsx`, `admin/settings/page.tsx`, `achievements/[id]/actions.ts`, `LegalPage`, `dbErrorCode`, `icons.tsx`, `team-card.tsx`, `createBoundedFetch`, `when`, `app/events/[id]/actions.ts`, `app/events/[id]/page.tsx`, `vitest`, `app/events/[id]/check-in/actions.ts`, `safeNext`, `app/events/[id]/check-in/page.tsx`, `start/route.test.ts`?**
  _High betweenness centrality (0.225) - this node is a cross-community bridge._
- **What connects `@emnapi/core`, `@emnapi/runtime`, `@types/node` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Tasks` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Why does `createClient()` connect `createClient` to `banner-form.tsx`, `src_app_admin_admin_module`, `site-header.tsx`, `params.ts`, `table-query.ts`, `dbErrorCode`, `icons.tsx`, `dashboard/page.tsx`, `SubmitButton`, `player/[id]/actions.ts`, `server/page.tsx`, `images.ts`, `app/settings/page.tsx`, `commu/events/[id]/check-in/actions.ts`, `team/[id]/page.tsx`, `callback/route.ts`, `next`, `[slug]/page.tsx`, `player/[id]/page.tsx`, `ics.ts`, `admin/page.tsx`, `players/actions.ts`, `staff-gate.ts`, `minecraft/route.ts`, `PixelIcon`, `event-card.tsx`, `announcements/[id]/page.tsx`, `admin/players/page.tsx`, `admin/settings/page.tsx`, `achievements/[id]/actions.ts`, `dbErrorCode`, `icons.tsx`, `createBoundedFetch`, `when`, `app/events/[id]/actions.ts`, `app/events/[id]/page.tsx`, `checkIn`, `app/events/[id]/check-in/actions.ts`, `app/events/[id]/check-in/page.tsx`, `start/route.test.ts`?**
  _High betweenness centrality (0.190) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.1323529411764706 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `vitest` to `error/page.tsx`, `package.json`, `banner-form.tsx`, `local-mocks.mjs`, `params.ts`, `dbErrorCode`, `icons.tsx`, `player/[id]/actions.ts`, `server/page.tsx`, `createClient`, `app/settings/page.tsx`, `commu/events/[id]/check-in/actions.ts`, `callback/route.ts`, `vitest`, `[slug]/page.tsx`, `ics.ts`, `admin/page.tsx`, `players/actions.ts`, `staff-gate.ts`, `minecraft/route.ts`, `admin/players/page.tsx`, `admin/settings/page.tsx`, `achievements/[id]/actions.ts`, `LegalPage`, `dbErrorCode`, `createBoundedFetch`, `banners/actions.test.ts`, `app/events/[id]/actions.ts`, `table-query.ts`, `showcase`, `checkIn`, `markdown.tsx`, `safeNext`, `commu/events/[id]/actions.test.ts`, `announcements/[id]/actions.test.ts`, `start/route.test.ts`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Should `banner-form.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14814814814814814 - nodes in this community are weakly interconnected._