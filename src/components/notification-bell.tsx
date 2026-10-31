"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { openNotifications, type NotificationItem } from "@/app/notifications/actions";
import styles from "./notification-bell.module.css";

type State = { status: "idle" | "loading" | "error" } | { status: "ready"; items: NotificationItem[] };

const BELL = "M8 2v1.5M4 11V7a4 4 0 0 1 8 0v4l1.5 1.5h-11zM6.5 14h3";

const str = (payload: unknown, key: string) => {
  const value = payload && typeof payload === "object" ? (payload as Record<string, unknown>)[key] : undefined;
  return typeof value === "string" ? value : "";
};

/** Relative to now ("in 2 hours", "3 days ago"), in the biggest whole unit. */
function relative(iso: string) {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  if (Number.isNaN(seconds)) return "";
  const units: [Intl.RelativeTimeFormatUnit, number][] = [["day", 86400], ["hour", 3600], ["minute", 60]];
  const [unit, size] = units.find(([, s]) => Math.abs(seconds) >= s) ?? ["minute", 60];
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(Math.round(seconds / size), unit);
}

function describe(item: NotificationItem): { text: string; href: string | null } {
  const p = item.payload;
  switch (item.kind) {
    case "award": return { text: `You earned ${str(p, "name")}`, href: "/dashboard#badges-title" };
    case "banner": return { text: `New banner unlocked: ${str(p, "name")}`, href: "/dashboard?edit=banner" };
    case "appeal": return { text: `Your appeal was ${str(p, "status")}`, href: "/dashboard" };
    case "report": return { text: `Your report was ${str(p, "status")}`, href: null };
    case "reminder": {
      const id = str(p, "event_id");
      return { text: `${str(p, "name")} starts ${relative(str(p, "starts_at"))}`, href: id ? `/events/${id}` : null };
    }
    default: return { text: "New notification", href: null };
  }
}

export function NotificationBell({ count, inline = false }: { count: number; inline?: boolean }) {
  const [unread, setUnread] = useState(count);
  const [seen, setSeen] = useState(count);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>({ status: "idle" });
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // A fresh server render (full load, sign-in) brings a fresh count.
  if (seen !== count) {
    setSeen(count);
    setUnread(count);
  }

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function load() {
    setState({ status: "loading" });
    try {
      const result = await openNotifications();
      if (!result.ok) return setState({ status: "error" });
      setState({ status: "ready", items: result.items });
      setUnread(0);
    } catch {
      setState({ status: "error" });
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) void load();
  }

  return (
    <div ref={root} className={`${styles.root} ${inline ? styles.inline : ""}`}>
      <button ref={button} type="button" className={styles.button} aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"} aria-expanded={open} aria-controls={panelId} onClick={toggle}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="miter" aria-hidden="true"><path d={BELL} /></svg>
        {unread > 0 && <span className={`badge badge-danger ${styles.count}`} aria-hidden="true">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (
        <div id={panelId} className={`panel panel-edge ${styles.popover}`} role="region" aria-label="Notifications">
          <p className={styles.title}>Notifications</p>
          {state.status === "loading" && (
            <div className={styles.skeletons} role="status" aria-label="Loading notifications">
              <span className="skeleton" /><span className="skeleton" /><span className="skeleton" />
            </div>
          )}
          {state.status === "error" && (
            <div className="alert alert-error" role="alert">
              <div>
                <p className="alert-body">Couldn&apos;t load — try again</p>
                <button type="button" className={`btn btn-sm ${styles.retry}`} onClick={() => void load()}>Retry</button>
              </div>
            </div>
          )}
          {state.status === "ready" && state.items.length === 0 && <p className={styles.empty}>Nothing yet</p>}
          {state.status === "ready" && state.items.length > 0 && (
            <ul className={styles.list}>
              {state.items.map((item) => {
                const { text, href } = describe(item);
                const body = <><span className={styles.text}>{text}</span><span className={styles.when}>{relative(item.created_at)}</span></>;
                const cls = `${styles.item} ${item.read_at ? "" : styles.unread}`;
                return <li key={item.id}>{href
                  ? <Link href={href} className={cls} onClick={() => setOpen(false)}>{body}</Link>
                  : <div className={cls}>{body}</div>}</li>;
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
