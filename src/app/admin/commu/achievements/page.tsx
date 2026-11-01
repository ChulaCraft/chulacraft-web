import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { PixelIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import styles from "@/app/admin/admin.module.css";
import { when } from "@/app/admin/overview";
import { publicImageUrl } from "./images";
import { timed } from "@/lib/perf";
import local from "@/app/admin/export-ui.module.css";
import { RowExport } from "@/components/row-export";

export const metadata: Metadata = { title: "Achievements" };

export default async function AdminAchievementsPage({ searchParams }: { searchParams: Promise<{ error?: string; done?: string }> }) {
  const { error: errorCode, done } = await searchParams;
  const supabase = await createClient();
  const achievements = await timed("admin_list_achievements", supabase.rpc("admin_list_achievements"));

  const ERRORS: Record<string, string> = {
    FORBIDDEN: "You don't have permission to do that.",
    NOT_FOUND: "That record no longer exists. Refresh and try again.",
    FAILED: "The change couldn't be saved. Please try again."
  };
  const DONE: Record<string, string> = {
    deleted: "Achievement deleted."
  };

  const rows = achievements.data ?? [];

  return <>
    <div className={styles.titleRow}>
      <h1 className={styles.title}>Achievements</h1>
      <div className={local.bar}>
        <RowExport href="/admin/commu/achievements/export" className="btn btn-sm" />
        <Link href="/admin/commu/achievements/new" className="btn btn-sm"><PixelIcon name="plus" />New achievement</Link>
      </div>
    </div>

    <div aria-live="polite">
      {errorCode && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{ERRORS[errorCode] ?? ERRORS.FAILED}</p></div>}
      {done && DONE[done] && <p className="alert alert-success" role="status"><PixelIcon name="check" />{DONE[done]}</p>}
    </div>

    {achievements.error ? (
      <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">Couldn&apos;t load the catalog. Please reload.</p></div>
    ) : <>
      <section aria-labelledby="cat-title">
        <h2 id="cat-title" className={styles.groupTitle}>Achievements ({rows.length})</h2>
        {rows.length === 0 ? <div className={styles.empty}>
          <p className="section-title">No achievements yet</p>
          <p className="muted">Create one, give it an image, then award it to players.</p>
        </div> : (
          <ul className={styles.catalog} aria-label="Achievements">
            {rows.map((row) => (
              <li key={row.id} className={local.withTick}>
                <input type="checkbox" className={local.tick} name="id" value={row.id} form="export-rows" aria-label={`Select ${row.name} for export`} />
                <Link href={`/admin/commu/achievements/${row.id}`}>
                  <Image className={`pixel-4 ${styles.catalogThumb}`} src={publicImageUrl(row.image_path)} alt="" width={56} height={56} />
                  <span className={styles.catalogText}>
                    <strong>{row.name}</strong>
                    <span className={styles.small}>{row.award_count} {row.award_count === 1 ? "award" : "awards"} · updated {when(row.updated_at)}</span>
                  </span>
                  <span className={`badge badge-${row.status === "published" ? "green" : "muted"}`}>{row.status}</span>
                  <PixelIcon name="arrow" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>}
  </>;
}