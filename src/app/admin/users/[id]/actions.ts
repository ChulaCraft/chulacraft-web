"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// The RPCs enforce every role rule; these actions only forward the request and
// send the outcome back to the page as a known error code.
function finish(userId: string, error: { message: string } | null, done: string) {
  if (!/^[0-9a-f-]{36}$/i.test(userId)) redirect("/admin");
  const code = error?.message.match(/[A-Z_]{5,}/)?.[0] ?? (error ? "FAILED" : null);
  revalidatePath(`/admin/users/${userId}`);
  redirect(`/admin/users/${userId}?${code ? `error=${code}` : `done=${done}`}`);
}

export async function setWhitelisted(formData: FormData) {
  const userId = String(formData.get("userId"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_whitelisted", {
    p_registration_id: String(formData.get("registrationId")),
    p_value: formData.get("value") === "true"
  });
  finish(userId, error, formData.get("value") === "true" ? "restored" : "removed");
}

export async function setRole(formData: FormData) {
  const userId = String(formData.get("userId"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_role", { p_user_id: userId, p_role: String(formData.get("role")) });
  finish(userId, error, "role");
}

export async function resetChula(formData: FormData) {
  const userId = String(formData.get("userId"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_reset_chula", { p_user_id: userId });
  finish(userId, error, "reset");
}

export async function markGuest(formData: FormData) {
  const userId = String(formData.get("userId"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_mark_guest", { p_user_id: userId });
  finish(userId, error, "guest");
}
