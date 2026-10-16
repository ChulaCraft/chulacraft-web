import { toCsv } from "@/lib/csv";
import { dbErrorCode } from "@/lib/db-error";
import { createClient } from "@/lib/supabase/server";
import { paramsOf } from "@/lib/table-query";
import { readPlayers, rpcArgs } from "../params";

const PAGE = 1000;

export async function GET(request: Request) {
  const state = readPlayers(paramsOf(new URL(request.url).searchParams));
  const args = rpcArgs(state);
  const supabase = await createClient();
  // Signed out, the RPC fails on its anon grant rather than with FORBIDDEN.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Forbidden", { status: 403 });
  const rows: (string | boolean | null)[][] = [["user_id", "name", "discord", "role", "status", "banned", "whitelist", "email", "chula_email", "minecraft", "joined"]];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase.rpc("admin_list_players", { ...args, p_offset: offset, p_limit: PAGE });
    if (error) {
      const forbidden = dbErrorCode(error) === "FORBIDDEN";
      return new Response(forbidden ? "Forbidden" : "Export failed", { status: forbidden ? 403 : 500 });
    }
    for (const r of data) rows.push([r.user_id, r.display_name, r.handle, r.role, r.verification_kind, r.banned, r.whitelist, r.email, r.chula_email, r.minecraft_usernames, r.created_at]);
    if (data.length < PAGE) break;
  }
  const day = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="chulacraft-players-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
