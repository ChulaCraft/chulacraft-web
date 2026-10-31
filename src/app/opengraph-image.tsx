import { OG_SIZE, OG_TYPE, siteImage } from "@/lib/og-image";

// The shared image for every page without its own (src/lib/og-image.tsx).
export const alt = "ChulaCraft, the Minecraft Java server for the Chula community";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return siteImage();
}
