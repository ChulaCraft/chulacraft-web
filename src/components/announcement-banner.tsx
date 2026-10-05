"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { PixelIcon } from "@/components/icons";
import { SEVERITY } from "@/lib/announcement-severity";

const KEY = "dismissed-announcement";
const CHANGED = "announcement-dismissed";

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Private browsing can refuse storage; the banner then just can't be dismissed for good. */
function dismissedId() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

/** The pinned announcement, under the header on every page. Dismissing stores
 *  its id, so a newer pinned announcement shows again. */
export function AnnouncementBanner({ id, title, severity }: { id: string; title: string; severity: string }) {
  // Server-rendered visible: most visitors have not dismissed it, and showing
  // it late would shift the page for all of them.
  const dismissed = useSyncExternalStore(subscribe, dismissedId, () => null);
  if (dismissed === id) return null;
  const tone = SEVERITY[severity] ?? SEVERITY.info;

  return (
    <aside className={`alert announcement-banner${tone.alert}`} aria-label="Announcement">
      <PixelIcon name={severity === "info" ? "info" : "warning"} />
      <p className="alert-body"><strong>{tone.label}:</strong> <Link href={`/announcements#${id}`}>{title}</Link></p>
      <button
        type="button"
        className="announcement-dismiss"
        aria-label="Dismiss announcement"
        onClick={() => {
          try { localStorage.setItem(KEY, id); } catch { /* see dismissedId */ }
          window.dispatchEvent(new Event(CHANGED));
        }}
      >
        <PixelIcon name="close" />
      </button>
    </aside>
  );
}
