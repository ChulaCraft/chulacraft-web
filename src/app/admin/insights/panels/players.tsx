import type { FunnelData, Loaded, PlayersData } from "@/lib/insights/rpc";
import { countValues, earliest, playerStats, snapValues, stat, type Window } from "../data";
import styles from "../insights.module.css";
import { Funnel } from "./funnel";
import { BarPanel, LinePanel, PanelAlert, PanelEmpty, TileGroup, csvName } from "./shared";

export function PlayersPanel({ win, players, funnel }: { win: Window; players: Loaded<PlayersData>; funnel: Loaded<FunnelData> }) {
  return <>
    {players.error ? <PanelAlert what="player numbers" /> : <PlayerCharts win={win} data={players.data} />}
    {funnel.error ? <PanelAlert what="the registration funnel" /> : <FunnelSection win={win} data={funnel.data} />}
  </>;
}

function PlayerCharts({ win, data }: { win: Window; data: PlayersData }) {
  const { snapshots, signups, faculty } = data;
  if (snapshots.length === 0 && signups.length === 0 && faculty.every((f) => f.n === 0)) return <PanelEmpty />;

  const first = earliest(snapshots, signups);
  const statDays = win.statDays(first);
  const core = playerStats(win, data);
  const days = win.chartDays(first);
  const snap = (pick: (s: PlayersData["snapshots"][number]) => number) => snapValues(snapshots, pick, days);
  const history = { win, rows: snapshots };
  const name = (chart: string) => csvName(win, "players", chart);

  return <>
    <TileGroup title="Player numbers" csvName={name("tiles")} tiles={[
      { label: "Players total", stat: core.players },
      { label: "New signups", stat: core.signups },
      { label: "Chula verified", stat: core.verified },
      { label: "Guests", stat: core.guests },
      { label: "Whitelisted", stat: stat(win, "last", snapValues(snapshots, (s) => s.whitelisted, statDays)) },
      { label: "Banned", stat: stat(win, "last", snapValues(snapshots, (s) => s.banned, statDays)) },
    ]} />
    <div className={styles.grid}>
      <LinePanel title="Players over time" csvName={name("total")} yLabel="Players" days={days} history={history}
        series={[{ name: "Players", values: snap((s) => s.players) }, { name: "Whitelisted", values: snap((s) => s.whitelisted) }]} />
      <LinePanel title="New signups per day" csvName={name("signups")} yLabel="Signups" days={days}
        series={[{ name: "Signups", values: countValues(signups, (s) => s.n, days) }]} />
      <LinePanel title="Chula vs guest" csvName={name("chula-guest")} yLabel="Players" days={days} history={history}
        series={[{ name: "Chula verified", values: snap((s) => s.verified) }, { name: "Guests", values: snap((s) => s.guests) }]} />
      <LinePanel title="Unverified and banned" csvName={name("unverified-banned")} yLabel="Players" days={days} history={history}
        series={[{ name: "Unverified", values: snap((s) => s.unverified) }, { name: "Banned", values: snap((s) => s.banned) }]} />
    </div>
    <BarPanel title="Players by faculty (now)" csvName={name("faculty")} data={faculty.map((f) => ({ label: f.faculty, value: f.n }))}
      columns={[{ key: "label", label: "Faculty" }, { key: "value", label: "Players" }]} />
  </>;
}

function FunnelSection({ win, data }: { win: Window; data: FunnelData }) {
  const inRange = new Set(win.chartDays(earliest(data.failures)));
  const totals = new Map<string, number>();
  for (const f of data.failures) if (inRange.has(f.day)) totals.set(`${f.step} · ${f.code}`, (totals.get(`${f.step} · ${f.code}`) ?? 0) + f.n);
  const failures = [...totals].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([label, value]) => ({ label, value }));
  return <div className={styles.grid}>
    <Funnel win={win} tab="players" data={data} />
    <BarPanel title="Registration failures by step and code" csvName={csvName(win, "players", "failures")} data={failures}
      columns={[{ key: "label", label: "Step · code" }, { key: "value", label: "Failures" }]} />
  </div>;
}
