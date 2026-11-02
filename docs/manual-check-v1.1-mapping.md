# v1.1 phases 5-7: where each manual check went

Every checkbox in `manual-check-v1.1-phases-5-7.md` (42) maps to a test or to a bucket.
Buckets: **A** automated, **L** needs a person's login, **R** ships untested, known risk.
The L and R lists are written up in `chulacraft-docs/docs/ops/release-v1.1-checks.md`.
Test paths are under `tests/visual/` (Playwright, stub) unless they start with `src/` or `supabase/`.

Result: A 23, L 9, R 10.

## Phase 5

| # | Item | Bucket | Test (file: title) |
|---|---|---|---|
| 1 | Role allowlist | A | phase5-engagement.spec.ts: "role allowlist: add, rename and remove a Discord role"; "...can't be removed, and a bot role can't be added" |
| 2 | Tier and role selects | A | phase5-engagement.spec.ts: "achievement form: tier select and a role select that offers only allowlisted roles" |
| 3 | Tier frames | A | phase5-engagement.spec.ts: "tier frames: each tier is written as text and framed differently..." |
| 4 | Showcase | A | phase5-engagement.spec.ts: "showcase" (3 tests, incl. none picked) |
| 5 | Check-in page | A | phase5-engagement.spec.ts: "staff check-in" (open, before, after) |
| 6 | Player scan states | A | phase5-engagement.spec.ts: "player scan" (7 tests). Real sign-in round trip: R-list |
| 7 | Staff scanner | A | phase5-engagement.spec.ts: "staff scanner" (typed code, camera denied, no BarcodeDetector). Real phone camera: R-list |
| 8 | Award attendees | A | phase5-engagement.spec.ts: "award badge to attendees: the count is shown and a second click awards 0" |
| 9 | Reminder offsets | A | phase5-engagement.spec.ts: "event reminders: offsets save and come back ticked" |
| 10 | `.ics` | A | phase5-engagement.spec.ts: "calendar: ..."; src/lib/ics.test.ts (CRLF, UTC, folding, escaping). Real calendar apps: R-list |
| 11 | Bell | A | phase5-engagement.spec.ts: "notification bell" (0, unread, opened, error) |
| 12 | Bot gives/removes role, reminders once | R | Bot repo and T3.2 contract tests; a real guild is not reachable |

## Phase 6

| # | Item | Bucket | Test |
|---|---|---|---|
| 1 | Keyboard arrows on a chart | A | insights-checks.spec.ts: "keyboard: Home then ArrowRight..."; insights.spec.ts: "keyboard moves the line chart tooltip" |
| 2 | Screen reader reads data tables | R | Tables in the DOM are tested (insights-checks.spec.ts: "every chart has its data table..."); listening is R |
| 3 | Ctrl+P PDF | R | insights-checks.spec.ts: "print: light, one column..." covers the CSS; the printed PDF is R |
| 4 | Spot-check on real data | R | Needs real data |
| 5 | Decide: Discord linked, `insights_staff` | R | Ships as is (Q5) |

## Phase 7: before deploying

| # | Item | Bucket | Note |
|---|---|---|---|
| 1 | Release order | L | Followed in G3 from `OPERATOR_RUNBOOK.md` |
| 2 | Manager implements contract | L | Conformance suite in the manager repo (T3.2); deploying it is a person's act |
| 3 | Bot implements contract | L | Bot contract tests (T3.2); deploying is a person's act |
| 4 | `OPS_HEALTH_TOKEN` | L | Vercel and bot `.env`. The route is tested: src/app/api/ops/health/route.test.ts |
| 5 | `NEXT_PUBLIC_SITE_URL` | L | Vercel |
| 6 | Copy contract to `chulacraft-docs` | L | Needs docs repo access |

## Phase 7: ops console

| # | Item | Bucket | Test |
|---|---|---|---|
| 1 | Redirect, nav says Ops | A | ops.spec.ts: "/admin/server redirects to /admin/ops"; ops-checks.spec.ts: "nav says Ops, not Server" |
| 2 | Stop survival, shows Down | A | ops.spec.ts: "stopping survival shows Down in the list while the console stays connected" |
| 3 | Keyboard through dialogs | A | ops.spec.ts: "every action dialog works from the keyboard alone"; ops-checks.spec.ts: "both backup buttons..." and "Pull & restart (owner)..."; ops.spec.ts: "admin sees the image tags but no Pull & restart" |
| 4 | `fail` row | A | ops.spec.ts: "owner sees every manager service plus the website; only the broken one shows an error" |
| 5 | `/admin/ops/website` | A | ops.spec.ts: "website page lists grouped errors; empty feed says so"; src/lib/ops-health.test.ts (health, version) |
| 6 | Audit `ops` rows with jti | A | src/lib/ops-grant.test.ts; supabase/tests/ops_console.test.sql (row shape). Real manager stop/start: G2/G3 |

## Phase 7: bot settings

| # | Item | Bucket | Test |
|---|---|---|---|
| 1 | Change channel, OK, error | A | ops-bot.spec.ts: "owner changes a channel..."; "a channel the bot can't find shows the bot's error" |
| 2 | Reset, restart note | A | ops-bot.spec.ts: "a malformed value gets an inline error and Reset to default goes back"; "a restart-only setting says so..." |
| 3 | Pause/resume, Overdue | A | ops-bot.spec.ts: "tasks show their state in words; pausing one shows Paused"; "when the bot stops reporting, its tasks go Overdue..." |
| 4 | Badge role vs bot role | A | ops-checks.spec.ts: "a role a badge may give is refused as a bot role, with the reason"; phase5-engagement.spec.ts "role allowlist" |

## Phase 7: performance

| # | Item | Bucket | Note |
|---|---|---|---|
| 1 | Fill `perf-baseline.md` | L | Vercel and Supabase dashboards |
| 2 | Align regions | L | Vercel and Supabase dashboards |
| 3 | `PERF_TRACE` preview run | L | Preview deploy |
| 4 | Production LCP and CLS | R | Needs production traffic |

## Phase 7: audits and SEO

| # | Item | Bucket | Test |
|---|---|---|---|
| 1 | Keyboard walkthrough, real services | R | Real Discord, Google, Mojang |
| 2 | Screen reader on register and report | R | Needs a screen reader |
| 3 | Discord and LINE previews | R | Needs the real apps. Meta and og:image are tested: seo.spec.ts |
| 4 | Decide: anonymous OG cards | R | Ships as is (Q5) |
| 5 | sitemap, robots, manifest | A | seo.spec.ts: "sitemap, robots.txt and the web manifest are served" |
