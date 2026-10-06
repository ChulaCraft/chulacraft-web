import Image from "next/image";
import Link from "next/link";
import styles from "./event-card.module.css";

/** list_upcoming_events() in supabase/migrations/20261006000002_event_interest.sql:50.
 *  The generated types describe the row; this is only the slice a card needs. */
export type UpcomingEvent = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  image_path: string | null;
  description_excerpt: string | null;
  interest_count: number;
};

/** Cache tag on the homepage list (src/app/page.tsx); actions that change
 *  events or interest expire it so the list never shows a deleted event. */
export const UPCOMING_EVENTS_TAG = "upcoming-events";

const BUCKET = "achievements";

/** Public bucket URL (the same URL builder the
 *  badge grid and the admin preview use, repeated because those live in
 *  app/ trees this component does not import from). */
export function eventImageUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}

const BANGKOK = "Asia/Bangkok";

function start(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { timeZone: BANGKOK, dateStyle: "medium", timeStyle: "short" });
}

/** "19:00 – 22:00" on the same day, so the card does not repeat the date; a
 *  multi-day event shows its end date too. */
function endTime(startIso: string, endIso: string) {
  const day = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: BANGKOK });
  return day(startIso) === day(endIso)
    ? new Date(endIso).toLocaleTimeString("en-GB", { timeZone: BANGKOK, timeStyle: "short" })
    : start(endIso);
}

function dayBadge(iso: string) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: BANGKOK, day: "2-digit", month: "short" }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { day: get("day"), month: get("month") };
}

/** `coverSrc` lets the admin form preview a picked file before it is uploaded. */
export function EventCard({ event, coverSrc }: { event: UpcomingEvent; coverSrc?: string }) {
  const badge = dayBadge(event.starts_at);

  return <li className={`panel ${styles.card}`}>
    <Link href={`/events/${event.id}`} className={styles.link}>
      <div className={`pixel-4 ${styles.cover}`}>
        {coverSrc || event.image_path ? (
          // The admin form previews a picked (blob:) file, which the optimizer can't fetch.
          <Image className={styles.coverImage} src={coverSrc ?? eventImageUrl(event.image_path!)} alt="" width={320} height={180}
            sizes="(min-width: 1200px) 340px, (min-width: 520px) 50vw, 100vw" unoptimized={!!coverSrc} />
        ) : (
          // No cover uploaded: the panel's own tone stands in, so the grid keeps
          // its rhythm rather than showing a broken image.
          <span className={styles.placeholder} aria-hidden="true" />
        )}
        <span className={`pixel-4 ${styles.badge}`} aria-hidden="true">
          <span className={styles.badgeDay}>{badge.day}</span>
          <span className={styles.badgeMonth}>{badge.month}</span>
        </span>
      </div>

      <h3 className={styles.name}>{event.name}</h3>
      <p className={`muted ${styles.when}`}>
        <time dateTime={event.starts_at}>{start(event.starts_at)}</time>
        {event.ends_at && <span> – {endTime(event.starts_at, event.ends_at)}</span>}
      </p>
      {event.location && <p className={`muted ${styles.where}`}>{event.location}</p>}
      {event.description_excerpt && <p className={`muted ${styles.excerpt}`}>{event.description_excerpt}</p>}
      {/* D7: the count is public, the names behind it are not. */}
      <p className={styles.interest} aria-label={`${event.interest_count} players interested`}>
        <span aria-hidden="true">★</span> {event.interest_count} interested
      </p>
    </Link>
  </li>;
}