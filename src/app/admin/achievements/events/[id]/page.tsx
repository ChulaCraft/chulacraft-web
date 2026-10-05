import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/confirm-action";
import { PixelIcon } from "@/components/icons";
import { UUID } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../admin.module.css";
import { when } from "../../../overview";
import { publicImageUrl } from "../../images";
import { EventForm } from "../event-form";
import { deleteEvent } from "./actions";

const ERRORS: Record<string, string> = {
  FORBIDDEN: "You don't have permission to change events.",
  NOT_FOUND: "That event no longer exists. Refresh and try again.",
  BAD_DATE: "Give the event a start date, and an end date that isn't before it.",
  BAD_IMAGE_TYPE: "That file isn't a PNG, JPEG, WebP or GIF image.",
  IMAGE_TOO_LARGE: "That cover is bigger than 2 MB. Please upload a smaller one.",
  UPLOAD_FAILED: "The cover couldn't be uploaded. Nothing was changed.",
  FAILED: "The change couldn't be saved. Please try again."
};

const DONE: Record<string, string> = {
  created: "Event created.",
  saved: "Event saved."
};

/** `datetime-local` wants a bare local time with no seconds; everything here is
 *  Bangkok (D8), so the offset is stripped off the stored timestamptz. Built from
 *  the Intl parts rather than a locale string, so the shape can't drift. */
function bangkokInput(iso: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export default async function AdminEventPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; done?: string }>;
}) {
  const { id } = await params;
  const { error: errorCode, done } = await searchParams;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const [catalog, interests] = await Promise.all([
    supabase.rpc("admin_list_events"),
    // Admin-only (20261006000002), so this is the only place the names behind
    // the public count are readable. A failure here must not hide the event.
    supabase.rpc("admin_list_event_interests", { p_event_id: id })
  ]);
  const { error: listError } = catalog;
  if (listError) {
    return <section className={`panel ${styles.errorCard}`} role="alert">
      <h1 className={styles.sectionTitle}><PixelIcon name="warning" size={22} className="tone-danger" />Couldn&apos;t load events</h1>
      <p className="muted">The events didn&apos;t load. Nothing was changed.</p>
      <Link href="/admin/achievements" className="link-button">Try again →</Link>
    </section>;
  }

  const event = (catalog.data ?? []).find((row) => row.id === id);
  if (!event) notFound();
  const interested = interests.data ?? [];

  return <>
    <Link href="/admin/achievements" className="back-link"><PixelIcon name="back" />Achievements</Link>

    <div aria-live="polite">
      {errorCode && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{ERRORS[errorCode] ?? ERRORS.FAILED}</p></div>}
      {done && DONE[done] && <p className="alert alert-success" role="status"><PixelIcon name="check" />{DONE[done]}</p>}
    </div>

    <EventForm
      submitLabel="Save event"
      coverUrl={event.image_path ? publicImageUrl(event.image_path) : null}
      initial={{
        id: event.id,
        name: event.name,
        description: event.description ?? "",
        startsAt: bangkokInput(event.starts_at),
        endsAt: event.ends_at ? bangkokInput(event.ends_at) : "",
        location: event.location ?? "",
        status: event.status
      }}
      footer={
        <section className={`panel ${styles.actionsCard}`} aria-labelledby="event-danger-title">
          <h2 id="event-danger-title" className={styles.sectionTitle}>Delete</h2>
          <p className="hint">Awards given at this event stay on players&apos; profiles, but lose the event link.</p>
          <ConfirmAction
            action={deleteEvent}
            fields={{ eventId: event.id }}
            trigger="Delete event"
            triggerLabel={`Delete ${event.name}`}
            triggerClassName="btn btn-danger-outline"
            title={`Delete ${event.name}?`}
            body={`${event.award_count} ${event.award_count === 1 ? "award was" : "awards were"} given at this event. The awards keep their dates but stop naming it. The cover image is deleted too.`}
            confirmLabel="Delete event"
            confirmClassName="btn btn-danger"
          />
        </section>
      }
      aside={<>
        <section className="panel stack gap-16" aria-labelledby="event-stats-title">
          <h2 id="event-stats-title" className={styles.sectionTitle}>Saved event</h2>
          <dl className={styles.facts}>
            <dt>Starts</dt><dd>{when(event.starts_at)}</dd>
            <dt>Ends</dt><dd>{event.ends_at ? when(event.ends_at) : "Not set"}</dd>
            <dt>Awards</dt><dd>{event.award_count}</dd>
            <dt>Interested</dt><dd>{interested.length}</dd>
            <dt>Status</dt><dd>{event.status}</dd>
          </dl>
          <p className="hint">All times shown in Bangkok.</p>
        </section>

        {/* D7: interest is not attendance. The names are only here, never on the
            public page, and an admin still confirms who actually turned up. */}
        <section className="panel" aria-labelledby="event-interested-title">
          <div className={styles.listHead}>
            <h2 id="event-interested-title" className={styles.sectionTitle}>Interested players</h2>
            <span className="hint">{interested.length}</span>
          </div>
          {interests.error ? (
            <p className="muted">The interested list didn&apos;t load.</p>
          ) : interested.length === 0 ? (
            <p className="muted">Nobody has marked this event as interesting yet.</p>
          ) : (
            <>
              <ul className={styles.ticks} aria-label="Interested players">
                {interested.map((player) => (
                  <li key={player.user_id}>
                    <label className={styles.tick}>
                      <input type="checkbox" disabled />
                      <span><strong>{player.display_name}</strong></span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="hint">
                To award from this list, open an achievement&apos;s award page and choose this event — it offers
                &ldquo;Prefill from interested players&rdquo;.
              </p>
            </>
          )}
          <p className="hint">
            Interest is a maybe, not a sign-up. Tick who actually came when you award.
          </p>
        </section>
      </>}
    />
  </>;
}