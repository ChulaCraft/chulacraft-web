"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { instant } from "@/lib/bangkok-time";
import { dbErrorCode } from "@/lib/db-error";
import { UUID } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import { BUCKET, uploadPicture } from "@/app/admin/commu/achievements/images";

const BASE = "/admin/commu/announcements";
const SEVERITIES = ["info", "warning", "maintenance"];

/** null means the New page is creating one; a posted value that is not a UUID
 *  is a malformed form and never reaches the database. */
function postedId(formData: FormData) {
  const raw = formData.get("announcementId");
  if (raw === null) return null;
  const value = String(raw);
  if (!UUID.test(value)) redirect(BASE);
  return value;
}

/** The banner sits in the root layout, so every page shows the change. */
function refresh() {
  revalidatePath("/", "layout");
}

export async function saveAnnouncement(formData: FormData) {
  const id = postedId(formData);
  const fail = (code: string): never => redirect(`${BASE}/${id ?? "new"}?error=${code}`);

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const severity = String(formData.get("severity") ?? "info");
  // Published with no time means "now"; the edit form posts the stored time
  // back, so re-saving does not move an announcement to the top of the list.
  const publishedAt = formData.get("status") === "published"
    ? instant(formData, "publishAt") ?? new Date().toISOString()
    : null;
  const expiresAt = instant(formData, "expiresAt");

  if (!title || title.length > 120 || !body || body.length > 2000 || !SEVERITIES.includes(severity)) fail("FAILED");
  // Same rule as the column check (20261009000001).
  if (publishedAt && expiresAt && expiresAt <= publishedAt) fail("BAD_DATE");

  const supabase = await createClient();
  const picture = await uploadPicture(supabase.storage, formData, "image", "announcements");
  if (picture.error) fail(picture.error);
  const { data, error } = await supabase.rpc("admin_upsert_announcement", {
    p_id: id ?? crypto.randomUUID(),
    p_title: title,
    p_body: body,
    p_severity: severity,
    p_pinned: formData.get("pinned") === "on",
    // The generated types do not mark the optional timestamps as nullable.
    p_published_at: publishedAt!,
    p_expires_at: expiresAt!,
    p_post_to_discord: formData.get("postToDiscord") === "on"
  });
  if (error || !data) {
    if (picture.key) await supabase.storage.from(BUCKET).remove([picture.key]);
    fail(dbErrorCode(error) ?? "FAILED");
  }

  // The database cannot touch Storage, so the replaced picture comes back here to remove.
  if (picture.key || formData.get("removeImage") === "on") {
    // The generated type does not mark p_path as nullable; null removes the picture.
    const { data: old, error: imageError } = await supabase.rpc("admin_set_announcement_image", { p_id: data!, p_path: picture.key as string });
    const stale = imageError ? picture.key : old;
    if (stale) await supabase.storage.from(BUCKET).remove([stale]);
    // The announcement itself saved, so land on its page either way.
    if (imageError) redirect(`${BASE}/${data}?error=${dbErrorCode(imageError) ?? "UPLOAD_FAILED"}`);
  }

  refresh();
  redirect(`${BASE}/${data}?done=${id ? "saved" : "created"}`);
}

export async function deleteAnnouncement(formData: FormData) {
  const id = postedId(formData);
  if (!id) redirect(BASE);
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_announcement", { p_id: id });
  const code = dbErrorCode(error) ?? (error ? "FAILED" : null);
  refresh();
  redirect(`${BASE}${code ? `?error=${code}` : "?done=deleted"}`);
}
