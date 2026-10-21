"use client";

import { GalleryGrid, type Shot } from "@/components/gallery-grid";
import { PreviewFrame, checked, text, useFormValues, usePickedFile } from "@/components/form-preview";

/** The group as /gallery shows it, with the picture being added at the end. */
export function GroupPreview({ formId, name, description, shots }: { formId: string; name: string; description: string; shots: Shot[] }) {
  const values = useFormValues(formId);
  const picked = usePickedFile(values, "image");
  const all = picked
    ? [...shots, { key: "new", src: picked, alt: text(values, "alt", ""), wide: checked(values, "wide", false) }]
    : shots;
  return (
    <PreviewFrame label="Preview — /gallery">
      <div className="stack gap-10">
        <p className="display">{name}</p>
        {description && <p className="muted">{description}</p>}
        {all.length ? <GalleryGrid shots={all} /> : <p className="muted">Pick a picture to see it here.</p>}
      </div>
    </PreviewFrame>
  );
}
