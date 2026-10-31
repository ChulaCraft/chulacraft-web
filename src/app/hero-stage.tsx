"use client";

import { useEffect, useRef } from "react";

/** Drives the landing hero's scroll moment. The section is taller than the
 *  screen and its stage sticks; as the reader scrolls through it, --p runs
 *  0 → 1 on the section (the banner shrinks from full-bleed into a card) and
 *  --header-in runs 0 → 1 on <html> over the second half (the site header
 *  slides in). Plain scrolling does the work: nothing is hijacked.
 *  Under reduced motion both sit at 1 and the CSS drops the extra height. */
export function HeroStage({ className, children, ...rest }: React.ComponentProps<"section">) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    root.dataset.hero = "";

    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const travel = el.offsetHeight - window.innerHeight;
      const p = still.matches || travel <= 0 ? 1 : Math.min(1, Math.max(0, window.scrollY / travel));
      el.style.setProperty("--p", p.toFixed(4));
      root.style.setProperty("--header-in", Math.min(1, Math.max(0, (p - 0.45) / 0.45)).toFixed(4));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    still.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      still.removeEventListener("change", schedule);
      delete root.dataset.hero;
      root.style.removeProperty("--header-in");
    };
  }, []);

  return <section ref={ref} className={className} {...rest}>{children}</section>;
}
