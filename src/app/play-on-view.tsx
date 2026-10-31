"use client";

import { useEffect, useRef } from "react";

/** A section whose entrance waits for the reader: once this script runs it
 *  arms the section (`data-armed`, which pauses its CSS animations), then
 *  `data-play` starts them when half of it is on screen. If the script never
 *  runs, nothing is armed and the animations simply play on load, so the
 *  content can't get stuck hidden. */
export function PlayOnView({ children, ...rest }: React.ComponentProps<"section">) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.dataset.armed = "";
    // They may have started before this ran: wind them back to the start.
    for (const a of el.getAnimations({ subtree: true })) a.currentTime = 0;
    if (!("IntersectionObserver" in window)) {
      el.dataset.play = "";
      return;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      el.dataset.play = "";
      io.disconnect();
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <section ref={ref} {...rest}>{children}</section>;
}
