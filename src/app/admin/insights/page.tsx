import { timed } from "@/lib/perf";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { parseRange, type Range } from "@/lib/insights/range";
import { insightsRpc } from "@/lib/insights/rpc";
import { TABS, allowedTabs, pickTab, type TabId } from "@/lib/insights/tabs";
import { createClient } from "@/lib/supabase/server";
import adminStyles from "../admin.module.css";
import { myRole } from "../staff-gate";
import { longDay, makeWindow, type Window } from "./data";
import styles from "./insights.module.css";
import { CommunityPanel } from "./panels/community";
import { EventsPanel } from "./panels/events";
import { OverviewPanel } from "./panels/overview";
import { PlayersPanel } from "./panels/players";
import { tabHref } from "./panels/shared";
import { StaffPanel } from "./panels/staff";

export const metadata: Metadata = { title: "Insights" };

const RANGES: { id: Range; label: string }[] = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "all", label: "All time" },
];

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function InsightsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const search = await searchParams;
  const allowed = allowedTabs(await timed("myRole", myRole()));
  const tab = pickTab(one(search.tab), allowed);
  if (!tab) notFound();
  const range = parseRange(one(search.range));
  const win = makeWindow(range);
  const tabLabel = TABS.find((t) => t.id === tab)!.label;
  const rangeLabel = RANGES.find((r) => r.id === range)!.label;

  return <div className={styles.page}>
    <p className={styles.printHeader} data-print-header>ChulaCraft Insights · {tabLabel} · {rangeLabel} · printed {longDay(win.today)}</p>
    <div className={adminStyles.titleRow}>
      <div>
        <h1 className={adminStyles.title}>Insights</h1>
        <p className="muted">Numbers from when this page loaded, by Bangkok day.</p>
      </div>
      <nav className={adminStyles.subnav} aria-label="Range">
        {RANGES.map((r) => <Link key={r.id} href={tabHref(tab, r.id)} scroll={false} aria-current={r.id === range ? "page" : undefined}>{r.label}</Link>)}
      </nav>
    </div>
    <nav className={`${adminStyles.subnav} ${styles.tabs}`} aria-label="Insights tabs">
      {allowed.map((id) => <Link key={id} href={tabHref(id, range)} scroll={false} aria-current={id === tab ? "page" : undefined}>{TABS.find((t) => t.id === id)!.label}</Link>)}
    </nav>
    <Panel tab={tab} win={win} />
  </div>;
}

/** Fetches only what this tab draws, in one round of parallel calls. */
async function Panel({ tab, win }: { tab: TabId; win: Window }) {
  const supabase = await createClient();
  const days = win.days;
  switch (tab) {
    case "overview": {
      const [players, funnel, events, community] = await Promise.all([
        timed("insights_players", insightsRpc(supabase, "insights_players", days)),
        timed("insights_funnel", insightsRpc(supabase, "insights_funnel", days)),
        timed("insights_events", insightsRpc(supabase, "insights_events", days)),
        timed("insights_community", insightsRpc(supabase, "insights_community", days)),
      ]);
      return <OverviewPanel win={win} players={players} funnel={funnel} events={events} community={community} vercelUrl={process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_URL || undefined} />;
    }
    case "players": {
      const [players, funnel] = await Promise.all([timed("insights_players", insightsRpc(supabase, "insights_players", days)), timed("insights_funnel", insightsRpc(supabase, "insights_funnel", days))]);
      return <PlayersPanel win={win} players={players} funnel={funnel} />;
    }
    case "events":
      return <EventsPanel win={win} events={await timed("insights_events", insightsRpc(supabase, "insights_events", days))} />;
    case "community":
      return <CommunityPanel win={win} community={await timed("insights_community", insightsRpc(supabase, "insights_community", days))} />;
    case "staff":
      return <StaffPanel win={win} staff={await timed("insights_staff", insightsRpc(supabase, "insights_staff", days))} />;
  }
}
