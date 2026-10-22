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
  /** 20261026000001: always present from the database; a missing or unknown
   *  value reads as common. */
  tier: string;
  /** 1..3 when the player picked it for their showcase, else null. */
  showcase_position: number | null;
};

export const TIERS = ["common", "rare", "epic", "legendary"] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_LABELS: Record<Tier, string> = { common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary" };

export function toTier(value: string | null | undefined): Tier {
  return (TIERS as readonly string[]).includes(value ?? "") ? value as Tier : "common";
}

/** Badges for the showcase row: the player's picks in their order, or, when
 *  nothing is picked, the highest tiers first and then the newest. */
export function showcase(groups: AchievementGroup[], size = 3): AchievementGroup[] {
  const picks = groups.filter((group) => group.showcase_position != null)
    .sort((a, b) => a.showcase_position! - b.showcase_position!);
  if (picks.length > 0) return picks.slice(0, size);
  return [...groups]
    .sort((a, b) => TIERS.indexOf(toTier(b.tier)) - TIERS.indexOf(toTier(a.tier)) || b.last_on.localeCompare(a.last_on))
    .slice(0, size);
}

const BUCKET = "achievements";

/** Public bucket URL; next/image resizes it (remote pattern in next.config.ts). */
export function achievementImage(path: string) {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}

/** One row of my_event_history() / get_player_event_history()
 *  (20261027000001_event_attendance.sql): events the player was checked in
 *  at, newest first, each with the published badges earned there. */
export type EventVisit = {
  event_id: string;
  name: string;
  starts_at: string;
  badges: { achievement_id: string; name: string; image_path: string; tier: string }[];
};

/** The RPCs return jsonb; anything that is not an array reads as no events. */
export function toEventHistory(data: unknown): EventVisit[] {
  return Array.isArray(data) ? data as EventVisit[] : [];
}

const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium" });

/** The tier in words, so the frame colour is never the only signal. */
function TierChip({ tier }: { tier: string }) {
  const value = toTier(tier);
  return <p className={`${styles["tier-chip"]} ${styles[`tier-${value}`]}`}><span className="sr-only">Tier: </span>{TIER_LABELS[value]}</p>;
}

/** The showcase: up to three small framed cards, sized so all three fit side
 *  by side on a 375 px phone. Pass the output of showcase(). */
export function ShowcaseRow({ groups, label }: { groups: AchievementGroup[]; label: string }) {
  return <ul className={styles["showcase-row"]} aria-label={label}>
    {groups.map((group) => (
      <li key={group.achievement_id} className={`${styles["badge-card"]} ${styles["showcase-card"]} ${styles[`tier-${toTier(group.tier)}`]} pixel-4`}>
        <Image className={styles["showcase-image"]} src={achievementImage(group.image_path)} alt="" width={56} height={56} />
        <p className={styles["showcase-name"]}>{group.name}</p>
        <TierChip tier={group.tier} />
      </li>
    ))}
  </ul>;
}

/** One card per badge: image, name, how many times it was earned, and the
 *  entries behind that count in a disclosure. */
export function AchievementGrid({ groups }: { groups: AchievementGroup[] }) {
  if (groups.length === 0) {
    return <p className="muted">No badges yet. Play at an event and one will show up here.</p>;
  }

  return <ul className={styles["badge-grid"]}>
    {groups.map((group) => (
      <li key={group.achievement_id} className={`${styles["badge-card"]} ${styles[`tier-${toTier(group.tier)}`]} pixel-4`}>
        <Image className={styles["badge-image"]} src={achievementImage(group.image_path)} alt="" width={96} height={96} />
        <p className={styles["badge-name"]}>{group.name}</p>
        <TierChip tier={group.tier} />
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

/** Attendance, newest first, with the badges earned at each event. */
export function EventHistory({ events }: { events: EventVisit[] }) {
  if (events.length === 0) return <p className="muted">No events yet.</p>;
  return <ol className={styles["event-list"]}>
    {events.map((event) => (
      <li key={event.event_id}>
        <time dateTime={event.starts_at} className={styles["event-date"]}>{day(event.starts_at)}</time>
        <span className={styles["event-text"]}>
          <strong>{event.name}</strong>
          {event.badges.length > 0 && <span className="muted">{event.badges.map((badge) => badge.name).join(", ")}</span>}
        </span>
      </li>
    ))}
  </ol>;
}
