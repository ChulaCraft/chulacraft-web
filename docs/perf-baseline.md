# Performance baseline (v1.1 Phase 7, Task 6)

Bars: admin page server response **p75 < 800 ms**; public pages **LCP < 2.5 s on mobile**; Lighthouse mobile
Accessibility, SEO and Best Practices **>= 95** on home, `/events`, `/events/[id]`, `/player/[id]`.

## Read this first: what these numbers are and are not

This session had no access to Vercel or the Supabase dashboard (controller ruling 9), so everything below was
measured **locally**: `npm run build` + `npm start` (production server, `PERF_TRACE=1`) on 127.0.0.1 against the
local Supabase (http://127.0.0.1:54321) and the manager mock. **Local numbers exclude cross-region latency**
(browser to Vercel, Vercel function to Supabase, Vercel to the manager) and cold starts, and the local database is
nearly empty (6 players, 0 events, 0 achievements/announcements; one temporary published event was inserted for
the event pages and deleted afterwards). They show the shape of each page (how many calls, sequential or
parallel) and a lower bound. Add the Supabase round-trip once per sequential step to estimate production.

## MANUAL: kaikub to fill (no dashboard access)

| Item | Where | Value |
|---|---|---|
| Vercel function region | Vercel dashboard -> Project -> Settings -> Functions -> Function Region | MANUAL: kaikub to fill |
| Supabase region | Supabase dashboard -> Project -> Settings -> General -> Region | MANUAL: kaikub to fill |
| Vercel function -> Supabase round trip | Preview deploy with `PERF_TRACE=1`: load `/admin`, read the `myRole` / `admin_overview_stats` lines in Vercel -> Deployment -> Logs (Runtime logs) | MANUAL: kaikub to fill |
| Admin route p75 server duration (7 days) | Vercel dashboard -> Project -> Observability -> Routes (or Vercel Functions) -> filter route, last 7 days, P75 | MANUAL: kaikub to fill, per route |

Until these are filled, the admin pass/miss column below is provisional: a page that passes locally can still miss
in production if it makes several sequential Supabase calls across regions.

## Method

- `src/lib/perf.ts` `timed(label, promise)` logs `<label> <ms>` server-side only when `PERF_TRACE` is set. It wraps
  every `rpc` call, the auth gates (`requireVerifiedUser`, `myRole`, `requireArea`), the ops manager/health calls and
  `auth.getUser` in the admin tree and the four public pages. Kept after Task 7 (ruling 16): without `PERF_TRACE` it is a
  pass-through, and setting `PERF_TRACE=1` on a Vercel preview measures the production waterfall (MANUAL rows above).
- Signed in as `owner@dev.local` (supabase/dev-seed.sql) by a password grant against local Supabase Auth, then the
  `@supabase/ssr` cookie (`sb-127-auth-token`) sent with curl. (`/api/dev-login` only works under `next dev`.)
- Per route: 1 warm-up request, then 9 timed requests with `curl -w '%{time_starttransfer} %{time_total}'`; p75 =
  7th-smallest of 9. The pass/miss uses **time_total** (the full streamed response, closest to function duration).
- Public-page LCP: `CHROME_PATH=/usr/bin/google-chrome node scripts/lighthouse.mjs http://127.0.0.1:3300 <eventId> <playerId>`
  (`/player/[id]` needs `PLAYER_COOKIE`, see "Auditing `/player/[id]` signed in" at the end; the Task 6/7 player rows
  were measured without it and are really `/register`)
  (Lighthouse 12, mobile preset, simulated slow-4G throttling, anonymous visitor, no CDN).

## Admin pages: server response, local production build (ms)

| Route | TTFB p75 | Total p75 | vs 800 ms |
|---|---|---|---|
| `/admin` | 24 | 24 | pass |
| `/admin/players` | 23 | 26 | pass |
| `/admin/users/ID3` | 20 | 22 | pass |
| `/admin/audit` | 18 | 18 | pass |
| `/admin/appeals` | 16 | 16 | pass |
| `/admin/reports` | 16 | 16 | pass |
| `/admin/restore` | 16 | 16 | pass |
| `/admin/settings` | 18 | 18 | pass |
| `/admin/insights` | 20 | 21 | pass |
| `/admin/pages` | 15 | 15 | pass |
| `/admin/pages/rules` | 15 | 15 | pass |
| `/admin/commu` | 14 | 14 | pass |
| `/admin/commu/achievements` | 15 | 15 | pass |
| `/admin/commu/achievements/new` | 15 | 15 | pass |
| `/admin/commu/achievements/IDaa` | 15 | 16 | pass |
| `/admin/commu/achievements/IDaa/award` | 15 | 15 | pass |
| `/admin/commu/announcements` | 14 | 14 | pass |
| `/admin/commu/announcements/IDaa` | 15 | 15 | pass |
| `/admin/commu/banners` | 15 | 15 | pass |
| `/admin/commu/gallery` | 17 | 17 | pass |
| `/admin/commu/gallery/IDaa` | 15 | 15 | pass |
| `/admin/commu/team` | 15 | 15 | pass |
| `/admin/commu/team/IDaa` | 15 | 15 | pass |
| `/admin/ops` | 19 | 29 | pass |
| `/admin/ops/survival` | 17 | 29 | pass |
| `/admin/ops/website` | 14 | 14 | pass |
| `/admin/ops/bot` | 19 | 19 | pass |

Detail pages for ids that do not exist locally (achievements, announcements, gallery group, team member) render the
not-found path and are not representative; `/admin/users/[id]`, `/admin/commu/events/[id]` and its check-in page,
`/admin/ops/survival` are real renders.

## Call waterfall per page (one request, ms per call, in completion order)

The admin layout calls (`requireVerifiedUser` then `myRole`, sequential) run alongside the page's own calls because
Next renders the layout and page concurrently; the page's gate (`requireArea`) and its data calls then run in
parallel with each other. Within a page: `Promise.all` groups are parallel.

| Page | Calls |
|---|---|
| `/admin` | myRole 11, admin_overview_stats 7, requireVerifiedUser 19, myRole 0, admin_recent_activity 8 |
| `/admin/players` | myRole 6, admin_list_achievements 5, requireVerifiedUser 12, myRole 0 |
| `/admin/users/ID3` | current_app_role 6, admin_user_bans 7, admin_user_profile 9, admin_get_user 9, admin_user_banners 10, requireVerifiedUser 12, myRole 3 |
| `/admin/audit` | requireArea 6, admin_audit_log 7, requireVerifiedUser 10, myRole 0 |
| `/admin/appeals` | requireArea 6, admin_list_appeals 7, requireVerifiedUser 9, myRole 0 |
| `/admin/reports` | requireArea 7, admin_list_reports 9, requireVerifiedUser 11, myRole 0 |
| `/admin/restore` | requireArea 6, admin_removed_accounts 7, requireVerifiedUser 9, myRole 0 |
| `/admin/settings` | get_site_settings 6, requireArea 6, admin_list_discord_roles 7, requireVerifiedUser 9, myRole 0 |
| `/admin/insights` | myRole 5, requireVerifiedUser 12, myRole 0, insights_players 7, insights_events 7, insights_community 7, insights_funnel 8 |
| `/admin/pages` | requireArea 7, get_site_page 7, get_site_page 8, get_site_page 9, requireVerifiedUser 12, myRole 0 |
| `/admin/pages/rules` | requireArea 6, get_site_page 5, requireVerifiedUser 10, myRole 0 |
| `/admin/commu` | requireArea 5, requireVerifiedUser 8, myRole 0 |
| `/admin/commu/achievements` | requireArea 6, admin_list_achievements 6, requireVerifiedUser 10, myRole 0 |
| `/admin/commu/achievements/new` | requireArea 6, admin_list_discord_roles 6, requireVerifiedUser 10, myRole 0 |
| `/admin/commu/achievements/IDaa` | requireArea 7, admin_list_awards 7, admin_list_achievements 8, admin_list_discord_roles 8, requireVerifiedUser 11, myRole 0 |
| `/admin/commu/achievements/IDaa/award` | requireArea 7, admin_list_achievements 7, admin_list_events 7, requireVerifiedUser 11, myRole 0 |
| `/admin/commu/announcements` | requireArea 6, admin_list_announcements 6, requireVerifiedUser 9, myRole 0 |
| `/admin/commu/announcements/IDaa` | requireArea 6, admin_list_announcements 6, requireVerifiedUser 9, myRole 0 |
| `/admin/commu/banners` | requireArea 6, admin_list_banners 6, requireVerifiedUser 9, myRole 0 |
| `/admin/commu/events` | requireArea 9, admin_list_events 10, requireVerifiedUser 12, myRole 0 |
| `/admin/commu/events/new` | requireArea 6, admin_list_banners 6, requireVerifiedUser 10, myRole 0 |
| `/admin/commu/events/IDe1` | requireArea 7, admin_list_events 7, admin_list_event_interests 7, admin_list_banners 8, admin_event_reminders 9, requireVerifiedUser 12, myRole 0 |
| `/admin/commu/events/IDe1/check-in` | requireArea 6, admin_list_events 6, admin_list_attendance 6, admin_list_achievements 6, requireVerifiedUser 11, myRole 0 |
| `/admin/commu/gallery` | requireArea 6, list_gallery_groups 6, list_gallery 6, requireVerifiedUser 10, myRole 0 |
| `/admin/commu/gallery/IDaa` | list_gallery_groups 5, requireArea 6, list_gallery 6, requireVerifiedUser 10, myRole 0 |
| `/admin/commu/team` | requireArea 6, list_team 7, list_team_generations 7, requireVerifiedUser 10, myRole 0 |
| `/admin/commu/team/IDaa` | list_team_generations 5, requireArea 6, list_team 6, requireVerifiedUser 9, myRole 0 |
| `/admin/ops` | myRole 5, requireArea 5, opsHealth 4, requireVerifiedUser 11, myRole 0, admin_bot_overview 6, opsGrant 7, opsGrant 9, managerFetch /services 2, managerFetch /backups 3, managerFetch status 2, managerFetch uptime 2, managerFetch status 3, managerFetch uptime 3, managerFetch status 3, managerFetch uptime 3, managerFetch status 3, managerFetch uptime 3 |
| `/admin/ops/survival` | myRole 5, requireArea 5, requireVerifiedUser 9, myRole 0, opsGrant 5, managerFetch /services 1, managerFetch status 1, managerFetch metrics 1, managerFetch rlog 1 |
| `/admin/ops/website` | opsHealth 5, requireArea 6, admin_app_errors 7, requireVerifiedUser 9, myRole 0 |
| `/admin/ops/bot` | requireArea 6, admin_bot_overview 8, requireVerifiedUser 10, myRole 0 |
| `/` | siteSettings 5, list_upcoming_events 6 |
| `/events` | list_upcoming_events 5, list_past_events 5 |
| `/events/IDe1` | auth.getUser 5, auth.getUser 5, get_event 2, get_event 3 |
| `/player/ID5` | auth.getUser 5, get_player_profile 7, get_player_event_history 3, get_player_banner 4, get_player_profile 4, siteSettings 2 |

Structure notes from the code:
- Every admin page: layout = 2 sequential calls (`requireVerifiedUser`, `myRole`); page = `requireArea` (layout of the section) in parallel with the data calls.
- `/admin/ops`: `opsGrant` (RPC) then `/services`, then per service status + uptime in parallel; backups and bot overview in parallel with that. Sequential depth about 3 round trips (RPC, manager, manager).
- `/admin/ops/[service]`: `opsGrant`, `/services`, then status/metrics/image/rlog in parallel (3 sequential steps).
- `/admin/users/[id]`: 5 RPCs in one `Promise.all` (parallel).
- `/player/[id]`: `getUser`, then profile, history, banner in parallel; `siteSettings` at render time.
- Fully parallel pages are bounded by one round trip beyond the gates; the sequential depth (layout 2 + ops 3) is what a cross-region latency multiplies.

## Public pages: Lighthouse mobile (local production build, anonymous)

| Page | Accessibility | SEO | Best Practices | Performance | LCP (ms) | LCP < 2500 | Scores >= 95 |
|---|---|---|---|---|---|---|---|
| `/` | 100 | 100 | 96 | 82 | 3804 | **MISS** | pass |
| `/events` | 98 | 100 | 96 | 94 | 2667 | **MISS** | pass |
| `/events/[id]` | 100 | **91** | 96 | 75 | 2319 | pass | **MISS (SEO 91)** |
| `/player/[id]` | 100 | 100 | 96 | 81 | 1719 | pass | pass |

LCP is a lab, simulated-throttling number on a local server, so it is a relative signal only. The SEO miss on the
event page was recorded, not diagnosed (Task 9 territory).

## Verdict (provisional)

- Admin: **all pages pass locally** (largest total p75 about 30 ms, `/admin/ops` and `/admin/ops/survival`; the rest under 30 ms). Local DB latency is about 5-10 ms per call; this verdict does not hold up the Task 7 decision until the MANUAL Observability p75 rows are filled in. Pages most exposed to cross-region latency: `/admin/ops`, `/admin/ops/[service]` (3 sequential steps), all admin pages (2 sequential layout calls).
- Public: **`/` and `/events` MISS the LCP bar locally**; `/events/[id]` and `/player/[id]` pass LCP.
- Audit bar: `/events/[id]` SEO 91 < 95.

## Task 7: fixes for the pages that missed

Scope (from the table above): `/` and `/events` missed LCP. All admin pages passed locally and were left alone.
Same method as Task 6 (production build, `npm start` on 127.0.0.1:3300, local Supabase, Lighthouse 12 mobile
preset with simulated slow 4G), with one temporary published event inserted for the runs and deleted afterwards.
Each step is 5 runs (final: 7 runs), median LCP. The numbers come from the Lighthouse JSON
(`largest-contentful-paint`, `largest-contentful-paint-element` phase table, `network-requests`).

### Diagnosis: what the LCP is made of

| Page | LCP element | TTFB | Resource load delay | Resource load time | Render delay |
|---|---|---|---|---|---|
| `/` | hero `<img>` (`landingpage-bg.webp`, 750w, 19 KB) | 15-39 ms | **2660-2690 ms** | 1090-1130 ms | 25-32 ms |
| `/events` | `<p class="lead">` (text) | 15-24 ms | n/a | n/a | **2320-2655 ms** |

TTFB is under 40 ms on both pages, so the server is not the cause. What delays both is the head of the
download queue: the root layout preloaded **20 font files** (Trirong in 4 weights x 2 styles x Latin + Thai = 16,
plus Pixelify Sans and IBM Plex Mono), about 220 KB at High priority, all requested at ~600 ms next to the 4 CSS
files. The CSS finished at ~2.3 s (so FCP was 2.3 s on both pages), the hero image was not even requested until
~2.7 s on `/`, and the `/events` lead paragraph could not paint before the CSS.

### Fix 1: region alignment (MANUAL, not applied)

Not doable from this session and **not the cause locally** (TTFB < 40 ms). It still matters in production for
TTFB and for the admin pages. MANUAL step for kaikub:

1. Read the Supabase region: Supabase dashboard -> Project -> Settings -> General -> Region (for example
   `ap-southeast-1`, Singapore).
2. Read the Vercel function region: Vercel dashboard -> Project -> Settings -> Functions -> Function Region.
3. If they differ, set the Vercel function region to the Vercel region nearest the Supabase one (Supabase
   `ap-southeast-1` -> Vercel `sin1`; `ap-northeast-1` -> `hnd1`; `us-east-1` -> `iad1`; `eu-central-1` -> `fra1`).
   Prefer the **project setting** (step 2). Use `vercel.json` `{"regions": ["sin1"]}` only if you want it in the
   repo; it overrides the project setting. This repo has no `vercel.json` and none was added, because the Supabase
   region is unknown here and a wrong value would add a cross-region hop to every request.
4. Redeploy, then fill the "Vercel function -> Supabase round trip" row at the top of this file.

### Fix 2: collapse sequential awaits (not applicable)

Both pages already read in parallel (`/`: `Promise.all([upcomingEvents, siteSettings])`; `/events`:
`Promise.all([list_upcoming_events, list_past_events])`), and TTFB is not the cause. No change.

### Fix 3: public content caching (not added)

Caching shortens server time, which is 15-40 ms here and not what the LCP is made of. Not added: no `'use cache'`,
no `cacheComponents`, no `updateTag`. `/` keeps its existing 60 s `unstable_cache` on `list_upcoming_events`.
Revisit only if the production Observability numbers show public TTFB as the problem.

### Fix 4: admin `loading.tsx` (not applicable)

Admin pages passed; out of scope.

### Client-side fixes (the actual cause)

| Step | Change | `/` LCP median (runs) | `/events` LCP median (runs) |
|---|---|---|---|
| Before | Task 6 build | **3820** (3816, 3818, 3820, 3851, 3852) | **2670** (2344, 2664, 2670, 2670, 2671) |
| A | Hero image: `loading="eager"` + `fetchPriority="high"` instead of `preload` (`src/app/home-hero.tsx`) | 3820 (3810-3844); load delay 2680 -> 600 ms, but load time grew 1100 -> 3170 ms (same queue) | not affected |
| B | A + Trirong preloads Latin only (`subsets: ["latin"]`, 20 -> 10 preloads) | 2954 (2935-2961) MISS | **2340** (2339-2354) pass |
| C (round 0 final, replaced by F) | A + Trirong `preload: false` (20 -> 2 preloads; `subsets` back to Latin + Thai) | **1936** (1923-1955, 7 runs) | **1830** (1828-1844, 7 runs) |

Round-0 final (step C), from `scripts/lighthouse.mjs` (one run each, all four pages, exit 0 / PASS):

| Page | Accessibility | SEO | Best Practices | Performance | LCP (ms) |
|---|---|---|---|---|---|
| `/` | 100 | 100 | 96 | 94 | 1933 |
| `/events` | 98 | 100 | 96 | 100 | 1515 |
| `/events/[id]` | 100 | 100 | 96 | 100 | 1503 |
| `/player/[id]` | 100 | 100 | 96 | 81 | 1697 |

FCP on both pages: 2.3 s -> 1.49 s. `/events/[id]` and `/player/[id]` did not regress (the event page scored SEO
100 this time with a temporary event that has a description; Task 9 owns that audit).

Trade-off of step C: **home CLS 0.084 -> 0.135** (`/events` 0.002 unchanged). The extra 0.05 is the hero copy
re-flowing when Trirong replaces the fallback (the copy is bottom-anchored, so a height change moves it). The 0.084
was already there (the hero card). Whether real devices shift less or more is **unverified** (headless Linux has no
Times New Roman, which the next/font fallback metrics are built from, and Thai fallback glyphs get no size-adjust
at all). Step C was replaced by step F below.

### Fix round 1: keep LCP, bring home CLS back to <= 0.1

Target: LCP < 2500 ms on `/` and `/events` and CLS <= 0.1 on `/`. Approach: split Trirong into two `next/font`
calls, everything not preloaded plus a small preloaded call for the faces the first screen needs
(`src/lib/fonts.ts`, `bodyFont` + `bodyFontRegular`; `--font-body` stacks both on `body` in `globals.css`). Under
Turbopack both calls emit their faces under the family name "Trirong", so the preloaded files serve those faces
and are not fetched twice (checked in the network log). Hero image change A kept. 7 runs each, median (range).

| Variant | Preloaded Trirong faces (total font preloads) | `/` LCP | `/` CLS (7 runs) | `/events` LCP | `/events` CLS |
|---|---|---|---|---|---|
| C (round 0) | none (2) | 1936 (1923-1955) | 0.135 all | 1830 (1828-1844) | 0.002 |
| D | 400 normal, Latin + Thai (4) | 2240 (2110-2393) | 0.084 x4, 0.130 x3 | 2082 (1587-2348) | 0.002 |
| E | 400 + 500 normal, Latin + Thai (6) | **2676** (2669-2690) MISS | 0.130 all | 2345 (2061-2353) | 0.000-0.002 |
| **F (chosen)** | **400 + 600 normal, Latin (4)** | **2265** (2099-2391) | **0.084 all** | **1905** (1860-2359) | 0.001 |

What the layout-shift audit showed: in D the remaining 0.046 shift on the hero copy came from the Trirong **600**
Latin file arriving late; in E preloading 500 did not remove it and two extra preloads pushed `/` over the bar.
F preloads 600 instead of the Thai 400 file, which removes the font shift (home CLS is back to the pre-Task-7 0.084,
all of it the hero card) while staying under 2500 ms on every run. Thai text keeps the not-preloaded Trirong faces
(swap), as before this round.

Final `scripts/lighthouse.mjs` on F (one run each): home 100/100/96, perf 94, LCP 2385; events 98/100/96, perf 96,
LCP 2340; event 100/**91**/96, perf 100, LCP 1545; player 100/100/96, perf 81, LCP 1690. Exit 1 only because of the
event page SEO 91 (Task 9's; it was 100 on one earlier run, so it depends on the temporary event's data). Single
runs of `/events` land either near 1.9 s or near 2.34 s (bimodal across all runs), both under the bar.

### Follow-up (a11y, not fixed here)

The insights line chart's `<svg role="group" tabindex>` is focusable from the server HTML before React attaches
`onKeyDown`, so arrow/Home/End keys pressed before hydration are silently dropped. The visual test now retries until
the page answers (`tests/visual/insights.spec.ts`). The component itself still needs a fix, e.g. render it
non-focusable until mounted.

## Auditing `/player/[id]` signed in (final fix wave)

`/player/[id]` is signed-in only: signed out it renders a redirect to `/register` (a 200 with a meta refresh, so
Lighthouse does not report an error). **The `/player/[id]` rows in the Task 6 and Task 7 tables above are the
`/register` page**, not a profile.

`scripts/lighthouse.mjs` now:

- audits the player page with a session cookie when `PLAYER_COOKIE` is set (passed as `--extra-headers`
  `{"Cookie": ...}`, player page only; the other three stay anonymous);
- fails a page whose final URL differs from the requested one (so a signed-out player run can no longer pass);
- sends Lighthouse 12's mobile UA plus the `Chrome-Lighthouse` token that PageSpeed Insights sends. Next streams
  `generateMetadata` output into `<body>` for ordinary browsers and blocks for its HTML-limited bots (whose default
  list includes `Chrome-Lighthouse`, and which Googlebot handles either way per the Next docs). Lighthouse's
  meta-description audit reads only `<head meta>`, so with the CLI's default UA the dynamic pages scored SEO 100 or
  92 by race: `curl` with the plain UA put the description in `<body>` 1 time in 5, with the token 0 in 5. This
  also explains the "SEO 91" on `/events/[id]` that Task 6 and Task 9 recorded.

Local recipe (owner session from `supabase/dev-seed.sql`, local Supabase only):

```sh
set -a; . ./.env.development.local; set +a
# Password grant -> the @supabase/ssr cookie (value "base64-" + base64url(session JSON); split into
# sb-127-auth-token.0/.1 if longer than 3180 characters)
SESSION=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" -H 'content-type: application/json' \
  -d '{"email":"owner@dev.local","password":"dev-password"}')
export PLAYER_COOKIE="sb-127-auth-token=base64-$(printf %s "$SESSION" | base64 -w0 | tr '+/' '-_' | tr -d '=')"
CHROME_PATH=/usr/bin/google-chrome node scripts/lighthouse.mjs http://127.0.0.1:3300 <eventId> 00000000-0000-4000-8000-000000000005
```

The session expires after an hour; build a new cookie per run. On a Vercel preview, copy the `sb-<ref>-auth-token`
cookie(s) from a signed-in browser instead (DevTools -> Application -> Cookies), joined as `name=value; name=value`.

### Results: `/player/[id]` signed in (local production build)

Same method as Task 7 (`npm run build`, `next start` on 127.0.0.1:3300 with `.env.development.local`, local
Supabase, Lighthouse 12.8.2 mobile preset), viewing `Dev Verified` (`...0005`) as `owner@dev.local`, one temporary
published event inserted for the event row and deleted afterwards.

| Run | Accessibility | SEO | Best Practices | Performance | LCP (ms) | CLS |
|---|---|---|---|---|---|---|
| Before (player `loading.tsx` without min-height), 5 runs | 100 | 100 (CLI UA: 92 in 1 of 3 script runs) | 96 | 75-78 | 1869-2339 | **0.493** |
| After, 3 script runs | 100 | 100 | 96 | 96-99 | 1897, 2342, 1908 | ~0 |

All four pages PASS in each of the 3 final runs (home LCP 2090-2392, `/events` 1582-2084, `/events/[id]` 1536-2065;
a11y/SEO/BP 100/100/96, `/events` a11y 98). Without `PLAYER_COOKIE` the script now reports
`player ... -> /register` and FAIL.

What was below par and fixed: the signed-in profile streams after its `loading.tsx` fallback, which was shorter than
a screen, so the footer painted in view and then jumped below the fold (CLS 0.49, all of it the footer). The player
fallback now takes `loading.module.css` `.main` (`min-height: 100svh`), as the root fallback already did. CLS is not
one of this phase's bars, but it held the performance score at 75-78. Best Practices 96 everywhere is the
`/_vercel/insights/script.js` 404 on a non-Vercel host (console error), as in Task 6/7.
