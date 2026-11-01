"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { Shot } from "@/components/gallery-grid";
import styles from "./gallery-viewer.module.css";

/** Full-screen picture viewer on a modal <dialog>: the browser traps focus and
 *  closes on Esc; arrows and the buttons step through the category. */
export function GalleryViewer({ shots, index, onIndex, onClose }: {
  shots: Shot[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const shot = shots[index];
  const count = shots.length;
  const step = (by: number) => onIndex((index + by + count) % count);

  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      className={styles.viewer}
      aria-label="Picture viewer"
      onClose={onClose}
      onClick={(e) => { if (e.target === e.currentTarget) dialog.current?.close(); }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
      }}
    >
      <div className={styles.bar}>
        <p className={styles.count} aria-live="polite">{index + 1} / {count}</p>
        <button type="button" className={styles.close} onClick={() => dialog.current?.close()} autoFocus>
          Close
        </button>
      </div>
      <div className={styles.stage}>
        <Image key={shot.key} className={styles.picture} src={shot.src} alt={shot.alt} fill sizes="100vw" priority />
      </div>
      <p className={styles.caption}>{shot.alt}</p>
      {count > 1 && (
        <>
          <button type="button" className={`${styles.nav} ${styles.prev}`} onClick={() => step(-1)} aria-label="Previous picture">
            <span aria-hidden="true">&larr;</span>
          </button>
          <button type="button" className={`${styles.nav} ${styles.next}`} onClick={() => step(1)} aria-label="Next picture">
            <span aria-hidden="true">&rarr;</span>
          </button>
        </>
      )}
    </dialog>
  );
}
