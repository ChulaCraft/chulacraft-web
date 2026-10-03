"use client";

import { useRef, useState } from "react";

type Props = {
  /** Server action the confirm button submits. */
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  trigger: React.ReactNode;
  triggerClassName: string;
  triggerLabel?: string;
  title: string;
  body: string;
  confirmLabel: string;
  confirmClassName?: string;
  /** Owner promotion: the confirm button stays disabled until this text is typed. */
  requireText?: string;
  danger?: boolean;
};

/** A button that opens a native <dialog> to confirm a server action. */
export function ConfirmAction({ action, fields, trigger, triggerClassName, triggerLabel, title, body, confirmLabel, confirmClassName = "btn btn-primary", requireText, danger }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [typed, setTyped] = useState("");
  const blocked = requireText !== undefined && typed.trim() !== requireText;

  return <>
    <button type="button" className={triggerClassName} aria-label={triggerLabel} onClick={() => { setTyped(""); ref.current?.showModal(); }}>{trigger}</button>
    <dialog ref={ref} className="dialog" data-danger={danger || undefined} aria-label={title} onClick={(e) => { if (e.target === e.currentTarget) ref.current?.close(); }}>
      {danger && <div className="dialog-banner">Highest level</div>}
      <form action={action} className="dialog-body">
        {Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
        <h2 className="dialog-title">{title}</h2>
        <p className="muted">{body}</p>
        {requireText !== undefined && (
          <div className="field">
            <label htmlFor="confirm-text">Type <span className="mono">{requireText}</span> to confirm</label>
            <input id="confirm-text" className="input mono" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck="false" />
          </div>
        )}
        <div className="dialog-actions">
          <button type="button" className="btn" onClick={() => ref.current?.close()} autoFocus>Cancel</button>
          <button type="submit" className={confirmClassName} disabled={blocked}>{confirmLabel}</button>
        </div>
      </form>
    </dialog>
  </>;
}
