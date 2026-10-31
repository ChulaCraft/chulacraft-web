// Banner styles and their file rules. Pictures and GIFs share one exact size,
// so every header crops the same way (profile-banner.module.css shows 5:1).
export const BANNER_WIDTH = 1500;
export const BANNER_HEIGHT = 300;

export const BANNER_STYLES = [
  { value: "color", label: "Colours", types: [] as string[] },
  { value: "picture", label: "Picture", types: ["image/png", "image/jpeg", "image/webp"] },
  { value: "animated", label: "Animated GIF", types: ["image/gif"] }
] as const;

export type BannerStyle = (typeof BANNER_STYLES)[number]["value"];

export const toBannerStyle = (value: unknown): BannerStyle | null =>
  BANNER_STYLES.find((s) => s.value === value)?.value ?? null;

/** null when the file suits the style; otherwise the error code the page explains.
 *  `pages` is the frame count (sharp metadata; the browser check passes none). */
export function bannerFileError(style: BannerStyle, meta: { format?: string; width?: number; height?: number; pages?: number }): string | null {
  if (style === "picture" && !["png", "jpeg", "webp"].includes(meta.format ?? "")) return "BAD_IMAGE_TYPE";
  if (style === "picture" && (meta.pages ?? 1) > 1) return "ANIMATED";
  if (style === "animated" && meta.format !== "gif") return "NOT_GIF";
  if (meta.width !== BANNER_WIDTH || meta.height !== BANNER_HEIGHT) return "BAD_SIZE";
  return null;
}
