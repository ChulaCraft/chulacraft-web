import { csvStream } from "@/lib/admin-export";
import { paramsOf } from "@/lib/table-query";
import { readExport, today } from "../../export-request";
import { readPlayers, rpcArgs, type PlayerRow } from "../params";

const HEADER = ["user_id", "name", "discord", "role", "status", "banned", "whitelist", "email", "chula_email", "minecraft", "joined"];
const PAGE = 1000;

async function run(request: Request) {
  const req = await readExport(request);
  if (!req.ok) return req.response;
  const { supabase, ids } = req;
  const args = rpcArgs(readPlayers(paramsOf(req.params)));
  const wanted = ids && new Set(ids);
  // Paged by offset, advancing by what came back: PostgREST max_rows may cut a page
  // below PAGE, and only an empty page means the end. Ticked rows stop it early.
  async function* pages() {
    let found = 0;
    for (let offset = 0; !wanted || found < wanted.size; ) {
      const { data, error } = await supabase.rpc("admin_list_players", { ...args, p_offset: offset, p_limit: PAGE });
      if (error) throw new Error(error.message);
      const rows: PlayerRow[] = data ?? [];
      if (rows.length === 0) return;
      offset += rows.length;
      const keep = wanted ? rows.filter((r) => wanted.has(r.user_id)) : rows;
      found += keep.length;
      yield keep.map((r) => [r.user_id, r.display_name, r.handle, r.role, r.verification_kind, r.banned, r.whitelist, r.email, r.chula_email, r.minecraft_usernames, r.created_at]);
    }
  }
  return csvStream(`chulacraft-players-${today()}.csv`, HEADER, pages(), "/admin/players/export");
}

export const GET = run;
export const POST = run;
