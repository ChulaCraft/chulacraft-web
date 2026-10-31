"use client";

import { useState, type KeyboardEvent } from "react";
import { cursorKey } from "./scale";
import styles from "./charts.module.css";

/** One drawn bar: `width` is its length as a % of the longest (0-100). */
export type BarRow = { label: string; value: string; note?: string; width: number };

/** "Engineering: 42" or "Verified: 150 · 83% of previous step": the tooltip
 *  and screen-reader readout for one bar. */
export function barReadout(row: BarRow): string {
  return `${row.label}: ${row.value}${row.note ? ` · ${row.note}` : ""}`;
}

/**
 * The interactive layer shared by BarChart and FunnelChart, on the same
 * model as LineChart: the list is one tab stop, arrow keys (and Home/End) move
 * a cursor across bars, the pointer does the same, and a tooltip shows the
 * bar's label and value. Each row's own text names it for screen readers;
 * key moves are also announced.
 */
export function BarRows({ rows, label, vertical = false }: { rows: BarRow[]; label: string; vertical?: boolean }) {
  const [cursor, setCursor] = useState<number | null>(null);
  const [spoken, setSpoken] = useState("");
  const n = rows.length;
  const at = cursor !== null && cursor < n ? cursor : null;

  function onKeyDown(e: KeyboardEvent<HTMLUListElement>) {
    const next = cursorKey(at, e.key, n, true);
    if (next === undefined) return;
    e.preventDefault();
    setCursor(next);
    setSpoken(next === null ? "" : barReadout(rows[next]));
  }

  const tooltip = (i: number) => {
    const row = rows[i];
    // Keep the tooltip inside the chart: ends anchor to their side.
    const side = !vertical ? styles.tipStart : i < n / 3 ? styles.tipStart : i >= (2 * n) / 3 ? styles.tipEnd : styles.tipMiddle;
    return <div className={`${styles.tooltip} ${styles.barTip} ${side}`} aria-hidden="true">
      <div className={styles.tooltipDay}>{row.label}</div>
      <div className={styles.tooltipRow}><strong>{row.value}</strong>{row.note && <span>· {row.note}</span>}</div>
    </div>;
  };

  return <div className={styles.plotWrap}>
    <ul
      className={vertical ? styles.columns : styles.bars}
      tabIndex={0}
      aria-label={`${label}. Use the arrow keys to read each bar.`}
      onKeyDown={onKeyDown}
      onPointerLeave={() => setCursor(null)}
      onBlur={() => setCursor(null)}
    >
      {rows.map((row, i) => <li key={i} data-active={i === at || undefined} onPointerEnter={() => setCursor(i)}>
        {vertical ? <>
          <span className={styles.colPlot}>
            <span className={styles.barValue}>{row.value}</span>
            <span className={styles.column} style={{ height: `calc((100% - 24px) * ${row.width / 100})` }} />
          </span>
          <span className={styles.colLabel}>{row.label}</span>
        </> : <>
          <span className={styles.barLabel}>{row.label}{row.note && <span className={styles.barNote}><br />{row.note}</span>}</span>
          <span className={styles.barTrack}>
            <span className={styles.bar} style={{ width: `calc((100% - 9ch) * ${row.width / 100})` }} />
            <span className={styles.barValue}>{row.value}</span>
          </span>
        </>}
        {i === at && tooltip(i)}
      </li>)}
    </ul>
    <p className="sr-only" aria-live="polite">{spoken}</p>
  </div>;
}
