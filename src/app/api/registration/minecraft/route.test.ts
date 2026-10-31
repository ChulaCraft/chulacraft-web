import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ getUser: vi.fn(), order: vi.fn(), rpc: vi.fn(), userRpc: vi.fn(), record: vi.fn(), open: true }));

// after() only works inside a request, so run its callback straight away.
vi.mock("next/server", async (original) => ({ ...(await original<typeof import("next/server")>()), after: (fn: () => unknown) => { void fn(); } }));
vi.mock("@/lib/funnel", async (original) => ({ ...(await original<typeof import("@/lib/funnel")>()), recordFunnelFailure: m.record }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => {
    const query = { select: () => query, eq: () => query, order: m.order };
    return { auth: { getUser: m.getUser }, from: () => query, rpc: m.userRpc };
  },
  createAdminClient: () => ({ rpc: m.rpc })
}));

vi.mock("@/lib/site-content", () => ({ siteSettings: async () => ({ registrationOpen: m.open }) }));

import { DELETE, GET, PATCH, POST } from "./route";

const del = (body: unknown) => DELETE(new Request("https://example.test", { method: "DELETE", body: JSON.stringify(body) }));

describe("Minecraft registration API", () => {
  beforeEach(() => {
    m.getUser.mockReset().mockResolvedValue({ data: { user: { id: "u1" } } });
    m.order.mockReset();
    m.rpc.mockReset();
    m.userRpc.mockReset();
    m.record.mockReset();
    m.open = true;
  });

  it("refuses adds and changes while registration is closed, before any database call", async () => {
    m.open = false;
    const body = JSON.stringify({ minecraftUsername: "Steve" });
    expect((await POST(new Request("https://example.test", { method: "POST", body }))).status).toBe(403);
    expect((await PATCH(new Request("https://example.test", { method: "PATCH", body }))).status).toBe(403);
    expect(m.userRpc).not.toHaveBeenCalled();
    expect(m.rpc).not.toHaveBeenCalled();
    expect(m.record).toHaveBeenCalledTimes(2);
    expect(m.record).toHaveBeenCalledWith("minecraft", "CLOSED");
  });

  it("counts neither a rate-limited attempt nor a missing sign-in", async () => {
    m.userRpc.mockResolvedValue({ data: false, error: null });
    const post = () => POST(new Request("https://example.test", { method: "POST", body: JSON.stringify({ minecraftUsername: "Steve" }) }));
    expect((await post()).status).toBe(429);
    expect(m.record).not.toHaveBeenCalled();
    m.getUser.mockResolvedValueOnce({ data: { user: null } });
    expect((await post()).status).toBe(401);
    expect(m.record).not.toHaveBeenCalled();
  });

  it("requires a working, signed-in session", async () => {
    m.getUser.mockRejectedValueOnce(new Error("down"));
    expect((await GET()).status).toBe(503);
    m.getUser.mockResolvedValueOnce({ data: { user: null } });
    expect((await GET()).status).toBe(401);
    m.getUser.mockResolvedValueOnce({ data: { user: null } });
    expect((await del({ id: "r1" })).status).toBe(401);
  });

  it("returns only the public registration fields", async () => {
    m.order.mockResolvedValue({
      data: [{ id: "r1", minecraft_username: "Steve", desired_whitelisted: true, sync_status: "pending", updated_at: "t", user_id: "u1" }],
      error: null
    });
    expect(await (await GET()).json()).toEqual({
      registrations: [{ id: "r1", minecraftUsername: "Steve", desiredWhitelisted: true, syncStatus: "pending", updatedAt: "t" }]
    });
  });

  it("removes an account or maps the database error", async () => {
    const id = "00000000-0000-0000-0000-000000000001";
    expect((await del({})).status).toBe(400);
    expect((await del({ id: "r1" })).status).toBe(400);
    m.rpc.mockResolvedValueOnce({ error: null });
    expect((await del({ id })).status).toBe(204);
    expect(m.rpc).toHaveBeenCalledWith("remove_minecraft_account", { p_user_id: "u1", p_registration_id: id });
    m.rpc.mockResolvedValueOnce({ error: { message: "NOT_FOUND" } });
    expect((await del({ id })).status).toBe(404);
  });
});
