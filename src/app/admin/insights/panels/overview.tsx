import type { CommunityData, EventsData, FunnelData, Loaded, PlayersData } from "@/lib/insights/rpc";
import { countValues, earliest, snapValues, stat, type Window } from "../data";
import styles from "../insights.module.css";
import { Funnel } from "./funnel";
import { PanelAlert, PanelEmpty, TileGroup, csvName, tabHref, type Tile } from "./shared";

export function OverviewPanel({ win, players, funnel, events, community, vercelUrl }: {
  win: Window;
  players: Loaded<PlayersData>;
  funnel: Loaded<FunnelData>;
  events: Loaded<EventsData>;
  community: Loaded<CommunityData>;
  vercelUrl?: string;
}) {
  const tiles: Tile[] = [];
  if (players.data) {
    const { snapshots, signups } = players.data;
    const days = win.statDays(earliest(snapshots, signups));
    tiles.push(
      { label: "Players total", stat: stat(win, "last", snapValues(snapshots, (s) => s.players, days)), href: tabHref("players", win.range) },
      { label: "New signups", stat: stat(win, "sum", countValues(signups, (s) => s.n, days)) },
      { label: "Verified (Chula + guest)", stat: stat(win, "last", snapValues(snapshots, (s) => s.verified + s.guests, days)) },
      { label: "Whitelisted", stat: stat(win, "last", snapValues(snapshots, (s) => s.whitelisted, days)) },
    );
  }
  if (events.data) {
    const days = win.statDays(earliest(events.data.attendance));
    tiles.push({ label: "Event attendance", stat: stat(win, "sum", countValues(events.data.attendance, (a) => a.n, days)), href: tabHref("events", win.range) });
  }
  if (community.data) {
    const days = win.statDays(earliest(community.data.reports));
    tiles.push({ label: "Reports opened", stat: stat(win, "sum", countValues(community.data.reports, (r) => r.opened, days)), href: tabHref("community", win.range) });
  }

  const anyData = tiles.some((t) => (t.stat.value ?? 0) !== 0 || t.stat.series.some((v) => v)) || (funnel.data?.steps[0]?.n ?? 0) > 0;
  const loadedAny = players.data || funnel.data || events.data || community.data;

  return <>
    {players.error && <PanelAlert what="player numbers" />}
    {events.error && <PanelAlert what="event numbers" />}
    {community.error && <PanelAlert what="report numbers" />}
    {funnel.error && <PanelAlert what="the registration funnel" />}
    {loadedAny && !anyData ? <PanelEmpty /> : <>
      <TileGroup title="Overview numbers" csvName={csvName(win, "overview", "tiles")} tiles={tiles} />
      {funnel.data && <Funnel win={win} tab="overview" data={funnel.data} />}
    </>}
    {vercelUrl && <p className={styles.external}>
      Page views and visitors are in <a href={vercelUrl} target="_blank" rel="noreferrer">Vercel Analytics<span className="sr-only"> (opens in a new tab)</span> <span aria-hidden="true">↗</span></a>
    </p>}
  </>;
}
