"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { EventCard } from "@/components/event-card";
import { PixelIcon } from "@/components/icons";
import styles from "../../admin.module.css";
import { IMAGE_TYPES } from "../images";
import { saveEvent } from "./[id]/actions";

export type EventFormValues = {
  id?: string;
  name: string;
  description: string;
  startsAt: string;
  endsAt: string;
  location: string;
  status: string;
};

/** Covers are shown at card size, so ~500 KB is plenty and keeps the free-tier
 *  Storage quota from filling up. Anything bigger is re-encoded. */
const TARGET_BYTES = 500 * 1024;
/** Widest a cover needs to be: the event page shows it at most ~800 px wide. */
const MAX_WIDTH = 1600;

/** Re-encodes a picture as WebP (JPEG where the browser can't write WebP),
 *  lowering quality and then size until it fits. A GIF comes out as a still. */
async function shrink(file: File): Promise<File | null> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  let scale = Math.min(1, MAX_WIDTH / bitmap.width);
  let quality = 0.9;
  for (let attempt = 0; attempt < 12; attempt++) {
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    let blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, "image/webp", quality));
    if (blob && blob.type !== "image/webp") blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, "image/jpeg", quality));
    if (blob && blob.size <= TARGET_BYTES) {
      const ext = blob.type === "image/webp" ? "webp" : "jpg";
      return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.${ext}`, { type: blob.type });
    }
    if (quality > 0.55) quality -= 0.1;
    else { scale *= 0.8; quality = 0.85; }
  }
  return null;
}

const LOADED_AT = new Date().toISOString();
const noSubscribe = () => () => {};

/** datetime-local values are Bangkok wall time (D8), same as the server reads them. */
const toIso = (local: string) => {
  const date = new Date(`${local}:00+07:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

/** The event editor: fields on the left, the homepage card it will become on
 *  the right, updated as the admin types. `aside` is extra server-rendered
 *  content for the right column, `footer` for under the form. */
export function EventForm({ initial, submitLabel, coverUrl, aside, footer }: {
  initial: EventFormValues;
  submitLabel: string;
  coverUrl: string | null;
  aside?: ReactNode;
  footer?: ReactNode;
}) {
  const [values, setValues] = useState(initial);
  const [preview, setPreview] = useState<string | null>(null);
  const [coverNote, setCoverNote] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const prefix = initial.id ? "e" : "n";

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  // Stand-in date for the preview before a start is picked. Null while server
  // rendering: "now" on the server and in the browser never match.
  const now = useSyncExternalStore(noSubscribe, () => LOADED_AT, () => null);

  const set = (field: keyof EventFormValues) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [field]: e.target.value }));

  function onStart(e: { target: { value: string } }) {
    const startsAt = e.target.value;
    // An end before the new start would be refused on save; clear it instead.
    setValues((v) => ({ ...v, startsAt, endsAt: v.endsAt && v.endsAt < startsAt ? "" : v.endsAt }));
  }

  function pickFile(file: File | null) {
    const input = fileRef.current!;
    if (file) {
      const list = new DataTransfer();
      list.items.add(file);
      input.files = list.files;
    } else {
      input.value = "";
    }
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setCoverNote(null);
    if (!file) return pickFile(null);
    if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
      pickFile(null);
      setCoverNote({ tone: "error", text: `Upload didn't work: “${file.name}” isn't a PNG, JPEG, WebP or GIF image. Pick another file.` });
      return;
    }
    if (file.size <= TARGET_BYTES) return pickFile(file);

    setBusy(true);
    try {
      const small = await shrink(file);
      if (!small) {
        pickFile(null);
        setCoverNote({ tone: "error", text: "Upload didn't work: that picture couldn't be made small enough. Try a smaller one." });
      } else {
        pickFile(small);
        const kb = (n: number) => n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
        setCoverNote({ tone: "info", text: `Compressed from ${kb(file.size)} to ${kb(small.size)} (WebP, up to ${MAX_WIDTH} px wide).` });
      }
    } catch {
      pickFile(null);
      setCoverNote({ tone: "error", text: "Upload didn't work: that file couldn't be read as an image." });
    } finally {
      setBusy(false);
    }
  }

  const startsIso = toIso(values.startsAt) ?? now;
  const description = values.description.trim();

  return (
    <div className={styles.columns}>
      <div className={styles.sideCol}>
        <form action={saveEvent} className={`panel ${styles.catalogForm}`} aria-labelledby={`${prefix}-form-title`}>
          <h1 id={`${prefix}-form-title`} className={styles.sectionTitle}>{initial.id ? initial.name : "New event"}</h1>
          {initial.id && <input type="hidden" name="eventId" value={initial.id} />}

          <div className="field">
            <label htmlFor={`${prefix}-name`}>Name</label>
            <input id={`${prefix}-name`} className="input" name="name" value={values.name} onChange={set("name")} required maxLength={80} />
          </div>
          <div className="field">
            <label htmlFor={`${prefix}-desc`}>Description <span className="optional">(optional)</span></label>
            <textarea id={`${prefix}-desc`} className={styles.textarea} name="description" rows={3} value={values.description} onChange={set("description")} maxLength={500} />
          </div>
          <div className={styles.formRow}>
            <div className="field">
              <label htmlFor={`${prefix}-starts`}>Starts (Bangkok)</label>
              <input id={`${prefix}-starts`} className="input" type="datetime-local" name="startsAt" value={values.startsAt} onChange={onStart} required aria-describedby={`${prefix}-time-help`} />
            </div>
            <div className="field">
              <label htmlFor={`${prefix}-ends`}>Ends <span className="optional">(optional)</span></label>
              <input id={`${prefix}-ends`} className="input" type="datetime-local" name="endsAt" value={values.endsAt} onChange={set("endsAt")} min={values.startsAt || undefined} disabled={!values.startsAt} />
            </div>
          </div>
          <p id={`${prefix}-time-help`} className="field-help">Times are Bangkok time. Pick the start first; the end can&apos;t be before it.</p>
          <div className="field">
            <label htmlFor={`${prefix}-location`}>Location <span className="optional">(optional)</span></label>
            <input id={`${prefix}-location`} className="input" name="location" value={values.location} onChange={set("location")} maxLength={120} placeholder="Spawn, survival world" />
          </div>
          <div className="field">
            <label htmlFor={`${prefix}-cover`}>Cover</label>
            <input ref={fileRef} id={`${prefix}-cover`} className="input" type="file" name="cover" accept={IMAGE_TYPES.join(",")} onChange={onCover} aria-describedby={`${prefix}-cover-help ${prefix}-cover-note`} />
            <p id={`${prefix}-cover-help`} className="field-help">
              PNG, JPEG, WebP or GIF. Anything over 500 KB is compressed to WebP for you.{initial.id && " Leave empty to keep the current cover."}
            </p>
            <div id={`${prefix}-cover-note`} aria-live="polite">
              {busy && <p className="hint">Compressing…</p>}
              {coverNote && (
                <p className={`alert ${coverNote.tone === "error" ? "alert-error" : "alert-success"}`} role={coverNote.tone === "error" ? "alert" : "status"}>
                  <PixelIcon name={coverNote.tone === "error" ? "warning" : "check"} />{coverNote.text}
                </p>
              )}
            </div>
          </div>
          <div className="field">
            <label htmlFor={`${prefix}-status`}>Status</label>
            <select id={`${prefix}-status`} className="input" name="status" value={values.status} onChange={set("status")}>
              <option value="draft">Draft — hidden from players</option>
              <option value="published">Published — players see it</option>
            </select>
          </div>

          <div className={styles.formButtons}>
            <button type="submit" className="btn btn-primary" disabled={busy}>{submitLabel}</button>
            {!initial.id && <Link href="/admin/achievements" className="btn">Cancel</Link>}
          </div>
        </form>
        {footer}
      </div>

      <div className={styles.mainCol}>
        <section className="panel stack gap-16" aria-labelledby={`${prefix}-preview-title`}>
          <h2 id={`${prefix}-preview-title`} className={styles.sectionTitle}>Live preview</h2>
          <p className="hint">How the card looks on the homepage and the Events page{values.status === "draft" ? " once published" : ""}.</p>
          {/* inert: a picture of the card, not a link to follow from here. */}
          {startsIso && <ul className={styles.previewCard} inert>
            <EventCard
              coverSrc={preview ?? coverUrl ?? undefined}
              event={{
                id: initial.id ?? "preview",
                name: values.name.trim() || "Event name",
                starts_at: startsIso,
                ends_at: values.endsAt ? toIso(values.endsAt) : null,
                location: values.location.trim() || null,
                image_path: preview || coverUrl ? "preview" : null,
                description_excerpt: description ? (description.length > 140 ? `${description.slice(0, 140)}…` : description) : null,
                interest_count: 0
              }}
            />
          </ul>}
        </section>
        {aside}
      </div>
    </div>
  );
}
