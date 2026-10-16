import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ rpc: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: m.rpc }) }));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidatePath }));

import { bulkBan, bulkMarkGuest } from "./actions";

const A = "00000000-0000-0000-0000-0000000000a1";
const B = "00000000-0000-0000-0000-0000000000b2";

describe("bulk player actions", () => {
  beforeEach(() => { m.rpc.mockReset().mockResolvedValue({ error: null }); m.revalidatePath.mockReset(); });

  it("rejects non-UUID ids without touching the database", async () => {
    expect(await bulkMarkGuest([A, "nope"])).toEqual({ error: "INVALID" });
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("caps a batch at 200", async () => {
    expect(await bulkMarkGuest(Array(201).fill(A))).toEqual({ error: "TOO_MANY" });
  });

  it("applies the rest when one id fails and reports it", async () => {
    m.rpc.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: { message: "FORBIDDEN" } });
    expect(await bulkMarkGuest([A, B])).toEqual({ done: 1, skipped: [{ id: B, code: "FORBIDDEN" }] });
    expect(m.rpc).toHaveBeenCalledWith("admin_mark_guest", { p_user_id: A });
    expect(m.revalidatePath).toHaveBeenCalledWith("/admin/players");
  });

  it("requires a ban reason", async () => {
    expect(await bulkBan([A], "  ")).toEqual({ error: "INVALID" });
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("bans each id with the same reason", async () => {
    expect(await bulkBan([A, B], "raid")).toEqual({ done: 2, skipped: [] });
    expect(m.rpc).toHaveBeenCalledWith("admin_ban_user", { p_user_id: B, p_reason: "raid" });
  });

  it("counts a thrown RPC as skipped and keeps going", async () => {
    m.rpc.mockRejectedValueOnce(new Error("fetch failed")).mockResolvedValueOnce({ error: null });
    expect(await bulkMarkGuest([A, B])).toEqual({ done: 1, skipped: [{ id: A, code: "FAILED" }] });
  });
});
