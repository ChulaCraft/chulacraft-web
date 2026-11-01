import type { Metadata } from "next";
import Link from "next/link";
import { PixelIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import styles from "@/app/admin/admin.module.css";
import { timed } from "@/lib/perf";
import local from "@/app/admin/export-ui.module.css";
import { RowExport } from "@/components/row-export";

export const metadata: Metadata = { title: "Events" };

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<{ error?: string; done?: string }> }) {
  const { error: errorCode, done } = await searchParams;
  const supabase = await createClient();
  const events = await timed("admin_list_events", supabase.rpc("admin_list_events"));

  const ERRORS: Record<string, string> = {
    FORBIDDEN: "You don't have permission to do that.",
    NOT_FOUND: "That record no longer exists. Refresh and try again.",
    FAILED: "The change couldn't be saved. Please try again."
  };
  const DONE: Record<string, string> = {
    "event-deleted": "Event deleted."
  };

  const eventRows = events.data ?? [];

  return <>
    <div className={styles.titleRow}>
      <h1 className={styles.title}>Events</h1>
      <div className={local.bar}>
        <RowExport href="/admin/commu/events/export" className="btn btn-sm" />
        <Link href="/admin/commu/events/new" className="btn btn-sm"><PixelIcon name="plus" />New event</Link>
      </div>
    </div>

    <div aria-live="polite">
      {errorCode && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{ERRORS[errorCode] ?? ERRORS.FAILED}</p></div>}
      {done && DONE[done] && <p className="alert alert-success" role="status"><PixelIcon name="check" />{DONE[done]}</p>}
    </div>

    {events.error ? (
      <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">Couldn&apos;t load events. Please reload.</p></div>
    ) : (
      <section aria-labelledby="ev-title">
        <h2 id="ev-title" className={styles.groupTitle}>Events ({eventRows.length})</h2>
        {eventRows.length === 0 ? <div className={styles.empty}>
          <p className="section-title">No events yet</p>
          <p className="muted">Events carry a date and a place. Awards made at one copy its date.</p>
        </div> : (
          <ul className={styles.catalog} aria-label="Events">
            {eventRows.map((event) => (
              <li key={event.id} className={local.withTick}>
                <input type="checkbox" className={local.tick} name="id" value={event.id} form="export-rows" aria-label={`Select ${event.name} for export`} />
                <Link href={`/admin/commu/events/${event.id}`}>
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
    )}
  </>;
}
