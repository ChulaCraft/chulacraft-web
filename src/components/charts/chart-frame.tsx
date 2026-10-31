import type { ReactNode } from "react";
import { CsvButton } from "./csv-button";
import styles from "./charts.module.css";

export type ChartColumn = { key: string; label: string };

const cell = (v: unknown) => (v === null || v === undefined || (typeof v === "number" && !Number.isFinite(v)) ? "–" : typeof v === "number" ? v.toLocaleString("en") : String(v));

/**
 * A chart's figure: the title, the chart itself, a "Download CSV" button and a
 * data table of the same `rows`. The table is visually hidden unless `table`
 * is set, so screen readers always get the numbers. With no rows the chart is
 * replaced by an empty message and there is nothing to download.
 */
export function ChartFrame({ title, csvName, columns, rows, table = false, children }: {
  title: string;
  csvName: string;
  columns: ChartColumn[];
  rows: Record<string, unknown>[];
  table?: boolean;
  children: ReactNode;
}) {
  const empty = rows.length === 0;
  return <figure className={styles.frame}>
    <div className={styles.head}>
      <figcaption className={styles.title}>{title}</figcaption>
      {!empty && <CsvButton name={csvName} columns={columns} rows={rows} title={title} />}
    </div>
    {empty ? <p className={styles.empty}>No data in this range</p> : children}
    {/* A table ignores sr-only's 1px width and can widen the page, so the
        hidden copy sits in an sr-only box instead. */}
    {!empty && <div className={table ? undefined : "sr-only"}><table className={table ? styles.table : undefined}>
      <caption className="sr-only">{title}</caption>
      <thead><tr>{columns.map((c) => <th key={c.key} scope="col">{c.label}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{columns.map((c) => <td key={c.key}>{cell(r[c.key])}</td>)}</tr>)}</tbody>
    </table></div>}
  </figure>;
}
