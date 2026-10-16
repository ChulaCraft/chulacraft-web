import { NavLinks } from "@/components/site-nav";
import styles from "./admin.module.css";

const GROUPS = [
  { label: "People", links: [{ label: "Overview", href: "/admin", exact: true }, { label: "Players", href: "/admin/players" }, { label: "Removed", href: "/admin/restore" }] },
  { label: "Community", links: [{ label: "Achievements", href: "/admin/commu/achievements" }, { label: "Events", href: "/admin/commu/events" }, { label: "Announcements", href: "/admin/commu/announcements" }] },
  { label: "Moderation", links: [{ label: "Reports", href: "/admin/reports" }, { label: "Appeals", href: "/admin/appeals" }] },
  { label: "System", links: [{ label: "Server", href: "/admin/server" }, { label: "Audit log", href: "/admin/audit" }] },
];

export function AdminNav() {
  return (
    <nav className={`${styles.subnav} ${styles.adminNav}`} aria-label="Admin sections">
      {GROUPS.map((g) => (
        <div key={g.label} role="group" aria-label={g.label} className={styles.subnavGroup}>
          <span className={styles.subnavLabel} aria-hidden="true">{g.label}</span>
          <div className={styles.subnavLinks}><NavLinks links={g.links} /></div>
        </div>
      ))}
    </nav>
  );
}
