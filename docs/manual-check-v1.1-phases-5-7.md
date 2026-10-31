# v1.1 Phases 5–7: manual checks before commit and deploy

Phases 5, 6 and 7 are implemented on branch `v1.1` and are **not committed**. Automated gates pass (Vitest,
typecheck, lint, pgTAP per new file, Playwright visual suite on the local Supabase stub, local Lighthouse).
The items below cannot be proven by automation from the dev machine: they need a real browser, a real device,
real Discord/Google/Mojang, a screen reader, or dashboard access. Tick each one.

Local setup for most checks: `npx supabase start`, `npm run dev`, and for the ops console `npm run dev:mocks`
(manager mock) or `node scripts/local-mocks.mjs --bot` (bot mock).

## Phase 5: engagement (rarity, Discord roles, check-in, reminders, bell)

Browser at 375 px and 1280 px, keyboard only, and with reduced motion on:

- [ ] Settings → Discord role allowlist: add/remove a role.
- [ ] Achievement form: tier select and Discord role select (only allowlisted roles offered).
- [ ] Achievement cards on `/dashboard` and `/player/<id>`: tier frame colour, tier name readable as text.
- [ ] Showcase: pick badges, and the fallback when none are picked.
- [ ] Staff check-in page: rotating QR while the window is open, closed state outside it.
- [ ] Player scan: signed in; signed out → sign in → back → Check in; waiting more than 5 min; already checked
      in; expired token.
- [ ] Staff scanner on a phone: camera allowed, camera denied, manual code (Firefox/desktop Safari fall back to
      the code field).
- [ ] "Award badge to attendees": count shown, second click awards 0.
- [ ] Event form: reminder offsets save.
- [ ] `/events/<id>/calendar.ics` opens in a real calendar app (Google Calendar, Apple Calendar) with the right
      time; "Add to calendar" button works.
- [ ] Notification bell: 0, unread count, opened (count clears), empty, error.
- [ ] Bot side (needs the chulacraft-discord changes from `docs/bot-contract-phase5.md`): a badge with a role
      gives/removes the Discord role; event reminders post once.

## Phase 6: insights

- [ ] `/admin/insights`: keyboard ←/→ on a line chart moves the tooltip.
- [ ] A screen reader (Orca or VoiceOver) reads each chart's hidden data table.
- [ ] Ctrl+P on the Players tab gives a one-column light PDF.
- [ ] Spot-check numbers against the database on real data (signups, funnel, staff activity).
- [ ] Decide (left open by the final review): the "Discord linked" funnel step is ~100% by design; relabel or
      drop it. `insights_staff` date filter is not index-friendly — fine until audit rows grow large.

## Phase 7: ops console, error capture, perf, audits

### Before deploying (release order matters)

- [ ] Follow `OPERATOR_RUNBOOK.md` → "Release order (ops console)": ship the server-manager with `/services`
      **and** the `/servers` aliases first; then apply migrations `20261031000001`–`000003` and deploy the website
      in the same window (the migration drops `admin_server_console_access`, which the old `/admin/server` uses);
      remove the aliases later.
- [ ] The server-manager implements `docs/ops-manager-contract.md` (Docker backend via the filtering socket proxy,
      `chulacraft-update@.service` for image updates, metrics, backups). Not built in this repo.
- [ ] The Discord bot implements `docs/bot-contract-ops.md` (settings from `bot_config()`, job reports, the
      `/api/ops/health` probe and the `errors_5m ≥ 10` spike alert). Not built in this repo.
- [ ] Set `OPS_HEALTH_TOKEN` on Vercel and in the bot's `.env` (same value).
- [ ] Set `NEXT_PUBLIC_SITE_URL` on Vercel to the real domain (canonical URLs, sitemap and OG images use it).
- [ ] Copy `docs/ops-manager-contract.md` into `chulacraft-docs/docs/mcsv/api/` once you consider it final.

### Ops console (with `npm run dev:mocks`)

- [ ] `/admin/server` redirects to `/admin/ops`; nav says "Ops".
- [ ] Stop `survival` → the list shows Down; start it again; the console still streams.
- [ ] Keyboard only through every action dialog: start, stop, restart, "Back up now" (world and database),
      "Pull & restart" (owner only; admin sees tags but no button).
- [ ] The `fail` service row shows "Couldn't load status" while the rest of the page works.
- [ ] `/admin/ops/website`: health, version, and the error table (trigger an error to see a row).
- [ ] With the real manager: stop/start a real service, check the audit log has `ops` rows with the jti.

### Bot settings (`/admin/ops/bot`, with `node scripts/local-mocks.mjs --bot` against local Supabase)

- [ ] Change a channel ID → saved, then "OK" after the bot checks it; a value ending `0000` shows the bot's error.
- [ ] "Reset to default" works; a restart-only setting shows the restart note linking to the bot's Ops page.
- [ ] Pause and resume a job; stop the mock and see jobs turn Overdue.
- [ ] A role used by a badge can't be set as a bot role (and the reverse).

### Performance (needs Vercel/Supabase dashboards — not reachable from the dev machine)

- [ ] Fill the rows marked "MANUAL — kaikub to fill" in `docs/perf-baseline.md`: Vercel function region, Supabase
      region, function→Supabase round trip, Vercel Observability p75 per admin route (bar: < 800 ms).
- [ ] If the regions differ, align them (steps in `docs/perf-baseline.md`).
- [ ] On a preview deploy with `PERF_TRACE=1`, load the admin pages and check the logged call waterfall.
- [ ] Speed Insights / PageSpeed on production: home LCP < 2.5 s on mobile (local headroom was only
      ~110–230 ms) and home CLS ≤ 0.1, especially with Thai text (Thai has no preloaded font face).

### Audits and SEO

- [ ] Keyboard-only walkthrough with the real services (`docs/a11y-keyboard-pass.md` lists what automation
      covered): Discord sign-in, details, Chula Google verification, add a Minecraft name (real Mojang lookup),
      report a player.
- [ ] Screen reader pass on register and report-player.
- [ ] Share an event link and a public player link in Discord/LINE: preview image renders, Thai names readable.
- [ ] Decide: player OG cards are only generated for signed-in viewers (profiles are sign-in-only), so crawlers
      and link previews get the site image. Allow anonymous OG for public profiles, or keep as is.
- [ ] `https://<domain>/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` load in production.

### Known follow-ups (not blocking, from review)

- Manager mock never returns 409 for start/stop/restart/update; contract is silent on images with no
  `RepoDigests` — settle before the manager implements `image`.
- `bot_register('[]','[]')` retires every setting and job (values kept; bot falls back to `.env`).
- Charts are focusable before hydration, so a very early key press is dropped.
- 192/512 px icons are upscaled from a 160 px logo; replace with a larger source when available.
- `timed()` PERF_TRACE wrappers stay in ~45 files (no-ops unless `PERF_TRACE` is set).
