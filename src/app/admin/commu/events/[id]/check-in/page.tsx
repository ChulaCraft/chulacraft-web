import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/confirm-action";
import { PixelIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { UUID } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import styles from "@/app/admin/admin.module.css";
import { when } from "@/app/admin/overview";
import { removeAttendance, resetCode } from "./actions";
import { AwardAttendees } from "./award-attendees";
import { CheckinQr, type WindowState } from "./checkin-qr";
import { Scanner } from "./scanner";
import local from "./check-in.module.css";
import { timed } from "@/lib/perf";

export const metadata: Metadata = { title: "Check-in" };

const ERRORS: Record<string, string> = {
  FORBIDDEN: "You don't have permission to run check-in.",
  NOT_FOUND: "That event or player no longer exists. Refresh and try again.",
  NO_ACHIEVEMENT: "Choose an achievement to award.",
  FAILED: "The change couldn't be saved. Please try again."
};

const METHODS: Record<string, string> = { self: "Scanned the QR", staff: "Checked in by staff", backfill: "From an earlier award" };

const MINUTE = 60_000;

/** Mirrors checkin_open() in 20261027000001_event_attendance.sql. */
function windowState(status: string, startsAt: string, endsAt: string | null): WindowState {
  if (status !== "published") return "draft";
  const now = Date.now();
  if (now < Date.parse(startsAt) - 15 * MINUTE) return "before";
  if (now > Date.parse(endsAt ?? startsAt) + 15 * MINUTE) return "after";
  return "open";
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  return src
    // eslint-disable-next-line @next/next/no-img-element -- Discord CDN avatar; next/image adds nothing at this size
    ? <img className="avatar" src={src} alt="" width={36} height={36} referrerPolicy="no-referrer" />
    : <span className="avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>;
}

export default async function AdminCheckInPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; done?: string; n?: string }>;
}) {
  const { id } = await params;
  const { error: errorCode, done, n } = await searchParams;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const [catalog, attendance, achievementList] = await Promise.all([
    timed("admin_list_events", supabase.rpc("admin_list_events")),
    timed("admin_list_attendance", supabase.rpc("admin_list_attendance", { p_event_id: id })),
    timed("admin_list_achievements", supabase.rpc("admin_list_achievements"))
  ]);
  if (catalog.error) {
    return <section className={`panel ${styles.errorCard}`} role="alert">
      <h1 className={styles.sectionTitle}><PixelIcon name="warning" size={22} className="tone-danger" />Couldn&apos;t load the event</h1>
      <p className="muted">The event didn&apos;t load. Nothing was changed.</p>
      <Link href={`/admin/commu/events/${id}/check-in`} className="link-button">Try again →</Link>
    </section>;
  }
  const event = (catalog.data ?? []).find((row) => row.id === id.toLowerCase());
  if (!event) notFound();

  const state = windowState(event.status, event.starts_at, event.ends_at);
  const opensAt = new Date(Date.parse(event.starts_at) - 15 * MINUTE).toISOString();
  const closesAt = new Date(Date.parse(event.ends_at ?? event.starts_at) + 15 * MINUTE).toISOString();
  const attendees = attendance.data ?? [];
  const achievements = (achievementList.data ?? []).filter((a) => a.status === "published").map((a) => ({ id: a.id, name: a.name }));
  const awarded = Number(n) || 0;
  const doneText = done === "awarded" ? (awarded > 0 ? `Awarded ${awarded} ${awarded === 1 ? "player" : "players"}.` : "Everyone already has it.")
    : done === "removed" ? "Removed from attendance."
    : done === "reset" ? "Code reset. Codes shown before no longer work."
    : null;

  return <>
    <a href={`/admin/commu/events/${id}`} className="back-link"><PixelIcon name="back" />{event.name}</a>

    <div className="stack gap-6">
      <h1 className={`${styles.title} ${local.wrap}`}>Check-in: {event.name}</h1>
      <p className="muted">
        {state === "open" ? "Open now" : state === "before" ? "Not open yet" : state === "after" ? "Closed" : "Draft"}
        {" · "}{when(opensAt)} – {when(closesAt)} (Bangkok)
      </p>
      {!event.ends_at && <p className="hint">Set an end time to keep check-in open for the whole event.</p>}
    </div>

    <div aria-live="polite">
      {errorCode && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{ERRORS[errorCode] ?? ERRORS.FAILED}</p></div>}
      {doneText && <p className="alert alert-success" role="status"><PixelIcon name="check" />{doneText}</p>}
    </div>

    <div className={local.stations}>
      <section className="panel stack gap-14" aria-labelledby="qr-title">
        <h2 id="qr-title" className={styles.sectionTitle}>Event code</h2>
        <p className="hint">Show this screen. Players scan it with their phone and press Check in.</p>
        <CheckinQr eventId={id} state={state} opensAt={opensAt} />
      </section>

      <section className="panel stack gap-14" aria-labelledby="scan-title">
        <h2 id="scan-title" className={styles.sectionTitle}>Scan a player</h2>
        <p className="hint">For players without a phone signal: scan or type the code on their profile.</p>
        <Scanner eventId={id} />
      </section>
    </div>

    <section className="panel" aria-labelledby="attendance-title">
      <div className={styles.listHead}>
        <h2 id="attendance-title" className={styles.sectionTitle}>Checked in</h2>
        <span className="hint">{attendees.length}</span>
      </div>
      {attendance.error ? (
        <p className="muted">The attendance list didn&apos;t load.</p>
      ) : attendees.length === 0 ? (
        <p className="muted">No one yet.</p>
      ) : (
        <ul className={local.people} aria-label="Checked-in players">
          {attendees.map((row) => (
            <li key={row.user_id}>
              <Avatar src={row.avatar_url} name={row.display_name} />
              <span className={local.person}>
                <strong className={local.wrap}>{row.display_name}</strong>
                <span className="hint">{METHODS[row.method] ?? row.method}{row.recorded_by_name && row.method === "staff" ? ` (${row.recorded_by_name})` : ""} · {when(row.created_at)}</span>
              </span>
              <form action={removeAttendance}>
                <input type="hidden" name="eventId" value={id} />
                <input type="hidden" name="userId" value={row.user_id} />
                <SubmitButton className="btn btn-sm" aria-label={`Remove ${row.display_name}`}>Remove</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>

    <section className={`panel ${styles.actionsCard}`} aria-labelledby="award-title">
      <h2 id="award-title" className={styles.sectionTitle}>Award badge to attendees</h2>
      {achievements.length === 0
        ? <p className="muted">No published achievements yet. <Link href="/admin/commu/achievements/new">Create one</Link>.</p>
        : <AwardAttendees eventId={id} attendees={attendees.length} achievements={achievements} />}
    </section>

    <section className={`panel ${styles.actionsCard}`} aria-labelledby="reset-title">
      <h2 id="reset-title" className={styles.sectionTitle}>Reset code</h2>
      <p className="hint">If a photo of the code is going around, reset it. Every code shown so far stops working, including on players&apos; screens mid check-in.</p>
      <ConfirmAction
        action={resetCode}
        fields={{ eventId: id }}
        trigger="Reset code"
        triggerClassName="btn btn-danger-outline"
        title="Reset the check-in code?"
        body="The QR on screen changes and every earlier code stops working. Players who already checked in stay checked in."
        confirmLabel="Reset code"
        confirmClassName="btn btn-danger"
      />
    </section>
  </>;
}
