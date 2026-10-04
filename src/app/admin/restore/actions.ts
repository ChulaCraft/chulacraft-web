"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dbErrorCode } from "@/lib/db-error";
import { UUID } from "@/lib/registration";

export async function restoreAccount(formData: FormData) {
  // Check the id before the call so a malformed form never reaches the database.
  const registrationId = String(formData.get("registrationId"));
  if (!UUID.test(registrationId)) redirect("/admin");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_whitelisted", {
    p_registration_id: registrationId,
    p_value: true
  });
  const code = dbErrorCode(error) ?? (error ? "FAILED" : null);
  revalidatePath("/admin/restore");
  redirect(`/admin/restore${code ? `?error=${code}` : "?restored=1"}`);
}
