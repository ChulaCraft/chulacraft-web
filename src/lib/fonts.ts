import { Atkinson_Hyperlegible, IBM_Plex_Mono, IBM_Plex_Sans_Thai, Pixelify_Sans } from "next/font/google";

export const bodyFont = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
  display: "swap"
});

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

/** Thai glyphs: Atkinson and Pixelify have none, so every font stack lists this
 *  next, and the browser uses it for Thai characters only. */
export const thaiFont = IBM_Plex_Sans_Thai({
  subsets: ["thai"],
  weight: ["400", "600", "700"],
  variable: "--font-thai",
  display: "swap"
});
