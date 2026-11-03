import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ rpc: vi.fn(), getUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: m.rpc, auth: { getUser: m.getUser } }) }));

import { GET } from "./route";

const get = (q = "") => GET(new Request(`http://x/admin/players/export${q}`));

describe("players CSV export", () => {
  beforeEach(() => {
    m.getUser.mockReset().mockResolvedValue({ data: { user: { id: "u1" } } });
    m.rpc.mockReset().mockImplementation(async (fn: string) => fn === "current_app_role" ? { data: "admin", error: null } : { data: [], error: null });
  });

  it("refuses moderators and event staff: bulk emails are owner/admin only", async () => {
    for (const role of ["moderator", "event_staff"]) {
      m.rpc.mockReset().mockImplementation(async (fn: string) => fn === "current_app_role" ? { data: role, error: null } : { data: [], error: null });
      expect((await get()).status).toBe(403);
      expect(m.rpc).not.toHaveBeenCalledWith("admin_list_players", expect.anything());
    }
  });

  it("refuses a signed-out request without calling the database", async () => {
    m.getUser.mockResolvedValue({ data: { user: null } });
    expect((await get()).status).toBe(403);
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("refuses a player the RPC rejects", async () => {
    m.rpc.mockImplementation(async (fn: string) => fn === "current_app_role" ? { data: "user", error: null } : { data: null, error: { message: "FORBIDDEN" } });
    expect((await get()).status).toBe(403);
  });

  it("pages through results with the screen's filter", async () => {
    const row = { user_id: "a", display_name: "=cmd", handle: "h", role: "user", verification_kind: "guest", banned: false, whitelist: "none", email: "e", chula_email: null, minecraft_usernames: null, created_at: "t" };
    m.rpc.mockResolvedValueOnce({ data: "admin", error: null }).mockResolvedValueOnce({ data: Array(1000).fill(row), error: null }).mockResolvedValueOnce({ data: [row], error: null });
    const res = await get("?status=guest&status=verified&q=kai");
    const lines = (await res.text()).trim().split("\r\n");
    expect(lines).toHaveLength(1002);
    expect(lines[1]).toContain("'=cmd");
    expect(m.rpc).toHaveBeenNthCalledWith(3, "admin_list_players", { p_filters: { status: ["guest", "verified"] }, p_query: "kai", p_sort: "joined", p_desc: true, p_offset: 1000, p_limit: 1000 });
    expect(m.rpc).toHaveBeenCalledTimes(4);
  });
});
