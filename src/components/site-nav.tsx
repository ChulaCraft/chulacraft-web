"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// The header lives in the root layout and isn't re-rendered on navigation,
// so the bits that depend on the current page are worked out here instead.

export function HeaderShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const home = path === "/";
  const [scrolled, setScrolled] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const hidden = home && !scrolled;

  // An open menu hangs below the header, so it would float on its own once
  // the header slides away; close it then, after navigating, and on any
  // click outside it.
  useEffect(() => {
    ref.current?.querySelectorAll("details[open]").forEach((d) => d.removeAttribute("open"));
  }, [path, hidden]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      ref.current?.querySelectorAll("details[open]").forEach((d) => { if (!d.contains(e.target as Node)) d.removeAttribute("open"); });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!home) return;
    const onScroll = () => setScrolled(window.scrollY > 72);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [home]);
  // On the landing page the header floats over the hero and drops in on scroll.
  return <header ref={ref} className={`site-header${home ? " site-header-overlay" : ""}${home && scrolled ? " is-shown" : ""}`}>{children}</header>;
}

export function NavLinks({ links }: { links: { label: string; href: string }[] }) {
  const path = usePathname();
  return links.map((l) => {
    const active = l.href === "/" ? path === "/" : path === l.href || path.startsWith(`${l.href}/`);
    return <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}>{l.label}</Link>;
  });
}
