export type Range = "7d" | "30d" | "90d" | "all";

const RANGES: readonly Range[] = ["7d", "30d", "90d", "all"];
const DAYS: Record<Range, number | null> = { "7d": 7, "30d": 30, "90d": 90, all: null };

export const parseRange = (v: string | undefined): Range => (RANGES.find((r) => r === v) ?? "30d");

export const rangeDays = (r: Range): number | null => DAYS[r];

export type Delta = { kind: "up" | "down" | "flat" | "new" | "none"; pct: number | null; label: string };

export function delta(current: number, previous: number | null): Delta {
  if (previous === null || !Number.isFinite(previous) || !Number.isFinite(current)) return { kind: "none", pct: null, label: "" };
  if (previous === 0) return current === 0 ? { kind: "flat", pct: 0, label: "0%" } : { kind: "new", pct: null, label: "New" };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { kind: "flat", pct: 0, label: "0%" };
  return pct > 0 ? { kind: "up", pct, label: `+${pct}%` } : { kind: "down", pct, label: `${pct}%` };
}
