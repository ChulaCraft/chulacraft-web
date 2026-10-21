import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/confirm-action";
import { PixelIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/server";
import { effectiveDate } from "@/lib/site-content";
import { DEFAULT_PAGES, LEGAL_EFFECTIVE_DATE, PAGES, isPageSlug } from "@/lib/site-pages";
import styles from "@/app/admin/admin.module.css";
import { savePage } from "../actions";
import { PagePreview } from "./page-preview";

export const metadata: Metadata = { title: "Edit page" };

const ERRORS: Record<string, string> = {
  FORBIDDEN: "Only admins can edit pages.",
  TOO_LONG: "That's longer than 20,000 characters. Nothing was saved.",
  FAILED: "The page couldn't be saved. Please try again."
};

const DONE: Record<string, string> = {
  saved: "Saved. The page shows the new text now.",
  reset: "Back to the built-in text."
};

export default async function AdminEditPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; done?: string }>;
}) {
  const { slug } = await params;
  const { error: errorCode, done } = await searchParams;
  if (!isPageSlug(slug)) notFound();
  const supabase = await createClient();
  // Straight from the database, not the cached copy the public page reads.
  const { data, error } = await supabase.rpc("get_site_page", { p_slug: slug });
  if (error) {
    return <section className={`panel ${styles.errorCard}`} role="alert">
      <h1 className={styles.sectionTitle}><PixelIcon name="warning" size={22} className="tone-danger" />Couldn&apos;t load the page</h1>
      <p className="muted">Nothing was changed. Reload to try again.</p>
    </section>;
  }
  const row = data?.[0];
  const { title } = PAGES[slug];

  return <>
    <Link href="/admin/pages" className="back-link"><PixelIcon name="back" />Pages</Link>

    <div aria-live="polite">
      {errorCode && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{ERRORS[errorCode] ?? ERRORS.FAILED}</p></div>}
      {done && DONE[done] && <p className="alert alert-success" role="status"><PixelIcon name="check" />{DONE[done]}</p>}
    </div>

    <div className={styles.editorGrid}>
      <form id="page-form" action={savePage} className={`panel ${styles.catalogForm}`} aria-labelledby="form-title">
        <h1 id="form-title" className={styles.sectionTitle}>{title}</h1>
        <input type="hidden" name="slug" value={slug} />
        <div className="field">
          <label htmlFor="p-body">Text</label>
          <textarea id="p-body" className={`${styles.textarea} mono`} name="body" rows={28} defaultValue={row?.body ?? DEFAULT_PAGES[slug]} maxLength={20000} aria-describedby="p-body-help" />
          <div id="p-body-help" className="field-help">
            <p><code>## Title</code> starts a numbered section (listed in the side menu). Then <code>- item</code> lists, <code>**bold**</code>, <code>*italic*</code>, <code>[link text](https://…)</code> or <code>[link text](/terms)</code>, and tables: <code>| A | B |</code> rows.</p>
          </div>
        </div>
        <p className="hint">{row ? `Edited ${effectiveDate(row.updated_at)}. Saving updates the "Effective" date.` : "Showing the built-in text. Saving it unchanged keeps it built-in."}</p>
        <div className={styles.formButtons}>
          <SubmitButton className="btn btn-primary">Save page</SubmitButton>
          <button type="reset" className="btn">Undo changes</button>
          <Link href={`/${slug}`} className="btn">View page</Link>
        </div>
      </form>
      <div className={styles.previewColumn}>
        <PagePreview formId="page-form" title={title} saved={row?.body ?? DEFAULT_PAGES[slug]} effective={row ? effectiveDate(new Date().toISOString()) : LEGAL_EFFECTIVE_DATE} />
      </div>
    </div>

    {row && (
      <section className={`panel ${styles.actionsCard}`} aria-labelledby="reset-title">
        <h2 id="reset-title" className={styles.sectionTitle}>Go back to the built-in text</h2>
        <p className="hint">Throws away the edited text.</p>
        <ConfirmAction
          action={savePage}
          fields={{ slug, body: "" }}
          trigger="Use built-in text"
          triggerClassName="btn btn-danger-outline"
          title={`Reset ${title}?`}
          body="The edited text is thrown away and the page shows the built-in text again. This can't be undone."
          confirmLabel="Reset page"
          confirmClassName="btn btn-danger"
        />
      </section>
    )}
  </>;
}
