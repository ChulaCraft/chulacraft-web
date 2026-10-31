import type { Metadata } from "next";
import Link from "next/link";
import { EventCard, type UpcomingEvent } from "@/components/event-card";
import { EVENT_CATEGORIES, toCategory } from "@/lib/event-category";
import { createClient } from "@/lib/supabase/server";
import { discordCommunityUrl } from "@/lib/site-links";
import styles from "./events.module.css";
import { timed } from "@/lib/perf";

export const metadata: Metadata = {
  title: "Events",
  description: "Community nights, builds and contests on the ChulaCraft Minecraft server.",
  // One canonical for every ?category= view: they filter the same list.
  alternates: { canonical: "/events" },
};

/** Every published event: what's coming up, then the archive. Both reads are
 *  granted to anon (20261006000002), so this page is public. */
export default async function EventsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const category = toCategory((await searchParams).category);
  const supabase = await createClient();
  const [upcoming, past] = await Promise.all([
    timed("list_upcoming_events", supabase.rpc("list_upcoming_events", { p_limit: 12 })),
    timed("list_past_events", supabase.rpc("list_past_events", { p_limit: 24 }))
  ]);
  const failed = Boolean(upcoming.error || past.error);
  // The category chips filter what's already loaded; no extra round trip.
  const inCategory = (e: UpcomingEvent) => !category || e.category === category;
  const next = ((upcoming.data ?? []) as UpcomingEvent[]).filter(inCategory);
  const done = ((past.data ?? []) as UpcomingEvent[]).filter(inCategory);

  return (
    <main className={`container ${styles.main}`}>
      <div className="stack gap-10">
        <span className="kicker" aria-hidden="true" />
        <h1 className="page-title">Events</h1>
        <p className="lead">Community nights, builds and contests on the server. Mark the ones you might join.</p>
      </div>

      <nav className={styles.filters} aria-label="Filter by category">
        <Link className="cat-chip" href="/events" aria-current={category ? undefined : "page"}>All events</Link>
        {EVENT_CATEGORIES.map((c) => (
          <Link key={c.value} className="cat-chip" href={`/events?category=${c.value}`} aria-current={category === c.value ? "page" : undefined}>{c.label}</Link>
        ))}
      </nav>

      {failed && (
        <p className="alert alert-error" role="alert">Events couldn&apos;t be loaded. Please try again in a moment.</p>
      )}

      {next.length === 0 ? (
        <section className={`panel ${styles.empty}`} aria-labelledby="upcoming-title">
          <h2 id="upcoming-title" className={styles.title}>{category ? "Nothing in this category yet" : "Nothing scheduled yet"}</h2>
          <p className="muted">New events are posted here and on Discord first.</p>
          <a className="btn" href={discordCommunityUrl} target="_blank" rel="noreferrer">Join the Discord</a>
        </section>
      ) : <>
        <section aria-label="Next event">
          <ul className={styles.featured}><EventCard event={next[0]} featured /></ul>
        </section>
        {next.length > 1 && (
          <section className="stack gap-16" aria-labelledby="upcoming-title">
            <h2 id="upcoming-title" className={styles.title}>Also coming up</h2>
            <ul className={styles.grid}>{next.slice(1).map((event) => <EventCard key={event.id} event={event} />)}</ul>
          </section>
        )}
      </>}

      {done.length > 0 && (
        <section className="stack gap-16" aria-labelledby="past-title">
          <h2 id="past-title" className={styles.title}>Past events</h2>
          <ul className={`${styles.grid} ${styles.past}`}>{done.map((event) => <EventCard key={event.id} event={event} />)}</ul>
        </section>
      )}
    </main>
  );
}
