import Link from "next/link";
import { PixelIcon, type PixelIconName } from "@/components/icons";
import styles from "./admin.module.css";

export type Stats = {
  players: number;
  verified: number;
  guests: number;
  unverified: number;
  whitelisted_accounts: number;
  pending_sync: number;
  retrying_sync: number;
  oldest_failing_since: string | null;
  removed_accounts: number;
};

export type Tool = { title: string; desc: string; icon: PixelIconName; href?: string; cta?: string; count?: string };

export const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium", timeStyle: "short" });

/** "2 hours", "3 days": how long ago an ISO time was, for "Oldest waiting". */
export function timeSince(iso: string) {
  const hours = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000));
  if (hours < 1) return "under an hour";
  if (hours < 48) return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  return `${Math.round(hours / 24)} days`;
}

export function StatRow({ label, stats }: { label: string; stats: { label: string; value: number; rail?: string }[] }) {
  return (
    <section aria-label={label} className={styles.stats}>
      {stats.map((s) => (
        <div key={s.label} className={styles.stat} style={s.rail ? { "--rail": s.rail } as React.CSSProperties : undefined}>
          <span className={styles.statLabel}>{s.label}</span>
          <span className={styles.statValue}>{s.value.toLocaleString("en-GB")}</span>
        </div>
      ))}
    </section>
  );
}

/** Tools without an href render as "Coming soon". */
export function ToolCards({ title, tools }: { title: string; tools: Tool[] }) {
  return (
    <section aria-labelledby="tools-title" className={styles.toolsSection}>
      <h2 id="tools-title" className={styles.groupTitle}>{title}</h2>
      <ul className={styles.tools}>
        {tools.map((t) => (
          <li key={t.title}>
            {t.href ? (
              <Link href={t.href} className={styles.tool}>
                <span className={styles.toolHead}>
                  <span className={styles.toolIcon} aria-hidden="true"><PixelIcon name={t.icon} size={22} /></span>
                  {t.count && <span className={`mono ${styles.toolCount}`}>{t.count}</span>}
                </span>
                <span className={styles.toolText}><strong>{t.title}</strong><span>{t.desc}</span></span>
                <span className={styles.toolCta}>{t.cta ?? "Open"} →</span>
              </Link>
            ) : (
              <div className={styles.tool} data-soon aria-disabled="true">
                <span className={styles.toolHead}>
                  <span className={styles.toolIcon} aria-hidden="true"><PixelIcon name={t.icon} size={22} /></span>
                  <span className={styles.soon}>Coming soon</span>
                </span>
                <span className={styles.toolText}><strong>{t.title}</strong><span>{t.desc}</span></span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
