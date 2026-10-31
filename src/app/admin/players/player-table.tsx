"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { SortHeader } from "@/components/data-table";
import { VerificationBadge, type VerificationKind } from "@/components/verification-badge";
import { ROLE_LABELS } from "@/lib/staff";
import type { Filters, RawParams } from "@/lib/table-query";
import styles from "../admin.module.css";
import { loadPlayers } from "./actions";
import { BulkBar, type AchievementOption, type BulkPermissions } from "./bulk-bar";
import { BASE, COLUMNS, hrefFor, readPlayers, type PlayerRow } from "./params";

const kind = (value: string): VerificationKind => (value === "verified" || value === "guest" ? value : "unverified");
const joined = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium" });
const day = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
const WHITELIST: Record<string, [string, string]> = {
  whitelisted: ["Whitelisted", "badge-green"], pending: ["Pending sync", "badge-amber"], retrying: ["Retrying", "badge-danger"], none: ["None", "badge-muted"],
};

export function PlayerTable({ initial, total, search, achievements, can }: { initial: PlayerRow[]; total: number; search: RawParams; achievements: AchievementOption[]; can: BulkPermissions }) {
  const state = readPlayers(search);
  const [rows, setRows] = useState(initial);
  const [failed, setFailed] = useState(false);
  // router.refresh() after a bulk action sends a new first page; start over from
  // it, or the next scroll would page against stale offsets and skip players.
  const [base, setBase] = useState(initial);
  if (base !== initial) { setBase(initial); setRows(initial); setFailed(false); }
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState("");
  const sentinel = useRef<HTMLDivElement>(null);
  const done = rows.length >= total;
  /** Every value in the table filters the table to it. */
  const only = (filters: Filters) => hrefFor(state, { filters });

  const more = (retry = false) => {
    if (pending || done || (failed && !retry)) return;
    setFailed(false);
    start(async () => {
      const page = await loadPlayers(search, rows.length);
      if ("error" in page) { setFailed(true); return; }
      // Dedupe by id: a player who joined mid-scroll shifts offsets by one.
      setRows((prev) => { const seen = new Set(prev.map((r) => r.user_id)); return [...prev, ...page.rows.filter((r) => !seen.has(r.user_id))]; });
    });
  };

  useEffect(() => {
    const el = sentinel.current;
    if (!el || done) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && more(), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  });

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const selectable = can.guest || can.ban || can.award;
  const allOnScreen = rows.length > 0 && rows.every((r) => selected.has(r.user_id));
  const filtered = state.q !== "" || Object.keys(state.filters).length > 0;

  return <>
    <p role="status" className="hint">{result}</p>
    {selected.size > 0 && <BulkBar ids={[...selected]} achievements={achievements} can={can} onClear={() => setSelected(new Set())} onResult={setResult} />}
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {selectable && <th scope="col"><input type="checkbox" aria-label="Select all loaded players" checked={allOnScreen} disabled={rows.length === 0}
              onChange={() => setSelected(allOnScreen ? new Set() : new Set(rows.map((r) => r.user_id)))} /></th>}
            {COLUMNS.map((c) => <SortHeader key={c.key} column={c} base={BASE} state={state} />)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const [wlLabel, wlClass] = WHITELIST[r.whitelist] ?? WHITELIST.none;
            return (
              <tr key={r.user_id} aria-selected={selected.has(r.user_id)}>
                {selectable && <td><input type="checkbox" aria-label={`Select ${r.display_name ?? r.handle}`} checked={selected.has(r.user_id)} onChange={() => toggle(r.user_id)} /></td>}
                <td>
                  <Link href={`/admin/users/${r.user_id}`}><strong>{r.display_name ?? r.handle}</strong></Link><br />
                  <Link href={`/admin/users/${r.user_id}`} className={styles.small}>{r.handle}</Link>
                </td>
                <td className="mono">
                  {r.minecraft_usernames
                    ? r.minecraft_usernames.split(", ").map((name, i) => <span key={name}>{i > 0 && ", "}<Link scroll={false} href={only({ minecraft: name })}>{name}</Link></span>)
                    : <Link scroll={false} href={only({ whitelist: ["none"] })} className="muted">—</Link>}
                </td>
                <td><Link scroll={false} href={only({ whitelist: [r.whitelist] })} className={`badge ${wlClass}`}>{wlLabel}</Link></td>
                <td><Link scroll={false} href={only({ status: [r.verification_kind] })} className={styles.cellLink}><VerificationBadge kind={kind(r.verification_kind)} /></Link></td>
                <td>
                  <Link scroll={false} href={only({ role: [r.role] })} className={r.role === "user" ? "muted" : "badge badge-lavender"}>{ROLE_LABELS[r.role] ?? r.role}</Link>
                </td>
                <td>
                  <Link scroll={false} href={only({ banned: [r.banned ? "yes" : "no"] })} className={r.banned ? "badge badge-danger" : "muted"}>{r.banned ? "Banned" : "No"}</Link>
                </td>
                <td><Link scroll={false} href={only({ joined_from: day(r.created_at), joined_to: day(r.created_at) })}><time dateTime={r.created_at}>{joined(r.created_at)}</time></Link></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className={styles.empty}>
          <p className="section-title">No players match</p>
          {filtered ? <Link scroll={false} href={BASE} className="link-button">Clear filters</Link> : <p className="muted">Nobody has signed in yet.</p>}
        </div>
      )}
    </div>
    {rows.length > 0 && (
      <div ref={sentinel} className={styles.tableFoot}>
        {failed ? <button className="btn btn-sm" onClick={() => more(true)}>Couldn&apos;t load more. Retry</button>
          : done ? <span className="muted">All {total.toLocaleString("en-GB")} loaded</span>
          : <button className="btn btn-sm" onClick={() => more()} disabled={pending} aria-busy={pending}>{pending ? "Loading…" : "Load more"}</button>}
      </div>
    )}
  </>;
}
