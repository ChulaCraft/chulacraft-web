import { BarRows, type BarRow } from "./bar-rows";

export type BarDatum = { label: string; value: number };

/** Each bar's length as a % of the largest; 0 when there is nothing to compare. */
export function barWidths(values: number[]): number[] {
  const max = Math.max(0, ...values.filter(Number.isFinite));
  return values.map((v) => (max > 0 && Number.isFinite(v) && v > 0 ? (v / max) * 100 : 0));
}

const shown = (v: number) => (Number.isFinite(v) ? v.toLocaleString("en") : "–");

export function barRows(data: BarDatum[]): BarRow[] {
  const widths = barWidths(data.map((d) => d.value));
  return data.map((d, i) => ({ label: d.label, value: shown(d.value), width: widths[i] }));
}

/**
 * One series of bars, the value at each bar's tip. `horizontal` is for long
 * labels (faculties, badge names in Thai): rows are HTML, so a label wraps
 * rather than overflowing. Vertical columns suit a few short labels. `label`
 * names the chart for screen readers (pass the frame's title). Bars take
 * pointer and arrow-key tooltips (see BarRows).
 */
export function BarChart({ data, horizontal = false, label = "Bar chart" }: { data: BarDatum[]; horizontal?: boolean; label?: string }) {
  return <BarRows rows={barRows(data)} label={label} vertical={!horizontal} />;
}
