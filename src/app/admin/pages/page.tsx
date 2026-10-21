import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { effectiveDate } from "@/lib/site-content";
import { PAGES, PAGE_SLUGS } from "@/lib/site-pages";
import styles from "@/app/admin/admin.module.css";

export const metadata: Metadata = { title: "Pages" };

export default async function AdminPagesPage() {
  const supabase = await createClient();
  const rows = await Promise.all(PAGE_SLUGS.map(async (slug) => {
    const { data } = await supabase.rpc("get_site_page", { p_slug: slug });
    return { slug, updated: data?.[0]?.updated_at ?? null };
  }));

  return <>
    <div className={styles.titleRow}>
      <h1 className={styles.title}>Pages</h1>
    </div>
    <p className="muted">Edit the text of these pages. Changes show on the site as soon as you save.</p>
    <ul className={styles.itemList} aria-label="Pages">
      {rows.map(({ slug, updated }) => (
        <li key={slug}>
          <span className={styles.itemText}>
            <strong>{PAGES[slug].title}</strong>
            <span className="hint">/{slug} · {updated ? `Edited ${effectiveDate(updated)}` : "Built-in text"}</span>
          </span>
          <Link href={`/${slug}`} className="btn btn-sm">View</Link>
          <Link href={`/admin/pages/${slug}`} className="btn btn-sm btn-primary">Edit</Link>
        </li>
      ))}
    </ul>
  </>;
}
