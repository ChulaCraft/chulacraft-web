import { ChartFrame } from "@/components/charts/chart-frame";
import { FunnelChart, funnelNote, type FunnelStep } from "@/components/charts/funnel-chart";
import type { FunnelData } from "@/lib/insights/rpc";
import type { Window } from "../data";
import { csvName } from "./shared";

const STEP_LABELS: Record<string, string> = {
  signed_in: "Signed in",
  discord: "Discord linked",
  verified: "Chula or guest verified",
  registered: "Minecraft name registered",
  whitelisted: "Whitelisted",
};

/** The cohort funnel: players who signed up in the range, by the furthest step they have reached now. */
export function Funnel({ win, tab, data }: { win: Window; tab: string; data: FunnelData }) {
  const title = "Registration funnel";
  const steps: FunnelStep[] = data.steps.map((s) => ({ step: s.step, label: STEP_LABELS[s.step] ?? s.step, n: s.n }));
  const columns = [{ key: "step", label: "Step" }, { key: "n", label: "Players" }, { key: "note", label: "Of previous step" }];
  const rows = (steps[0]?.n ?? 0) > 0 ? steps.map((s, i) => ({ step: s.label, n: s.n, note: funnelNote(steps, i).note })) : [];
  return <ChartFrame title={title} csvName={csvName(win, tab, "funnel")} columns={columns} rows={rows}>
    <p className="muted">Players who signed up in this range, counted at each step they have reached by now.</p>
    <FunnelChart steps={steps} label={title} />
  </ChartFrame>;
}
