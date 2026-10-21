import { NavLinks } from "@/components/site-nav";
import { staffCan, type Area } from "@/lib/staff";
import styles from "./admin.module.css";
import { CommandSearch } from "./search/command-search";

const ALL_GROUPS: { label: string; area: Area; links: { label: string; href: string; exact?: boolean; area?: Area }[] }[] = [
  { label: "People", area: "players_read", links: [{ label: "Overview", href: "/admin", exact: true }, { label: "Players", href: "/admin/players" }, { label: "Removed", href: "/admin/restore", area: "admin" }] },
  { label: "Community", area: "community", links: [{ label: "Achievements", href: "/admin/commu/achievements" }, { label: "Events", href: "/admin/commu/events" }, { label: "Announcements", href: "/admin/commu/announcements" }, { label: "Banners", href: "/admin/commu/banners" }, { label: "Gallery", href: "/admin/commu/gallery" }, { label: "Team", href: "/admin/commu/team" }] },
  { label: "Moderation", area: "moderation", links: [{ label: "Reports", href: "/admin/reports" }, { label: "Appeals", href: "/admin/appeals" }] },
  { label: "System", area: "admin", links: [{ label: "Server", href: "/admin/server" }, { label: "Audit log", href: "/admin/audit" }, { label: "Settings", href: "/admin/settings" }, { label: "Pages", href: "/admin/pages" }] },
];

/** Only the sections this role can open. */
function groupsFor(role: string | null) {
  return ALL_GROUPS.filter((g) => staffCan(role, g.area))
    .map((g) => ({ ...g, links: g.links.filter((l) => !l.area || staffCan(role, l.area)) }));
}

export function AdminNav({ role }: { role: string | null }) {
  const GROUPS = groupsFor(role);
  return (
    <nav className={`${styles.subnav} ${styles.adminNav}`} aria-label="Admin sections">
      {GROUPS.map((g) => (
        <div key={g.label} role="group" aria-label={g.label} className={styles.subnavGroup}>
          <span className={styles.subnavLabel} aria-hidden="true">{g.label}</span>
          <div className={styles.subnavLinks}><NavLinks links={g.links} /></div>
        </div>
      ))}
      <div className={styles.navSearch}>
        <CommandSearch pages={GROUPS.flatMap((g) => g.links.map((l) => ({ label: l.label, href: l.href, group: g.label })))} />
      </div>
    </nav>
  );
}
