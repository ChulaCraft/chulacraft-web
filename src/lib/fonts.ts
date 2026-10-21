import { IBM_Plex_Mono, Pixelify_Sans, Trirong } from "next/font/google";

/** One serif for Latin and Thai body text, so a mixed line keeps one voice
 *  instead of switching typefaces mid-sentence. Trirong is one of the few
 *  Google serifs drawn for both scripts. */
export const bodyFont = Trirong({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-body",
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
