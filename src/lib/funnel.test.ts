import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ serviceClient: () => ({ rpc: m.rpc }) }));

import { failureCode, recordFunnelFailure } from "./funnel";

describe("failureCode", () => {
  it("prefers a raised database code", () => expect(failureCode(409, "REGISTRATION_CONFLICT")).toBe("REGISTRATION_CONFLICT"));
  it("names the status when nothing was raised", () => {
    expect(failureCode(429)).toBe("RATE_LIMITED");
    expect(failureCode(400)).toBe("INVALID_INPUT");
    expect(failureCode(503)).toBe("UNAVAILABLE");
    expect(failureCode(403)).toBe("CLOSED");
  });
  it("always fits the database check", () => {
    for (const status of [400, 403, 404, 409, 418, 429, 500, 503]) expect(failureCode(status)).toMatch(/^[A-Z0-9_]{2,40}$/);
  });
});

describe("recordFunnelFailure", () => {
  beforeEach(() => m.rpc.mockReset());

  it("calls the RPC with the step and code", async () => {
    m.rpc.mockResolvedValue({ error: null });
    await recordFunnelFailure("verify", "CU_SWAP");
    expect(m.rpc).toHaveBeenCalledWith("record_funnel_failure", { p_step: "verify", p_code: "CU_SWAP" });
  });

  it("swallows a thrown RPC error and logs once", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    m.rpc.mockRejectedValueOnce(new Error("down"));
    await expect(recordFunnelFailure("minecraft", "CLOSED")).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledTimes(1);
    log.mockRestore();
  });

  it("swallows a returned RPC error", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    m.rpc.mockResolvedValue({ error: { message: "nope" } });
    await expect(recordFunnelFailure("minecraft", "CLOSED")).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledTimes(1);
    log.mockRestore();
  });
});
