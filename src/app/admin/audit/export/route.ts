import { csvStream } from "@/lib/admin-export";
import { UUID } from "@/lib/registration";
import type { Database } from "@/lib/supabase/database.types";
import { readExport, today } from "../../export-request";
import { bangkokDay, ENTITIES } from "../filters";

type Row = Database["public"]["Functions"]["admin_export_audit"]["Returns"][number];

const HEADER = ["log_id", "time", "actor_id", "actor", "target_user_id", "target", "entity", "entity_id", "field", "old_value", "new_value"];
const PAGE = 1000;

async function run(request: Request) {
  const req = await readExport(request);
  if (!req.ok) return req.response;
  const { supabase, params, ids } = req;
  const actor = params.get("actor");
  const target = params.get("target");
  const entity = params.get("entity");
  const filters = {
    p_actor: actor && UUID.test(actor) ? actor : undefined,
    p_target: target && UUID.test(target) ? target : undefined,
    p_entity: entity && entity in ENTITIES ? entity : undefined,
    p_from: bangkokDay(params.get("from") ?? undefined) ?? undefined,
    p_to: bangkokDay(params.get("to") ?? undefined, 1) ?? undefined,
    p_ids: ids,
    p_limit: PAGE,
  };
  // Keyset paging: a new row landing mid-export can't shift the pages, and the last page is an empty one.
  async function* pages() {
    let before: { p_before_at: string; p_before_id: string } | undefined;
    for (;;) {
      const { data, error } = await supabase.rpc("admin_export_audit", { ...filters, ...before });
      if (error) throw new Error(error.message);
      const rows: Row[] = data ?? [];
      if (rows.length === 0) return;
      yield rows.map((r) => [r.id, r.created_at, r.actor_user_id, r.actor_name, r.target_user_id, r.target_name, r.entity, r.entity_id, r.field, r.old_value, r.new_value]);
      const last = rows[rows.length - 1];
      before = { p_before_at: last.created_at, p_before_id: last.id };
    }
  }
  return csvStream(`chulacraft-audit-${today()}.csv`, HEADER, pages(), "/admin/audit/export");
}

export const GET = run;
export const POST = run;
