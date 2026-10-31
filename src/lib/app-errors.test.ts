import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ serviceClient: () => ({ rpc: m.rpc }) }));

import { fingerprint, normaliseRoute, recordAppError, scrub } from "./app-errors";

describe("scrub", () => {
  it("redacts secrets and personal data", () => {
    expect(scrub("bad eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig_x-y here")).toBe("bad [jwt] here");
    expect(scrub("key sb_secret_abc123 used")).toBe("key [key] used");
    expect(scrub("mail a@b.co failed")).toBe("mail [email] failed");
    expect(scrub("GET /events?code=123")).toBe("GET /events");
    expect(scrub("at https://x.test/auth?code=1&state=2#access_token=t done")).toBe("at https://x.test/auth done");
  });
});

describe("fingerprint", () => {
  it("ignores digits so ids do not split a group", () => {
    expect(fingerprint("server", "id 12 failed", "/a")).toBe(fingerprint("server", "id 99 failed", "/a"));
  });
  it("separates kinds, messages and routes", () => {
    const base = fingerprint("server", "x", "/a");
    expect(fingerprint("client", "x", "/a")).not.toBe(base);
    expect(fingerprint("server", "y", "/a")).not.toBe(base);
    expect(fingerprint("server", "x", "/b")).not.toBe(base);
  });
});

describe("normaliseRoute", () => {
  it("turns UUID and all-digit segments into [id] and drops query and fragment", () => {
    expect(normaliseRoute("/player/3f2a9c1e-8b7d-4e6f-a1b2-c3d4e5f60718")).toBe("/player/[id]");
    expect(normaliseRoute("/admin/users/3F2A9C1E-8B7D-4E6F-A1B2-C3D4E5F60718/edit")).toBe("/admin/users/[id]/edit");
    expect(normaliseRoute("/events/42?code=1#x")).toBe("/events/[id]");
    expect(normaliseRoute("/events/42")).toBe(normaliseRoute("/events/7"));
  });
  it("keeps named segments, the root and patterns that are already normalised", () => {
    expect(normaliseRoute("/")).toBe("/");
    expect(normaliseRoute("/events/v2-launch")).toBe("/events/v2-launch");
    expect(normaliseRoute("/admin/ops/survival")).toBe("/admin/ops/survival");
    expect(normaliseRoute("/events/[id]")).toBe("/events/[id]");
    expect(normaliseRoute("/admin/pages/page")).toBe("/admin/pages/page");
  });
  it("maps a Next route file path to its URL pattern", () => {
    expect(normaliseRoute("/events/[id]/page", true)).toBe("/events/[id]");
    expect(normaliseRoute("/app/blog/[dynamic]", true)).toBe("/blog/[dynamic]");
    expect(normaliseRoute("/api/client-errors/route", true)).toBe("/api/client-errors");
    expect(normaliseRoute("/(site)/@modal/player/[id]/page", true)).toBe("/player/[id]");
    expect(normaliseRoute("/page", true)).toBe("/");
  });
});

describe("recordAppError", () => {
  beforeEach(() => m.rpc.mockReset().mockResolvedValue({ error: null }));

  it("always sends p_digest, as null when there is none", async () => {
    await recordAppError({ kind: "client", route: "/a", message: "m" });
    expect(m.rpc).toHaveBeenCalledWith("record_app_error", { p_kind: "client", p_route: "/a", p_message: "m", p_digest: null });
    await recordAppError({ kind: "server", route: "/a", message: "m", digest: "abc-123" });
    expect(m.rpc.mock.calls[1][1].p_digest).toBe("abc-123");
    await recordAppError({ kind: "server", route: "/a", message: "m", digest: "a b@c.co" });
    expect(m.rpc.mock.calls[2][1].p_digest).toBeNull();
  });

  it("scrubs the message and route before the call", async () => {
    await recordAppError({ kind: "server", route: "/auth?code=1", message: "x a@b.co sb_secret_k" });
    expect(m.rpc.mock.calls[0][1]).toMatchObject({ p_route: "/auth", p_message: "x [email] [key]" });
  });

  it("normalises a raw path before the call, so ids neither split groups nor get stored", async () => {
    await recordAppError({ kind: "client", route: "/player/3f2a9c1e-8b7d-4e6f-a1b2-c3d4e5f60718?tab=1", message: "m" });
    await recordAppError({ kind: "client", route: "/events/12", message: "m" });
    expect(m.rpc.mock.calls.map((c) => c[1].p_route)).toEqual(["/player/[id]", "/events/[id]"]);
  });

  it("never throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    m.rpc.mockResolvedValueOnce({ error: { message: "PGRST202" } });
    await expect(recordAppError({ kind: "client", route: "/a", message: "m" })).resolves.toBeUndefined();
    m.rpc.mockRejectedValueOnce(new Error("network"));
    await expect(recordAppError({ kind: "client", route: "/a", message: "m" })).resolves.toBeUndefined();
  });
});
