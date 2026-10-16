import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { FilterChips, FilterPanel, KeepState } from "@/components/data-table";
import { PixelIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import type { RawParams } from "@/lib/table-query";
import styles from "../admin.module.css";
import { staffCan } from "@/lib/staff";
import { myRole } from "../staff-gate";
import { loadPlayers } from "./actions";
import { activeView, BASE, COLUMNS, hrefFor, readPlayers, VIEWS } from "./params";
import { PlayerTable } from "./player-table";

export const metadata: Metadata = { title: "Players" };

export default async function AdminPlayersPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const search = await searchParams;
  const state = readPlayers(search);
  const supabase = await createClient();
  const role = await myRole();
  const isAdmin = staffCan(role, "admin");
  const can = { guest: isAdmin, ban: staffCan(role, "moderation"), award: staffCan(role, "community") };
  const [first, catalog] = await Promise.all([
    loadPlayers(search, 0),
    can.award ? supabase.rpc("admin_list_achievements") : Promise.resolve({ data: [] as { id: string; name: string; status: string }[] }),
  ]);
  const achievements = (catalog.data ?? []).filter((a) => a.status === "published").map((a) => ({ id: a.id, name: a.name }));
  const view = activeView(state);
  const ctx = { base: BASE, state };

  return <>
    <div className={styles.titleRow}>
      <h1 className={styles.title}>Players</h1>
      {isAdmin && <Link href="/admin/restore" className="link-button">Removed accounts →</Link>}
    </div>

    <Form scroll={false} action={BASE} className={`panel pixel-4 ${styles.search}`} role="search">
      <KeepState state={state} except={["q"]} />
      <label htmlFor="admin-q" className="label">Search players</label>
      <div className={styles.searchRow}>
        <div className={styles.searchInput}>
          <PixelIcon name="search" />
          <input id="admin-q" className="input" name="q" type="search" defaultValue={state.q} placeholder="Discord name or ID, Chula email, or Minecraft name" aria-describedby="q-help" />
        </div>
        <button className="btn btn-primary" type="submit">Search</button>
      </div>
      <p id="q-help" className="field-help">Includes removed Minecraft accounts.</p>
    </Form>

    <nav className={styles.subnav} aria-label="Views">
      {VIEWS.map((v) => (
        <Link scroll={false} key={v.label} href={hrefFor({ ...state, filters: {} }, { filters: v.filters })} aria-current={view === v.label ? "page" : undefined}>{v.label}</Link>
      ))}
    </nav>

    {"error" in first
      ? <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">Couldn&apos;t load players. Please try again.</p></div>
      : <>
        <div className={styles.tableBar}>
          {/* Keyed by the view so it closes once Apply has loaded the results. */}
          <FilterPanel key={hrefFor(state)} columns={COLUMNS} {...ctx} />
          <p className={styles.tableCount} aria-live="polite"><strong>{first.total.toLocaleString("en-GB")}</strong> {first.total === 1 ? "player" : "players"}</p>
          <FilterChips columns={COLUMNS} {...ctx} />
          {isAdmin && <a href={hrefFor(state).replace(BASE, `${BASE}/export`)} className="btn btn-sm" download><PixelIcon name="arrow" />Export CSV</a>}
        </div>
        <PlayerTable key={hrefFor(state)} initial={first.rows} total={first.total} search={search} achievements={achievements} can={can} />
      </>}
  </>;
}
