import { csvStream, fetchAllRpc } from "@/lib/admin-export";
import { UUID } from "@/lib/registration";
import type { Database } from "@/lib/supabase/database.types";
import { readExport, today } from "../../../../export-request";

type Row = Database["public"]["Functions"]["admin_list_awards"]["Returns"][number];

const HEADER = ["award_id", "user_id", "player", "awarded_on", "event_id", "event", "awarded_by", "created"];

async function run(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });
  const req = await readExport(request);
  if (!req.ok) return req.response;
  const { supabase } = req;
  const wanted = req.ids && new Set(req.ids);
  async function* pages() {
    for await (const page of fetchAllRpc(supabase, "admin_list_awards", { p_achievement_id: id })) {
      yield (page as Row[]).filter((a) => !wanted || wanted.has(a.id))
        .map((a) => [a.id, a.user_id, a.display_name, a.awarded_on, a.event_id, a.event_name, a.awarded_by, a.created_at]);
    }
  }
  return csvStream(`chulacraft-achievement-recipients-${today()}.csv`, HEADER, pages(), "/admin/commu/achievements/[id]/export");
}

export const GET = run;
export const POST = run;
