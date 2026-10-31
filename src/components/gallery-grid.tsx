import Image from "next/image";
import styles from "./gallery-grid.module.css";

export type Shot = { key: string; src: string; alt: string; wide?: boolean };

/** One gallery group's pictures: /gallery, and the admin's preview of it.
 *  Picked-but-not-uploaded files arrive as blob: URLs, which the image
 *  optimizer can't fetch. */
export function GalleryGrid({ shots }: { shots: Shot[] }) {
  return (
    <ul className={styles.grid}>
      {shots.map((s) => (
        <li key={s.key} className={`pixel-8 ${styles.shot}`} data-wide={s.wide || undefined}>
          <Image src={s.src} alt={s.alt} fill sizes="(min-width: 1100px) 360px, (min-width: 600px) 50vw, 100vw" unoptimized={s.src.startsWith("blob:")} />
        </li>
      ))}
    </ul>
  );
}
