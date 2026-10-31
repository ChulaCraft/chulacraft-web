import type { CommunityData, Loaded } from "@/lib/insights/rpc";
import { countValues, earliest, stat, type Window } from "../data";
import styles from "../insights.module.css";
import { BarPanel, LinePanel, PanelAlert, PanelEmpty, TileGroup, csvName } from "./shared";

const TIER_LABELS: Record<string, string> = { common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary" };

export function CommunityPanel({ win, community }: { win: Window; community: Loaded<CommunityData> }) {
  if (community.error) return <PanelAlert what="community numbers" />;
  const { tiers, top, reports, appeals } = community.data;
  const first = earliest(reports, appeals);
  const days = win.chartDays(first);
  const statDays = win.statDays(first);
  const any = tiers.some((t) => t.owners > 0) || top.length > 0 || reports.length > 0 || appeals.length > 0;
  if (!any) return <PanelEmpty />;
  const name = (chart: string) => csvName(win, "community", chart);
  const tierLabel = (t: string) => TIER_LABELS[t] ?? t;

  return <>
    <TileGroup title="Moderation numbers" csvName={name("tiles")} tiles={[
      { label: "Reports opened", stat: stat(win, "sum", countValues(reports, (r) => r.opened, statDays)) },
      { label: "Reports resolved", stat: stat(win, "sum", countValues(reports, (r) => r.resolved, statDays)) },
      { label: "Appeals opened", stat: stat(win, "sum", countValues(appeals, (a) => a.opened, statDays)) },
      { label: "Appeals decided", stat: stat(win, "sum", countValues(appeals, (a) => a.decided, statDays)) },
    ]} />
    <div className={styles.grid}>
      <BarPanel title="Ownership by tier (now)" csvName={name("tiers")}
        data={tiers.map((t) => ({ label: tierLabel(t.tier), value: t.owners }))}
        columns={[{ key: "tier", label: "Tier" }, { key: "owners", label: "Players holding one" }, { key: "badges", label: "Published badges" }]}
        rows={tiers.map((t) => ({ tier: tierLabel(t.tier), owners: t.owners, badges: t.badges }))} />
      <BarPanel title="Top badges (now)" csvName={name("top-badges")}
        data={top.map((b) => ({ label: `${b.name} (${tierLabel(b.tier)})`, value: b.owners }))}
        columns={[{ key: "name", label: "Badge" }, { key: "tier", label: "Tier" }, { key: "owners", label: "Owners" }]}
        rows={top.map((b) => ({ name: b.name, tier: tierLabel(b.tier), owners: b.owners }))} />
      <LinePanel title="Reports opened and resolved" csvName={name("reports")} yLabel="Reports" days={days}
        series={[{ name: "Opened", values: countValues(reports, (r) => r.opened, days) }, { name: "Resolved", values: countValues(reports, (r) => r.resolved, days) }]} />
      <LinePanel title="Appeals opened and decided" csvName={name("appeals")} yLabel="Appeals" days={days}
        series={[{ name: "Opened", values: countValues(appeals, (a) => a.opened, days) }, { name: "Decided", values: countValues(appeals, (a) => a.decided, days) }]} />
    </div>
  </>;
}
