import { describe, expect, it } from "vitest";
import { delta, parseRange, rangeDays } from "./range";

describe("range", () => {
  it("parses ranges and defaults to 30d", () => {
    expect(parseRange("999d")).toBe("30d");
    expect(parseRange(undefined)).toBe("30d");
    expect(parseRange("7d")).toBe("7d");
    expect(parseRange("all")).toBe("all");
  });
  it("maps ranges to days", () => {
    expect([rangeDays("7d"), rangeDays("30d"), rangeDays("90d"), rangeDays("all")]).toEqual([7, 30, 90, null]);
  });
});

describe("delta", () => {
  it("handles zero and missing previous periods", () => {
    expect(delta(10, 0).kind).toBe("new");
    expect(delta(10, 0).label).toBe("New");
    expect(delta(10, null).kind).toBe("none");
    expect(delta(0, 0).kind).toBe("flat");
  });
  it("computes percentage change", () => {
    expect(delta(5, 10)).toMatchObject({ kind: "down", pct: -50 });
    expect(delta(15, 10)).toMatchObject({ kind: "up", pct: 50, label: "+50%" });
    expect(delta(10, 10).kind).toBe("flat");
  });
  it("never yields NaN or Infinity text", () => {
    for (const d of [delta(0, 0), delta(3, 0), delta(0, 5)]) expect(d.label).not.toMatch(/NaN|Infinity|∞/);
  });
});
