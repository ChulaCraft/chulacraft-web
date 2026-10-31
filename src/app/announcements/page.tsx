import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { publicImageUrl } from "@/app/admin/commu/achievements/images";
import { AnnouncementItem } from "@/components/announcement-item";
import styles from "./announcements.module.css";

export const metadata: Metadata = {
  title: "Announcements",
  description: "News from the ChulaCraft team: maintenance, updates and server notices.",
  alternates: { canonical: "/announcements" },
};

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
          {rows.map((row) => (
            <AnnouncementItem key={row.id} id={row.id} title={row.title} body={row.body} severity={row.severity} pinned={row.pinned}
              publishedAt={row.published_at} imageSrc={row.image_path ? publicImageUrl(row.image_path) : null} />
          ))}
        </ul>
      )}
    </main>
  );
}
