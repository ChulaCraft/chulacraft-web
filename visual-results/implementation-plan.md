# ChulaCraft Redesign Implementation Plan

## 1. Objective and Scope

Redesign the current `web/` user-facing surfaces to match `DesignAsset/LaunchDesign` while preserving all existing behavior.

### In-scope visual routes

- `/`
- `/about`
- `/register`
- `/auth/error`
- `not-found`

### Functional-only surfaces to preserve

- `/auth/callback`
- `/api/registration`
- Supabase clients, session refresh, middleware/proxy behavior
- Registration validation and Minecraft lookup contracts

Do not add `/rules`, `/faq`, `/features`, `/gallery`, or password-login routes. Their reference panels may inform shared components only.

## 2. Delivery Rules

- `FullPageDesign.png` controls page composition.
- `componentDesign.png` controls shared UI.
- Isolated backgrounds and launch logos are production imagery.
- `loadingAnimation.png` controls loading treatment only.
- Preserve current navigation, CTA, clipboard, OAuth, sign-out, registration, validation, redirects, and API behavior.
- Implement shared tokens and components before route work.
- Keep concurrent ownership non-overlapping. Page-specific styles should remain with their page lane; only the design-system owner edits shared global styles.
- Do not modify backend/auth files unless a demonstrated regression requires the smallest possible repair.

## 3. Implementation Task Graph

### TASK DS — Global Design System and Shared Chrome

**OWNER:** Shared UI Implementer

**FILES / SCOPE:**

- `web/src/app/layout.tsx`
- `web/src/app/globals.css`
- `web/src/components/site-header.tsx`
- `web/src/components/site-footer.tsx`
- `web/src/components/brand.tsx`
- `web/src/components/auth-button.tsx`
- `web/src/components/sign-out-button.tsx`
- Shared visual primitives introduced under `web/src/components/`
- Font and shared asset integration required by these files

**DEPENDENCIES:** Audit report and visual references

**ACCEPTANCE:**

- Defines the audited pink/plum palette, typography roles, spacing, borders, shadows, pixel geometry, focus states, and reduced-motion behavior.
- Uses Minecraftia only for display/brand roles; readable UI text uses Rajdhani/Inter or robust approved fallbacks.
- Header, footer, brand, buttons, panels, inputs, alerts, badges, and loading treatment follow the component reference.
- Responsive navigation works at all required widths with at least 44px interactive targets.
- Oversized transparent logo canvases are cropped or wrapped so the visible mark has the intended scale.
- Existing auth, sign-out, links, and navigation behavior remain unchanged.
- No significant green/teal legacy styling remains in shared chrome.
- Shared components expose stable APIs for route implementers.

**RISKS:** `globals.css` blast radius, font layout shifts, transparent logo padding, and auth/mobile navigation regressions.

### TASK HOME — Landing Route

**OWNER:** Home Implementer

**FILES / SCOPE:** `web/src/app/page.tsx`, Home-only styling/components, and `web/src/components/server-address-card.tsx`.

**DEPENDENCIES:** TASK DS

**ACCEPTANCE:** Match the Home composition with `landingpageBG.png`; preserve sign-in, Discord, registration, navigation, and server-copy behavior; tune art, type, controls, and proportions at every required viewport; retain accessible clipboard feedback; eliminate overflow and broken imagery.

**RISKS:** Art focal crop and accidental substitution of `Banner.png` for the canonical Home composition.

### TASK ABOUT — About Route

**OWNER:** About Implementer

**FILES / SCOPE:** `web/src/app/about/page.tsx` and About-only styling/components.

**DEPENDENCIES:** TASK DS

**ACCEPTANCE:** Use `AboutUsBG.png` and the audited composition; preserve existing content/links/CTA behavior; maintain readability without glassmorphism; tune crops at every viewport; remove legacy styling.

**RISKS:** Obscuring artwork and inventing an unsupported mobile composition.

### TASK REG — Registration and Auth Presentation

**OWNER:** Registration/Auth Implementer

**FILES / SCOPE:** `web/src/app/register/page.tsx`, `web/src/components/registration-panel.tsx`, `web/src/app/auth/error/page.tsx`, route-specific styling, and `Background1.png` integration.

**DEPENDENCIES:** TASK DS

**ACCEPTANCE:** Apply launch form/card/alert/badge/input/loading patterns; preserve authenticated/unauthenticated behavior, validation, polling, messages, live regions, errors, and submit state; retain safe error mapping; remain responsive; do not change callback/API/Supabase/RPC/RLS/redirect contracts without a failing regression test.

**RISKS:** Client/server boundaries, state/polling behavior, redirect contracts, async stabilization, and credential-dependent QA.

### TASK AUX — Not-Found Surface

**OWNER:** Auxiliary Surface Implementer

**FILES / SCOPE:** `web/src/app/not-found.tsx` and route-only styling.

**DEPENDENCIES:** TASK DS

**ACCEPTANCE:** Conservatively apply the launch panel/button system, preserve semantic missing-page recovery, avoid invented product functionality, and remain responsive.

**RISKS:** No dedicated visual mockup.

### TASK VISINFRA — Playwright Visual Infrastructure

**OWNER:** QA Infrastructure Implementer

**FILES / SCOPE:** `web/playwright.config.ts`, `web/tests/visual/**`, `web/visual-results/visual-todo.md`, `score-history.json`, and screenshot cycle directories.

**DEPENDENCIES:** Route inventory; may begin in parallel with TASK DS and validate after route work.

**ACCEPTANCE:** Cover all scoped surfaces; capture full pages at 375×812, 430×932, 768×1024, and 1440×900; wait for fonts/images; stabilize animation; detect browser errors, broken images, overflow, and serious failures; save deterministic cycles/final evidence; cover unauthenticated registration and safe deterministic external-state handling; derive the checklist from real references.

**RISKS:** External services and overly permissive screenshot waits.

### TASK RESPONSIVE — Integrated Responsive Polish

**OWNER:** Responsive Integrator

**FILES / SCOPE:** Route-specific styles after route owners finish; shared CSS only through TASK DS coordination.

**DEPENDENCIES:** TASK DS, HOME, ABOUT, REG, AUX, and first screenshots.

**ACCEPTANCE:** Correct crop, stacking, navigation, panel width, type, and spacing at all required viewports; preserve one visual system; eliminate overflow, clipped controls, unreadable content, and sub-44px targets; do not change behavior.

**RISKS:** Cross-route regressions; implementation concurrency must stop before this pass.

## 4. Safe Parallelism

1. Land TASK DS first.
2. TASK VISINFRA may create isolated QA files in parallel.
3. After shared APIs stabilize, HOME, ABOUT, REG, and AUX may run in parallel with exclusive file ownership.
4. Never allow parallel edits to `globals.css`, header/footer/brand, or registration files.
5. Merge route work, capture Cycle 1, then run TASK RESPONSIVE as an integration pass.
6. Route screenshot discrepancies to the route owner; global typography/navigation issues return to TASK DS.
7. Freeze implementation before each independent evidence-only review.

## 5. Visual QA and Fix Loop

For every cycle: build and run; capture all routes/viewports; give an independent reviewer only the original references, current screenshots, and checklist; withhold prior scores; score layout 25, typography 15, colors/borders 15, assets 15, spacing 10, component fidelity 10, responsive quality 5, and polish 5; record prioritized concrete discrepancies and score history; reassign fixes; rebuild and repeat.

Scores from 88–92 require a second blind review and averaging. Differences above eight points require a third review or evidence-based reconciliation. Completion requires overall greater than 90 and every major page at least 85. Runtime errors cap a page at 85; severe layout breakage caps it at 70.

## 6. Separate Functional Review

A non-scoring Functional Regression Reviewer verifies routes, recovery paths, navigation, OAuth entry/safe callback, unauthenticated registration behavior, authenticated registration where fixtures permit, Minecraft validation, form semantics, async/error states, GET/POST contracts, sign-out, clipboard, browser errors/requests/images, keyboard focus, labels, live regions, and error roles. Serious regressions return to implementation and restart relevant checks.

## 7. Verification Gates

Run targeted behavior tests, then `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build`, Playwright at all viewports, functional review, and independent visual scoring. If stale `.next/dev` route types affect typecheck, regenerate framework artifacts normally and rerun; do not suppress errors.

## 8. Fresh Blind Final Review

After first meeting thresholds, produce a clean final build and new screenshots; assign a reviewer who did not score earlier cycles; withhold prior scores/history; repeat route scoring/browser checks and a functional smoke review. Resume fixes if overall falls to 90 or below, a major route is below 85, or any regression appears.

## 9. Stop Conditions

Complete only when every scoped surface uses the launch system; significant old design is gone; functional contracts are preserved; test/typecheck/lint/build pass; Playwright passes all viewports without serious errors, broken primary artwork, or overflow; functional review passes; visual thresholds pass; fresh blind verification passes; and final screenshots, score history, remaining differences, and verification evidence are recorded.
