"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dbErrorCode } from "@/lib/db-error";
import { UUID } from "@/lib/registration";

// The RPCs enforce every role rule; these actions only forward the request and
// send the outcome back to the page as a known error code. Ids are checked here
// so a malformed form never reaches the database at all.
function id(formData: FormData, field: string) {
  const value = String(formData.get(field));
  return UUID.test(value) ? value : null;
}

function finish(userId: string | null, error: { message: string } | null, done: string) {
  if (!userId) redirect("/admin");
  const code = dbErrorCode(error) ?? (error ? "FAILED" : null);
  revalidatePath(`/admin/users/${userId}`);
  redirect(`/admin/users/${userId}?${code ? `error=${code}` : `done=${done}`}`);
}

export async function setWhitelisted(formData: FormData) {
  const userId = id(formData, "userId");
  const registrationId = id(formData, "registrationId");
  if (!userId || !registrationId) redirect("/admin");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_whitelisted", {
    p_registration_id: registrationId,
    p_value: formData.get("value") === "true"
  });
  finish(userId, error, formData.get("value") === "true" ? "restored" : "removed");
}

export async function setRole(formData: FormData) {
  const userId = id(formData, "userId");
  if (!userId) redirect("/admin");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_role", { p_user_id: userId, p_role: String(formData.get("role")) });
  finish(userId, error, "role");
}

export async function resetChula(formData: FormData) {
  const userId = id(formData, "userId");
  if (!userId) redirect("/admin");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_reset_chula", { p_user_id: userId });
  finish(userId, error, "reset");
}

/** Days per duration option on the ban form; null is permanent. Not exported:
 *  a "use server" file may only export async functions. */
const BAN_DURATIONS: Record<string, number | null> = { "1d": 1, "7d": 7, "30d": 30, permanent: null };

export async function banUser(formData: FormData) {
  const userId = id(formData, "userId");
  if (!userId) redirect("/admin");
  const days = BAN_DURATIONS[String(formData.get("duration"))];
  if (days === undefined) finish(userId, { message: "INVALID" }, "");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_ban_user", {
    p_user_id: userId,
    p_reason: String(formData.get("reason") ?? ""),
    p_public_note: String(formData.get("publicNote") ?? ""),
    p_expires_at: days ? new Date(Date.now() + days * 86_400_000).toISOString() : undefined,
  });
  finish(userId, error, "banned");
}

export async function liftBan(formData: FormData) {
  const userId = id(formData, "userId");
  const banId = id(formData, "banId");
  if (!userId || !banId) redirect("/admin");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_lift_ban", { p_ban_id: banId });
  finish(userId, error, "lifted");
}

export async function markGuest(formData: FormData) {
  const userId = id(formData, "userId");
  if (!userId) redirect("/admin");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_mark_guest", { p_user_id: userId });
  finish(userId, error, "guest");
}
