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

export async function markGuest(formData: FormData) {
  const userId = id(formData, "userId");
  if (!userId) redirect("/admin");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_mark_guest", { p_user_id: userId });
  finish(userId, error, "guest");
}
