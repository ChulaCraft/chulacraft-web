import Image from "next/image";
import styles from "./achievement-grid.module.css";

/** achievement_groups() in supabase/migrations/20261006000001_achievements.sql:427
 *  builds this jsonb, so the generated types can't describe it. Only the
 *  achievement's own fields and its entries are read here; event_name is only
 *  present when the event is published (20261006000001:439). */
export type AchievementGroup = {
  achievement_id: string;
  name: string;
  description: string | null;
  image_path: string;
  count: number;
  first_on: string;
  last_on: string;
  entries: { awarded_on: string; event_name: string | null }[];
};

const BUCKET = "achievements";

/** Public bucket URL; next/image resizes it (remote pattern in next.config.ts). */
export function achievementImage(path: string) {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}

const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium" });

/** One card per badge: image, name, how many times it was earned, and the
 *  entries behind that count in a disclosure. */
export function AchievementGrid({ groups }: { groups: AchievementGroup[] }) {
  if (groups.length === 0) {
    return <p className="muted">No badges yet. Play at an event and one will show up here.</p>;
  }

  return <ul className={styles["badge-grid"]}>
    {groups.map((group) => (
      <li key={group.achievement_id} className={`${styles["badge-card"]} pixel-4`}>
        <Image className={styles["badge-image"]} src={achievementImage(group.image_path)} alt="" width={96} height={96} />
        <p className={styles["badge-name"]}>{group.name}</p>
        <p className={styles["badge-count"]}>
          ×{group.count}
          <span className={styles["badge-span"]}> · earned {day(group.first_on)}{group.count > 1 && ` – ${day(group.last_on)}`}</span>
        </p>
        {group.description && <p className={styles["badge-note"]}>{group.description}</p>}
        {group.entries.length > 1 && (
          <details className={styles["badge-entries"]}>
            <summary>{group.count === 1 ? "When" : "Every time"}</summary>
            <ol>
              {group.entries.map((entry, i) => (
                <li key={i}>
                  <time dateTime={entry.awarded_on}>{day(entry.awarded_on)}</time>
                  {entry.event_name && <span>{entry.event_name}</span>}
                </li>
              ))}
            </ol>
          </details>
        )}
        {group.entries.length === 1 && group.entries[0].event_name && (
          <p className={styles["badge-span"]}>{group.entries[0].event_name}</p>
        )}
      </li>
    ))}
  </ul>;
}