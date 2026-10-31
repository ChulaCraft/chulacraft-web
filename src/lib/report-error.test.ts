import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("reportError", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("window", { location: { pathname: "/events/1", search: "?code=9" } });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("sends at most 5 reports per fingerprint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const { reportError } = await import("./report-error");
    for (let i = 0; i < 1000; i++) reportError(new Error("boom"));
    expect(fetchMock).toHaveBeenCalledTimes(5);
    reportError(new Error("different"));
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it("sends the route pattern: no query, ids as [id]", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const { reportError } = await import("./report-error");
    reportError(new Error("m"));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ route: "/events/[id]", message: "m" });
  });

  it("skips errors with a digest: the server already recorded them", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const { reportError } = await import("./report-error");
    reportError(Object.assign(new Error("An error occurred in the Server Components render."), { digest: "1234567" }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never throws when fetch rejects or throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const { reportError } = await import("./report-error");
    expect(() => reportError(new Error("a"))).not.toThrow();
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("sync"); }));
    expect(() => reportError(new Error("b"))).not.toThrow();
    await new Promise((r) => setTimeout(r));
  });
});
