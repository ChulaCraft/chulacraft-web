import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ record: vi.fn() }));
vi.mock("@/lib/app-errors", async (original) => ({ ...(await original<typeof import("@/lib/app-errors")>()), recordAppError: m.record }));

import { POST } from "./route";

const req = (body: unknown, headers: Record<string, string> = {}) => new Request("https://site.test/api/client-errors", {
  method: "POST",
  body: typeof body === "string" ? body : JSON.stringify(body),
  headers: { origin: "https://site.test", "x-forwarded-for": "1.2.3.4", ...headers }
});
const ok = { route: "/events", message: "boom", digest: "d" };

describe("client error endpoint", () => {
  beforeEach(() => m.record.mockReset().mockResolvedValue(undefined));

  it("records a same-origin report as a client error", async () => {
    expect((await POST(req(ok, { "x-forwarded-for": "9.9.9.9" }))).status).toBe(204);
    expect(m.record).toHaveBeenCalledWith({ kind: "client", route: "/events", message: "boom", digest: "d" });
  });

  it("refuses a foreign or missing Origin", async () => {
    expect((await POST(req(ok, { origin: "https://evil.test" }))).status).toBe(403);
    const noOrigin = new Request("https://site.test/api/client-errors", { method: "POST", body: JSON.stringify(ok) });
    expect((await POST(noOrigin)).status).toBe(403);
    expect(m.record).not.toHaveBeenCalled();
  });

  it("refuses a body over 2 KB", async () => {
    expect((await POST(req({ ...ok, message: "x".repeat(3000) }, { "x-forwarded-for": "8.8.8.8" }))).status).toBe(413);
    expect(m.record).not.toHaveBeenCalled();
  });

  it("refuses malformed bodies", async () => {
    expect((await POST(req("not json", { "x-forwarded-for": "7.7.7.7" }))).status).toBe(400);
    expect((await POST(req({ route: 1 }, { "x-forwarded-for": "7.7.7.7" }))).status).toBe(400);
  });

  it("allows 60 reports a minute per IP and refuses the 61st", async () => {
    const headers = { "x-forwarded-for": "5.5.5.5" };
    for (let i = 0; i < 60; i++) expect((await POST(req(ok, headers))).status).toBe(204);
    expect((await POST(req(ok, headers))).status).toBe(429);
    expect((await POST(req(ok, { "x-forwarded-for": "6.6.6.6" }))).status).toBe(204);
  });
});
