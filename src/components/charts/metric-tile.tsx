import Link from "next/link";
import type { Delta } from "@/lib/insights/range";
import { Sparkline } from "./sparkline";
import styles from "./charts.module.css";

const ARROW: Record<Delta["kind"], string> = { up: "▲", down: "▼", flat: "▶", new: "✦", none: "" };
const SPOKEN: Record<Delta["kind"], string> = { up: "Up", down: "Down", flat: "No change", new: "New", none: "" };

/** "Up +12% vs previous period" — the change in words, never colour alone. */
export function deltaText(d: Delta | null): string {
  if (!d || d.kind === "none") return "";
  if (d.kind === "new") return "New vs previous period (was 0)";
  if (d.kind === "flat") return "No change vs previous period";
  return `${SPOKEN[d.kind]} ${d.label} vs previous period`;
}

/**
 * A headline number: label, value, the change vs the previous period (sign +
 * words, from `delta()`), and an optional trend sparkline. With `href` the
 * whole tile is a link. `delta` null or kind "none" (the "all" range) hides
 * the change line; an empty `series` hides the sparkline.
 */
export function MetricTile({ label, value, delta, series = [], href }: {
  label: string;
  value: number | string;
  delta: Delta | null;
  series?: (number | null)[];
  href?: string;
}) {
  const shown = typeof value === "number" ? (Number.isFinite(value) ? value.toLocaleString("en") : "–") : value;
  const change = deltaText(delta);
  const body = <>
    <span className={styles.tileLabel}>{label}</span>
    <span className={styles.tileValue}>{shown}</span>
    {change && delta && <span className={styles.tileDelta}>
      <span aria-hidden="true">{ARROW[delta.kind]} {delta.label} vs prev.</span>
      <span className="sr-only">{change}</span>
    </span>}
    {series.length > 0 && <span className={styles.tileSpark}><Sparkline values={series} label={`${label} trend`} /></span>}
  </>;
  return href ? <Link href={href} className={styles.tile}>{body}</Link> : <div className={styles.tile}>{body}</div>;
}
