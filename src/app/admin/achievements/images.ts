/** The bucket created in supabase/migrations/20261006000001_achievements.sql:461. */
export const BUCKET = "achievements";

/** Mirrors the bucket's allowed_mime_types; the Storage API rejects anything
 *  else, but checking here saves the admin a failed save (AC 4). */
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;

/** Mirrors the bucket's file_size_limit. */
export const MAX_IMAGE_BYTES = 2097152;

const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif"
};

/** Public bucket, so images are read straight from the object URL. Kept next to
 *  the upload rules it depends on; the player-facing copy of this lives in
 *  src/components/achievement-grid.tsx. */
export function publicImageUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}

/** A fresh key per upload, so replacing an image never overwrites the old
 *  object while a reader still has it open. */
export function imageKey(prefix: string, type: string) {
  return `${prefix}/${crypto.randomUUID()}.${EXTENSIONS[type] ?? "bin"}`;
}

/** "NO_IMAGE" when the file is fine or absent; the code names an error the page
 *  turns into copy. An absent file means "keep the current image". */
export function imageError(file: File | null): string | null {
  if (!file || file.size === 0) return null;
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return "BAD_IMAGE_TYPE";
  if (file.size > MAX_IMAGE_BYTES) return "IMAGE_TOO_LARGE";
  return null;
}

/** status is a text column with a check constraint, so narrow it here the same
 *  way the rest of the admin does for verification_kind. */
export function toStatus(value: string) {
  return value === "published" ? "published" : "draft";
}