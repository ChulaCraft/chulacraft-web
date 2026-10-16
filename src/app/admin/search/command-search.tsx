"use client";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { PixelIcon } from "@/components/icons";
import styles from "./search.module.css";
import { adminSearch, type SearchHit } from "./actions";

type Item = { kind: SearchHit["kind"] | "Page"; label: string; hint: string; href: string };

/** Ctrl+K / ⌘K from any admin page: jump to a page, player, achievement or event. */
export function CommandSearch({ pages }: { pages: { label: string; href: string; group: string }[] }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  // Debounced; an answer for an older query is ignored.
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef("");
  const type = (value: string) => {
    setQ(value);
    setActive(0);
    clearTimeout(timer.current);
    const term = value.trim();
    latest.current = term;
    if (term.length < 2) { setHits([]); setLoading(false); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      const found = await adminSearch(term).catch(() => []);
      if (latest.current === term) { setHits(found); setLoading(false); }
    }, 200);
  };

  const open = () => { type(""); dialog.current?.showModal(); };

  const onShortcut = useEffectEvent((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); open(); }
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => onShortcut(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const needle = q.trim().toLowerCase();
  const items: Item[] = [
    ...pages.filter((p) => !needle || p.label.toLowerCase().includes(needle) || p.group.toLowerCase().includes(needle))
      .map((p) => ({ kind: "Page" as const, label: p.label, hint: p.group, href: p.href })),
    ...hits,
  ];

  const go = (item: Item | undefined) => {
    if (!item) return;
    dialog.current?.close();
    router.push(item.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); go(items[active]); }
  };

  return <>
    <button type="button" className={styles.trigger} onClick={open} aria-keyshortcuts="Control+K Meta+K">
      <PixelIcon name="search" size={16} />Search<kbd>Ctrl K</kbd>
    </button>
    <dialog ref={dialog} className={`dialog ${styles.dialog}`} aria-label="Search admin"
      onClick={(e) => { if (e.target === e.currentTarget) dialog.current?.close(); }}>
      <div className={styles.box}>
        <div className={styles.inputRow}>
          <PixelIcon name="search" />
          <input
            className={styles.input} autoFocus value={q} onChange={(e) => type(e.target.value)} onKeyDown={onKeyDown}
            placeholder="Players, achievements, events or pages…" aria-label="Search admin"
            role="combobox" aria-expanded="true" aria-controls="cmd-results" aria-activedescendant={items[active] ? `cmd-${active}` : undefined}
          />
          <kbd>Esc</kbd>
        </div>
        <ul id="cmd-results" role="listbox" className={styles.results} aria-busy={loading}>
          {items.map((item, i) => (
            <li key={`${item.kind}-${item.href}`} id={`cmd-${i}`} role="option" aria-selected={i === active}
              onMouseMove={() => setActive(i)} onClick={() => go(item)}>
              <span className={styles.kind}>{item.kind}</span>
              <strong>{item.label}</strong>
              <span className={styles.hint}>{item.hint}</span>
            </li>
          ))}
          {items.length === 0 && <li className={styles.empty}>{loading ? "Searching…" : "Nothing found."}</li>}
        </ul>
        {loading && items.length > 0 && <p className={styles.status} role="status">Searching…</p>}
      </div>
    </dialog>
  </>;
}
