import { barWidths } from "./bar-chart";
import { BarRows } from "./bar-rows";

export type FunnelStep = { step: string; label: string; n: number };

/** "1,204" for the first step, then "980 · 81% of previous step". A previous
 *  step of 0 has no meaningful share, so it reads "– of previous step". */
export function funnelNote(steps: FunnelStep[], i: number): { count: string; note: string } {
  const count = steps[i].n.toLocaleString("en");
  if (i === 0) return { count, note: "" };
  const prev = steps[i - 1].n;
  return { count, note: prev > 0 ? `${Math.round((steps[i].n / prev) * 100)}% of previous step` : "– of previous step" };
}

/** The cohort funnel: one bar per step, each as long as its share of the
 *  largest. The tooltip reads "n · x% of previous step". */
export function FunnelChart({ steps, label = "Funnel" }: { steps: FunnelStep[]; label?: string }) {
  const widths = barWidths(steps.map((s) => s.n));
  const rows = steps.map((s, i) => {
    const { count, note } = funnelNote(steps, i);
    return { label: s.label, value: count, note, width: widths[i] };
  });
  return <BarRows rows={rows} label={label} />;
}
