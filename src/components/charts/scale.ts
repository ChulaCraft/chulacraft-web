/** Pure geometry for the hand-rolled SVG charts. Nothing here may emit NaN or
 *  Infinity: an SVG path with either is dropped whole by the browser. */

export type Point = { x: number; y: number };

/** Maps `domain` onto `range`. A zero-width domain (one point, or all-equal
 *  values) maps everything to the middle of the range instead of dividing by 0. */
export function linearScale(domain: [number, number], range: [number, number]): (v: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  if (!Number.isFinite(span) || span === 0) return () => (r0 + r1) / 2;
  return (v) => r0 + ((v - d0) / span) * (r1 - r0);
}

const tidy = (v: number) => Number(v.toFixed(10));

/** Ticks from 0 up to the first clean step (1, 2 or 5 × 10ⁿ) at or above `max`. */
export function niceTicks(max: number, count = 5): number[] {
  if (!Number.isFinite(max) || max <= 0 || count < 1) return [0];
  const raw = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= raw - 1e-12) ?? 10 * magnitude;
  const steps = Math.ceil(tidy(max / step));
  return Array.from({ length: steps + 1 }, (_, i) => tidy(i * step));
}

const num = (v: number) => String(Math.round(v * 100) / 100);
const usable = (p: Point | null): p is Point => p !== null && Number.isFinite(p.x) && Number.isFinite(p.y);

/** An SVG path through the points. A null (or non-finite) point is a gap: the
 *  next point starts a new `M` segment, so a missing day never joins up. */
export function linePath(points: (Point | null)[]): string {
  let d = "";
  let pen = false;
  for (const p of points) {
    if (!usable(p)) {
      pen = false;
      continue;
    }
    d += `${pen ? "L" : "M"}${num(p.x)} ${num(p.y)}`;
    pen = true;
  }
  return d;
}

/** The keyboard cursor over `n` days: ←/→ step and clamp, Home/End jump,
 *  Escape clears. The first arrow press lands on the nearest end. */
export function cursorIndex(current: number | null, key: string, n: number): number | null {
  if (n <= 0) return null;
  const last = n - 1;
  switch (key) {
    case "ArrowRight": return current === null ? 0 : Math.min(last, current + 1);
    case "ArrowLeft": return current === null ? last : Math.max(0, current - 1);
    case "Home": return 0;
    case "End": return last;
    case "Escape": return null;
    default: return current;
  }
}

const ALIASES: Record<string, string> = { ArrowDown: "ArrowRight", ArrowUp: "ArrowLeft" };

/** A chart's key handling: the new cursor, or `undefined` when the key is not
 *  the chart's (so it must not be preventDefault-ed). Escape belongs to the
 *  chart only while a cursor shows, so it still reaches an enclosing dialog.
 *  `vertical` also maps ↑/↓ to ←/→ (bar lists). */
export function cursorKey(current: number | null, key: string, n: number, vertical = false): number | null | undefined {
  if (key === "Escape") return current === null ? undefined : null;
  const k = vertical ? (ALIASES[key] ?? key) : key;
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(k)) return undefined;
  const next = cursorIndex(current, k, n);
  return next === current ? undefined : next;
}

/** The day nearest to pointer `x` when `n` days are spread evenly over x0…x1. */
export function nearestIndex(x: number, x0: number, x1: number, n: number): number {
  if (n <= 1 || x1 === x0 || !Number.isFinite(x)) return 0;
  const i = Math.round(((x - x0) / (x1 - x0)) * (n - 1));
  return Math.min(n - 1, Math.max(0, i));
}

const COMPACT = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

/** 950 / 1.2K / 3.4M: axis ticks and tile values. */
export const compact = (v: number) => (Number.isFinite(v) ? COMPACT.format(v) : "–");
