import { IBM_Plex_Mono, Pixelify_Sans, Trirong } from "next/font/google";

/** One serif for Latin and Thai body text, so a mixed line keeps one voice
 *  instead of switching typefaces mid-sentence. Trirong is one of the few
 *  Google serifs drawn for both scripts.
 *
 *  Two calls, so only the faces the first screen needs are preloaded
 *  (docs/perf-baseline.md, Task 7). Preloading every face was 16 files racing
 *  the CSS and the hero image on a phone (home LCP 3.8 s); preloading none made
 *  the hero copy jump when Trirong swapped in (CLS 0.084 -> 0.135).
 *  - `bodyFont`: every weight and style in both scripts, not preloaded.
 *  - `bodyFontRegular`: Latin 400 and 600, preloaded (400 is body text, 600
 *    is the face whose late swap moved the hero copy).
 *  Both emit their faces under the family name "Trirong", so the browser uses
 *  the preloaded files for those faces and does not fetch them twice.
 *  globals.css also stacks the two variables into `--font-body`, so the
 *  preloaded faces still stand in if a build ever gives them distinct names. */
export const bodyFont = Trirong({
  subsets: ["latin", "thai"],
  preload: false,
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-body-all",
  display: "swap",
  // bodyFontRegular is the stand-in; an automatic fallback would come first.
  adjustFontFallback: false
});

export const bodyFontRegular = Trirong({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: "normal",
  variable: "--font-body-regular",
  display: "swap"
});

/** The Minecraft voice: brand, hero and page titles only. */
export const displayFont = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap"
});

export const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: "500",
  variable: "--font-mono",
  display: "swap"
});
