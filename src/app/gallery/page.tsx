import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { galleryAlbums } from "@/lib/site-content";
import { publicImageUrl } from "@/app/admin/commu/achievements/images";
import team from "../team/team.module.css";
import styles from "./gallery.module.css";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Screenshots from ChulaCraft builds and events.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const result = await galleryAlbums().then((albums) => ({ albums, failed: false }), () => ({ albums: [], failed: true }));

  return (
    <main className={`container ${team.main}`}>
      <div className="stack gap-10">
        <span className="kicker" aria-hidden="true" />
        <h1 className="page-title">Gallery</h1>
        <p className="lead">Builds, events and moments from the ChulaCraft world.</p>
      </div>

      {result.failed ? (
        <p className="alert alert-error" role="alert">The gallery couldn&apos;t be loaded. Please try again in a moment.</p>
      ) : result.albums.length === 0 ? (
        <p className="muted">No pictures yet. Check back after the next event.</p>
      ) : (
        <ul className={styles.cards}>
          {result.albums.map((g) => {
            const cover = g.cover_path || g.images[0].image_path;
            return (
              <li key={g.id} className={styles.card}>
                <Link href={`/gallery/${g.id}`} className={styles.link}>
                  <span className={`pixel-8 ${styles.frame}`}>
                    <Image src={publicImageUrl(cover)} alt="" fill sizes="(min-width: 1100px) 380px, (min-width: 600px) 50vw, 100vw" />
                  </span>
                  <span className={styles.text}>
                    <span className={styles.topic}>{g.name}</span>
                    {g.description && <span className={styles.detail}>{g.description}</span>}
                    <span className={styles.count}>{g.images.length} {g.images.length === 1 ? "picture" : "pictures"}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
