# Graph Report - chulacraft-web  (2026-10-17)

## Corpus Check
- 254 files · ~187,131 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 30 file(s) not represented in the graph (top: .css 24, (none) 2, .toml 2)

## Summary
- 1049 nodes · 2546 edges · 51 communities (37 shown, 14 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 81 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0e597a2b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- src_app_loading_module
- server.ts
- registration.ts
- package.json
- player/[id]/page.tsx
- compilerOptions
- icons.tsx
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
- dbErrorCode
- react
- app/events/[id]/page.tsx
- markdown.tsx
- event-card.tsx
- engines
- server/page.tsx
- createClient
- ref_next_dev_types_routes_d_ts
- admin/page.tsx
- dependencies
- scripts
- achievements/[id]/actions.test.ts
- next_dev_types_routes_d
- overrides
- commu/events/[id]/actions.ts
- src_app_about_you_about_you_module
- Phases
- next_types_root_params_d
- next_types_routes_d
- src_app_auth_error_auth_error_module
- src_app_not_found_module
- announcements/[id]/page.tsx
- submit-button.tsx
- commu/events/[id]/actions.test.ts
- allowScripts
- next
- event-form.tsx
- app/layout.tsx
- src_app_admin_admin_module
- achievements/[id]/page.tsx
- site-header.tsx
- app/events/[id]/actions.ts

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 114 edges
2. `next` - 82 edges
3. `PixelIcon()` - 44 edges
4. `dbErrorCode()` - 40 edges
5. `vitest` - 37 edges
6. `react` - 21 edges
7. `when()` - 19 edges
8. `SubmitButton()` - 16 edges
9. `createAdminClient()` - 16 edges
10. `compilerOptions` - 16 edges

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

## Communities (51 total, 14 thin omitted)

### Community 1 - "server.ts"
Cohesion: 0.08
Nodes (33): @supabase/ssr, authErrorResponse(), GET(), { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities }, ok, AuthErrorPage(), metadata, src_app_home_module (+25 more)

### Community 2 - "registration.ts"
Cohesion: 0.07
Nodes (45): `/api/registration/minecraft` — player's Minecraft accounts, `GET /api/dev-login?as=<user>` — local only, `GET /auth/callback?code=…`, HTTP endpoints, DELETE(), GET(), PATCH(), POST() (+37 more)

### Community 3 - "package.json"
Cohesion: 0.14
Nodes (14): name, private, version, @emnapi/core, @emnapi/runtime, eslint, eslint-config-next, @eslint/js (+6 more)

### Community 4 - "player/[id]/page.tsx"
Cohesion: 0.07
Nodes (41): 1. `eventHistory()` helper + test, 2. `ProfileBanner` component, 3. Public player page (`src/app/player/[id]/page.tsx`), 4. Report dialog, 5. Profile page (`src/app/dashboard/page.tsx`), 6. Motion, 7. Verify, Decisions (+33 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "icons.tsx"
Cohesion: 0.05
Nodes (44): src_app_about_about_module, gallery, metadata, values, AdminEventsPage(), metadata, signOut(), ServiceUnavailable() (+36 more)

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
Nodes (16): Accounts and identity, Audit, Content, Database, Minecraft whitelist, Other services that use this database, Player-readable tables, RPC functions (+8 more)

### Community 11 - "dashboard/page.tsx"
Cohesion: 0.05
Nodes (58): Pages, Server actions, Web API, Moderation, Task 1: Show the Discord name everywhere, @supabase/supabase-js, finish(), LEVELS (+50 more)

### Community 13 - "vitest"
Cohesion: 0.05
Nodes (69): RFC-4180, 1. The URL is the state, 2. Columns declare what they can do, 3. Above the table, 4. Every value is a link, 5. One RPC per table, 6. States, Admin tables: the protocol (+61 more)

### Community 14 - "award/page.tsx"
Cohesion: 0.15
Nodes (23): addPlayers(), awardId(), confirmAward(), fail(), prefillInterested(), previewAward(), m, unique() (+15 more)

### Community 15 - "Chulacraft registration runbook"
Cohesion: 0.22
Nodes (8): Chulacraft registration runbook, Daily stats, Normal operations, Roles and Chula verification, Safe launch order, Secret incident response, Switching from CU SSO to Google (deploy order), Troubleshooting and recovery

### Community 18 - "dbErrorCode"
Cohesion: 0.20
Nodes (12): decideAppeal(), deleteAnnouncement(), postedId(), refresh(), saveAnnouncement(), SEVERITIES, form(), m (+4 more)

### Community 19 - "react"
Cohesion: 0.10
Nodes (26): ref_node_dns, ref_node_net, react, src_app_announcements_announcements_module, AnnouncementsPage(), metadata, AnnouncementBanner(), dismissedId() (+18 more)

### Community 20 - "app/events/[id]/page.tsx"
Cohesion: 0.36
Nodes (9): clock(), day(), ends(), ERRORS, EventDetail, EventPage(), generateMetadata(), loadEvent() (+1 more)

### Community 21 - "markdown.tsx"
Cohesion: 0.43
Nodes (5): react-dom, block(), inline(), Markdown(), withBreaks()

### Community 22 - "event-card.tsx"
Cohesion: 0.24
Nodes (12): src_app_events_events_module, EventsPage(), metadata, dayBadge(), endTime(), EventCard(), eventImageUrl(), src_components_event_card_module (+4 more)

### Community 24 - "server/page.tsx"
Cohesion: 0.11
Nodes (31): ref_node_crypto, ACTIONS, openConsole(), serverAction(), m, redirected(), ConsoleAction, grant() (+23 more)

### Community 25 - "createClient"
Cohesion: 0.08
Nodes (45): BAN_DURATIONS, banUser(), finish(), liftBan(), markGuest(), PRIVACY_LEVELS, resetChula(), saveProfileFor() (+37 more)

### Community 27 - "admin/page.tsx"
Cohesion: 0.07
Nodes (35): Final, Global Constraints, Review Focus, Task 1: `admin_list_players` RPC, Task 2: CSV helper + export route, Task 5: Clickable dashboard numbers + real Unverified / Guest cards, Task 6: Daily stats snapshot (for Phase 6 charts), v1.1 Phase 2a — Players Table, Filters, Bulk Actions, CSV, Daily Stats (+27 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @emnapi/core, @emnapi/runtime, next, react, react-dom, sharp, @supabase/ssr (+2 more)

### Community 29 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, db:types, dev, dev:mocks, lint, start, test (+3 more)

### Community 30 - "achievements/[id]/actions.test.ts"
Cohesion: 0.29
Nodes (4): deleteAchievement(), form(), m, valid()

### Community 33 - "commu/events/[id]/actions.ts"
Cohesion: 0.22
Nodes (16): finish(), postedId(), revokeAward(), saveAchievement(), BUCKET, EXTENSIONS, imageError(), imageKey() (+8 more)

### Community 35 - "Phases"
Cohesion: 0.15
Nodes (12): ChulaCraft Web v1.1 — Roadmap Spec, Decisions already made, Deferred (needs Minecraft server endpoint), Global constraints (every phase), Phase 1 — Quick fixes & admin navigation  → `plans/2026-10-16-v1.1-phase1-quick-fixes.md`, Phase 2 — Admin power tools, Phase 3 — Design system & UI redesign, Phase 4 — Content without a developer (+4 more)

### Community 40 - "announcements/[id]/page.tsx"
Cohesion: 0.38
Nodes (5): AdminAnnouncementPage(), DONE, ERRORS, metadata, bangkokInput()

### Community 41 - "submit-button.tsx"
Cohesion: 0.14
Nodes (12): AdminAppealsPage(), DONE, ERRORS, metadata, metadata, AdminReportsPage(), CATEGORIES, DONE (+4 more)

### Community 42 - "commu/events/[id]/actions.test.ts"
Cohesion: 0.33
Nodes (3): form(), m, valid()

### Community 45 - "next"
Cohesion: 0.19
Nodes (8): next, restoreAccount(), m, redirected(), ERRORS, metadata, RemovedRow, RestorePage()

### Community 46 - "event-form.tsx"
Cohesion: 0.16
Nodes (12): IMAGE_TYPES, EventForm(), onCover(), pickFile(), EventFormValues, LOADED_AT, noSubscribe(), shrink() (+4 more)

### Community 47 - "app/layout.tsx"
Cohesion: 0.18
Nodes (11): @vercel/analytics, GET(), src_app_globals, metadata, SiteFooter(), DEV_LOGIN_ENABLED, DEV_USERS, bodyFont (+3 more)

### Community 48 - "src_app_admin_admin_module"
Cohesion: 0.15
Nodes (5): src_app_admin_admin_module, AdminAnnouncementsPage(), ERRORS, metadata, state()

### Community 49 - "achievements/[id]/page.tsx"
Cohesion: 0.18
Nodes (14): AdminAchievementPage(), DONE, ERRORS, metadata, publicImageUrl(), AdminAchievementsPage(), metadata, AdminEventPage() (+6 more)

### Community 54 - "site-header.tsx"
Cohesion: 0.06
Nodes (37): Final, Global Constraints, Review Focus, Task 2: Hero copy, Task 3: Readable admin stat numbers, Task 4: Move community admin to `/admin/commu/*`, Task 5: Grouped admin nav, v1.1 Phase 1 — Quick Fixes & Admin Navigation Implementation Plan (+29 more)

### Community 55 - "app/events/[id]/actions.ts"
Cohesion: 0.31
Nodes (8): eventId(), signInPath(), form(), interested(), m, redirected(), toggleInterest(), UPCOMING_EVENTS_TAG

## Knowledge Gaps
- **315 isolated node(s):** `nextConfig`, `name`, `private`, `node`, `version` (+310 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 407 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `server.ts`, `registration.ts`, `package.json`, `player/[id]/page.tsx`, `icons.tsx`, `dashboard/page.tsx`, `vitest`, `award/page.tsx`, `dbErrorCode`, `react`, `app/events/[id]/page.tsx`, `event-card.tsx`, `server/page.tsx`, `createClient`, `admin/page.tsx`, `commu/events/[id]/actions.ts`, `announcements/[id]/page.tsx`, `submit-button.tsx`, `event-form.tsx`, `app/layout.tsx`, `src_app_admin_admin_module`, `achievements/[id]/page.tsx`, `site-header.tsx`, `app/events/[id]/actions.ts`?**
  _High betweenness centrality (0.276) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `server.ts`, `registration.ts`, `player/[id]/page.tsx`, `icons.tsx`, `dashboard/page.tsx`, `vitest`, `award/page.tsx`, `dbErrorCode`, `react`, `app/events/[id]/page.tsx`, `event-card.tsx`, `server/page.tsx`, `admin/page.tsx`, `achievements/[id]/actions.test.ts`, `commu/events/[id]/actions.ts`, `announcements/[id]/page.tsx`, `submit-button.tsx`, `next`, `app/layout.tsx`, `src_app_admin_admin_module`, `achievements/[id]/page.tsx`, `site-header.tsx`, `app/events/[id]/actions.ts`?**
  _High betweenness centrality (0.161) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `server.ts`, `registration.ts`, `package.json`, `player/[id]/page.tsx`, `icons.tsx`, `commu/events/[id]/actions.test.ts`, `dashboard/page.tsx`, `next`, `award/page.tsx`, `dbErrorCode`, `react`, `markdown.tsx`, `site-header.tsx`, `app/events/[id]/actions.ts`, `server/page.tsx`, `createClient`, `admin/page.tsx`, `achievements/[id]/actions.test.ts`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `private` to the rest of the system?**
  _315 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `registration.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06801346801346801 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.14166666666666666 - nodes in this community are weakly interconnected._