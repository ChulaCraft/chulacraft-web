import { csvStream, fetchAllRpc } from "@/lib/admin-export";
import type { Database } from "@/lib/supabase/database.types";
import { readExport, today } from "../../export-request";

type Row = Database["public"]["Functions"]["admin_export_appeals"]["Returns"][number];

const HEADER = ["appeal_id", "created", "status", "message", "admin_response", "decided_at", "decided_by", "ban_id", "user_id", "user", "ban_reason", "public_note", "banned_at", "expires_at", "banned_by"];

async function run(request: Request) {
  const req = await readExport(request);
  if (!req.ok) return req.response;
  const { supabase, ids } = req;
  const raw = req.params.get("status");
  const status = raw === "accepted" || raw === "rejected" ? raw : "open";
  async function* pages() {
    for await (const page of fetchAllRpc(supabase, "admin_export_appeals", { p_status: status, p_ids: ids })) {
      yield (page as Row[]).map((a) => [a.id, a.created_at, a.status, a.message, a.admin_response, a.decided_at, a.decided_by_name, a.ban_id, a.user_id, a.user_name, a.reason, a.public_note, a.banned_at, a.expires_at, a.banned_by_name]);
    }
  }
  return csvStream(`chulacraft-appeals-${status}-${today()}.csv`, HEADER, pages(), "/admin/appeals/export");
}

export const GET = run;
export const POST = run;
