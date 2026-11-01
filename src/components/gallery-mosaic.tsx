"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { GalleryViewer } from "@/components/gallery-viewer";
import type { Shot } from "@/components/gallery-grid";
import styles from "./gallery-mosaic.module.css";

/** One category's pictures as a dense mosaic. Each picture is a button that
 *  opens the full-screen viewer; wide pictures keep their two columns. */
export function GalleryMosaic({ shots, label }: { shots: Shot[]; label: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);

  return (
    <>
      <ul className={styles.mosaic} aria-label={label}>
        {shots.map((s, i) => (
          <li key={s.key} className={`pixel-8 ${styles.tile}`} data-wide={s.wide || undefined}>
            <button
              type="button"
              ref={(el) => { triggers.current[i] = el; }}
              className={styles.open}
              onClick={() => setOpen(i)}
              aria-label={`Open picture ${i + 1} of ${shots.length}: ${s.alt}`}
              aria-haspopup="dialog"
            >
              <Image src={s.src} alt="" fill sizes="(min-width: 1100px) 360px, (min-width: 600px) 50vw, 100vw" />
            </button>
          </li>
        ))}
      </ul>
      {open !== null && (
        <GalleryViewer
          shots={shots}
          index={open}
          onIndex={setOpen}
          onClose={() => {
            const at = open;
            setOpen(null);
            // The dialog is gone by now, so hand focus back to the tile that opened it.
            requestAnimationFrame(() => triggers.current[at]?.focus());
          }}
        />
      )}
    </>
  );
}
