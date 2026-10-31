"use client";

import { useRef } from "react";
import { PixelIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { reportPlayer } from "./actions";
import styles from "./player.module.css";

const CATEGORIES = [
  ["grief", "Griefing", "Broke or stole builds"],
  ["cheat", "Cheating", "Hacked client, x-ray, exploits"],
  ["harassment", "Harassment", "Insults, threats, spam"],
  ["other", "Something else", "Tell us in the details"]
] as const;

/** Report button + native <dialog>. The server action and its error codes are
 *  unchanged: it redirects back here with ?error= or ?done=reported. */
export function ReportDialog({ playerId, playerName }: { playerId: string; playerName: string }) {
  const ref = useRef<HTMLDialogElement>(null);

  return <>
    <button type="button" className="btn btn-sm btn-danger-outline" onClick={() => ref.current?.showModal()}>
      <PixelIcon name="warning" />Report
    </button>
    <dialog ref={ref} className="dialog" aria-labelledby="report-title" onClick={(e) => { if (e.target === e.currentTarget) ref.current?.close(); }}>
      <form action={reportPlayer} className="dialog-body">
        <input type="hidden" name="playerId" value={playerId} />
        <h2 id="report-title" className="dialog-title">Report {playerName}</h2>
        <fieldset className={styles.reasons}>
          <legend className="label">What happened?</legend>
          {CATEGORIES.map(([value, label, help]) => (
            <label key={value} className={styles.reason}>
              <input type="radio" name="category" value={value} defaultChecked={value === "grief"} />
              <span><strong>{label}</strong><span className="muted">{help}</span></span>
            </label>
          ))}
        </fieldset>
        <div className="field">
          <label htmlFor="report-details">Details</label>
          <textarea id="report-details" className="input" name="details" rows={3} minLength={10} maxLength={2000} required placeholder="Where, when, and what they did" />
        </div>
        <div className="field">
          <label htmlFor="report-evidence">Screenshot or video link <span className="optional">optional</span></label>
          <input id="report-evidence" className="input" type="url" name="evidenceUrl" pattern="https://.*" maxLength={500} placeholder="https://" />
        </div>
        <p className="hint">Only admins see reports. The player isn&apos;t told who reported them.</p>
        <div className="dialog-actions">
          <button type="button" className="btn" onClick={() => ref.current?.close()}>Cancel</button>
          <SubmitButton className="btn btn-danger">Send report</SubmitButton>
        </div>
      </form>
    </dialog>
  </>;
}
