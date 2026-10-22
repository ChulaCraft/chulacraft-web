import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PixelIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { UUID } from "@/lib/registration";
import { PROOF_COOKIE } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";
import { checkIn } from "./actions";
import styles from "./check-in.module.css";

export const metadata: Metadata = { title: "Check in" };

/** The fields of get_event() (20261006000002_event_interest.sql:76) this page reads. */
type EventSummary = { id: string; name: string; starts_at: string; location: string | null };

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "full", timeStyle: "short" });

const ERRORS: Record<string, { title: string; body: React.ReactNode }> = {
  TOKEN_EXPIRED: { title: "Scan the code again", body: "That code has expired. Codes change every 30 seconds, so scan the one on the staff screen again." },
  CHECKIN_CLOSED: { title: "Check-in is closed", body: "Check-in opens 15 minutes before the event and closes 15 minutes after it ends." },
  BANNED: { title: "You can't check in", body: <>Your account is banned. See <Link href="/dashboard">your profile</Link> for details and how to appeal.</> },
  NOT_VERIFIED: { title: "Verify your account first", body: <>Only verified players can check in. <Link href="/verify">Verify your Chula account</Link>, then scan the code again.</> },
  FORBIDDEN: { title: "Sign in to check in", body: <><Link href="/register">Sign in</Link>, then scan the code again.</> },
  NOT_FOUND: { title: "Event not available", body: "That event is no longer available." },
  FAILED: { title: "That didn't work", body: "Something went wrong. Press Check in again in a moment." }
};

export default async function CheckInPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; done?: string }>;
}) {
  const { id } = await params;
  const { error: errorCode, done } = await searchParams;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  let signedIn = false;
  let event: EventSummary | null = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = Boolean(user);
    if (user) {
      const { data, error } = await supabase.rpc("get_event", { p_id: id });
      event = error ? null : data as EventSummary | null;
    }
  } catch {
    event = null;
  }
  if (!signedIn) redirect("/register");
  if (!event) notFound();

  // Reading is fine here; only the start route and the action write it.
  const hasProof = (await cookies()).has(PROOF_COOKIE);
  const failure = errorCode ? ERRORS[errorCode] ?? ERRORS.FAILED : null;

  return (
    <main className="narrow">
      <div className={styles.main}>
        <Link href={`/events/${event.id}`} className="back-link"><PixelIcon name="back" />Event</Link>

        <section className={`panel ${styles.card}`} aria-labelledby="checkin-title">
          <p className="eyebrow">Check in</p>
          <h1 id="checkin-title" className={styles.title}>{event.name}</h1>
          <p className="muted"><time dateTime={event.starts_at}>{when(event.starts_at)}</time>{event.location && <> · {event.location}</>}</p>

          <div aria-live="polite">
            {done === "recorded" && (
              <div className="alert alert-success" role="status">
                <PixelIcon name="check" />
                <div className="stack gap-4">
                  <p className="alert-title">You&apos;re checked in</p>
                  <p className="alert-body">Have fun. It now shows in your event history.</p>
                </div>
              </div>
            )}
            {done === "already" && (
              <p className="alert" role="status"><PixelIcon name="check" />You&apos;re already checked in.</p>
            )}
            {failure && (
              <div className="alert alert-error" role="alert">
                <PixelIcon name="warning" />
                <div className="stack gap-4">
                  <p className="alert-title">{failure.title}</p>
                  <p className="alert-body">{failure.body}</p>
                </div>
              </div>
            )}
          </div>

          {hasProof ? (
            // GET never records (link previews and prefetches); this post does.
            <form action={checkIn} className={styles.form}>
              <input type="hidden" name="eventId" value={event.id} />
              <SubmitButton className="btn btn-primary"><PixelIcon name="check" />Check in</SubmitButton>
            </form>
          ) : !done && !failure && (
            <p className="muted">Scan the QR code on the staff screen at the event to check in.</p>
          )}
          {(done || failure) && <Link className="link-button" href="/dashboard">Go to your profile →</Link>}
        </section>
      </div>
    </main>
  );
}
