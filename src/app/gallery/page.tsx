import type { Metadata } from "next";
import { GalleryGrid } from "@/components/gallery-grid";
import { gallery } from "@/lib/site-content";
import { publicImageUrl } from "@/app/admin/commu/achievements/images";
import styles from "../team/team.module.css";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Screenshots from ChulaCraft builds and events.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const result = await gallery().then((data) => ({ ...data, failed: false }), () => ({ groups: [], images: [], failed: true }));
  const groups = result.groups
    .map((g) => ({ ...g, images: result.images.filter((i) => i.group_id === g.id) }))
    .filter((g) => g.images.length > 0);

  return (
    <main className={`container ${styles.main}`}>
      <div className="stack gap-10">
        <span className="kicker" aria-hidden="true" />
        <h1 className="page-title">Gallery</h1>
        <p className="lead">Builds, events and moments from the ChulaCraft world.</p>
      </div>

      {result.failed ? (
        <p className="alert alert-error" role="alert">The gallery couldn&apos;t be loaded. Please try again in a moment.</p>
      ) : groups.length === 0 ? (
        <p className="muted">No pictures yet. Check back after the next event.</p>
      ) : groups.map((g) => (
        <section key={g.id} aria-labelledby={`g-${g.id}`} className={styles.section}>
          <h2 id={`g-${g.id}`} className={styles.sectionTitle}>{g.name}</h2>
          {g.description && <p className="muted">{g.description}</p>}
          <GalleryGrid shots={g.images.map((i) => ({ key: i.id, src: publicImageUrl(i.image_path), alt: i.alt, wide: i.wide }))} />
        </section>
      ))}
    </main>
  );
}
