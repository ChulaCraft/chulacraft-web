// Pure line-series helpers, kept out of the "use client" LineChart module so
// server components (the Insights panels) can call lineRows() for ChartFrame.

export type LineSeries = { name: string; points: { day: string; value: number | null }[] };

export const MAX_SERIES = 3;

/** Why `series` can't be drawn exactly as given, or null when it can. */
export function seriesProblem(series: LineSeries[]): string | null {
  if (series.length > MAX_SERIES) return `LineChart draws at most ${MAX_SERIES} series; got ${series.length}. Only the first ${MAX_SERIES} are drawn.`;
  const days = series[0]?.points.map((p) => p.day).join() ?? "";
  const odd = series.find((s) => s.points.map((p) => p.day).join() !== days);
  return odd ? `LineChart series "${odd.name}" has a different day list from "${series[0].name}". It is aligned to that series' days.` : null;
}

/** What the chart draws: the first three series, each read on the first
 *  series' days (a day a series lacks is null, i.e. a gap). */
export function alignSeries(input: LineSeries[]): { days: string[]; series: LineSeries[] } {
  const days = input[0]?.points.map((p) => p.day) ?? [];
  const series = input.slice(0, MAX_SERIES).map((s) => {
    const byDay = new Map(s.points.map((p) => [p.day, p.value]));
    return { name: s.name, points: days.map((day) => ({ day, value: byDay.get(day) ?? null })) };
  });
  return { days, series };
}

/** The table/CSV for a line chart, built from the same series it draws: one
 *  row per day, one column per drawn series. Pass `columns` and `rows`
 *  straight to ChartFrame so the download is exactly what is plotted. */
export function lineRows(input: LineSeries[], dayLabel = "Day") {
  const { days, series } = alignSeries(input);
  const columns = [{ key: "day", label: dayLabel }, ...series.map((s, i) => ({ key: `s${i}`, label: s.name }))];
  const rows = days.map((day, d) => Object.fromEntries([["day", day], ...series.map((s, i) => [`s${i}`, s.points[d].value])]));
  return { columns, rows };
}
