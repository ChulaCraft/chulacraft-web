"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PixelIcon } from "@/components/icons";
import { nextToken } from "./actions";
import styles from "./check-in.module.css";

export type WindowState = "open" | "before" | "after" | "draft";

type View = { kind: "loading" } | { kind: "ready"; svg: string; expiresAt: number } | { kind: "error"; code: string };

const ERRORS: Record<string, string> = {
  FORBIDDEN: "You don't have permission to run check-in.",
  NOT_FOUND: "Only a published event can take check-ins.",
  FAILED: "The code didn't load."
};

const clock = (iso: string) => new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium", timeStyle: "short" });

/** The rotating event QR. The SVG is drawn by the nextToken server action, so
 *  this file never imports an encoder. A new code is fetched 5 s before the
 *  current window ends (the old one stays valid one more window), and nothing
 *  is fetched while the tab is hidden. */
export function CheckinQr({ eventId, state, opensAt }: { eventId: string; state: WindowState; opensAt: string }) {
  const router = useRouter();
  const [view, setView] = useState<View>({ kind: "loading" });
  const [now, setNow] = useState(() => Date.now());
  // Bumped by "Try again" to restart the refresh loop below.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (state !== "open") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    let inFlight = false;
    async function load() {
      clearTimeout(timer);
      if (document.hidden || inFlight) return;
      inFlight = true;
      const result = await nextToken(eventId).catch(() => ({ error: "FAILED" }));
      inFlight = false;
      if (cancelled || document.hidden) return;
      if ("error" in result) {
        setView({ kind: "error", code: result.error });
        return;
      }
      setView({ kind: "ready", ...result });
      setNow(Date.now());
      // Clamped so a device with a wrong clock still refreshes inside the window.
      const delay = Math.min(30_000, Math.max(5_000, result.expiresAt - 5_000 - Date.now()));
      clearTimeout(timer);
      timer = setTimeout(load, delay);
    }
    timer = setTimeout(load, 0);
    const onVisibility = () => (document.hidden ? clearTimeout(timer) : void load());
    document.addEventListener("visibilitychange", onVisibility);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [state, eventId, attempt]);

  // Before the window: reload the page when it opens, if that is soon enough
  // for a timer (the staff screen is usually opened minutes before).
  useEffect(() => {
    if (state !== "before") return;
    const wait = new Date(opensAt).getTime() - Date.now();
    if (wait > 6 * 3600_000) return;
    const id = setTimeout(() => router.refresh(), Math.max(0, wait) + 1000);
    return () => clearTimeout(id);
  }, [state, opensAt, router]);

  if (state === "draft") return <Closed title="Not published" body="Publish the event to open check-in." />;
  if (state === "before") return <Closed title={`Check-in opens at ${clock(opensAt)}`} body="Opens 15 minutes before the start. The code appears here by itself." />;
  if (state === "after" || (view.kind === "error" && view.code === "CHECKIN_CLOSED")) {
    return <Closed title="Check-in closed" body="It closes 15 minutes after the event ends. Set an end time to keep check-in open longer." />;
  }

  if (view.kind === "error") {
    return <div className={styles.qrBox}>
      <div className="alert alert-error" role="alert">
        <PixelIcon name="warning" />
        <p className="alert-body">{ERRORS[view.code] ?? ERRORS.FAILED}</p>
      </div>
      <button type="button" className="btn" onClick={() => { setView({ kind: "loading" }); setAttempt((a) => a + 1); }}>Try again</button>
    </div>;
  }

  const left = view.kind === "ready" ? Math.max(0, Math.min(30, Math.ceil((view.expiresAt - now) / 1000))) : null;
  return <div className={styles.qrBox}>
    {view.kind === "ready"
      // eslint-disable-next-line @next/next/no-img-element -- inline SVG data URI; next/image cannot optimise it
      ? <img className={`pixel-4 ${styles.qr}`} alt="Check-in QR code" src={`data:image/svg+xml;utf8,${encodeURIComponent(view.svg)}`} width={320} height={320} />
      : <span className={`skeleton pixel-4 ${styles.qr}`} role="img" aria-label="Loading the check-in QR code" />}
    <p className="hint" aria-live="off">{left === null ? "Loading…" : `New code in ${left} s. Players scan with their phone camera.`}</p>
  </div>;
}

function Closed({ title, body }: { title: string; body: string }) {
  return <div className={styles.qrBox}>
    <p className="alert" role="status"><PixelIcon name="clock" /><span className="stack gap-4"><strong>{title}</strong><span className="muted">{body}</span></span></p>
  </div>;
}
