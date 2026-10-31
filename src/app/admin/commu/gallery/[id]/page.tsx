import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/confirm-action";
import { PixelIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { UUID } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import styles from "@/app/admin/admin.module.css";
import { IMAGE_TYPES, publicImageUrl } from "@/app/admin/commu/achievements/images";
import { addGalleryImage, deleteGalleryImage, moveGalleryImage, saveGalleryGroup, updateGalleryImage } from "../actions";
import { GALLERY_DONE, GALLERY_ERRORS } from "../messages";
import { GroupPreview } from "./group-preview";
import { timed } from "@/lib/perf";

export const metadata: Metadata = { title: "Gallery group" };

export default async function AdminGalleryGroupPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; done?: string }>;
}) {
  const { id } = await params;
  const { error: errorCode, done } = await searchParams;
  if (!UUID.test(id)) notFound();
  const supabase = await createClient();
  const [groups, images] = await Promise.all([timed("list_gallery_groups", supabase.rpc("list_gallery_groups")), timed("list_gallery", supabase.rpc("list_gallery"))]);
  if (groups.error || images.error) {
    return <section className={`panel ${styles.errorCard}`} role="alert">
      <h1 className={styles.sectionTitle}><PixelIcon name="warning" size={22} className="tone-danger" />Couldn&apos;t load the gallery</h1>
      <p className="muted">Nothing was changed. Reload to try again.</p>
    </section>;
  }
  const group = groups.data.find((g) => g.id === id);
  if (!group) notFound();
  const rows = images.data.filter((i) => i.group_id === id);

  return <>
    <Link href="/admin/commu/gallery" className="back-link"><PixelIcon name="back" />Gallery</Link>

    <div aria-live="polite">
      {errorCode && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{GALLERY_ERRORS[errorCode] ?? GALLERY_ERRORS.FAILED}</p></div>}
      {done && GALLERY_DONE[done] && <p className="alert alert-success" role="status"><PixelIcon name="check" />{GALLERY_DONE[done]}</p>}
    </div>

    <form action={saveGalleryGroup} className={`panel ${styles.catalogForm}`} aria-labelledby="group-title">
      <h1 id="group-title" className={styles.sectionTitle}>{group.name}</h1>
      <input type="hidden" name="groupId" value={group.id} />
      <div className={styles.formRow}>
        <div className="field">
          <label htmlFor="g-name">Name</label>
          <input id="g-name" className="input" name="name" defaultValue={group.name} required maxLength={60} />
        </div>
        <div className="field">
          <label htmlFor="g-description">Description <span className="optional">(optional)</span></label>
          <input id="g-description" className="input" name="description" defaultValue={group.description} maxLength={300} />
        </div>
      </div>
      <div className={styles.formButtons}>
        <SubmitButton className="btn btn-sm">Save group</SubmitButton>
      </div>
    </form>

    <div className={styles.editorGrid}>
      <form id="add-picture" action={addGalleryImage} className={`panel ${styles.catalogForm}`} aria-labelledby="add-title">
        <h2 id="add-title" className={styles.sectionTitle}>Add a picture</h2>
        <input type="hidden" name="groupId" value={group.id} />
        <div className="field">
          <label htmlFor="g-image">Picture</label>
          <input id="g-image" className="input" type="file" name="image" accept={IMAGE_TYPES.join(",")} required aria-describedby="g-image-help" />
          <p id="g-image-help" className="field-help">PNG, JPEG, WebP or GIF, up to 2 MB. Screenshots look best at 16:9.</p>
        </div>
        <div className="field">
          <label htmlFor="g-alt">Description</label>
          <input id="g-alt" className="input" name="alt" required maxLength={200} aria-describedby="g-alt-help" />
          <p id="g-alt-help" className="field-help">What the picture shows, read out by screen readers. E.g. &ldquo;Players celebrating the first Ender Dragon kill&rdquo;.</p>
        </div>
        <label className={styles.tick}>
          <input type="checkbox" name="wide" />
          <span><strong>Wide</strong><span className="hint">Takes two columns.</span></span>
        </label>
        <div className={styles.formButtons}>
          <SubmitButton className="btn btn-primary">Add picture</SubmitButton>
        </div>
      </form>
      <div className={styles.previewColumn}>
        <GroupPreview
          formId="add-picture"
          name={group.name}
          description={group.description}
          shots={rows.map((r) => ({ key: r.id, src: publicImageUrl(r.image_path), alt: r.alt, wide: r.wide }))}
        />
      </div>
    </div>

    {rows.length === 0 ? (
      <p className="muted">No pictures in this group yet. Empty groups don&apos;t show on the site.</p>
    ) : (
      <ul className={styles.itemList} aria-label={`Pictures in ${group.name}, in order`}>
        {rows.map((row, i) => (
          <li key={row.id}>
            <Image className={styles.previewImage} src={publicImageUrl(row.image_path)} alt="" width={96} height={54} />
            <form action={updateGalleryImage} className={styles.itemText}>
              <input type="hidden" name="imageId" value={row.id} />
              <input type="hidden" name="groupId" value={group.id} />
              <label className="sr-only" htmlFor={`alt-${row.id}`}>Description</label>
              <input id={`alt-${row.id}`} className="input" name="alt" defaultValue={row.alt} required maxLength={200} />
              <label className="sr-only" htmlFor={`to-${row.id}`}>Group</label>
              <select id={`to-${row.id}`} className="input" name="toGroupId" defaultValue={group.id}>
                {groups.data.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <label className={styles.tick}>
                <input type="checkbox" name="wide" defaultChecked={row.wide} />
                <span>Wide</span>
              </label>
              <SubmitButton className="btn btn-sm">Save</SubmitButton>
            </form>
            <form action={moveGalleryImage}>
              <input type="hidden" name="imageId" value={row.id} />
              <input type="hidden" name="groupId" value={group.id} />
              <button className="btn btn-sm" name="direction" value="up" disabled={i === 0} aria-label={`Move ${row.alt} up`}>↑</button>
              <button className="btn btn-sm" name="direction" value="down" disabled={i === rows.length - 1} aria-label={`Move ${row.alt} down`}>↓</button>
            </form>
            <ConfirmAction
              action={deleteGalleryImage}
              fields={{ imageId: row.id, groupId: group.id }}
              trigger="Delete"
              triggerClassName="btn btn-sm btn-danger-outline"
              title="Delete this picture?"
              body="It leaves the gallery straight away. This can't be undone."
              confirmLabel="Delete picture"
              confirmClassName="btn btn-danger"
            />
          </li>
        ))}
      </ul>
    )}
  </>;
}
