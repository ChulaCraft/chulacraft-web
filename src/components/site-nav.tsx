"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The header lives in the root layout and isn't re-rendered on navigation,
// so the bits that depend on the current page are worked out here instead.

export function HeaderShell({ children }: { children: React.ReactNode }) {
  // On the landing page the header floats over the hero and drops in on scroll.
  return <header className={`site-header${usePathname() === "/" ? " site-header-overlay" : ""}`}>{children}</header>;
}

export function NavLinks({ links }: { links: { label: string; href: string }[] }) {
  const path = usePathname();
  return links.map((l) => {
    const active = l.href === "/" ? path === "/" : path === l.href || path.startsWith(`${l.href}/`);
    return <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}>{l.label}</Link>;
  });
}
