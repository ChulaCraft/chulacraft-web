"use client";

import { TeamCard, type TeamCardData } from "@/components/team-card";
import { PreviewFrame, checked, text, useFormValues, usePickedFile } from "@/components/form-preview";
import { TEAM_SECTIONS } from "@/lib/team";
import styles from "@/app/team/team.module.css";

/** The card as /team will show it, under its section heading. */
export function MemberPreview({ formId, saved, kind }: { formId: string; saved: TeamCardData; kind: string }) {
  const values = useFormValues(formId);
  const picked = usePickedFile(values, "photo");
  const section = TEAM_SECTIONS.find((s) => s.kind === text(values, "kind", kind)) ?? TEAM_SECTIONS[0];
  const player = text(values, "player", saved.userId ?? "");
  const card: TeamCardData = {
    name: text(values, "name", saved.name),
    title: text(values, "title", saved.title),
    bio: text(values, "bio", saved.bio),
    photo: picked ?? (checked(values, "removePhoto", false) ? null : saved.photo),
    userId: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.exec(player)?.[0] ?? null,
    linkUrl: text(values, "link", saved.linkUrl ?? "") || null,
  };
  return (
    <PreviewFrame label="Preview — /team">
      <div className={styles.section}>
        <p className={styles.sectionTitle}>{section.title}</p>
        <div className={styles.grid}><TeamCard preview member={card} /></div>
      </div>
    </PreviewFrame>
  );
}
