import Link from "next/link";
import { PixelIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import styles from "../admin.module.css";
import { when } from "../overview";

const ERRORS: Record<string, string> = {
  FORBIDDEN: "You don't have permission to do that.",
  NOT_FOUND: "That announcement no longer exists.",
  FAILED: "The change couldn't be saved. Please try again."
};

/** Where an announcement is in its life, worked out from its two timestamps. */
function state(publishedAt: string | null, expiresAt: string | null) {
  const now = Date.now();
  if (!publishedAt) return { label: "draft", tone: "muted" };
  if (Date.parse(publishedAt) > now) return { label: "scheduled", tone: "lavender" };
  if (expiresAt && Date.parse(expiresAt) <= now) return { label: "expired", tone: "muted" };
  return { label: "live", tone: "green" };
}

export default async function AdminAnnouncementsPage({ searchParams }: { searchParams: Promise<{ error?: string; done?: string }> }) {
  const { error: errorCode, done } = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_announcements");
  const rows = data ?? [];

  return <>
    <div className={styles.titleRow}>
      <h1 className={styles.title}>Announcements</h1>
      <Link href="/admin/announcements/new" className="btn btn-sm"><PixelIcon name="plus" />New announcement</Link>
    </div>

    <div aria-live="polite">
      {errorCode && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{ERRORS[errorCode] ?? ERRORS.FAILED}</p></div>}
      {done === "deleted" && <p className="alert alert-success" role="status"><PixelIcon name="check" />Announcement deleted.</p>}
    </div>

    {error ? (
      <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">Couldn&apos;t load announcements. Please reload.</p></div>
    ) : rows.length === 0 ? (
      <div className={styles.empty}>
        <p className="section-title">No announcements yet</p>
        <p className="muted">Write one to show it on the site, pin it as a banner, or send it to Discord.</p>
      </div>
    ) : (
      <ul className={styles.catalog} aria-label="Announcements">
        {rows.map((row) => {
          // The generated types say string; drafts and open-ended posts are null.
          const s = state(row.published_at as string | null, row.expires_at as string | null);
          return (
            <li key={row.id}>
              <Link href={`/admin/announcements/${row.id}`}>
                <span className={styles.catalogText}>
                  <strong>{row.title}</strong>
                  <span className={styles.small}>
                    {row.severity}{row.pinned ? " · pinned" : ""}{row.discord_message_id ? " · on Discord" : row.post_to_discord ? " · Discord pending" : ""} · updated {when(row.updated_at)}
                  </span>
                </span>
                <span className={`badge badge-${s.tone}`}>{s.label}</span>
                <PixelIcon name="arrow" />
              </Link>
            </li>
          );
        })}
      </ul>
    )}
  </>;
}
