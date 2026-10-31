"use client";

import { usePathname } from "next/navigation";
import { PixelIcon } from "@/components/icons";
import { NavLinks } from "@/components/site-nav";
import styles from "./admin.module.css";

type Link = { label: string; href: string; exact?: boolean };

const isActive = (path: string, l: Link) =>
  l.exact ? path === l.href : path === l.href || path.startsWith(`${l.href}/`);

/** One top-level admin section as a dropdown of its pages. The section that
 *  holds the current page opens on its own; the rest stay folded until
 *  picked. Keyed by the active state so navigating into a folded section
 *  opens it, while a section the reader opened by hand stays open. */
export function AdminNavGroup({ label, links }: { label: string; links: Link[] }) {
  const path = usePathname();
  const active = links.some((l) => isActive(path, l));
  return (
    <details key={String(active)} className={styles.navGroup} open={active || undefined} data-active={active || undefined}>
      <summary>
        <span>{label}</span>
        <PixelIcon name="chevron" size={14} />
      </summary>
      <div className={styles.subnavLinks} role="group" aria-label={label}>
        <NavLinks links={links} />
      </div>
    </details>
  );
}
