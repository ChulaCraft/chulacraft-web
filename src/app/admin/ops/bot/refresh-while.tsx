"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-reads the page every 5 s while `active` (a saved setting is waiting for
 *  the bot's check), so "Waiting for the bot to check" turns into the result
 *  without a reload. Typed-in values survive: refresh keeps client state. */
export function RefreshWhile({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [active, router]);
  return null;
}
