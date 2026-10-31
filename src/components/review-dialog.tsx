"use client";

import { useEffect, useRef } from "react";
import { SubmitButton } from "@/components/submit-button";

export type ReviewRow = { label: string; before: string; after: string };

type Props = {
  /** Server action the confirm button submits. */
  action: (formData: FormData) => void | Promise<void>;
  fields?: Record<string, string>;
  trigger: React.ReactNode;
  triggerClassName: string;
  triggerLabel?: string;
  title: string;
  /** One line per change, shown as before -> after. */
  rows: ReviewRow[];
  /** Shown above the buttons, for example who gets notified or what can't be undone. */
  warning?: string;
  confirmLabel: string;
  confirmClassName?: string;
  /** A failed apply: the dialog opens again and shows this, so nothing looks saved. */
  error?: string | null;
  disabled?: boolean;
  danger?: boolean;
};

/** Native <dialog> that lists staged changes for review before a server action applies them. */
export function ReviewDialog({ action, fields = {}, trigger, triggerClassName, triggerLabel, title, rows, warning, confirmLabel, confirmClassName = "btn btn-primary", error, disabled, danger }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (error && ref.current && !ref.current.open) ref.current.showModal(); }, [error]);

  return <>
    <button type="button" className={triggerClassName} aria-label={triggerLabel} disabled={disabled} onClick={() => ref.current?.showModal()}>{trigger}</button>
    <dialog ref={ref} className="dialog" data-danger={danger || undefined} aria-label={title} onClick={(e) => { if (e.target === e.currentTarget) ref.current?.close(); }}>
      {danger && <div className="dialog-banner">Highest level</div>}
      <form action={action} className="dialog-body">
        {Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
        <h2 className="dialog-title">{title}</h2>
        <ul className="review-rows" style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.5rem" }}>
          {rows.map((row) => (
            <li key={row.label}>
              <span className="muted">{row.label}</span>{" "}
              <span>{row.before}</span> <span aria-hidden="true">{"->"}</span><span className="sr-only"> changes to </span> <strong>{row.after}</strong>
            </li>
          ))}
        </ul>
        {warning && <p className="muted" role="note">{warning}</p>}
        {error && <div className="alert alert-error" role="alert"><p className="alert-body">{error}</p></div>}
        <div className="dialog-actions">
          <button type="button" className="btn" onClick={() => ref.current?.close()} autoFocus>Cancel</button>
          <SubmitButton className={confirmClassName}>{confirmLabel}</SubmitButton>
        </div>
      </form>
    </dialog>
  </>;
}
