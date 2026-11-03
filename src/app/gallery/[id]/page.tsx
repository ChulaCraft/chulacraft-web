import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PixelIcon } from "@/components/icons";
import { GalleryMosaic } from "@/components/gallery-mosaic";
import { UUID } from "@/lib/registration";
import { galleryAlbums } from "@/lib/site-content";
import { publicImageUrl } from "@/app/admin/commu/achievements/images";
import team from "../../team/team.module.css";

/** An unknown id and an outage both look like a missing page to a crawler;
 *  only the first is a true 404, so a failed read throws to the error page. */
async function loadAlbum(id: string) {
  if (!UUID.test(id)) return null;
  return (await galleryAlbums()).find((g) => g.id === id) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const album = await loadAlbum(id).catch(() => null);
  if (!album) return { title: "Gallery" };
  return {
    title: album.name,
    description: album.description || `Pictures from ${album.name}.`,
    alternates: { canonical: `/gallery/${album.id}` },
  };
}

export default async function GalleryCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const album = await loadAlbum(id);
  if (!album) notFound();

  return (
    <main className={`container ${team.main}`}>
      <Link href="/gallery" className="back-link"><PixelIcon name="back" />Gallery</Link>
      <div className="stack gap-10">
        <span className="kicker" aria-hidden="true" />
        <h1 className="page-title">{album.name}</h1>
        {album.description && <p className="lead">{album.description}</p>}
      </div>
      <GalleryMosaic
        label={`Pictures in ${album.name}`}
        shots={album.images.map((i) => ({ key: i.id, src: publicImageUrl(i.image_path), alt: i.alt, wide: i.wide }))}
      />
    </main>
  );
}
