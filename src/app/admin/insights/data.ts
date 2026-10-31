import type { PlayersData } from "@/lib/insights/rpc";
import { delta, rangeDays, type Delta, type Range } from "@/lib/insights/range";
import { bangkokDay, fillDays } from "@/lib/insights/series";

const DAY_MS = 86_400_000;
const shift = (day: string, by: number) => new Date(Date.parse(day) + by * DAY_MS).toISOString().slice(0, 10);

/** Every day from `from` to `to`, inclusive. */
export const dayList = (from: string, to: string): string[] =>
  from > to ? [] : fillDays<{ day: string }>([], from, to, (day) => ({ day })).map((r) => r!.day);

/** The earliest day in any of the lists, or null when all are empty. */
export function earliest(...lists: { day: string }[][]): string | null {
  let min: string | null = null;
  for (const list of lists) for (const r of list) if (min === null || r.day < min) min = r.day;
  return min;
}

/**
 * The days one range covers, ending today in Bangkok. A ranged view draws the
 * last `days` days and keeps the `days` before them for the "vs previous
 * period" delta (the RPCs return both). "all" starts at the first day with data
 * and has no previous period.
 */
export type Window = {
  range: Range;
  days: number | null;
  today: string;
  chartDays: (first: string | null) => string[];
  statDays: (first: string | null) => string[];
};

export function makeWindow(range: Range, now: Date = new Date()): Window {
  const days = rangeDays(range);
  const today = bangkokDay(now.toISOString());
  const all = (first: string | null) => dayList(first && first < today ? first : today, today);
  return {
    range, days, today,
    chartDays: (first) => (days === null ? all(first) : dayList(shift(today, -(days - 1)), today)),
    statDays: (first) => (days === null ? all(first) : dayList(shift(today, -(2 * days - 1)), today)),
  };
}

/** A count series read on `days`: a day with no row is 0 (count series are sparse). */
export function countValues<T extends { day: string }>(rows: T[], pick: (r: T) => number, days: string[]): number[] {
  const byDay = new Map<string, number>();
  for (const r of rows) byDay.set(r.day, (byDay.get(r.day) ?? 0) + pick(r));
  return days.map((d) => byDay.get(d) ?? 0);
}

/** A snapshot series read on `days`: a day with no row is null (a gap, never 0). */
export function snapValues<T extends { day: string }>(rows: T[], pick: (r: T) => number, days: string[]): (number | null)[] {
  const byDay = new Map(rows.map((r) => [r.day, pick(r)]));
  return days.map((d) => byDay.get(d) ?? null);
}

/** `value` is null when there is nothing to show (no snapshot in the period). */
export type Stat = { value: number | null; delta: Delta | null; series: (number | null)[] };

const lastFinite = (vs: (number | null)[]) => {
  for (let i = vs.length - 1; i >= 0; i--) if (typeof vs[i] === "number") return vs[i] as number;
  return null;
};

/**
 * A tile's numbers from values on `win.statDays`: "sum" adds a count over
 * the period, "last" takes the latest snapshot in it. The delta compares
 * with the period before; "all" has none. `series` is the current period
 * only, for the sparkline.
 */
export function stat(win: Window, kind: "sum" | "last", values: (number | null)[]): Stat {
  const d = win.days;
  const current = d === null ? values : values.slice(-d);
  const previous = d === null ? null : values.slice(0, Math.max(0, values.length - d));
  const total = (vs: (number | null)[]) => vs.reduce<number>((s, v) => s + (v ?? 0), 0);
  const value = kind === "sum" ? total(current) : lastFinite(current);
  let prev: number | null = null;
  if (previous) prev = kind === "sum" ? (previous.length ? total(previous) : null) : lastFinite(previous);
  return { value, delta: d === null || value === null ? null : delta(value, prev), series: current };
}

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
/** "2026-10-22" → "22 Oct 2026". */
export const longDay = (day: string) => {
  const t = Date.parse(`${day}T00:00:00Z`);
  return Number.isNaN(t) ? day : DATE.format(t);
};

/**
 * The four headline player numbers, shared by the Insights Players tab and the
 * /admin/players strip so the two cannot disagree.
 */
export function playerStats(win: Window, { snapshots, signups }: Pick<PlayersData, "snapshots" | "signups">) {
  const days = win.statDays(earliest(snapshots, signups));
  const last = (pick: (s: PlayersData["snapshots"][number]) => number) => stat(win, "last", snapValues(snapshots, pick, days));
  return {
    players: last((s) => s.players),
    signups: stat(win, "sum", countValues(signups, (s) => s.n, days)),
    verified: last((s) => s.verified),
    guests: last((s) => s.guests),
  };
}
