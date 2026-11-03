# Patch notes: v1.0 → v1.1

Everything that changed or was added between v1.0 and v1.1 of the ChulaCraft website. v1.0 is preserved on the `v1.0` branch for rollback.

Notes are grouped by who sees the change: players, staff and admins, then operators and developers.

---

## For players

**Look and feel**
- Site-wide redesign: new home hero, refreshed About page, footer and event cards, with better responsiveness and accessibility.
- App icons, web manifest and share previews (Open Graph images) for the home page, events and player profiles, so links look right in chat apps and search results.

**Profiles and achievements**
- Achievements now have **rarity tiers**, shown as a coloured frame with the tier name as readable text.
- **Showcase**: pick which badges to show on your dashboard and profile. If you pick none, a sensible default is shown.
- **Profile banners**: banners with images and styles, which staff can grant or take back.
- Privacy settings for what your public profile shows.
- Achievements can carry a **Discord role**; the bot gives or removes it when the badge is awarded or removed.

**Events**
- **Event check-in**: staff show a rotating QR code while the check-in window is open. Players scan it, sign in if needed, and are checked in. Expired, already-used and out-of-window codes show clear messages.
- **Event reminders**: staff choose reminder offsets per event, and the bot posts each reminder once.
- **Add to calendar** button and a calendar file (`.ics`) for every event.
- Events have **categories**.
- **Notification bell** for in-site notifications, with unread count, empty and error states.
- An **Announcements** page.

**Gallery**
- `/gallery` is now a grid of **category cards** with a cover image. Empty categories are hidden.
- Each category has its own page with a mosaic of photos and a shareable link.
- **Full-screen viewer** with keyboard navigation (←/→, Esc) that respects reduced-motion settings.
- Existing gallery groups and photos are kept as they were.

---

## For staff and admins

**Roles and moderation**
- **Staff roles**: owner, admin, moderator and event staff, each limited to its own area (moderation, community or admin).
- Reports, appeals and bans are handled in the admin area, with an audit log for account-affecting actions.
- Admin search across players, and admin support tools.

**Player page (`/admin/users/<id>`)**
- The page is **read-only by default**. Press **Edit** to reveal the controls.
- Changes are **staged**, then confirmed in one **review** that lists everything that will change and any extra warnings. The whole review applies **all or nothing**: if one step fails, nothing is saved and the review tells you which control failed.
- Leaving the page discards unconfirmed edits.
- Bulk **Mark as guest** and **Ban** on the Players list use the same review, and are limited to 200 players at a time.

**CSV export**
- **Export CSV on every admin list** (players, reports, appeals, audit log, achievements, events and more), keeping the filters you set.
- **Export ticked**: tick rows, then export only those (up to 5000).
- Exports are for admins only, are streamed so large lists don't hit size limits, and are never cut short silently. Thai text opens correctly in Excel, and cells that could run as formulas are neutralised.

**Achievement awards**
- One paged, filterable list with tick boxes and "select all".
- Ticks persist while you search and page.
- Players who already have the badge are shown as locked, and awarding twice never creates duplicates (enforced in the database).
- Paste a list of names or open the page from a prefilled link.
- Creating an achievement no longer fails silently: errors stay on the page with specific messages and your input is kept.

**Insights**
- `/admin/insights`: charts for signups, a registration funnel (with failure reasons), staff activity and daily stats. Charts are keyboard-operable and each has a data table for screen readers. Printing the Players tab gives a clean one-column PDF.

**Ops console**
- `/admin/ops` replaces `/admin/server`: status, start, stop and restart, a live console, "Back up now" (world, bot data and database), and "Pull & restart" (owner only).
- Per-service view with uptime, metrics and logs; a service that fails to load shows an error without breaking the page.
- `/admin/ops/website` shows site health, the running version and captured errors.
- `/admin/ops/bot` edits the Discord bot's settings (channels, roles and so on) from the site, with the bot confirming each value.
- Every ops action is written to the audit log.

---

## For operators and developers

**Security**
- Upgraded Next.js to **16.4.3**, closing the advisories affecting 16.3.x. `npm audit --omit=dev` reports 0 vulnerabilities.
- Manager requests use short-lived EdDSA tokens signed by the website. Bad tokens get 401, missing rights get 403.
- Error capture scrubs sensitive data before storing it.
- gitleaks allowlist narrowed to one fake test value.

**Server manager and bot**
- New and updated contracts for the server manager and the Discord bot, with contract tests that run against both a mock and the real manager.
- Nightly backups of the world, the bot's data file and the database: 7 daily and 4 weekly copies, a disk-space guard, an alert on failure, and a rehearsed restore.
- A host handover document covers deployment, rollback and sign-off.

**Database (28 new migrations, `20261017000001` to `20261102000001`)**
- Players list and daily stats, admin support, staff roles, event categories, profile banners (admin, images, styles), site content.
- Achievement rarity and Discord roles, event attendance, event reminders, notifications.
- Insights, funnel failures, error capture, ops console and bot admin.
- Export RPCs, skip-existing awards, one-transaction player changes, gallery covers, and the permission fixes for the player-changes function.
- All writes go through functions, deletions are soft, and every new function has pgTAP coverage.
- **Order matters:** apply these migrations only after the server manager and bot are live. The bot copes with them being missing, and the previous site build still runs on the new schema (checked by `tests/compat/old-site.mjs`).

**Tests and tooling**
- New suites: accessibility, keyboard, ops, SEO, cache, gallery, award, export and player-edit browser tests; contract tests; old-site compatibility; pgTAP.
- The phase 5–7 manual checklist is now mostly automated. `docs/manual-check-v1.1-mapping.md` lists, for each of its 42 items, the test that covers it or why it stays manual.
- New Lighthouse script and performance baseline document.

**Known limits**
- Backups live on the same host as the data (no off-site copy yet).
- Some checks need a person: real phone camera, real Discord and Google sign-in, screen readers, real calendar apps, production performance numbers.
- Tokens for the manager are not bound to one service, and an open console connection outlives its token. Both are accepted for now and recorded in the manager's security notes.

**Rollback:** the previous release is on the `v1.0` branch. Roll back to the patched build, not to the older vulnerable one.
