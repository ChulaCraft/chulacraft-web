import { csvStream } from "@/lib/admin-export";
import { readExport, today } from "../../../export-request";

const HEADER = ["achievement_id", "name", "description", "status", "tier", "discord_role_id", "awards", "created", "updated"];

async function run(request: Request) {
  const req = await readExport(request);
  if (!req.ok) return req.response;
  const { supabase, ids } = req;
  async function* pages() {
    const { data, error } = await supabase.rpc("admin_list_achievements");
    if (error) throw new Error(error.message);
    const wanted = ids && new Set(ids);
    yield (data ?? []).filter((a) => !wanted || wanted.has(a.id))
      .map((a) => [a.id, a.name, a.description, a.status, a.tier, a.discord_role_id, a.award_count, a.created_at, a.updated_at]);
  }
  return csvStream(`chulacraft-achievements-${today()}.csv`, HEADER, pages(), "/admin/commu/achievements/export");
}

export const GET = run;
export const POST = run;
