import { describe, expect, it } from "vitest";
import { bangkokDay, fillDays, splitPeriods } from "./series";

describe("bangkokDay", () => {
  it("counts 17:30Z as the next Bangkok day", () => {
    expect(bangkokDay("2026-10-21T17:30:00Z")).toBe("2026-10-22");
    expect(bangkokDay("2026-10-21T16:59:59Z")).toBe("2026-10-21");
  });
});

describe("fillDays", () => {
  const rows = [{ day: "2026-10-20", n: 3 }, { day: "2026-10-22", n: 5 }];
  it("leaves a gap when fill returns null", () => {
    expect(fillDays(rows, "2026-10-20", "2026-10-22", () => null)).toEqual([rows[0], null, rows[1]]);
  });
  it("zero-fills when fill returns a row", () => {
    expect(fillDays(rows, "2026-10-20", "2026-10-22", (day) => ({ day, n: 0 }))).toEqual([rows[0], { day: "2026-10-21", n: 0 }, rows[1]]);
  });
});

describe("splitPeriods", () => {
  it("splits two consecutive periods", () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({ day: `2026-10-${String(i + 5).padStart(2, "0")}` }));
    const { current, previous } = splitPeriods(rows, 7, "2026-10-22");
    expect(current.map((r) => r.day)).toEqual(["16", "17", "18", "19", "20", "21", "22"].map((d) => `2026-10-${d}`));
    expect(previous.map((r) => r.day)).toEqual(["09", "10", "11", "12", "13", "14", "15"].map((d) => `2026-10-${d}`));
  });
  it("handles empty input", () => {
    expect(splitPeriods([], 7, "2026-10-22")).toEqual({ current: [], previous: [] });
  });
});
