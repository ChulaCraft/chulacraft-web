"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { selectionParam } from "@/app/admin/commu/achievements/selection";
import { ReviewDialog, type ReviewRow } from "@/components/review-dialog";
import styles from "../admin.module.css";
import { bulkBan, bulkMarkGuest, type BulkResult } from "./actions";
import { MAX_BULK } from "./params";

export type AchievementOption = { id: string; name: string };
export type BulkPermissions = { guest: boolean; ban: boolean; award: boolean };

const say = (r: BulkResult) => "error" in r
  ? (r.error === "TOO_MANY" ? `Select ${MAX_BULK} players or fewer.` : "That selection can't be used. Reload and try again.")
  : `${r.done} done${r.skipped.length ? `, ${r.skipped.length} skipped (${[...new Set(r.skipped.map((s) => s.code))].join(", ")})` : ""}.`;

const SHOWN = 20;
const AWARD_MAX = 200;

/** Actions for the ticked rows. Each player still goes through the same RPC as
 *  the single-player buttons, so the database applies every role rule. Guest and
 *  ban open a review first; `names` (id to display name) lists who is affected. */
export function BulkBar({ ids, names = {}, achievements, can, onClear, onResult }: { ids: string[]; names?: Record<string, string>; achievements: AchievementOption[]; can: BulkPermissions; onClear: () => void; onResult: (message: string) => void }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [award, setAward] = useState("");
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<{ action: "guest" | "ban"; message: string; key: string } | null>(null);
  /** A failure belongs to the selection it came from; a different selection starts clean. */
  const key = ids.join(",");
  const shown = problem?.key === key ? problem : null;

  /** Awaited by the dialog's action, so Confirm stays pending until the job is done. A failure stays in the dialog. */
  const run = async (action: "guest" | "ban", job: () => Promise<BulkResult>) => {
    setPending(true);
    setProblem(null);
    try {
      const result = await job();
      if ("error" in result) { setProblem({ action, message: say(result), key }); return; }
      onResult(say(result));
      onClear();
      router.refresh();
    } catch {
      setProblem({ action, message: "The bulk action failed. Try again.", key });
    } finally {
      setPending(false);
    }
  };
  const tooMany = ids.length > MAX_BULK;

  const rows = (before: string, after: string): ReviewRow[] => {
    const list = ids.slice(0, SHOWN).map((id) => ({ label: names[id] ?? id.slice(0, 8), before, after }));
    return ids.length > SHOWN ? [...list, { label: `and ${ids.length - SHOWN} more`, before, after }] : list;
  };
  const count = `${ids.length} ${ids.length === 1 ? "player" : "players"}`;

  return (
    <div className={styles.bulkBar} role="region" aria-label="Bulk actions">
      <strong>{ids.length} selected</strong>
      {can.guest && (
        <ReviewDialog
          action={() => run("guest", () => bulkMarkGuest(ids))} error={shown?.action === "guest" ? shown.message : null} onClose={() => setProblem(null)}
          trigger="Mark as guest" triggerClassName="btn btn-sm" disabled={pending || tooMany}
          title={`Mark ${count} as verified (guest)?`}
          rows={rows("Not verified", "Verified (guest)")}
          warning="Players who already have a verified Chula link, and players you can't change, are skipped."
          confirmLabel={`Mark ${ids.length} as guest`}
        />
      )}
      {can.ban && <>
        <label htmlFor="bulk-reason" className="sr-only">Ban reason (admins only see this)</label>
        <input id="bulk-reason" className="input" placeholder="Ban reason" maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
        <ReviewDialog
          action={() => run("ban", () => bulkBan(ids, reason))} error={shown?.action === "ban" ? shown.message : null} onClose={() => setProblem(null)}
          trigger="Ban…" triggerClassName="btn btn-sm" disabled={pending || tooMany || !reason.trim()}
          title={`Ban ${count}?`}
          rows={rows("Not banned", "Banned")}
          warning={`Reason: ${reason.trim()}. Their whitelisted Minecraft accounts are turned off. Admins and you are skipped.`}
          confirmLabel={`Ban ${ids.length}`} confirmClassName="btn btn-danger"
        />
      </>}
      {tooMany && (can.guest || can.ban) && <span className="hint" role="status">Guest and ban work on {MAX_BULK} players or fewer. Untick some.</span>}
      {can.award && achievements.length > 0 && <>
        <label htmlFor="bulk-award" className="sr-only">Achievement to award</label>
        <select id="bulk-award" className="input" value={award} onChange={(e) => setAward(e.target.value)}>
          <option value="">Award achievement…</option>
          {achievements.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        {award && (ids.length > AWARD_MAX
          ? <><button type="button" className="btn btn-sm" disabled>Go</button><span className="hint" role="status">Select {AWARD_MAX} players or fewer</span></>
          : <Link className="btn btn-sm" href={`/admin/commu/achievements/${award}/award?sel=${selectionParam(ids)}`}>Go</Link>)}
      </>}
      <button type="button" className="link-button" onClick={onClear}>Clear</button>
      {pending && <span className="muted">Working…</span>}
    </div>
  );
}
