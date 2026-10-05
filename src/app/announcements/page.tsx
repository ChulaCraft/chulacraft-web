import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SEVERITY } from "@/lib/announcement-severity";
import styles from "./announcements.module.css";

export const metadata: Metadata = { title: "Announcements | ChulaCraft" };

/** Every live announcement, pinned first. The read is granted to anon
 *  (20261009000001), so this page is public. */
export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_announcements", { p_limit: 50 });
  const rows = data ?? [];

  return (
    <main className={`container ${styles.main}`}>
      <div className="stack gap-10">
        <span className="kicker" aria-hidden="true" />
        <h1 className="page-title">Announcements</h1>
        <p className="lead">Server news, maintenance windows and things worth knowing before you log in.</p>
      </div>

      {error ? (
        <p className="alert alert-error" role="alert">Announcements couldn&apos;t be loaded. Please try again in a moment.</p>
      ) : rows.length === 0 ? (
        <p className="muted">Nothing to announce right now.</p>
      ) : (
        <ul className={styles.list}>
          {rows.map((row) => {
            const severity = SEVERITY[row.severity] ?? SEVERITY.info;
            return (
              <li key={row.id} id={row.id} className={`panel ${styles.item}`}>
                <p className={styles.meta}>
                  <span className={`badge badge-${severity.badge}`}>{severity.label}</span>
                  {row.pinned && <span className="badge badge-muted">Pinned</span>}
                  <time className="hint" dateTime={row.published_at}>
                    {new Date(row.published_at).toLocaleString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium", timeStyle: "short" })}
                  </time>
                </p>
                <h2 className={styles.title}>{row.title}</h2>
                <p className={styles.body}>{row.body}</p>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
