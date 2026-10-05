"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dbErrorCode } from "@/lib/db-error";
import { UUID } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";

export async function decideAppeal(formData: FormData) {
  const appealId = String(formData.get("appealId"));
  if (!UUID.test(appealId)) redirect("/admin/appeals");
  const accept = formData.get("accept") === "true";
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_decide_appeal", {
    p_appeal_id: appealId,
    p_accept: accept,
    p_response: String(formData.get("response") ?? ""),
  });
  const code = dbErrorCode(error) ?? (error ? "FAILED" : null);
  revalidatePath("/admin/appeals");
  redirect(`/admin/appeals?${code ? `error=${code}` : `done=${accept ? "accepted" : "rejected"}`}`);
}
