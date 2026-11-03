import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { fetchAllRpc } from "@/lib/admin-export";

// Needs: supabase start, dev-seed.sql, seed-export-paging.sql, and
// SUPABASE_PUBLISHABLE_KEY (from `supabase status`). Skipped otherwise.
const url = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
const ACHIEVEMENT = "00000000-0000-4000-8000-0000000fa001";
const EVENT = "00000000-0000-4000-8000-0000000fa002";

async function adminClient() {
  const supabase = createClient(url, key!, { auth: { persistSession: false } });
  const { error } = await supabase.auth.signInWithPassword({ email: "admin@dev.local", password: "dev-password" });
  expect(error).toBeNull();
  return supabase;
}

async function all(supabase: Awaited<ReturnType<typeof adminClient>>, fn: string, args: Record<string, unknown>) {
  const rows: Record<string, unknown>[] = [];
  for await (const page of fetchAllRpc(supabase, fn, args)) rows.push(...(page as Record<string, unknown>[]));
  return rows;
}

// Each case sits past PostgREST's max_rows = 1000: a single call would stop at 1000 with no error.
describe.skipIf(!key)("exports against real PostgREST (max_rows = 1000)", () => {
  it.each([
    ["admin_export_reports", {}, (r: Record<string, unknown>) => String(r.details).startsWith("paging-seed")],
    ["admin_export_appeals", {}, (r: Record<string, unknown>) => String(r.message).startsWith("paging-seed")],
    ["admin_list_awards", { p_achievement_id: ACHIEVEMENT }, () => true],
    ["admin_list_attendance", { p_event_id: EVENT }, () => true],
  ] as const)("fetchAllRpc returns all 1500 rows of %s", async (fn, args, mine) => {
    const rows = (await all(await adminClient(), fn, { ...(fn === "admin_export_reports" || fn === "admin_export_appeals" ? { p_status: fn === "admin_export_reports" ? "actioned" : "rejected" } : {}), ...args })).filter(mine);
    expect(rows.length).toBe(1500);
  });

  it("walks the audit log by keyset, past 1000 rows", async () => {
    const supabase = await adminClient();
    let seen = 0;
    let before: { p_before_at: string; p_before_id: string } | undefined;
    for (;;) {
      const { data, error } = await supabase.rpc("admin_export_audit", { p_entity: "profiles", p_limit: 1000, ...before });
      expect(error).toBeNull();
      if (!data || data.length === 0) break;
      seen += data.filter((r) => r.field === "paging-seed").length;
      const last = data[data.length - 1];
      before = { p_before_at: last.created_at, p_before_id: last.id };
    }
    expect(seen).toBe(1500);
  });

  it("pages players by offset past the cap and lists every matching id", async () => {
    const supabase = await adminClient();
    const ids = new Set<string>();
    let pages = 0;
    for (let offset = 0; ; ) {
      const { data, error } = await supabase.rpc("admin_list_players", { p_filters: {}, p_query: "", p_sort: "joined", p_desc: true, p_offset: offset, p_limit: 1000 });
      expect(error).toBeNull();
      if (!data || data.length === 0) break;
      pages += 1;
      offset += data.length;
      for (const row of data) ids.add(row.user_id);
    }
    expect(ids.size).toBeGreaterThanOrEqual(2500);
    expect(pages).toBeGreaterThan(1);

    const { data: all, error } = await supabase.rpc("admin_list_player_ids", { p_filters: {}, p_query: "" });
    expect(error).toBeNull();
    expect(all!.length).toBeGreaterThanOrEqual(2500);
  });
});
