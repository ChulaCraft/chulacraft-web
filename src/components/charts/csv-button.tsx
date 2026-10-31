"use client";

import { toCsv } from "@/lib/insights/csv";
import type { ChartColumn } from "./chart-frame";
import styles from "./charts.module.css";

/** Builds the CSV from the exact rows the chart drew; no extra route. */
export function CsvButton({ name, columns, rows, title }: { name: string; columns: ChartColumn[]; rows: Record<string, unknown>[]; title: string }) {
  function download() {
    const url = URL.createObjectURL(new Blob([toCsv(columns, rows)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.csv`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return <button type="button" className={styles.csv} onClick={download}>
    Download CSV<span className="sr-only">: {title}</span>
  </button>;
}
