import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ rpc: vi.fn(), getUser: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: m.rpc, auth: { getUser: m.getUser } }) }));

import { openNotifications } from "./actions";

const ROW = { id: "n1", kind: "award", payload: { name: "Miner" }, created_at: "2026-10-22T00:00:00Z", read_at: null };

describe("openNotifications", () => {
  beforeEach(() => {
    m.getUser.mockReset().mockResolvedValue({ data: { user: { id: "u1" } } });
    m.rpc.mockReset().mockImplementation(async (name: string) => ({ data: name === "my_notifications" ? [ROW] : 1, error: null }));
  });

  it("loads the list and then marks it read", async () => {
    expect(await openNotifications()).toEqual({ ok: true, items: [ROW] });
    expect(m.rpc.mock.calls.map((c) => c[0])).toEqual(["my_notifications", "mark_my_notifications_read"]);
    expect(m.rpc).toHaveBeenNthCalledWith(1, "my_notifications", { p_limit: 20 });
  });

  it("returns an empty list when there are no rows", async () => {
    m.rpc.mockResolvedValueOnce({ data: null, error: null });
    expect(await openNotifications()).toEqual({ ok: true, items: [] });
  });

  it("fails without marking anything read when the list can't load", async () => {
    m.rpc.mockResolvedValueOnce({ data: null, error: { message: "connection reset" } });
    expect(await openNotifications()).toEqual({ ok: false, error: "FAILED" });
    expect(m.rpc).toHaveBeenCalledTimes(1);
  });

  it("still returns the list when marking read fails", async () => {
    m.rpc.mockResolvedValueOnce({ data: [ROW], error: null }).mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    expect(await openNotifications()).toEqual({ ok: true, items: [ROW] });
  });

  it("refuses a signed-out caller without calling the database", async () => {
    m.getUser.mockResolvedValue({ data: { user: null } });
    expect(await openNotifications()).toEqual({ ok: false, error: "UNAUTHENTICATED" });
    expect(m.rpc).not.toHaveBeenCalled();
  });
});
