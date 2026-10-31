import Image from "next/image";
import { categoryLabel } from "@/lib/event-category";
import { Markdown } from "@/lib/markdown";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eventImageUrl } from "@/components/event-card";
import { PixelIcon } from "@/components/icons";
import { discordCommunityUrl } from "@/lib/site-links";
import { UUID } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import { toggleInterest } from "./actions";
import styles from "./event.module.css";
import { SubmitButton } from "@/components/submit-button";
import { timed } from "@/lib/perf";

/** get_event() in supabase/migrations/20261006000002_event_interest.sql:76 builds
 *  this jsonb, so the generated types cannot describe it. me_interested is the
 *  caller's own row and is false for a logged-out visitor. */
type EventDetail = {
  id: string;
  name: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  category: string | null;
  image_path: string | null;
  interest_count: number;
  me_interested: boolean;
  ended: boolean;
};

const BANGKOK = "Asia/Bangkok";

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { timeZone: BANGKOK, dateStyle: "full", timeStyle: "short" });
const clock = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { timeZone: BANGKOK, timeStyle: "short" });
const day = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: BANGKOK });
/** Just the time when the event ends the day it starts; the full date otherwise. */
const ends = (start: string, end: string) => (day(start) === day(end) ? clock(end) : when(end));

/** Read through the session's own client: get_event is granted to anon as well
 *  as authenticated, and me_interested has to reflect whoever is asking. Unlike
 *  the homepage list this is not cached — the interest count is the point of
 *  the page. */
async function loadEvent(id: string): Promise<{ event: EventDetail | null; signedIn: boolean }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await timed("auth.getUser", supabase.auth.getUser());
    const { data, error } = await timed("get_event", supabase.rpc("get_event", { p_id: id }));
    // No row and a hard read failure look the same to a visitor: either way
    // there is no published event at this address.
    if (error || !data) return { event: null, signedIn: Boolean(user) };
    return { event: data as EventDetail, signedIn: Boolean(user) };
  } catch {
    return { event: null, signedIn: false };
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { event } = UUID.test(id) ? await loadEvent(id) : { event: null };
  if (!event) return { title: "Event not found", robots: { index: false } };
  // A description is required for search results (Lighthouse SEO); an event
  // without one gets its date and place instead of the site-wide text.
  const fallback = `${event.name}: a ChulaCraft event on ${when(event.starts_at)}${event.location ? ` at ${event.location}` : ""}.`;
  return {
    title: event.name,
    description: event.description?.trim().slice(0, 300) || fallback,
    alternates: { canonical: `/events/${event.id}` },
  };
}

const ERRORS: Record<string, string> = {
  EVENT_ENDED: "This event has already finished, so interest is closed.",
  NOT_FOUND: "That event is no longer available.",
  FAILED: "That didn't save. Please try again in a moment."
};

export default async function EventPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; done?: string }>;
}) {
  const { id } = await params;
  const { error: errorCode, done } = await searchParams;
  if (!UUID.test(id)) notFound();

  const { event, signedIn } = await loadEvent(id);
  // A draft or an unknown id is indistinguishable from the outside (D6).
  if (!event) notFound();

  // D7: a logged-out click goes to sign-in, so the button is a real link rather
  // than a form post that redirects.
  const signInHref = "/register";

  const interested = event.interest_count === 1;

  return (
    <>
      <main className={`container ${styles.main}`}>
        <Link href="/events" className="back-link"><PixelIcon name="back" />Events</Link>

        <div aria-live="polite">
          {errorCode && (
            <div className="alert alert-error" role="alert">
              <PixelIcon name="warning" />
              <p className="alert-body">{ERRORS[errorCode] ?? ERRORS.FAILED}</p>
            </div>
          )}
          {done === "interested" && (
            <p className="alert alert-success" role="status"><PixelIcon name="check" />Marked as interested.</p>
          )}
          {done === "cleared" && (
            <p className="alert alert-success" role="status"><PixelIcon name="check" />Interest removed.</p>
          )}
        </div>

        {/* Left: the picture and the story. Right: what, when, and the one action. */}
        <div className={styles.layout}>
          {/* The whole poster at its own shape; a blurred copy fills the frame
              when a tall poster is capped to the screen height. */}
          <div className={`pixel-4 ${styles.cover}`}>
            {event.image_path ? <>
              <Image className={styles.coverFill} src={eventImageUrl(event.image_path)} alt="" width={64} height={80} aria-hidden="true" />
              <Image className={styles.coverImage} src={eventImageUrl(event.image_path)} alt={`${event.name} poster`} width={1200} height={1500}
                sizes="(min-width: 900px) 60vw, 100vw" preload />
            </> : <span className={styles.placeholder} aria-hidden="true" />}
          </div>

          <aside className={`panel ${styles.info}`} aria-labelledby="event-title">
            <p className="eyebrow">Community event</p>
            <h1 id="event-title" className={styles.title}>{event.name}</h1>

            <dl className={styles.facts}>
              <dt>Starts</dt><dd><time dateTime={event.starts_at}>{when(event.starts_at)}</time></dd>
              {event.ends_at && <><dt>Ends</dt><dd><time dateTime={event.ends_at}>{ends(event.starts_at, event.ends_at)}</time></dd></>}
              {event.location && <><dt>Where</dt><dd>{event.location}</dd></>}
              {categoryLabel(event.category) && <><dt>Type</dt><dd>{categoryLabel(event.category)}</dd></>}
              <dt>Interested</dt>
              <dd aria-label={`${event.interest_count} players interested`}>{event.interest_count} {interested ? "player" : "players"}</dd>
            </dl>
            <p className="hint">All times are Asia/Bangkok.</p>
            {!event.ended && <a className="btn" href={`/events/${event.id}/calendar.ics`} download>Add to calendar</a>}

            {event.ended ? (
              <p className="alert" role="status"><PixelIcon name="clock" />This event has ended.</p>
            ) : signedIn ? (
              <div className={styles.interestForm}>
                <form action={toggleInterest}>
                  <input type="hidden" name="eventId" value={event.id} />
                  <input type="hidden" name="interested" value={event.me_interested ? "false" : "true"} />
                  <SubmitButton className={`btn ${event.me_interested ? "" : "btn-primary"}`}>
                    {event.me_interested ? <><PixelIcon name="check" />Interested ✓ (undo)</> : "Mark as interested"}
                  </SubmitButton>
                </form>
                <p className={`muted ${styles.interestNote}`}>
                  {event.me_interested
                    ? "We only use this to tell admins who might turn up. It is not a sign-up."
                    : "Tells the admins who might turn up. It is not a sign-up, and no one else can see your name."}
                </p>
              </div>
            ) : (
              <div className={styles.interestForm}>
                <Link className="btn btn-primary" href={signInHref}>Mark as interested</Link>
                <p className={`muted ${styles.interestNote}`}>
                  Sign in to tell the admins you might turn up. It is not a sign-up, and nobody sees your name.
                </p>
              </div>
            )}
          </aside>

          <div className={styles.body}>
            {event.description && (
              <section className={`panel ${styles.details}`} aria-labelledby="details-title">
                <h2 id="details-title" className={styles.detailsTitle}>Details</h2>
                <div className="md"><Markdown source={event.description} /></div>
              </section>
            )}
            <p className="muted">
              Questions or last-minute plans? Ask in <a href={discordCommunityUrl} target="_blank" rel="noreferrer">Discord</a>.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}