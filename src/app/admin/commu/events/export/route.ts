import { csvStream } from "@/lib/admin-export";
import { readExport, today } from "../../../export-request";

const HEADER = ["event_id", "name", "description", "category", "location", "status", "starts_at", "ends_at", "awards", "created", "updated"];

async function run(request: Request) {
  const req = await readExport(request);
  if (!req.ok) return req.response;
  const { supabase, ids } = req;
  async function* pages() {
    const { data, error } = await supabase.rpc("admin_list_events");
    if (error) throw new Error(error.message);
    const wanted = ids && new Set(ids);
    yield (data ?? []).filter((e) => !wanted || wanted.has(e.id))
      .map((e) => [e.id, e.name, e.description, e.category, e.location, e.status, e.starts_at, e.ends_at, e.award_count, e.created_at, e.updated_at]);
  }
  return csvStream(`chulacraft-events-${today()}.csv`, HEADER, pages(), "/admin/commu/events/export");
}

export const GET = run;
export const POST = run;
