import { PixelIcon } from "@/components/icons";
import { submitAppeal } from "./actions";
import styles from "./dashboard.module.css";
import { SubmitButton } from "@/components/submit-button";

/** my_ban() in 20261012000001_bans.sql builds this jsonb. The admin-only
 *  reason is never part of it. */
export type MyBan = {
  public_note: string | null;
  created_at: string;
  expires_at: string | null;
  appeal: { status: "open" | "accepted" | "rejected"; admin_response: string | null; created_at: string } | null;
  appeals_left: number;
};

const APPEAL_ERRORS: Record<string, string> = {
  INVALID: "Write at least 10 characters (up to 2000).",
  APPEAL_OPEN: "You already have an appeal waiting for an answer.",
  TOO_MANY_APPEALS: "You've used all your appeals for this ban.",
  NOT_BANNED: "Your ban has already ended.",
};

const date = (iso: string) => new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium", timeStyle: "short" });

export function BanCard({ ban, appealError, appealSent }: { ban: MyBan; appealError?: string; appealSent: boolean }) {
  const canAppeal = ban.appeal?.status !== "open" && ban.appeals_left > 0;
  return (
    <section className={`panel ${styles.card}`} role="alert" aria-labelledby="ban-title">
      <h2 id="ban-title" className={styles.cardTitle}><PixelIcon name="revoked" size={22} className={styles.dangerIcon} />Your account is banned</h2>
      <p>
        {ban.expires_at ? `Until ${date(ban.expires_at)}.` : "This ban is permanent."}{" "}
        Your Minecraft accounts are off the whitelist and you can&apos;t add new ones until it ends.
      </p>
      {ban.public_note && <p className="muted" style={{ whiteSpace: "pre-wrap" }}>{ban.public_note}</p>}

      <div role="status" aria-live="polite">
        {appealSent && <p className={`alert alert-success ${styles.smallAlert}`}><PixelIcon name="check" />Appeal sent. An admin will answer here.</p>}
        {appealError && <p className={`alert alert-error ${styles.smallAlert}`}><PixelIcon name="warning" />{APPEAL_ERRORS[appealError] ?? "That didn't send. Please try again."}</p>}
      </div>

      {ban.appeal && (
        <p className="hint">
          {ban.appeal.status === "open" ? `Appeal sent ${date(ban.appeal.created_at)}, waiting for an admin.` : "Your last appeal was rejected."}
          {ban.appeal.admin_response && <> Admin: “{ban.appeal.admin_response}”</>}
        </p>
      )}
      {canAppeal && (
        <form action={submitAppeal} className="stack gap-10">
          <label className="stack gap-6">
            <span className="label">Appeal this ban</span>
            <textarea className="input" name="message" rows={3} minLength={10} maxLength={2000} required />
          </label>
          <p className="hint">{ban.appeals_left} {ban.appeals_left === 1 ? "appeal" : "appeals"} left for this ban.</p>
          <SubmitButton className="btn btn-sm btn-primary">Send appeal</SubmitButton>
        </form>
      )}
    </section>
  );
}
