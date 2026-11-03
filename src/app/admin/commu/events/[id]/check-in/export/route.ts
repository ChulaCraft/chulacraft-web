import { csvStream, fetchAllRpc } from "@/lib/admin-export";
import { UUID } from "@/lib/registration";
import type { Database } from "@/lib/supabase/database.types";
import { readExport, today } from "../../../../../export-request";

type Row = Database["public"]["Functions"]["admin_list_attendance"]["Returns"][number];

const HEADER = ["user_id", "player", "method", "recorded_by", "checked_in"];

async function run(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });
  const req = await readExport(request);
  if (!req.ok) return req.response;
  const { supabase } = req;
  const wanted = req.ids && new Set(req.ids);
  async function* pages() {
    for await (const page of fetchAllRpc(supabase, "admin_list_attendance", { p_event_id: id })) {
      yield (page as Row[]).filter((a) => !wanted || wanted.has(a.user_id))
        .map((a) => [a.user_id, a.display_name, a.method, a.recorded_by_name, a.created_at]);
    }
  }
  return csvStream(`chulacraft-attendance-${today()}.csv`, HEADER, pages(), "/admin/commu/events/[id]/check-in/export");
}

export const GET = run;
export const POST = run;
