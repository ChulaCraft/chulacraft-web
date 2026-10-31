"use client";

import { AnnouncementBanner } from "@/components/announcement-banner";
import { AnnouncementItem } from "@/components/announcement-item";
import { PreviewFrame, checked, text, useFormValues, usePickedFile } from "@/components/form-preview";

type Saved = { title: string; body: string; severity: string; pinned: boolean; published: boolean; publishedAt: string | null; imageSrc: string | null };

/** The announcement on /announcements, plus the banner under the header when pinned. */
export function AnnouncementPreview({ formId, saved }: { formId: string; saved: Saved }) {
  const values = useFormValues(formId);
  const picked = usePickedFile(values, "image");
  const title = text(values, "title", saved.title);
  const severity = text(values, "severity", saved.severity);
  const pinned = checked(values, "pinned", saved.pinned);
  const published = text(values, "status", saved.published ? "published" : "draft") === "published";
  const imageSrc = picked ?? (checked(values, "removeImage", false) ? null : saved.imageSrc);
  return (
    <PreviewFrame label="Preview — /announcements">
      <div className="stack gap-10">
        {pinned && published && <AnnouncementBanner preview id="preview" title={title || "Title"} severity={severity} />}
        <AnnouncementItem preview title={title} body={text(values, "body", saved.body)} severity={severity} pinned={pinned}
          publishedAt={published ? saved.publishedAt ?? new Date().toISOString() : null} imageSrc={imageSrc} />
        {!published && <p className="hint">Drafts are hidden from players.</p>}
      </div>
    </PreviewFrame>
  );
}
