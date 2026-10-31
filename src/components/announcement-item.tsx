import Image from "next/image";
import { SEVERITY } from "@/lib/announcement-severity";
import styles from "@/app/announcements/announcements.module.css";

type Props = {
  id?: string; title: string; body: string; severity: string; pinned: boolean;
  /** null = draft or scheduled, shown as such in the admin preview. */
  publishedAt: string | null;
  imageSrc: string | null;
  preview?: boolean;
};

/** One announcement on /announcements, and the admin form's live preview. */
export function AnnouncementItem({ id, title, body, severity, pinned, publishedAt, imageSrc, preview = false }: Props) {
  const tone = SEVERITY[severity] ?? SEVERITY.info;
  const Item = preview ? "div" : "li";
  const Title = preview ? "p" : "h2";
  return (
    <Item id={id} className={`panel ${styles.item}`}>
      <p className={styles.meta}>
        <span className={`badge badge-${tone.badge}`}>{tone.label}</span>
        {pinned && <span className="badge badge-muted">Pinned</span>}
        {publishedAt
          ? <time className="hint" dateTime={publishedAt}>{new Date(publishedAt).toLocaleString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium", timeStyle: "short" })}</time>
          : <span className="hint">Not published</span>}
      </p>
      <Title className={styles.title}>{title || "Title"}</Title>
      {imageSrc && (
        <div className={`pixel-4 ${styles.picture}`}>
          <Image src={imageSrc} alt="" fill sizes="(min-width: 800px) 760px, 100vw" unoptimized={imageSrc.startsWith("blob:")} />
        </div>
      )}
      <p className={styles.body}>{body}</p>
    </Item>
  );
}
