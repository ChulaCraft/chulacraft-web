"use client";

import { useEffect, useRef, useState } from "react";
import { PixelIcon } from "@/components/icons";
import { checkInPlayer, type ScanResult } from "./actions";
import styles from "./check-in.module.css";

/** Not in TypeScript's DOM lib yet; only the part used here. */
type Detector = { detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]> };
type DetectorClass = new (options: { formats: string[] }) => Detector;

type Camera = "off" | "starting" | "on" | "denied" | "unsupported";

const ERRORS: Record<string, string> = {
  UNKNOWN_CODE: "Unknown code. Check it and try again.",
  BANNED: "This player is banned and can't check in.",
  NOT_VERIFIED: "This player hasn't verified their account, so they can't check in yet.",
  CHECKIN_CLOSED: "Check-in is closed for this event.",
  NOT_FOUND: "Only a published event can take check-ins.",
  FORBIDDEN: "You don't have permission to check players in.",
  FAILED: "That didn't save. Try again."
};

function Avatar({ src, name }: { src: string | null; name: string }) {
  return src
    // eslint-disable-next-line @next/next/no-img-element -- Discord CDN avatar; next/image adds nothing at this size
    ? <img className="avatar" src={src} alt="" width={40} height={40} referrerPolicy="no-referrer" />
    : <span className="avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>;
}

/** Staff scan of a player's personal code (CC-XXXXXXXXXX). The camera uses the
 *  browser's own BarcodeDetector; the typed field is always there for browsers
 *  without it, a blocked camera, or a cracked screen. */
export function Scanner({ eventId }: { eventId: string }) {
  const [camera, setCamera] = useState<Camera>("off");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const loop = useRef<ReturnType<typeof setInterval>>(undefined);
  // The same code stays in frame for a while; one submit per code per 4 s.
  const last = useRef({ value: "", at: 0 });
  const busyRef = useRef(false);

  function stop() {
    clearInterval(loop.current);
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setCamera((c) => (c === "on" || c === "starting" ? "off" : c));
  }

  useEffect(() => () => {
    clearInterval(loop.current);
    stream.current?.getTracks().forEach((track) => track.stop());
  }, []);

  async function submit(value: string, typed = false) {
    if (busyRef.current || !value.trim()) return;
    busyRef.current = true;
    setBusy(true);
    const outcome = await checkInPlayer(eventId, value).catch((): ScanResult => ({ error: "FAILED" }));
    setResult(outcome);
    if (!("error" in outcome)) setCode("");
    busyRef.current = false;
    setBusy(false);
    // Ready for the next player without reaching for the field again.
    if (typed) field.current?.focus();
  }

  function fallBack(state: "denied" | "unsupported") {
    setResult(null);
    setCamera(state);
    field.current?.focus();
  }

  async function start() {
    const Barcode = (window as unknown as { BarcodeDetector?: DetectorClass }).BarcodeDetector;
    if (!Barcode || !navigator.mediaDevices?.getUserMedia) return fallBack("unsupported");
    setCamera("starting");
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      stream.current = media;
      const el = video.current!;
      el.srcObject = media;
      await el.play();
      setCamera("on");
      const detector = new Barcode({ formats: ["qr_code"] });
      loop.current = setInterval(async () => {
        if (busyRef.current || el.readyState < 2) return;
        const found = await detector.detect(el).catch(() => []);
        const value = found[0]?.rawValue?.trim();
        if (!value) return;
        const now = Date.now();
        if (value === last.current.value && now - last.current.at < 4000) return;
        last.current = { value, at: now };
        void submit(value);
      }, 300);
    } catch (error) {
      stop();
      fallBack(error instanceof DOMException && error.name === "NotAllowedError" ? "denied" : "unsupported");
    }
  }

  const live = camera === "on" || camera === "starting";

  return <div className={styles.scanner}>
    <div className={styles.viewfinder} hidden={!live}>
      <video ref={video} className={styles.video} muted playsInline aria-label="Camera preview" />
      <span className={styles.frame} aria-hidden="true" />
    </div>

    <div className={styles.cameraRow}>
      {live
        ? <button type="button" className="btn" onClick={stop}><PixelIcon name="close" />Stop camera</button>
        : <button type="button" className="btn" onClick={start}>Scan with camera</button>}
    </div>
    {/* A scan result replaces the camera warning, so only one message shows. */}
    {(camera === "denied" || camera === "unsupported") && !result && (
      <p className="alert alert-warning" role="status">
        <PixelIcon name="info" />
        {camera === "denied" ? "The camera is blocked for this site. Allow it and reload, or type the code instead." : "This browser can't scan codes. Type the code instead."}
      </p>
    )}

    <form className={styles.codeForm} onSubmit={(e) => { e.preventDefault(); void submit(code, true); }}>
      <div className="field">
        <label htmlFor="player-code">Player code</label>
        <input ref={field} id="player-code" className="input mono" value={code} onChange={(e) => setCode(e.target.value)}
          placeholder="CC-XXXXXXXXXX" autoComplete="off" autoCapitalize="characters" spellCheck="false" maxLength={20} />
        <p className="field-help">From the player&apos;s profile page, under &ldquo;My check-in code&rdquo;.</p>
      </div>
      <button type="submit" className="btn btn-primary" disabled={busy} aria-busy={busy || undefined}>Check in player</button>
    </form>

    <div aria-live="polite">
      {result && ("error" in result ? (
        <p className="alert alert-error" role="alert"><PixelIcon name="warning" />{ERRORS[result.error] ?? ERRORS.FAILED}</p>
      ) : (
        <div className={`alert ${result.status === "recorded" ? "alert-success" : ""} ${styles.scanResult}`} role="status">
          <Avatar src={result.avatarUrl} name={result.name} />
          <div className="stack gap-4">
            <p className="alert-title">{result.status === "recorded" ? "Checked in" : "Already checked in"}</p>
            <p className={`alert-body ${styles.wrap}`}>{result.name}</p>
          </div>
        </div>
      ))}
    </div>
  </div>;
}
