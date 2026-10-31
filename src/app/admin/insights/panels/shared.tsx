import { BarChart, type BarDatum } from "@/components/charts/bar-chart";
import { ChartFrame, type ChartColumn } from "@/components/charts/chart-frame";
import { CsvButton } from "@/components/charts/csv-button";
import { LineChart } from "@/components/charts/line-chart";
import { lineRows, type LineSeries } from "@/components/charts/line-series";
import { MetricTile } from "@/components/charts/metric-tile";
import { PixelIcon } from "@/components/icons";
import { longDay, type Stat, type Window } from "../data";
import styles from "../insights.module.css";

export const EMPTY = "No data in this range";

/** Shown in place of a panel whose RPC failed; the other panels still render. */
export function PanelAlert({ what }: { what: string }) {
  return <div className="alert alert-error" role="alert">
    <PixelIcon name="warning" />
    <p className="alert-body">Couldn&apos;t load {what}. Please reload.</p>
  </div>;
}

export function PanelEmpty() {
  return <p className={`panel ${styles.empty}`}>{EMPTY}</p>;
}

export type Tile = { label: string; stat: Stat; href?: string };

/** A grid of headline tiles plus one CSV of the numbers they show. */
export function TileGroup({ title, csvName, tiles }: { title: string; csvName: string; tiles: Tile[] }) {
  if (tiles.length === 0) return null;
  const columns: ChartColumn[] = [{ key: "metric", label: "Metric" }, { key: "value", label: "Value" }, { key: "change", label: "Change vs previous period" }];
  const rows = tiles.map((t) => ({ metric: t.label, value: t.stat.value, change: t.stat.delta?.label ?? "" }));
  return <section className={styles.tileGroup} aria-label={title}>
    <div className={styles.tileHead}>
      <h2 className="sr-only">{title}</h2>
      <CsvButton name={csvName} columns={columns} rows={rows} title={title} />
    </div>
    <div className={styles.tiles}>
      {tiles.map((t) => <MetricTile key={t.label} label={t.label} value={t.stat.value ?? "–"} delta={t.stat.delta} series={t.stat.series} href={t.href} />)}
    </div>
  </section>;
}

const hasValue = (vs: (number | null)[]) => vs.some((v) => typeof v === "number" && v !== 0);

/**
 * A line chart over `days`, with its table and CSV built from the exact series
 * it draws. A chart with nothing but zeros or gaps shows the empty state.
 * `history` is for snapshot charts on "all": fewer than two snapshot rows
 * cannot make a line, so it says when history began instead; when snapshots
 * start after the chart's first day (signups predate them), the chart keeps
 * its days (and its CSV rows) and says when history began above it.
 */
export function LinePanel({ title, csvName, yLabel, days, series, history }: {
  title: string;
  csvName: string;
  yLabel: string;
  days: string[];
  series: { name: string; values: (number | null)[] }[];
  history?: { win: Window; rows: { day: string }[] };
}) {
  if (history && history.win.days === null && history.rows.length > 0 && history.rows.length < 2) {
    return <div className={styles.notice}>
      <p className={styles.noticeTitle}>{title}</p>
      <p>History starts on {longDay(history.rows[0].day)}. A trend needs at least two days of snapshots.</p>
    </div>;
  }
  const lines: LineSeries[] = series.map((s) => ({ name: s.name, points: days.map((day, i) => ({ day, value: s.values[i] ?? null })) }));
  const empty = !series.some((s) => hasValue(s.values));
  const { columns, rows } = lineRows(lines);
  const firstSnapshot = history && history.win.days === null && history.rows.length > 0
    ? history.rows.reduce((min, r) => (r.day < min ? r.day : min), history.rows[0].day) : null;
  const lateStart = !empty && firstSnapshot !== null && days.length > 0 && firstSnapshot > days[0];
  return <ChartFrame title={title} csvName={csvName} columns={columns} rows={empty ? [] : rows}>
    {lateStart && <p className="muted">History starts on {longDay(firstSnapshot)}. Earlier days have no snapshot.</p>}
    <LineChart series={lines} yLabel={yLabel} />
  </ChartFrame>;
}

/** A horizontal bar chart; `columns`/`rows` override the default label/value table. */
export function BarPanel({ title, csvName, data, columns, rows }: {
  title: string;
  csvName: string;
  data: BarDatum[];
  columns?: ChartColumn[];
  rows?: Record<string, unknown>[];
}) {
  const empty = !hasValue(data.map((d) => d.value));
  const cols = columns ?? [{ key: "label", label: "Name" }, { key: "value", label: "Count" }];
  const body = rows ?? data.map((d) => ({ label: d.label, value: d.value }));
  return <ChartFrame title={title} csvName={csvName} columns={cols} rows={empty ? [] : body}>
    <BarChart data={data} horizontal label={title} />
  </ChartFrame>;
}

export const csvName = (win: Window, tab: string, chart: string) => `chulacraft-${tab}-${chart}-${win.range}-${win.today}`;

export const tabHref = (tab: string, range: string) => `/admin/insights?tab=${tab}&range=${range}`;
