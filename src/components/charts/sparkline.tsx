import { linePath, linearScale } from "./scale";
import styles from "./charts.module.css";

const W = 120;
const H = 32;
const PAD = 3;

const finite = (v: number | null): v is number => v !== null && Number.isFinite(v);

/** "Signups: 4 to 12" from the first and last values present. */
export function sparkLabel(values: (number | null)[], label: string): string {
  const present = values.filter(finite);
  if (present.length === 0) return `${label}: no data`;
  const [first, last] = [present[0], present.at(-1)!].map((v) => v.toLocaleString("en"));
  return present.length === 1 ? `${label}: ${first}` : `${label}: ${first} to ${last}`;
}

/** Points for a 120×32 sparkline; a null value is a gap. */
export function sparkPoints(values: (number | null)[]) {
  const present = values.filter(finite);
  // Min to max, not zero-based: a sparkline shows the trend's shape.
  const y = present.length ? linearScale([Math.min(...present), Math.max(...present)], [H - PAD, PAD]) : () => H / 2;
  const x = linearScale([0, values.length - 1], [PAD, W - PAD]);
  return values.map((v, i) => (finite(v) ? { x: x(i), y: y(v) } : null));
}

export function Sparkline({ values, label }: { values: (number | null)[]; label: string }) {
  const points = sparkPoints(values);
  const last = points.filter((p) => p !== null).at(-1);
  return <svg className={styles.spark} viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={sparkLabel(values, label)}>
    <path className={styles.line} d={linePath(points)} />
    {last && <circle className={styles.dot} cx={last.x} cy={last.y} r={2.5} />}
  </svg>;
}
