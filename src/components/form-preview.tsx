"use client";

import { useEffect, useMemo, useState } from "react";

/** Live values of the form with this id, re-read on every input or change, so a
 *  preview can sit beside a server-rendered form. Null until the first edit:
 *  previews show the saved values until then. */
export function useFormValues(formId: string) {
  const [values, setValues] = useState<FormData | null>(null);
  useEffect(() => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;
    const read = () => setValues(new FormData(form));
    // "reset" fires before the fields go back, so show the saved values instead.
    const reset = () => setValues(null);
    form.addEventListener("input", read);
    form.addEventListener("change", read);
    form.addEventListener("reset", reset);
    return () => {
      form.removeEventListener("input", read);
      form.removeEventListener("change", read);
      form.removeEventListener("reset", reset);
    };
  }, [formId]);
  return values;
}

/** A text field's live value, or `saved` before the first edit. */
export const text = (values: FormData | null, name: string, saved: string) => (values ? String(values.get(name) ?? "") : saved);

/** A checkbox's live state, or `saved` before the first edit. */
export const checked = (values: FormData | null, name: string, saved: boolean) => (values ? values.get(name) === "on" : saved);

/** Object URL for a picked file, or null; revoked when the file changes. */
export function usePickedFile(values: FormData | null, name: string) {
  const file = values?.get(name);
  const picked = file instanceof File && file.size > 0 ? file : null;
  const url = useMemo(() => (picked ? URL.createObjectURL(picked) : null), [picked]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return url;
}

/** Frame that labels a preview as one, so nobody mistakes it for the live site. */
export function PreviewFrame({ label = "Preview", children }: { label?: string; children: React.ReactNode }) {
  return (
    <section className="preview-frame" aria-label={label}>
      <p className="preview-label" aria-hidden="true">{label}</p>
      {children}
    </section>
  );
}
