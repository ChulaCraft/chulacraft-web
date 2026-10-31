# Keyboard-only pass: register and report-player

**Date:** 2026-10-22 (v1.1 Phase 7, Task 9)
**How:** automated with Playwright, keyboard only (Tab, Enter, Space, arrow keys, Escape; no mouse and no
`click`), at 375 px and 1440 px, against the visual-suite Supabase stub. Spec: `tests/visual/keyboard.spec.ts`
(runs with `npm run test:visual`). Each Tab stop on the way is checked for a visible focus indicator (outline or
box-shadow).

## Steps and result

| # | Step | What the spec does | Result |
| --- | --- | --- | --- |
| 1 | Sign in | `/register` logged out. Tab to **Continue with Discord**, Enter. | Pass. Reachable, focus ring on every stop, Enter starts Discord OAuth (request to `/auth/v1/authorize?provider=discord`). Stops there. |
| 2 | Verify | `/verify` signed in, Discord only. Tab to **Verify with Chula Google**, Enter. | Pass. Reachable, Enter starts the Google link (`/auth/v1/user/identities/authorize?provider=google`). Stops there. |
| 3 | Details | `/register/details`. Type first and last name, Tab past nickname, Space on the first study level, ArrowDown in Faculty and Major, Tab to **Finish registration**, Enter. | Pass. Lands on `/welcome`. |
| 4 | Add Minecraft name | On `/welcome`, Tab to **Add your Java username**, Enter (lands on `/settings#add-account`). Tab to the username field, type, Enter. | Pass. "Added …" status shown. The Mojang lookup and the database write were answered in the browser, see below. |
| 5 | Report a player | `/player/[id]` signed in. Tab to **Report**, Enter: the dialog opens. Escape closes it and focus returns to **Report**. Enter again: focus starts on the checked reason, ArrowDown picks the next one, Tab to Details, type, Tab to **Send report**, Enter. | Pass. "Report sent" status shown. |

Fixes made during this pass: none needed for these steps. The axe run in the same task found and fixed one
issue on every signed-in page: the account menu's `aria-label` did not contain its visible name (now named by its
content, `src/components/site-header.tsx`).

Blockers found by automation: none in the steps above. This does not cover the items below.

## Human confirmation pending (kaikub)

Automation cannot prove these. They need one person with a keyboard (and a screen reader for the last item):

- **Real Discord OAuth:** the Discord authorize and consent screens, and the return to `/auth/callback`, by keyboard.
- **Real Google verification:** Google's account chooser with a `@chula.ac.th` or `@student.chula.ac.th` account and
  the return to `/verify` → `/register/details`, by keyboard.
- **Real Minecraft name check:** "Add account" against the real Mojang lookup and whitelist write (the spec answers
  `/api/registration/minecraft` in the browser).
- **Screen-reader output:** what VoiceOver/NVDA/TalkBack actually announce on each step (labels, the report dialog,
  the status messages). Automation only checks roles and names.
