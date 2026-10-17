import Image from "next/image";
import Link from "next/link";
import { categoryLabel } from "@/lib/event-category";
import { plainText } from "@/lib/markdown";
import { PixelIcon } from "./icons";
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
  category: string | null;
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

/** `coverSrc` lets the admin form preview a picked file before it is uploaded.
 *  `featured` is the big card that opens the Events page: picture beside the
 *  details on wide screens, with a "View event" call to action. */
export function EventCard({ event, coverSrc, featured = false }: { event: UpcomingEvent; coverSrc?: string; featured?: boolean }) {
  const badge = dayBadge(event.starts_at);
  const category = categoryLabel(event.category);
  const src = coverSrc ?? (event.image_path ? eventImageUrl(event.image_path) : null);

  return <li className={`panel ${styles.card}`} data-featured={featured || undefined}>
    <Link href={`/events/${event.id}`} className={styles.link}>
      {/* The whole poster, never cropped: portrait or landscape, it sits on a
          blurred copy of itself that fills the frame. Nothing is drawn over it. */}
      <div className={`pixel-4 ${styles.cover}`}>
        {src ? <>
          <Image className={styles.coverFill} src={src} alt="" width={64} height={80} unoptimized={!!coverSrc} aria-hidden="true" />
          <Image className={styles.coverImage} src={src} alt="" width={featured ? 720 : 480} height={featured ? 900 : 600}
            sizes={featured ? "(min-width: 900px) 440px, 100vw" : "(min-width: 1200px) 380px, (min-width: 520px) 50vw, 100vw"}
            preload={featured} unoptimized={!!coverSrc} />
        </> : (
          // No cover uploaded: the panel's own tone stands in, so the grid keeps
          // its rhythm rather than showing a broken image.
          <span className={styles.placeholder} aria-hidden="true" />
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.head}>
          <span className={`pixel-4 ${styles.badge}`} aria-hidden="true">
            <span className={styles.badgeDay}>{badge.day}</span>
            <span className={styles.badgeMonth}>{badge.month}</span>
          </span>
          <div className={styles.headText}>
            {/* Where sits top right, level with the category label. */}
            {(category || event.location) && <div className={styles.labelRow}>
              {category && <span className={styles.chip}>{category}</span>}
              {event.location && (
                <p className={styles.where} title={event.location}>
                  <PixelIcon name="pin" size={16} /><span className="sr-only">Where: </span><span className={styles.whereText}>{event.location}</span>
                </p>
              )}
            </div>}
            <h3 className={styles.name}>{event.name}</h3>
          </div>
        </div>

        {event.description_excerpt && <p className={styles.excerpt}>{plainText(event.description_excerpt)}</p>}
        <div className={styles.foot}>
          <p className={styles.when}>
            <PixelIcon name="clock" size={16} />
            <span>
              <time dateTime={event.starts_at}>{start(event.starts_at)}</time>
              {event.ends_at && <> – {endTime(event.starts_at, event.ends_at)}</>}
            </span>
          </p>
          {/* D7: the count is public, the names behind it are not. */}
          <span className={styles.interest} aria-label={`${event.interest_count} players interested`}>
            <span aria-hidden="true">★</span> {event.interest_count} interested
          </span>
          {featured && <span className={`btn btn-primary ${styles.cta}`}>View event</span>}
        </div>
      </div>
    </Link>
  </li>;
}
