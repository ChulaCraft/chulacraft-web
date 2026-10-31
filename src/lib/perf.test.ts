import { afterEach, describe, expect, it, vi } from "vitest";
import { timed } from "./perf";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("timed", () => {
  it("logs '<label> <ms>' only when PERF_TRACE is set", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubEnv("PERF_TRACE", "");
    await timed("quiet", Promise.resolve(1));
    expect(log).not.toHaveBeenCalled();

    vi.stubEnv("PERF_TRACE", "1");
    await timed("loud", Promise.resolve(1));
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0][0]).toMatch(/^loud \d+$/);
  });

  it("passes the resolved value through", async () => {
    vi.stubEnv("PERF_TRACE", "1");
    vi.spyOn(console, "log").mockImplementation(() => {});
    await expect(timed("v", Promise.resolve({ a: 1 }))).resolves.toEqual({ a: 1 });
    await expect(timed("thenable", { then: (r: (v: number) => unknown) => r(7) } as PromiseLike<number>)).resolves.toBe(7);
  });

  it("passes rejections through (and still logs)", async () => {
    vi.stubEnv("PERF_TRACE", "1");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await expect(timed("bad", Promise.reject(new Error("boom")))).rejects.toThrow("boom");
    expect(log).toHaveBeenCalledTimes(1);
  });
});
