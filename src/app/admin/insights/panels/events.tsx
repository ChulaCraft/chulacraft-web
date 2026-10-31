import { barWidths } from "@/components/charts/bar-chart";
import { BarRows } from "@/components/charts/bar-rows";
import { ChartFrame } from "@/components/charts/chart-frame";
import type { EventsData, Loaded } from "@/lib/insights/rpc";
import { bangkokDay } from "@/lib/insights/series";
import { countValues, earliest, longDay, stat, type Window } from "../data";
import styles from "../insights.module.css";
import { BarPanel, LinePanel, PanelAlert, PanelEmpty, TileGroup, csvName } from "./shared";

export function EventsPanel({ win, events }: { win: Window; events: Loaded<EventsData> }) {
  if (events.error) return <PanelAlert what="event numbers" />;
  const byDay = events.data.events.map((e) => ({ ...e, day: bangkokDay(e.starts_at) }));
  const { attendance } = events.data;
  const first = earliest(byDay, attendance);
  const days = win.chartDays(first);
  const shown = new Set(days);
  const current = byDay.filter((e) => shown.has(e.day));
  if (current.length === 0) return <PanelEmpty />;

  const statDays = win.statDays(first);
  const name = (chart: string) => csvName(win, "events", chart);

  // Newest 12 first. Each bar is attendance on one scale shared with interest.
  const newest = [...current].sort((a, b) => b.starts_at.localeCompare(a.starts_at)).slice(0, 12);
  const widths = barWidths([...newest.map((e) => e.attendance), ...newest.map((e) => e.interest)]).slice(0, newest.length);
  const perEvent = "Interest and attendance per event";
  const sum = (pick: (e: (typeof current)[number]) => number) => current.reduce((s, e) => s + pick(e), 0);

  return <>
    <TileGroup title="Event numbers" csvName={name("tiles")} tiles={[
      { label: "Events held", stat: stat(win, "sum", countValues(byDay, () => 1, statDays)) },
      { label: "Interested", stat: stat(win, "sum", countValues(byDay, (e) => e.interest, statDays)) },
      { label: "Attended", stat: stat(win, "sum", countValues(attendance, (a) => a.n, statDays)) },
    ]} />
    <ChartFrame title={perEvent} csvName={name("per-event")}
      columns={[{ key: "name", label: "Event" }, { key: "day", label: "Starts" }, { key: "interest", label: "Interested" }, { key: "attendance", label: "Attended" }]}
      rows={newest.map((e) => ({ name: e.name, day: e.day, interest: e.interest, attendance: e.attendance }))}>
      <p className="muted">Newest {newest.length === 1 ? "event" : `${newest.length} events`} in this range. The bar is attendance.</p>
      <BarRows label={perEvent} rows={newest.map((e, i) => ({
        label: `${e.name} (${longDay(e.day)})`,
        value: `${e.attendance.toLocaleString("en")} attended`,
        note: `${e.interest.toLocaleString("en")} interested`,
        width: widths[i],
      }))} />
    </ChartFrame>
    <div className={styles.grid}>
      <LinePanel title="Attendance per day" csvName={name("attendance")} yLabel="Attendees" days={days}
        series={[{ name: "Attended", values: countValues(attendance, (a) => a.n, days) }]} />
      <BarPanel title="Check-in method" csvName={name("method")} data={[
        { label: "Self check-in", value: sum((e) => e.self) },
        { label: "Checked in by staff", value: sum((e) => e.staff) },
        { label: "Added afterwards", value: sum((e) => e.backfill) },
      ]} columns={[{ key: "label", label: "Method" }, { key: "value", label: "Attendees" }]} />
    </div>
  </>;
}
