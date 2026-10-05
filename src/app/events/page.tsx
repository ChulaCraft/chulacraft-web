import type { Metadata } from "next";
import { EventCard, type UpcomingEvent } from "@/components/event-card";
import { createClient } from "@/lib/supabase/server";
import { discordCommunityUrl } from "@/lib/site-links";
import styles from "./events.module.css";

export const metadata: Metadata = { title: "Events | ChulaCraft" };

/** Every published event: what's coming up, then the archive. Both reads are
 *  granted to anon (20261006000002), so this page is public. */
export default async function EventsPage() {
  const supabase = await createClient();
  const [upcoming, past] = await Promise.all([
    supabase.rpc("list_upcoming_events", { p_limit: 12 }),
    supabase.rpc("list_past_events", { p_limit: 24 })
  ]);
  const failed = Boolean(upcoming.error || past.error);
  const next = (upcoming.data ?? []) as UpcomingEvent[];
  const done = (past.data ?? []) as UpcomingEvent[];

  return (
    <main className={`container ${styles.main}`}>
      <div className="stack gap-10">
        <span className="kicker" aria-hidden="true" />
        <h1 className="page-title">Events</h1>
        <p className="lead">Community nights, builds and contests on the server. Mark the ones you might join.</p>
      </div>

      {failed && (
        <p className="alert alert-error" role="alert">Events couldn&apos;t be loaded. Please try again in a moment.</p>
      )}

      <section className="stack gap-16" aria-labelledby="upcoming-title">
        <h2 id="upcoming-title" className={styles.title}>Coming up</h2>
        {next.length === 0 ? (
          <p className="muted">
            Nothing scheduled yet. Dates are posted here and on <a href={discordCommunityUrl} target="_blank" rel="noreferrer">Discord</a>.
          </p>
        ) : (
          <ul className={styles.grid}>{next.map((event) => <EventCard key={event.id} event={event} />)}</ul>
        )}
      </section>

      {done.length > 0 && (
        <section className="stack gap-16" aria-labelledby="past-title">
          <h2 id="past-title" className={styles.title}>Past events</h2>
          <ul className={`${styles.grid} ${styles.past}`}>{done.map((event) => <EventCard key={event.id} event={event} />)}</ul>
        </section>
      )}
    </main>
  );
}
