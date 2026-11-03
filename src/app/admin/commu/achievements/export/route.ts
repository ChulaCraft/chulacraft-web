import { csvStream, fetchAllRpc } from "@/lib/admin-export";
import type { Database } from "@/lib/supabase/database.types";
import { readExport, today } from "../../../export-request";

type Row = Database["public"]["Functions"]["admin_list_achievements"]["Returns"][number];

const HEADER = ["achievement_id", "name", "description", "status", "tier", "discord_role_id", "awards", "created", "updated"];

async function run(request: Request) {
  const req = await readExport(request);
  if (!req.ok) return req.response;
  const { supabase, ids } = req;
  async function* pages() {
    const wanted = ids && new Set(ids);
    for await (const page of fetchAllRpc(supabase, "admin_list_achievements", {})) {
      yield (page as Row[]).filter((a) => !wanted || wanted.has(a.id))
        .map((a) => [a.id, a.name, a.description, a.status, a.tier, a.discord_role_id, a.award_count, a.created_at, a.updated_at]);
    }
  }
  return csvStream(`chulacraft-achievements-${today()}.csv`, HEADER, pages(), "/admin/commu/achievements/export");
}

export const GET = run;
export const POST = run;
