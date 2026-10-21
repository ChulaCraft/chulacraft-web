import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmAction } from "@/components/confirm-action";
import { PixelIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/server";
import styles from "@/app/admin/admin.module.css";
import { deleteGalleryGroup, moveGalleryGroup, saveGalleryGroup } from "./actions";
import { GALLERY_DONE, GALLERY_ERRORS } from "./messages";

export const metadata: Metadata = { title: "Gallery" };

export default async function AdminGalleryPage({ searchParams }: { searchParams: Promise<{ error?: string; done?: string }> }) {
  const { error: errorCode, done } = await searchParams;
  const supabase = await createClient();
  const [groups, images] = await Promise.all([supabase.rpc("list_gallery_groups"), supabase.rpc("list_gallery")]);
  const rows = groups.data ?? [];
  const count = (id: string) => (images.data ?? []).filter((i) => i.group_id === id).length;

  return <>
    <div className={styles.titleRow}>
      <h1 className={styles.title}>Gallery</h1>
      <Link href="/gallery" className="link-button">View gallery <PixelIcon name="arrow" size={14} /></Link>
    </div>

    <div aria-live="polite">
      {errorCode && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{GALLERY_ERRORS[errorCode] ?? GALLERY_ERRORS.FAILED}</p></div>}
      {done && GALLERY_DONE[done] && <p className="alert alert-success" role="status"><PixelIcon name="check" />{GALLERY_DONE[done]}</p>}
    </div>

    <form action={saveGalleryGroup} className={`panel ${styles.catalogForm}`} aria-labelledby="add-title">
      <h2 id="add-title" className={styles.sectionTitle}>New group</h2>
      <p className="hint">One group per event or build, e.g. &ldquo;Lobby building day&rdquo;. Then add pictures to it.</p>
      <div className="field">
        <label htmlFor="g-name">Name</label>
        <input id="g-name" className="input" name="name" required maxLength={60} />
      </div>
      <div className="field">
        <label htmlFor="g-description">Description <span className="optional">(optional)</span></label>
        <input id="g-description" className="input" name="description" maxLength={300} />
      </div>
      <div className={styles.formButtons}>
        <SubmitButton className="btn btn-primary">Create group</SubmitButton>
      </div>
    </form>

    {groups.error || images.error ? (
      <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">Couldn&apos;t load the gallery. Please reload.</p></div>
    ) : rows.length === 0 ? (
      <p className="muted">No groups yet. Until there are pictures, the About page shows the built-in screenshots.</p>
    ) : (
      <ul className={styles.itemList} aria-label="Groups, in order">
        {rows.map((g, i) => (
          <li key={g.id}>
            <span className={styles.itemText}>
              <strong>{g.name}</strong>
              <span className="hint">{count(g.id)} {count(g.id) === 1 ? "picture" : "pictures"}{g.description && ` · ${g.description}`}</span>
            </span>
            <form action={moveGalleryGroup}>
              <input type="hidden" name="groupId" value={g.id} />
              <button className="btn btn-sm" name="direction" value="up" disabled={i === 0} aria-label={`Move ${g.name} up`}>↑</button>
              <button className="btn btn-sm" name="direction" value="down" disabled={i === rows.length - 1} aria-label={`Move ${g.name} down`}>↓</button>
            </form>
            <Link href={`/admin/commu/gallery/${g.id}`} className="btn btn-sm btn-primary">Open</Link>
            <ConfirmAction
              action={deleteGalleryGroup}
              fields={{ groupId: g.id }}
              trigger="Delete"
              triggerClassName="btn btn-sm btn-danger-outline"
              title={`Delete ${g.name}?`}
              body={`The group and its ${count(g.id)} pictures leave the site straight away. This can't be undone.`}
              confirmLabel="Delete group"
              confirmClassName="btn btn-danger"
            />
          </li>
        ))}
      </ul>
    )}
  </>;
}
