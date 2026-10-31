import type { Loaded, StaffData } from "@/lib/insights/rpc";
import { countValues, earliest, stat, type Window } from "../data";
import styles from "../insights.module.css";
import { BarPanel, LinePanel, PanelAlert, PanelEmpty, TileGroup, csvName } from "./shared";

/** "minecraft_registrations" → "Minecraft registrations". */
export const entityLabel = (e: string) => {
  const s = e.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export function StaffPanel({ win, staff }: { win: Window; staff: Loaded<StaffData> }) {
  if (staff.error) return <PanelAlert what="staff activity" />;
  const { actions } = staff.data;
  const first = earliest(actions);
  const days = win.chartDays(first);
  const shown = new Set(days);
  const current = actions.filter((a) => shown.has(a.day));
  if (current.length === 0) return <PanelEmpty />;
  const name = (chart: string) => csvName(win, "staff", chart);

  // Totals per entity in the range: the top 5, then everything else as "Other".
  const totals = new Map<string, number>();
  for (const a of current) totals.set(a.entity, (totals.get(a.entity) ?? 0) + a.n);
  const ranked = [...totals].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const top = ranked.slice(0, 5).map(([e, n]) => ({ label: entityLabel(e), value: n }));
  const other = ranked.slice(5).reduce((s, [, n]) => s + n, 0);
  const bars = other > 0 ? [...top, { label: "Other", value: other }] : top;

  // The daily line can carry three series: the two busiest areas and the rest.
  const lead = ranked.slice(0, 2).map(([e]) => e);
  const series = [
    ...lead.map((e) => ({ name: entityLabel(e), values: countValues(actions.filter((a) => a.entity === e), (a) => a.n, days) })),
    ...(ranked.length > 2 ? [{ name: "Other", values: countValues(actions.filter((a) => !lead.includes(a.entity)), (a) => a.n, days) }] : []),
  ];
  const statDays = win.statDays(first);

  return <>
    <TileGroup title="Staff numbers" csvName={name("tiles")} tiles={[
      { label: "Staff actions", stat: stat(win, "sum", countValues(actions, (a) => a.n, statDays)) },
      { label: "Days with staff actions", stat: stat(win, "sum", countValues(actions, () => 1, statDays).map((v) => (v > 0 ? 1 : 0))) },
    ]} />
    <div className={styles.grid}>
      <LinePanel title="Staff actions per day" csvName={name("per-day")} yLabel="Actions" days={days} series={series} />
      <BarPanel title="Staff actions by area" csvName={name("by-area")} data={bars}
        columns={[{ key: "label", label: "Area" }, { key: "value", label: "Actions" }]} />
    </div>
  </>;
}
