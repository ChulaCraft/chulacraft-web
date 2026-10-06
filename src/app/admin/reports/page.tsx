import type { Metadata } from "next";
import Link from "next/link";
import { PixelIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import styles from "../admin.module.css";
import { when } from "../overview";
import { handleReport } from "./actions";
import { SubmitButton } from "@/components/submit-button";

export const metadata: Metadata = { title: "Reports" };

const CATEGORIES: Record<string, string> = { grief: "Griefing", cheat: "Cheating", harassment: "Harassment", other: "Other" };
const ERRORS: Record<string, string> = {
  NOT_FOUND: "Another admin already handled that report.",
  INVALID: "Keep the note under 1000 characters.",
};
const DONE: Record<string, string> = {
  actioned: "Marked as actioned.",
  dismissed: "Report dismissed.",
};

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<{ status?: string; error?: string; done?: string }> }) {
  const { status: raw, error: errorCode, done } = await searchParams;
  const status = raw === "actioned" || raw === "dismissed" ? raw : "open";
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_reports", { p_status: status });
  const reports = data ?? [];

  return <>
    <div className={styles.titleRow}>
      <h1 className={styles.title}>Player reports</h1>
      <nav className="hint" aria-label="Report status">
        {(["open", "actioned", "dismissed"] as const).map((s, i) => <span key={s}>
          {i > 0 && " · "}
          {s === status ? <strong>{s}</strong> : <Link href={s === "open" ? "/admin/reports" : `/admin/reports?status=${s}`}>{s}</Link>}
        </span>)}
      </nav>
    </div>

    <div aria-live="polite">
      {errorCode && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{ERRORS[errorCode] ?? "That didn't save. Please try again."}</p></div>}
      {done && DONE[done] && <p className="alert alert-success" role="status"><PixelIcon name="check" />{DONE[done]}</p>}
    </div>

    {error ? (
      <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">Couldn&apos;t load reports. Please reload.</p></div>
    ) : reports.length === 0 ? (
      <div className={styles.empty}><p className="section-title">No {status} reports</p></div>
    ) : reports.map((r) => (
      <section key={r.id} className="panel stack gap-10" aria-label={`Report about ${r.target_name ?? "a player"}`}>
        <div className={styles.listHead}>
          <h2>
            <Link href={`/admin/users/${r.target_user_id}`}>{r.target_name ?? "A player"}</Link>{" "}
            <span className="badge badge-muted">{CATEGORIES[r.category] ?? r.category}</span>{" "}
            {r.target_banned && <span className="badge badge-danger">Banned</span>}
          </h2>
          <time className="hint" dateTime={r.created_at}>{when(r.created_at)}</time>
        </div>
        <p className="hint">
          Reported by {r.reporter_id ? <Link href={`/admin/users/${r.reporter_id}`}>{r.reporter_name ?? "a player"}</Link> : "a deleted account"}
          {r.target_open_reports > 1 && ` · ${r.target_open_reports} open reports about this player`}
        </p>
        <blockquote className="muted" style={{ margin: 0, whiteSpace: "pre-wrap" }}>{r.details}</blockquote>
        {r.evidence_url && <p><a href={r.evidence_url} target="_blank" rel="noopener noreferrer nofollow">Evidence ↗</a> <span className="hint mono">{new URL(r.evidence_url).host}</span></p>}
        {status === "open" ? (
          <form action={handleReport} className="stack gap-10">
            <input type="hidden" name="reportId" value={r.id} />
            <label className="stack gap-6">
              <span className="label">Admin note <span className="optional">optional, admins only</span></span>
              <textarea className={styles.textarea} name="note" rows={2} maxLength={1000} />
            </label>
            <div className={styles.searchRow}>
              {!r.target_banned && <Link href={`/admin/users/${r.target_user_id}#ban-title`} className="btn btn-sm btn-danger-outline">Ban this player →</Link>}
              <SubmitButton name="status" value="actioned" className="btn btn-sm btn-primary">Mark actioned</SubmitButton>
              <SubmitButton name="status" value="dismissed" className="btn btn-sm">Dismiss</SubmitButton>
            </div>
          </form>
        ) : (
          <p className="hint">{r.status} by {r.handled_by_name ?? "an admin"}{r.handled_at && ` · ${when(r.handled_at)}`}{r.admin_note && <> — “{r.admin_note}”</>}</p>
        )}
      </section>
    ))}
  </>;
}
