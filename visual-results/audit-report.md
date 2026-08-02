# ChulaCraft Visual Redesign Audit Report

Authority: `IMPLEMENTPLAN/webforregister/PRD.md` only. No other project document was used to add or reinterpret requirements.

Auditors:

- Agent A — Design Asset Auditor (`DesignAsset/`, read-only)
- Agent B — Existing Web Auditor (`web/`, read-only)
- Agent C — Independent Design-System Reviewer (`DesignAsset/`, read-only)

## 1. Design asset inventory

| Asset | Dimensions | Intended use |
| --- | ---: | --- |
| `LaunchDesign/FullPageDesign.png` | 1536×1024 | Highest-authority desktop page composition reference: Home, About, Features, Gallery, Rules, FAQ, Register, Login, plus component strip |
| `LaunchDesign/componentDesign.png` | 1536×1024 | Shared color, type, button, form, card, alert, badge, navigation, and loading component reference |
| `LaunchDesign/loadingAnimation.png` | 1448×1086 | Eight-frame pixel loading and progress treatment reference |
| `LaunchDesign/BackgroundAsset/landingpageBG.png` | 1672×941 | Home hero background with Chula-style building, students, and dog |
| `LaunchDesign/BackgroundAsset/AboutUsBG.png` | 1536×1024 | About background with architecture and central content-safe sky |
| `LaunchDesign/BackgroundAsset/Background1.png` | 1448×1086 | Shared immersive cherry-blossom city/auth background |
| `LaunchDesign/Background1.png` | 1448×1086 | Byte-identical duplicate of the preceding background |
| `LaunchDesign/logo/LogoAlt.png` | 1536×1024 RGBA | Horizontal launch brand lockup; canvas has substantial transparent padding |
| `LaunchDesign/logo/Logo.png` | 1024×1536 RGBA | Compact pink crystal/spire emblem; canvas has substantial transparent padding |
| `LaunchDesign/logo/Banner.png` | 2111×745 | Self-contained promotional banner, secondary to the composed Home reference |
| `LaunchDesign/minecraftia.zip` | font archive | Minecraftia Regular display font and specimen |
| `betaVer/ChulaCraftLogo.png` | 1024×1024 RGBA | Historical concept evidence; superseded by the LaunchDesign identity |

All eleven PNGs were opened and reviewed. The two `Background1.png` copies were hash-checked as identical, and the font archive was inspected.

## 2. Existing website inventory

### Routes and behavior

| Surface | Current implementation | Functional contract |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Landing content, Discord sign-in, Discord community link, server-address copy action |
| `/about` | `src/app/about/page.tsx` | About/story/values content and existing CTA behavior |
| `/register` | `src/app/register/page.tsx` | Requires authenticated Supabase user; reads registration state and renders the Minecraft registration flow |
| `/auth/callback` | `src/app/auth/callback/route.ts` | Exchanges Discord OAuth code and redirects only to fixed safe destinations |
| `/auth/error` | `src/app/auth/error/page.tsx` | Safe mapped authentication-error presentation |
| `/api/registration` | `src/app/api/registration/route.ts` | Authenticated GET/POST registration API, rate limiting, Minecraft lookup, and Supabase RPCs |
| not found | `src/app/not-found.tsx` | User-facing missing-route state |

There are no current `/rules`, `/faq`, `/features`, `/gallery`, or password-based login routes. Those panels in the visual montage do not create new functional requirements.

### Shared application structure

- `src/app/layout.tsx` provides root metadata and loads `globals.css`.
- `src/components/site-header.tsx`, `site-footer.tsx`, `brand.tsx`, `auth-button.tsx`, `server-address-card.tsx`, `registration-panel.tsx`, and `sign-out-button.tsx` are the primary shared and interactive surfaces.
- Styling is centralized in `src/app/globals.css`; it currently uses a green/teal visual system and responsive breakpoints at 900px and 600px.
- Supabase SSR clients and session refresh live in `src/lib/supabase/**` and `src/proxy.ts`.
- Registration behavior and validation live in `src/lib/registration.ts` and `src/components/registration-panel.tsx`.
- Existing checks are `npm run test`, `npm run lint`, `npm run typecheck`, and `npm run build`.
- No Playwright configuration or visual test exists yet.

## 3. Route-to-reference mapping

| Existing surface | Visual reference | Decision |
| --- | --- | --- |
| `/` | Home panel in `FullPageDesign.png`; `landingpageBG.png`; shared component sheet | Recompose the existing landing content with the launch Home visual system and preserve all current CTA/server behavior |
| `/about` | About panel; `AboutUsBG.png`; shared component sheet | Use the About composition and artwork while preserving the current route and content purpose |
| `/register` | Register panel; generic `Background1.png`; form controls in component sheet | Apply the narrow scenic auth-card language to the existing Discord/Minecraft registration workflow; do not replace it with mock email/password registration |
| `/auth/error` | Register/Login palette and panels; alert component | Restyle the existing safe error messages without changing reason mapping |
| not found | Shared page title, panel, outline/primary buttons | Adapt the same launch system; no dedicated mockup exists |
| OAuth callback and registration API | No visual surface | Preserve implementation; no visual rewrite |

Mockup-only Features, Gallery, Rules, FAQ, and Login pages supply reusable visual patterns but are not new routes because `web/` is the functional source of truth.

## 4. Design-system interpretation

### Identity

- Chula-specific Minecraft fantasy: pink pixel spire/crystal mark, Thai/Chula architecture, uniformed community characters, blossoms, and campus-scale environments.
- Warm community/creativity/safety tone rather than combat-heavy gamer styling.
- Full-bleed scenic art under restrained, readable deep-plum panels.
- Pixel treatment is structural: display type, icons, clipped corners, one-pixel borders, loaders, and ornaments. Body text remains conventionally readable.

### Explicit tokens

| Role | Value |
| --- | --- |
| Primary pink | `#FF6FAE` |
| Pale pink | `#FFD6E7` |
| Lavender | `#C3A6FF` |
| Muted purple | `#8B6AAE` |
| Surface plum | `#3B2F4A` |
| Deep background | `#201A2B` |
| Main text | `#FFFFFF` |
| Loading-only pale variant | `#FFC0E7` |

Typography: Minecraftia for brand/display, Rajdhani Bold/Semibold for headings, and Inter for body text. Only Minecraftia is bundled, so the implementation must package that asset and obtain Rajdhani/Inter through the current font-loading approach or robust fallbacks without changing the identity.

### Reusable primitives

- Horizontal brand lockup and compact emblem
- Header/navigation with pink active state and a pixel-styled responsive menu
- Filled pink, Discord/dark, outline, and text-link buttons with full interaction states
- Ornamental page/section title, pixel panel, notched card, stat tile, alert, and divider
- Styled input, checkbox, status badge, accordion/list-row vocabulary
- Pixel loader/progress treatment for existing async operations

### Geometry and motion

- Thin pink/plum borders, restrained colored glow, stepped/clipped corners, minimal conventional rounding
- Rectilinear spacing, compact controls, generous panel padding, and reserved art areas
- Frame/step-oriented motion with reduced-motion support; no blur-heavy glassmorphism or floating-gradient effects
- Deliberately low-resolution sprites use pixelated rendering and integer-friendly scaling; scenic backgrounds use normal high-quality scaling

## 5. Functional constraints

The visual implementation must not break:

- Discord OAuth initiation, callback exchange, session cookies, or fixed safe redirect behavior
- Unauthenticated `/register` redirect
- Supabase RLS/RPC contracts, schema fields, error handling, and environment validation
- Minecraft username validation, external profile lookup, UUID conversion, conflict/rate-limit mapping, polling, and registration status messages
- Sign-out behavior, Discord links, server-address clipboard action, avatar host configuration, and security headers
- Existing accessible labels, focus behavior, live regions, error roles, semantic form behavior, and responsive navigation

Backend/API and database code are outside the redesign unless a regression test proves a frontend integration repair is necessary.

## 6. Risks

- `globals.css` is a high-blast-radius shared file.
- Logo files have very large transparent canvases; direct intrinsic sizing produces a visibly undersized mark.
- Mobile references do not exist, so artwork crops and navigation must be adapted without changing the visual language.
- Several icons/illustrations exist only inside reference boards and should not be crudely substituted with unrelated emoji or generic stock icons.
- Auth/Supabase-dependent browser QA may not have usable credentials; deterministic unauthenticated and mocked/network-observation paths must still cover the visible surface and browser errors.
- Initial standalone typecheck reads stale `.next/dev` route types for removed `/faq` and `/rules` routes; generated artifacts must be refreshed before final evidence.
- The current green/teal style is pervasive; completion requires removing significant remnants from every user-facing surface, not only Home.

## 7. Uncertainties

- No mobile layout, footer, not-found, auth-error, or authenticated Minecraft-status mockup exists.
- The exact use of `Banner.png` is unspecified.
- Rajdhani and Inter font binaries are not supplied.
- Gallery imagery, team avatars, FAQ dog, and several icons are embedded only in the composite boards.
- Exact montage measurements are not reliable CSS dimensions because the panels are scaled previews.

These gaps are resolved by preserving existing behavior and adapting the nearest demonstrated shared component pattern, not by inventing new product functionality.

## 8. Agent disagreements and challenges

The two independent visual auditors materially agreed on the palette, launch identity, typography roles, pixel geometry, responsive evidence gap, asset authority, and the secondary status of the beta logo.

Potential challenges were explicitly tested:

- `Banner.png` is not the canonical Home composition; the Home panel plus `landingpageBG.png` takes precedence.
- The beta logo is conceptual history, not launch chrome.
- Dark panels are readability overlays with pixel borders, not generic glassmorphism.
- Minecraftia is not a body font; the component sheet assigns Rajdhani and Inter to readable UI text.
- The loading sheet's `#FFC0E7` does not replace the component sheet's global `#FFD6E7` token.
- Mobile layouts cannot be copied literally; only same-system adaptation is evidence-based.

## 9. Resolved decisions

1. Redesign the existing user-facing route set; do not add mockup-only routes.
2. Use `FullPageDesign.png` for page composition, `componentDesign.png` for shared UI, isolated backgrounds/logos for production imagery, and `loadingAnimation.png` only for loading behavior.
3. Use the LaunchDesign horizontal lockup/emblem and exclude the beta logo from normal site chrome.
4. Preserve all registration/auth/backend contracts and fit them into the reference form language.
5. Create reusable tokens and primitives before page-specific implementation.
6. Use art-directed crops at each required viewport and preserve at least 44px interactive targets.
7. Build Playwright screenshot QA for 375×812, 430×932, 768×1024, and 1440×900 with browser-error, broken-image, and overflow detection.
8. Require independent visual scoring and separate functional regression review after implementation; neither implementers nor the leader will self-approve.
