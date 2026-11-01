import { csvStream, fetchAllRpc } from "@/lib/admin-export";
import type { Database } from "@/lib/supabase/database.types";
import { readExport, today } from "../../export-request";

type Row = Database["public"]["Functions"]["admin_export_reports"]["Returns"][number];

const HEADER = ["report_id", "created", "category", "status", "details", "evidence_url", "admin_note", "handled_at", "handled_by", "reporter_id", "reporter", "target_user_id", "target", "target_banned", "target_open_reports"];

async function run(request: Request) {
  const req = await readExport(request);
  if (!req.ok) return req.response;
  const { supabase, ids } = req;
  const raw = req.params.get("status");
  const status = raw === "actioned" || raw === "dismissed" ? raw : "open";
  async function* pages() {
    for await (const page of fetchAllRpc(supabase, "admin_export_reports", { p_status: status, p_ids: ids })) {
      yield (page as Row[]).map((r) => [r.id, r.created_at, r.category, r.status, r.details, r.evidence_url, r.admin_note, r.handled_at, r.handled_by_name, r.reporter_id, r.reporter_name, r.target_user_id, r.target_name, r.target_banned, r.target_open_reports]);
    }
  }
  return csvStream(`chulacraft-reports-${status}-${today()}.csv`, HEADER, pages(), "/admin/reports/export");
}

export const GET = run;
export const POST = run;
