"use client";

import { useFormStatus } from "react-dom";

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type">;

/**
 * A submit button for server-action forms. While the action runs, every submit
 * button in the form is disabled (no double submits), and the one that was
 * clicked shows a busy indicator. The label stays in place, so the width does
 * not change.
 */
export function SubmitButton({ disabled, name, value, ...props }: Props) {
  const { pending, data } = useFormStatus();
  // Forms with two outcomes (Accept / Reject) send the clicked button's
  // name=value, which tells us which one to mark busy.
  const mine = pending && (name === undefined || data?.get(name) === String(value));
  return <button {...props} type="submit" name={name} value={value} disabled={disabled || pending} aria-busy={mine || undefined} />;
}
