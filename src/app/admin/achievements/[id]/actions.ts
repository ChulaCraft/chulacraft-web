"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dbErrorCode } from "@/lib/db-error";
import { UUID } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import { BUCKET, imageError, imageKey, toStatus } from "../images";

// The RPCs enforce every role rule; these actions only forward the request and
// send the outcome back to the page as a known error code. Ids are checked here
// so a malformed form never reaches the database at all.
/** null means "the form posted no id", which is how the New page creates one; a
 *  posted value that is not a UUID is a malformed form and never gets here. */
function postedId(formData: FormData, field: string) {
  const raw = formData.get(field);
  if (raw === null) return null;
  const value = String(raw);
  if (!UUID.test(value)) redirect("/admin/achievements");
  return value;
}

function id(formData: FormData, field: string) {
  const value = String(formData.get(field));
  return UUID.test(value) ? value : null;
}

function finish(achievementId: string | null, error: { message: string } | null, done: string) {
  if (!achievementId) redirect("/admin/achievements");
  const code = dbErrorCode(error) ?? (error ? "FAILED" : null);
  revalidatePath("/admin/achievements");
  revalidatePath(`/admin/achievements/${achievementId}`);
  redirect(`/admin/achievements/${achievementId}${code ? `?error=${code}` : `?done=${done}`}`);
}

export async function saveAchievement(formData: FormData) {
  const achievementId = postedId(formData, "achievementId");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = toStatus(String(formData.get("status") ?? "draft"));
  const file = formData.get("image");
  // An untouched file input still posts an empty File; that means "keep the current image".
  const upload = file instanceof File && file.size > 0 ? file : null;

  const invalid = imageError(upload);
  if (invalid) finish(achievementId, { message: invalid }, "saved");
  // The database checks these too (20261006000001:51-52); trimming here stops
  // an obviously empty name from being sent at all.
  if (!name || name.length > 80 || description.length > 500) finish(achievementId, { message: "FAILED" }, "saved");

  const supabase = await createClient();
  // The image this row has now comes from the database, never the form: a
  // posted path could name any object in the bucket for the removal below.
  const { data: rows } = achievementId ? await supabase.rpc("admin_list_achievements") : { data: null };
  const previousImage = rows?.find((row) => row.id === achievementId)?.image_path ?? "";
  let key = previousImage;
  if (upload) {
    key = imageKey("achievements", upload.type);
    const { error } = await supabase.storage.from(BUCKET).upload(key, upload, { contentType: upload.type });
    if (error) finish(achievementId, { message: "UPLOAD_FAILED" }, "saved");
  }

  // The id this save asks for, which is the one admin_upsert_achievement echoes
  // back; comparing against it is what tells a failed save from a new row.
  const requestedId = achievementId ?? crypto.randomUUID();
  const { data, error } = await supabase.rpc("admin_upsert_achievement", {
    p_id: requestedId,
    p_name: name,
    p_description: description,
    p_image_path: key,
    p_status: status
  });

  // D5: an object the save didn't end up using is removed, and the one it
  // replaced goes once the new path is the live one.
  if (upload && (error || data !== requestedId)) await supabase.storage.from(BUCKET).remove([key]);
  if (!error && previousImage && previousImage !== key) await supabase.storage.from(BUCKET).remove([previousImage]);
  if (error) finish(achievementId, error, "saved");

  if (!achievementId && data) {
    revalidatePath("/admin/achievements");
    redirect(`/admin/achievements/${data}?done=created`);
  }
  finish(achievementId, null, "saved");
}

export async function deleteAchievement(formData: FormData) {
  const achievementId = id(formData, "achievementId");
  if (!achievementId) redirect("/admin/achievements");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_delete_achievement", { p_id: achievementId });
  const code = dbErrorCode(error) ?? (error ? "FAILED" : null);
  if (!error) {
    const path = data?.[0]?.image_path;
    if (path) await supabase.storage.from(BUCKET).remove([path]);
  }
  revalidatePath("/admin/achievements");
  redirect(`/admin/achievements${code ? `?error=${code}` : "?done=deleted"}`);
}

export async function revokeAward(formData: FormData) {
  const achievementId = id(formData, "achievementId");
  const awardId = id(formData, "awardId");
  if (!achievementId || !awardId) redirect("/admin/achievements");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_revoke_award", { p_award_id: awardId });
  finish(achievementId, error, "revoked");
}