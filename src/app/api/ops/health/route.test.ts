import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ serviceClient: () => ({ rpc: m.rpc }) }));

import { GET } from "./route";

const get = (auth?: string) => GET(new Request("https://site.test/api/ops/health", { headers: auth ? { authorization: auth } : {} }));

describe("GET /api/ops/health", () => {
  beforeEach(() => {
    m.rpc.mockReset();
    vi.stubEnv("OPS_HEALTH_TOKEN", "s3cret-token");
  });

  it("rejects a missing or wrong bearer", async () => {
    expect((await get()).status).toBe(401);
    expect((await get("Bearer wrong-token!")).status).toBe(401);
    expect((await get("s3cret-token")).status).toBe(401);
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("rejects everything when the token is not configured", async () => {
    vi.stubEnv("OPS_HEALTH_TOKEN", "");
    expect((await get("Bearer ")).status).toBe(401);
  });

  it("reports ok with the recent error count", async () => {
    m.rpc.mockResolvedValue({ data: 0, error: null });
    const res = await get("Bearer s3cret-token");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, db: "ok", errors_5m: 0 });
    expect(m.rpc).toHaveBeenCalledWith("app_errors_recent", { p_minutes: 5 });
  });

  it("reports 503 and db down when the database call fails", async () => {
    m.rpc.mockResolvedValue({ data: null, error: { message: "down" } });
    const res = await get("Bearer s3cret-token");
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ ok: false, db: "down" });
    m.rpc.mockRejectedValue(new Error("network"));
    expect((await get("Bearer s3cret-token")).status).toBe(503);
  });
});
