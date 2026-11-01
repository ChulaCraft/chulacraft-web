import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Manual checklist, Phase 7 "/admin/ops/website: health, version": that page renders opsHealth().
const m = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ serviceClient: () => ({ rpc: m.rpc }) }));

import { opsHealth } from "./ops-health";

describe("opsHealth", () => {
  beforeEach(() => { m.rpc.mockReset(); });
  afterEach(() => vi.unstubAllEnvs());

  it("is ok with the error count of the last 5 minutes and a 7-character version", async () => {
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "0123456789abcdef");
    m.rpc.mockResolvedValue({ data: 3, error: null });
    expect(await opsHealth()).toEqual({ ok: true, db: "ok", errors_5m: 3, version: "0123456" });
    expect(m.rpc).toHaveBeenCalledWith("app_errors_recent", { p_minutes: 5 });
  });

  it("calls the version dev outside Vercel", async () => {
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "");
    m.rpc.mockResolvedValue({ data: 0, error: null });
    expect((await opsHealth()).version).toBe("dev");
  });

  it("is down, never throwing, on an error or a non-number", async () => {
    m.rpc.mockResolvedValue({ data: null, error: { message: "x" } });
    expect(await opsHealth()).toMatchObject({ ok: false, db: "down", errors_5m: 0 });
    m.rpc.mockResolvedValue({ data: "3", error: null });
    expect((await opsHealth()).ok).toBe(false);
  });

  it("is down when the call itself rejects", async () => {
    m.rpc.mockRejectedValue(new Error("network"));
    expect((await opsHealth()).ok).toBe(false);
  });
});
