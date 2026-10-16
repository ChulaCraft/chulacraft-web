"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { selectionParam } from "@/app/admin/commu/achievements/selection";
import styles from "../admin.module.css";
import { bulkBan, bulkMarkGuest, type BulkResult } from "./actions";

export type AchievementOption = { id: string; name: string };

const say = (r: BulkResult) => "error" in r
  ? (r.error === "TOO_MANY" ? "Select 200 players or fewer." : "That selection can't be used. Reload and try again.")
  : `${r.done} done${r.skipped.length ? `, ${r.skipped.length} skipped (${[...new Set(r.skipped.map((s) => s.code))].join(", ")})` : ""}.`;

/** Actions for the ticked rows. Each player still goes through the same RPC as
 *  the single-player buttons, so the database applies every role rule. */
export function BulkBar({ ids, achievements, onClear, onResult }: { ids: string[]; achievements: AchievementOption[]; onClear: () => void; onResult: (message: string) => void }) {
  const router = useRouter();
  const ban = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");
  const [award, setAward] = useState("");
  const [pending, start] = useTransition();

  const run = (job: () => Promise<BulkResult>) => start(async () => {
    const result = await job();
    onResult(say(result));
    if (!("error" in result)) { onClear(); router.refresh(); }
  });

  return (
    <div className={styles.bulkBar} role="region" aria-label="Bulk actions">
      <strong>{ids.length} selected</strong>
      <button type="button" className="btn btn-sm" disabled={pending} onClick={() => run(() => bulkMarkGuest(ids))}>Mark as guest</button>
      <button type="button" className="btn btn-sm" disabled={pending} onClick={() => { setReason(""); ban.current?.showModal(); }}>Ban…</button>
      {achievements.length > 0 && <>
        <label htmlFor="bulk-award" className="sr-only">Achievement to award</label>
        <select id="bulk-award" className="input" value={award} onChange={(e) => setAward(e.target.value)}>
          <option value="">Award achievement…</option>
          {achievements.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        {award && <Link className="btn btn-sm" href={`/admin/commu/achievements/${award}/award?sel=${selectionParam(ids)}`}>Go</Link>}
      </>}
      <button type="button" className="link-button" onClick={onClear}>Clear</button>
      {pending && <span className="muted">Working…</span>}

      <dialog ref={ban} className="dialog" aria-label={`Ban ${ids.length} players`} onClick={(e) => { if (e.target === e.currentTarget) ban.current?.close(); }}>
        <form className="dialog-body" onSubmit={(e) => { e.preventDefault(); ban.current?.close(); run(() => bulkBan(ids, reason)); }}>
          <h2 className="dialog-title">Ban {ids.length} {ids.length === 1 ? "player" : "players"}?</h2>
          <p className="muted">Their whitelisted Minecraft accounts are turned off. Admins and you are skipped.</p>
          <div className="field">
            <label htmlFor="bulk-reason">Reason (admins only see this)</label>
            <input id="bulk-reason" className="input" required maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className="dialog-actions">
            <button type="button" className="btn" onClick={() => ban.current?.close()} autoFocus>Cancel</button>
            <button className="btn btn-primary" disabled={!reason.trim()}>Ban {ids.length}</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
