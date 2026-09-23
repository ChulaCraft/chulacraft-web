"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function restoreAccount(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_whitelisted", {
    p_registration_id: String(formData.get("registrationId")),
    p_value: true
  });
  const code = error?.message.match(/[A-Z_]{5,}/)?.[0] ?? (error ? "FAILED" : null);
  revalidatePath("/admin/restore");
  redirect(`/admin/restore${code ? `?error=${code}` : "?restored=1"}`);
}
