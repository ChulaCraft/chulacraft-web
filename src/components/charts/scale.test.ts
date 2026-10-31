import { describe, expect, it } from "vitest";
import { compact, cursorIndex, cursorKey, linePath, linearScale, nearestIndex, niceTicks } from "./scale";

describe("niceTicks", () => {
  it("has a single zero tick for an empty or zero max", () => {
    expect(niceTicks(0)).toEqual([0]);
    expect(niceTicks(-5)).toEqual([0]);
    expect(niceTicks(Number.NaN)).toEqual([0]);
  });

  it("rounds up to clean steps", () => {
    expect(niceTicks(87)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(niceTicks(1)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
    expect(niceTicks(3, 3)).toEqual([0, 1, 2, 3]);
    expect(niceTicks(1200)).toEqual([0, 500, 1000, 1500]);
  });

  it("always ends at or above max", () => {
    for (const max of [7, 13, 99, 101, 4321]) expect(niceTicks(max).at(-1)!).toBeGreaterThanOrEqual(max);
  });
});

describe("linearScale", () => {
  it("maps a zero-width domain to the range midpoint", () => {
    expect(linearScale([5, 5], [0, 100])(5)).toBe(50);
  });

  it("maps linearly, including inverted ranges", () => {
    expect(linearScale([0, 10], [0, 100])(5)).toBe(50);
    expect(linearScale([0, 100], [200, 0])(25)).toBe(150);
  });
});

describe("linePath", () => {
  it("starts a new segment after a null point", () => {
    const d = linePath([{ x: 0, y: 0 }, null, { x: 2, y: 2 }]);
    expect(d.match(/M/g)).toHaveLength(2);
  });

  it("joins consecutive points with L", () => {
    expect(linePath([{ x: 0, y: 0 }, { x: 1, y: 2 }])).toBe("M0 0L1 2");
  });

  it("is empty for no points and never contains NaN or Infinity", () => {
    expect(linePath([])).toBe("");
    expect(linePath([null, null])).toBe("");
    const outputs = [
      linePath([]),
      linePath([{ x: 0, y: 0 }, null, { x: 2, y: 2 }]),
      linePath([{ x: Number.NaN, y: 1 }, { x: 1, y: Infinity }, { x: 2, y: 3 }]),
      linePath([{ x: 0, y: linearScale([0, 0], [32, 0])(0) }])
    ];
    for (const d of outputs) expect(d).not.toMatch(/NaN|Infinity/);
  });
});

describe("cursor helpers", () => {
  it("moves with arrows and clamps at the ends", () => {
    expect(cursorIndex(null, "ArrowRight", 5)).toBe(0);
    expect(cursorIndex(null, "ArrowLeft", 5)).toBe(4);
    expect(cursorIndex(2, "ArrowRight", 5)).toBe(3);
    expect(cursorIndex(4, "ArrowRight", 5)).toBe(4);
    expect(cursorIndex(0, "ArrowLeft", 5)).toBe(0);
    expect(cursorIndex(2, "Home", 5)).toBe(0);
    expect(cursorIndex(2, "End", 5)).toBe(4);
    expect(cursorIndex(2, "Escape", 5)).toBeNull();
    expect(cursorIndex(null, "ArrowRight", 0)).toBeNull();
  });

  it("only claims keys it uses, and Escape only while a cursor shows", () => {
    expect(cursorKey(null, "Escape", 5)).toBeUndefined();
    expect(cursorKey(2, "Escape", 5)).toBeNull();
    expect(cursorKey(2, "ArrowRight", 5)).toBe(3);
    expect(cursorKey(4, "ArrowRight", 5)).toBeUndefined();
    expect(cursorKey(2, "Tab", 5)).toBeUndefined();
    expect(cursorKey(2, "ArrowDown", 5)).toBeUndefined();
    expect(cursorKey(2, "ArrowDown", 5, true)).toBe(3);
    expect(cursorKey(null, "ArrowUp", 5, true)).toBe(4);
  });

  it("snaps a pointer x to the nearest day", () => {
    expect(nearestIndex(0, 0, 100, 5)).toBe(0);
    expect(nearestIndex(60, 0, 100, 5)).toBe(2);
    expect(nearestIndex(500, 0, 100, 5)).toBe(4);
    expect(nearestIndex(-10, 0, 100, 5)).toBe(0);
    expect(nearestIndex(30, 0, 100, 1)).toBe(0);
  });
});

describe("compact", () => {
  it("shortens from 1,000 up", () => {
    expect(compact(950)).toBe("950");
    expect(compact(1200)).toBe("1.2K");
    expect(compact(0.4)).toBe("0.4");
  });
});
