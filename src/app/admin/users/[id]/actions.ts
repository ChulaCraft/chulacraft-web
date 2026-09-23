"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// The RPCs enforce every role rule; these actions only forward the request and
// send the outcome back to the page as a known error code.
function finish(userId: string, error: { message: string } | null) {
  const code = error?.message.match(/[A-Z_]{5,}/)?.[0] ?? (error ? "FAILED" : null);
  revalidatePath(`/admin/users/${userId}`);
  redirect(`/admin/users/${userId}${code ? `?error=${code}` : ""}`);
}

export async function setWhitelisted(formData: FormData) {
  const userId = String(formData.get("userId"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_whitelisted", {
    p_registration_id: String(formData.get("registrationId")),
    p_value: formData.get("value") === "true"
  });
  finish(userId, error);
}

export async function setRole(formData: FormData) {
  const userId = String(formData.get("userId"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_role", { p_user_id: userId, p_role: String(formData.get("role")) });
  finish(userId, error);
}
