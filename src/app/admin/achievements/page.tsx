import Link from "next/link";
import { PixelIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import styles from "../admin.module.css";
import { when } from "../overview";
import { publicImageUrl } from "./images";

export default async function AdminAchievementsPage({ searchParams }: { searchParams: Promise<{ error?: string; done?: string }> }) {
  const { error: errorCode, done } = await searchParams;
  const supabase = await createClient();
  const [achievements, events] = await Promise.all([
    supabase.rpc("admin_list_achievements"),
    supabase.rpc("admin_list_events")
  ]);

  const ERRORS: Record<string, string> = {
    FORBIDDEN: "You don't have permission to do that.",
    NOT_FOUND: "That record no longer exists. Refresh and try again.",
    FAILED: "The change couldn't be saved. Please try again."
  };
  const DONE: Record<string, string> = {
    deleted: "Achievement deleted.",
    "event-deleted": "Event deleted."
  };

  const rows = achievements.data ?? [];
  const eventRows = events.data ?? [];

  return <>
    <div className={styles.titleRow}>
      <h1 className={styles.title}>Achievements</h1>
      <div className={styles.titleRow}>
        <Link href="/admin/achievements/new" className="btn btn-sm"><PixelIcon name="plus" />New achievement</Link>
        <Link href="/admin/achievements/events/new" className="btn btn-sm"><PixelIcon name="plus" />New event</Link>
      </div>
    </div>

    <div aria-live="polite">
      {errorCode && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{ERRORS[errorCode] ?? ERRORS.FAILED}</p></div>}
      {done && DONE[done] && <p className="alert alert-success" role="status"><PixelIcon name="check" />{DONE[done]}</p>}
    </div>

    {achievements.error || events.error ? (
      <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">Couldn&apos;t load the catalog. Please reload.</p></div>
    ) : <>

      <section aria-labelledby="cat-title">
        <h2 id="cat-title" className={styles.groupTitle}>Achievements ({rows.length})</h2>
        {rows.length === 0 ? <div className={styles.empty}>
          <p className="section-title">No achievements yet</p>
          <p className="muted">Create one, give it an image, then award it to players.</p>
        </div> : (
          <ul className={styles.catalog} aria-label="Achievements">
            {rows.map((row) => (
              <li key={row.id}>
                <Link href={`/admin/achievements/${row.id}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- public Storage object; next/image would need a remote pattern for no gain */}
                  <img className={`pixel-4 ${styles.catalogThumb}`} src={publicImageUrl(row.image_path)} alt="" width={56} height={56} />
                  <span className={styles.catalogText}>
                    <strong>{row.name}</strong>
                    <span className={styles.small}>{row.award_count} {row.award_count === 1 ? "award" : "awards"} · updated {when(row.updated_at)}</span>
                  </span>
                  <span className={`badge badge-${row.status === "published" ? "green" : "muted"}`}>{row.status}</span>
                  <PixelIcon name="arrow" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="ev-title">
        <h2 id="ev-title" className={styles.groupTitle}>Events ({eventRows.length})</h2>
        {eventRows.length === 0 ? <div className={styles.empty}>
          <p className="section-title">No events yet</p>
          <p className="muted">Events carry a date and a place. Awards made at one copy its date.</p>
        </div> : (
          <ul className={styles.catalog} aria-label="Events">
            {eventRows.map((event) => (
              <li key={event.id}>
                <Link href={`/admin/achievements/events/${event.id}`}>
                  <span className={styles.catalogText}>
                    <strong>{event.name}</strong>
                    <span className={styles.small}>
                      {new Date(event.starts_at).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium" })}
                      {event.location ? ` · ${event.location}` : ""} · {event.award_count} {event.award_count === 1 ? "award" : "awards"}
                    </span>
                  </span>
                  <span className={`badge badge-${event.status === "published" ? "green" : "muted"}`}>{event.status}</span>
                  <PixelIcon name="arrow" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>}
  </>;
}