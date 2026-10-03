"use client";

import { useActionState, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { PixelIcon } from "@/components/icons";
import { FACULTIES, validateProfile, type ProfileDetails, type ProfileErrors } from "@/lib/faculties";
import { saveProfile } from "./actions";
import styles from "./about-you.module.css";

/** Profile details form: step 3 of sign-up, and the edit form on /dashboard (`next="/dashboard"`). */
export function AboutYouForm({ initial, next = "/welcome", submitLabel = "Finish registration →", cancelHref }: {
  initial: ProfileDetails; next?: "/welcome" | "/dashboard"; submitLabel?: string; cancelHref?: string;
}) {
  const [v, setV] = useState(initial);
  const [tried, setTried] = useState(false);
  const [state, action, saving] = useActionState(saveProfile, {});

  const e: ProfileErrors = tried ? validateProfile(v) : state.errors ?? {};
  const count = Object.keys(e).length;
  const faculty = FACULTIES.find((f) => f.name === v.faculty);
  const set = (k: keyof ProfileDetails) => (ev: { target: { value: string } }) =>
    setV((s) => ({ ...s, [k]: ev.target.value, ...(k === "faculty" ? { major: "" } : {}) }));

  function onSubmit(ev: FormEvent<HTMLFormElement>) {
    if (Object.keys(validateProfile(v)).length === 0) return;
    ev.preventDefault();
    setTried(true);
    const form = ev.currentTarget;
    setTimeout(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
  }

  return (
    <>
      {count > 0 && (
        <div className="alert alert-error" role="alert">
          <PixelIcon name="warning" />
          <p className="alert-body"><strong className="alert-title">{count === 1 ? "1 field missing." : `${count} fields missing.`}</strong> Fill in the highlighted fields to finish.</p>
        </div>
      )}
      {state.failed && (
        <div className="alert alert-error" role="alert">
          <PixelIcon name="warning" />
          <p className="alert-body">Couldn&apos;t save right now. Please try again in a moment.</p>
        </div>
      )}

      <form className={next === "/dashboard" ? styles.form : `panel ${styles.form}`} action={action} onSubmit={onSubmit} noValidate>
        <input type="hidden" name="next" value={next} />
        <div className={styles.row}>
          <Field id="first" label="First name" error={e.first && "Enter your first name."}>
            <input className="input" id="first" name="first" value={v.first} onChange={set("first")} autoComplete="given-name" maxLength={60} aria-invalid={Boolean(e.first)} aria-describedby="first-err" />
          </Field>
          <Field id="last" label="Last name" error={e.last && "Enter your last name."}>
            <input className="input" id="last" name="last" value={v.last} onChange={set("last")} autoComplete="family-name" maxLength={60} aria-invalid={Boolean(e.last)} aria-describedby="last-err" />
          </Field>
        </div>
        <Field id="nick" label={<>Nickname <span className="optional">(optional)</span></>} error={e.nick && "Keep it to 20 characters."}>
          <input className="input" id="nick" name="nick" value={v.nick} onChange={set("nick")} autoComplete="nickname" maxLength={20} aria-invalid={Boolean(e.nick)} aria-describedby="nick-err" />
        </Field>
        <Field id="faculty" label="Faculty" error={e.faculty && "Choose your faculty."}>
          <select className="input" id="faculty" name="faculty" value={v.faculty} onChange={set("faculty")} aria-invalid={Boolean(e.faculty)} aria-describedby="faculty-err">
            <option value="">Choose a faculty</option>
            {FACULTIES.map((f) => <option key={f.name}>{f.name}</option>)}
          </select>
        </Field>
        <Field id="major" label="Major" error={e.major && "Choose your major."} hint={!faculty && !e.major ? "Pick a faculty to see its majors." : undefined}>
          <select className="input" id="major" name="major" value={v.major} onChange={set("major")} disabled={!faculty} aria-invalid={Boolean(e.major)} aria-describedby="major-err major-hint">
            <option value="">{faculty ? "Choose a major" : "Pick a faculty first"}</option>
            {faculty?.majors.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <div className={styles.actions}>
          {cancelHref && <Link className="btn" href={cancelHref}>Cancel</Link>}
          <button className="btn btn-primary btn-lg" type="submit" disabled={saving}>{saving ? "Saving…" : submitLabel}</button>
        </div>
      </form>
    </>
  );
}

function Field({ id, label, error, hint, children }: { id: string; label: ReactNode; error?: string | false; hint?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <span id={`${id}-err`} className="field-error"><PixelIcon name="warning" size={14} />{error}</span>}
      {hint && <span id={`${id}-hint`} className="field-help">{hint}</span>}
    </div>
  );
}
