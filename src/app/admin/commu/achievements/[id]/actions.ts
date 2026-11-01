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
  if (!UUID.test(value)) redirect("/admin/commu/achievements");
  return value;
}

function id(formData: FormData, field: string) {
  const value = String(formData.get(field));
  return UUID.test(value) ? value : null;
}

function finish(achievementId: string | null, error: { message: string } | null, done: string) {
  if (!achievementId) redirect("/admin/commu/achievements");
  const code = dbErrorCode(error) ?? (error ? "FAILED" : null);
  revalidatePath("/admin/commu/achievements");
  revalidatePath(`/admin/commu/achievements/${achievementId}`);
  redirect(`/admin/commu/achievements/${achievementId}${code ? `?error=${code}` : `?done=${done}`}`);
}

type Fields = { name: string; description: string; status: string; tier: string; discordRoleId: string };

function fields(formData: FormData): Fields {
  return {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    status: toStatus(String(formData.get("status") ?? "draft")),
    // The RPC checks both (INVALID, ROLE_NOT_ALLOWED); blank role clears it.
    tier: String(formData.get("tier") ?? "common"),
    discordRoleId: String(formData.get("discordRoleId") ?? "").trim()
  };
}

/** The part of a save that edit and create share. `error.message` is a page
 *  error code or a raw database error; `id` is the row the page should land on.
 *  With `compensate`, a refused tier or role removes the row it just made,
 *  because the create form stays open and a resubmit would otherwise add a
 *  second copy (D11). */
async function persist(achievementId: string | null, formData: FormData, compensate: boolean, codes = { name: "FAILED", description: "FAILED" }) {
  const { name, description, status, tier, discordRoleId } = fields(formData);
  const file = formData.get("image");
  // An untouched file input still posts an empty File; that means "keep the current image".
  const upload = file instanceof File && file.size > 0 ? file : null;
  const fail = (message: string, id: string | null = achievementId) => ({ error: { message }, id, created: false });

  const invalid = imageError(upload);
  if (invalid) return fail(invalid);
  // The database checks these too (20261006000001:51-52); trimming here stops
  // an obviously empty name from being sent at all.
  if (!name || name.length > 80) return fail(codes.name);
  if (description.length > 500) return fail(codes.description);

  const supabase = await createClient();
  // The image this row has now comes from the database, never the form: a
  // posted path could name any object in the bucket for the removal below.
  const { data: rows } = achievementId ? await supabase.rpc("admin_list_achievements") : { data: null };
  const previousImage = rows?.find((row) => row.id === achievementId)?.image_path ?? "";
  let key = previousImage;
  if (upload) {
    key = imageKey("achievements", upload.type);
    const { error } = await supabase.storage.from(BUCKET).upload(key, upload, { contentType: upload.type });
    if (error) return fail("UPLOAD_FAILED");
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
  // After the image cleanup, so a refused tier or role can't strand the old
  // image. Separate RPC so admin_upsert_achievement's signature stays put
  // (20261026000001).
  if (!error && data) {
    // The generated type does not mark the optional role as nullable.
    const { error: metaError } = await supabase.rpc("admin_set_achievement_meta", { p_id: data, p_tier: tier, p_discord_role_id: (discordRoleId || null)! });
    if (metaError && compensate) {
      await supabase.rpc("admin_delete_achievement", { p_id: data });
      if (upload) await supabase.storage.from(BUCKET).remove([key]);
    }
    if (metaError) return { error: metaError, id: achievementId ?? data, created: false };
  }
  if (error) return { error, id: achievementId, created: false };
  return { error: null, id: achievementId ?? data, created: !achievementId && !!data };
}

export async function saveAchievement(formData: FormData) {
  const achievementId = postedId(formData, "achievementId");
  const result = await persist(achievementId, formData, false);
  if (!result.error && result.created) {
    revalidatePath("/admin/commu/achievements");
    redirect(`/admin/commu/achievements/${result.id}?done=created`);
  }
  finish(result.id, result.error, "saved");
}

export type CreateAchievementState = { code: string | null; values: Fields };

/** The New page's action for `useActionState`. A failure returns its code and
 *  the typed text instead of redirecting, so the form stays where it is. */
export async function createAchievement(_prev: CreateAchievementState, formData: FormData): Promise<CreateAchievementState> {
  const result = await persist(null, formData, true, { name: "NAME_INVALID", description: "DESCRIPTION_TOO_LONG" });
  if (!result.error) {
    revalidatePath("/admin/commu/achievements");
    redirect(`/admin/commu/achievements/${result.id}?done=created`);
  }
  return { code: dbErrorCode(result.error) ?? "FAILED", values: fields(formData) };
}

export async function deleteAchievement(formData: FormData) {
  const achievementId = id(formData, "achievementId");
  if (!achievementId) redirect("/admin/commu/achievements");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_delete_achievement", { p_id: achievementId });
  const code = dbErrorCode(error) ?? (error ? "FAILED" : null);
  if (!error) {
    const path = data?.[0]?.image_path;
    if (path) await supabase.storage.from(BUCKET).remove([path]);
  }
  revalidatePath("/admin/commu/achievements");
  redirect(`/admin/commu/achievements${code ? `?error=${code}` : "?done=deleted"}`);
}

export async function revokeAward(formData: FormData) {
  const achievementId = id(formData, "achievementId");
  const awardId = id(formData, "awardId");
  if (!achievementId || !awardId) redirect("/admin/commu/achievements");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_revoke_award", { p_award_id: awardId });
  finish(achievementId, error, "revoked");
}