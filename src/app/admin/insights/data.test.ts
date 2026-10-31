import { describe, expect, it } from "vitest";
import { countValues, dayList, earliest, longDay, makeWindow, snapValues, stat } from "./data";

// 2026-10-21T17:30Z is already 22 Oct in Bangkok.
const now = new Date("2026-10-21T17:30:00Z");

describe("makeWindow", () => {
  it("ends on today's Bangkok day and covers two periods for the delta", () => {
    const win = makeWindow("7d", now);
    expect(win.today).toBe("2026-10-22");
    expect(win.chartDays(null)).toEqual(dayList("2026-10-16", "2026-10-22"));
    expect(win.statDays(null)).toHaveLength(14);
    expect(win.statDays(null)[0]).toBe("2026-10-09");
  });
  it("starts 'all' at the first day with data", () => {
    const win = makeWindow("all", now);
    expect(win.days).toBeNull();
    expect(win.chartDays("2026-10-20")).toEqual(["2026-10-20", "2026-10-21", "2026-10-22"]);
    expect(win.chartDays(null)).toEqual(["2026-10-22"]);
  });
});

describe("series on a day list", () => {
  const days = ["2026-10-20", "2026-10-21", "2026-10-22"];
  it("zero-fills counts and leaves snapshot gaps", () => {
    expect(countValues([{ day: "2026-10-22", n: 4 }], (r) => r.n, days)).toEqual([0, 0, 4]);
    expect(snapValues([{ day: "2026-10-20", n: 1 }, { day: "2026-10-22", n: 3 }], (r) => r.n, days)).toEqual([1, null, 3]);
  });
  it("finds the earliest day", () => {
    expect(earliest([{ day: "2026-10-21" }], [{ day: "2026-10-19" }], [])).toBe("2026-10-19");
    expect(earliest([], [])).toBeNull();
  });
});

describe("stat", () => {
  const win = makeWindow("7d", now);
  it("sums a count and compares with the previous period", () => {
    const s = stat(win, "sum", [1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2]);
    expect(s).toMatchObject({ value: 14, delta: { kind: "up", label: "+100%" } });
    expect(s.series).toHaveLength(7);
  });
  it("takes the last snapshot in each period, skipping gaps", () => {
    const s = stat(win, "last", [5, null, null, null, null, null, 10, null, null, null, 20, null, null, null]);
    expect(s.value).toBe(20);
    expect(s.delta?.label).toBe("+100%");
  });
  it("reads New for a previous period of 0 and no delta for 'all'", () => {
    expect(stat(win, "sum", [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3]).delta?.label).toBe("New");
    expect(stat(makeWindow("all", now), "sum", [1, 2]).delta).toBeNull();
  });
  it("has no delta when the previous period has no snapshot", () => {
    expect(stat(win, "last", [null, null, null, null, null, null, null, 1, 2, 3, 4, 5, 6, 7]).delta?.kind).toBe("none");
  });
});

it("formats a long day", () => {
  expect(longDay("2026-10-22")).toBe("22 Oct 2026");
});

it("has no value or delta when a period has no snapshot at all", () => {
  expect(stat(makeWindow("7d", now), "last", Array(14).fill(null))).toMatchObject({ value: null, delta: null });
});
