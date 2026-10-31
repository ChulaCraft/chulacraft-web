const DAY_MS = 86_400_000;
const BANGKOK_OFFSET_MS = 7 * 3_600_000; // Asia/Bangkok has no DST

const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export const bangkokDay = (iso: string): string => fmt(new Date(iso).getTime() + BANGKOK_OFFSET_MS);

// One entry per day from..to inclusive. A missing day is passed to fill(); null means a gap.
export function fillDays<T extends { day: string }>(rows: T[], from: string, to: string, fill: (day: string) => T | null): (T | null)[] {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const out: (T | null)[] = [];
  for (let t = Date.parse(from); t <= Date.parse(to); t += DAY_MS) {
    const day = fmt(t);
    out.push(byDay.get(day) ?? fill(day));
  }
  return out;
}

// current = the `days` days ending at today; previous = the `days` days before that.
export function splitPeriods<T extends { day: string }>(rows: T[], days: number, today: string): { current: T[]; previous: T[] } {
  const t = Date.parse(today);
  const curFrom = fmt(t - (days - 1) * DAY_MS);
  const prevFrom = fmt(t - (2 * days - 1) * DAY_MS);
  return {
    current: rows.filter((r) => r.day >= curFrom && r.day <= today),
    previous: rows.filter((r) => r.day >= prevFrom && r.day < curFrom),
  };
}
