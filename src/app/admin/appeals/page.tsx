import Link from "next/link";
import { PixelIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import styles from "../admin.module.css";
import { when } from "../overview";
import { decideAppeal } from "./actions";
import { SubmitButton } from "@/components/submit-button";

const ERRORS: Record<string, string> = {
  NOT_FOUND: "Another admin already answered that appeal.",
  INVALID: "Keep the response under 1000 characters.",
};
const DONE: Record<string, string> = {
  accepted: "Appeal accepted. The ban is lifted and their accounts are going back on the whitelist.",
  rejected: "Appeal rejected. The player sees your response on their profile.",
};

export default async function AdminAppealsPage({ searchParams }: { searchParams: Promise<{ status?: string; error?: string; done?: string }> }) {
  const { status: raw, error: errorCode, done } = await searchParams;
  const status = raw === "accepted" || raw === "rejected" ? raw : "open";
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_appeals", { p_status: status });
  const appeals = data ?? [];

  return <>
    <div className={styles.titleRow}>
      <h1 className={styles.title}>Ban appeals</h1>
      <nav className="hint" aria-label="Appeal status">
        {(["open", "accepted", "rejected"] as const).map((s, i) => <span key={s}>
          {i > 0 && " · "}
          {s === status ? <strong>{s}</strong> : <Link href={s === "open" ? "/admin/appeals" : `/admin/appeals?status=${s}`}>{s}</Link>}
        </span>)}
      </nav>
    </div>

    <div aria-live="polite">
      {errorCode && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{ERRORS[errorCode] ?? "That didn't save. Please try again."}</p></div>}
      {done && DONE[done] && <p className="alert alert-success" role="status"><PixelIcon name="check" />{DONE[done]}</p>}
    </div>

    {error ? (
      <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">Couldn&apos;t load appeals. Please reload.</p></div>
    ) : appeals.length === 0 ? (
      <div className={styles.empty}><p className="section-title">No {status} appeals</p></div>
    ) : appeals.map((a) => (
      <section key={a.id} className="panel stack gap-10" aria-label={`Appeal from ${a.user_name ?? "a player"}`}>
        <div className={styles.listHead}>
          <h2><Link href={`/admin/users/${a.user_id}`}>{a.user_name ?? "A player"}</Link></h2>
          <time className="hint" dateTime={a.created_at}>{when(a.created_at)}</time>
        </div>
        <dl className={styles.facts}>
          <dt>Ban reason</dt><dd>{a.reason}</dd>
          <dt>Player sees</dt><dd>{a.public_note ?? <span className="hint">No note</span>}</dd>
          <dt>Banned</dt><dd>{when(a.banned_at)} by {a.banned_by_name ?? "a removed admin"} · {a.expires_at ? `until ${when(a.expires_at)}` : "permanent"}</dd>
        </dl>
        <blockquote className="muted" style={{ margin: 0, whiteSpace: "pre-wrap" }}>{a.message}</blockquote>
        {status === "open" ? (
          <form action={decideAppeal} className="stack gap-10">
            <input type="hidden" name="appealId" value={a.id} />
            <label className="stack gap-6">
              <span className="label">Response to the player <span className="optional">optional</span></span>
              <textarea className={styles.textarea} name="response" rows={2} maxLength={1000} />
            </label>
            <div className={styles.searchRow}>
              <SubmitButton name="accept" value="true" className="btn btn-sm btn-primary">Accept and lift ban</SubmitButton>
              <SubmitButton name="accept" value="false" className="btn btn-sm btn-danger-outline">Reject</SubmitButton>
            </div>
          </form>
        ) : (
          <p className="hint">{a.status} by {a.decided_by_name ?? "an admin"}{a.decided_at && ` · ${when(a.decided_at)}`}{a.admin_response && <> — “{a.admin_response}”</>}</p>
        )}
      </section>
    ))}
  </>;
}
