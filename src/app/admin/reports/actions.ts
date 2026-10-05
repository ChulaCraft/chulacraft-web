"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dbErrorCode } from "@/lib/db-error";
import { UUID } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";

export async function handleReport(formData: FormData) {
  const reportId = String(formData.get("reportId"));
  if (!UUID.test(reportId)) redirect("/admin/reports");
  const status = String(formData.get("status"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_handle_report", {
    p_report_id: reportId,
    p_status: status,
    p_note: String(formData.get("note") ?? ""),
  });
  const code = dbErrorCode(error) ?? (error ? "FAILED" : null);
  revalidatePath("/admin/reports");
  redirect(`/admin/reports?${code ? `error=${code}` : `done=${status}`}`);
}
