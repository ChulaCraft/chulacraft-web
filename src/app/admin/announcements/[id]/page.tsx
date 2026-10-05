import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/confirm-action";
import { PixelIcon } from "@/components/icons";
import { bangkokInput } from "@/lib/bangkok-time";
import { UUID } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import styles from "../../admin.module.css";
import { deleteAnnouncement, saveAnnouncement } from "./actions";
import { SubmitButton } from "@/components/submit-button";

const ERRORS: Record<string, string> = {
  FORBIDDEN: "You don't have permission to change announcements.",
  NOT_FOUND: "That announcement no longer exists.",
  BAD_DATE: "The expiry has to be after the publish time.",
  FAILED: "The change couldn't be saved. Check the fields and try again."
};

const DONE: Record<string, string> = {
  created: "Announcement created.",
  saved: "Announcement saved."
};

/** `/admin/announcements/new` is this form with nothing filled in;
 *  saveAnnouncement mints the id when none is posted. */
export default async function AdminAnnouncementPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; done?: string }>;
}) {
  const { id } = await params;
  const { error: errorCode, done } = await searchParams;
  const isNew = id === "new";
  if (!isNew && !UUID.test(id)) notFound();

  let row = null;
  if (!isNew) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("admin_list_announcements");
    if (error) {
      return <section className={`panel ${styles.errorCard}`} role="alert">
        <h1 className={styles.sectionTitle}><PixelIcon name="warning" size={22} className="tone-danger" />Couldn&apos;t load announcements</h1>
        <p className="muted">The announcement didn&apos;t load. Nothing was changed.</p>
        <Link href="/admin/announcements" className="link-button">Try again →</Link>
      </section>;
    }
    row = (data ?? []).find((a) => a.id === id) ?? null;
    if (!row) notFound();
  }
  // The generated types say string; drafts and open-ended posts are null.
  const publishedAt = row?.published_at as string | null | undefined;
  const expiresAt = row?.expires_at as string | null | undefined;

  return <>
    <Link href="/admin/announcements" className="back-link"><PixelIcon name="back" />Announcements</Link>

    <div aria-live="polite">
      {errorCode && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{ERRORS[errorCode] ?? ERRORS.FAILED}</p></div>}
      {done && DONE[done] && <p className="alert alert-success" role="status"><PixelIcon name="check" />{DONE[done]}</p>}
    </div>

    <form action={saveAnnouncement} className={`panel ${styles.catalogForm}`} aria-labelledby="form-title">
      <h1 id="form-title" className={styles.sectionTitle}>{row ? row.title : "New announcement"}</h1>
      {row && <input type="hidden" name="announcementId" value={row.id} />}

      <div className="field">
        <label htmlFor="a-title">Title</label>
        <input id="a-title" className="input" name="title" defaultValue={row?.title} required maxLength={120} />
      </div>
      <div className="field">
        <label htmlFor="a-body">Message</label>
        <textarea id="a-body" className={styles.textarea} name="body" rows={6} defaultValue={row?.body} required maxLength={2000} aria-describedby="a-body-help" />
        <p id="a-body-help" className="field-help">Plain text; line breaks are kept. Discord shows it as written, with mentions switched off.</p>
      </div>
      <div className={styles.formRow}>
        <div className="field">
          <label htmlFor="a-severity">Kind</label>
          <select id="a-severity" className="input" name="severity" defaultValue={row?.severity ?? "info"}>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="a-status">Status</label>
          <select id="a-status" className="input" name="status" defaultValue={row && !publishedAt ? "draft" : "published"}>
            <option value="draft">Draft — hidden from players</option>
            <option value="published">Published — players see it</option>
          </select>
        </div>
      </div>
      <div className={styles.formRow}>
        <div className="field">
          <label htmlFor="a-publish">Publish at <span className="optional">(optional)</span></label>
          <input id="a-publish" className="input" type="datetime-local" name="publishAt" defaultValue={publishedAt ? bangkokInput(publishedAt) : ""} aria-describedby="a-time-help" />
        </div>
        <div className="field">
          <label htmlFor="a-expires">Expires <span className="optional">(optional)</span></label>
          <input id="a-expires" className="input" type="datetime-local" name="expiresAt" defaultValue={expiresAt ? bangkokInput(expiresAt) : ""} aria-describedby="a-time-help" />
        </div>
      </div>
      <p id="a-time-help" className="field-help">Bangkok time. Leave &ldquo;Publish at&rdquo; empty to publish now, or set a future time to schedule it. After it expires it leaves the site.</p>

      <label className={styles.tick}>
        <input type="checkbox" name="pinned" defaultChecked={row?.pinned} />
        <span><strong>Pin as the site banner</strong><span className="hint">Shown under the header on every page until it expires or is unpinned.</span></span>
      </label>
      <label className={styles.tick}>
        <input type="checkbox" name="postToDiscord" defaultChecked={row?.post_to_discord} />
        <span><strong>Post to Discord</strong><span className="hint">
          {row?.discord_message_id
            ? "Posted. Edits to the title, message or kind update the Discord message."
            : "The bot posts it to the news channel once it is published."}
        </span></span>
      </label>

      <div className={styles.formButtons}>
        <SubmitButton className="btn btn-primary">{row ? "Save announcement" : "Create announcement"}</SubmitButton>
        {!row && <Link href="/admin/announcements" className="btn">Cancel</Link>}
      </div>
    </form>

    {row && (
      <section className={`panel ${styles.actionsCard}`} aria-labelledby="danger-title">
        <h2 id="danger-title" className={styles.sectionTitle}>Delete</h2>
        <p className="hint">Removes it from the site{row.discord_message_id ? " and deletes the Discord message" : ""}.</p>
        <ConfirmAction
          action={deleteAnnouncement}
          fields={{ announcementId: row.id }}
          trigger="Delete announcement"
          triggerLabel={`Delete ${row.title}`}
          triggerClassName="btn btn-danger-outline"
          title={`Delete ${row.title}?`}
          body="Players stop seeing it straight away. This can't be undone."
          confirmLabel="Delete announcement"
          confirmClassName="btn btn-danger"
        />
      </section>
    )}
  </>;
}
