"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { PixelIcon } from "./icons";

// The header lives in the root layout and isn't re-rendered on navigation,
// so the bits that depend on the current page are worked out here instead.

export function HeaderShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const ref = useRef<HTMLElement>(null);

  // Close an open menu after navigating, on any click outside it, and on Escape
  // (which also hands focus back to its toggle).
  useEffect(() => {
    ref.current?.querySelectorAll("details[open]").forEach((d) => d.removeAttribute("open"));
  }, [path]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      ref.current?.querySelectorAll("details[open]").forEach((d) => { if (!d.contains(e.target as Node)) d.removeAttribute("open"); });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      ref.current?.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((d) => {
        d.removeAttribute("open");
        d.querySelector("summary")?.focus();
      });
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return <header ref={ref} className="site-header">{children}</header>;
}

export function NavLinks({ links }: { links: { label: string; href: string; exact?: boolean }[] }) {
  const path = usePathname();
  return links.map((l) => {
    const active = l.exact || l.href === "/" ? path === l.href : path === l.href || path.startsWith(`${l.href}/`);
    return <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}>{l.label}</Link>;
  });
}

export type NavItem = { label: string; href: string } | { label: string; items: { label: string; href: string }[] };

const isActive = (path: string, href: string) =>
  href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);

/** The header's sections: plain links, and groups that open as dropdowns.
 *  A group is marked current when the page is one of its links. HeaderShell
 *  closes an open group on navigation, outside clicks and Escape. */
export function MainNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return items.map((item) => {
    if ("href" in item) {
      return <Link key={item.label} href={item.href} aria-current={isActive(path, item.href) ? "page" : undefined}>{item.label}</Link>;
    }
    const current = item.items.some((l) => isActive(path, l.href));
    return (
      <details key={item.label} className="nav-menu" data-current={current || undefined}>
        <summary>{item.label}<PixelIcon name="chevron" size={14} /></summary>
        <div className="nav-menu-panel">
          {item.items.map((l) => (
            <Link key={l.href} href={l.href} aria-current={isActive(path, l.href) ? "page" : undefined}>{l.label}</Link>
          ))}
        </div>
      </details>
    );
  });
}
