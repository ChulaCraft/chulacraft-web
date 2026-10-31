import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { fetchAllRpc } from "@/lib/admin-export";

// Needs: supabase start, dev-seed.sql, seed-export-paging.sql, and
// SUPABASE_PUBLISHABLE_KEY (from `supabase status`). Skipped otherwise.
const url = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const key = process.env.SUPABASE_PUBLISHABLE_KEY;

describe.skipIf(!key)("fetchAllRpc against real PostgREST (max_rows = 1000)", () => {
  it("returns every player, past the 1000-row cap", async () => {
    const supabase = createClient(url, key!, { auth: { persistSession: false } });
    const { error } = await supabase.auth.signInWithPassword({ email: "admin@dev.local", password: "dev-password" });
    expect(error).toBeNull();

    const ids = new Set<string>();
    let pages = 0;
    for await (const page of fetchAllRpc(supabase, "admin_list_players", { p_filters: {}, p_query: "", p_sort: "joined", p_desc: true, p_offset: 0, p_limit: 5000 })) {
      pages += 1;
      for (const row of page as { user_id: string }[]) ids.add(row.user_id);
    }
    expect(ids.size).toBeGreaterThanOrEqual(2500);
    expect(pages).toBeGreaterThan(1);
  });
});
