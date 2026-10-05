import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/confirm-action";
import { PixelIcon } from "@/components/icons";
import { UUID } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import styles from "../../admin.module.css";
import { when } from "../../overview";
import { publicImageUrl } from "../images";
import { deleteAchievement, revokeAward, saveAchievement } from "./actions";

const ERRORS: Record<string, string> = {
  FORBIDDEN: "You don't have permission to change achievements.",
  NOT_FOUND: "That achievement no longer exists. Refresh and try again.",
  BAD_IMAGE_TYPE: "That file isn't a PNG, JPEG, WebP or GIF image.",
  IMAGE_TOO_LARGE: "That image is bigger than 2 MB. Please upload a smaller one.",
  UPLOAD_FAILED: "The image couldn't be uploaded. Nothing was changed.",
  FAILED: "The change couldn't be saved. Please try again."
};

const DONE: Record<string, string> = {
  created: "Achievement created.",
  saved: "Achievement saved.",
  revoked: "Award revoked."
};

export default async function AdminAchievementPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; done?: string }>;
}) {
  const { id } = await params;
  const { error: errorCode, done } = await searchParams;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const [{ data: catalog, error: listError }, { data: awards }] = await Promise.all([
    supabase.rpc("admin_list_achievements"),
    supabase.rpc("admin_list_awards", { p_achievement_id: id })
  ]);
  if (listError) {
    return <section className={`panel ${styles.errorCard}`} role="alert">
      <h1 className={styles.sectionTitle}><PixelIcon name="warning" size={22} className="tone-danger" />Couldn&apos;t load achievements</h1>
      <p className="muted">The catalog didn&apos;t load. Nothing was changed.</p>
      <Link href="/admin/achievements" className="link-button">Try again →</Link>
    </section>;
  }

  const achievement = (catalog ?? []).find((row) => row.id === id);
  if (!achievement) notFound();
  const rows = awards ?? [];

  return <>
    <Link href="/admin/achievements" className="back-link"><PixelIcon name="back" />Achievements</Link>

    <div aria-live="polite">
      {errorCode && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{ERRORS[errorCode] ?? ERRORS.FAILED}</p></div>}
      {done && DONE[done] && <p className="alert alert-success" role="status"><PixelIcon name="check" />{DONE[done]}</p>}
    </div>

    <div className={styles.columns}>
      <div className={styles.sideCol}>
        <form action={saveAchievement} className={`panel ${styles.catalogForm}`} aria-labelledby="edit-title">
          <h1 id="edit-title" className={styles.sectionTitle}>{achievement.name}</h1>
          <input type="hidden" name="achievementId" value={achievement.id} />

          <div className="field">
            <label htmlFor="a-name">Name</label>
            <input id="a-name" className="input" name="name" defaultValue={achievement.name} required maxLength={80} />
          </div>
          <div className="field">
            <label htmlFor="a-desc">Description <span className="optional">(optional)</span></label>
            <textarea id="a-desc" className={styles.textarea} name="description" rows={3} defaultValue={achievement.description} maxLength={500} />
            <p className="field-help">Shown on the badge and on player profiles.</p>
          </div>
          <div className="field">
            <label htmlFor="a-image">Image</label>
            <input id="a-image" className="input" type="file" name="image" accept="image/png,image/jpeg,image/webp,image/gif" aria-describedby="a-image-help" />
            <p id="a-image-help" className="field-help">PNG, JPEG, WebP or GIF, up to 2 MB. Leave empty to keep the current image.</p>
          </div>
          <div className="field">
            <label htmlFor="a-status">Status</label>
            <select id="a-status" className="input" name="status" defaultValue={achievement.status}>
              <option value="draft">Draft — hidden from players</option>
              <option value="published">Published — players see it</option>
            </select>
          </div>

          <div className={styles.formButtons}>
            <button type="submit" className="btn btn-primary">Save achievement</button>
            <Link href={`/admin/achievements/${achievement.id}/award`} className="btn">Award to players</Link>
          </div>
        </form>

        <section className={`panel ${styles.actionsCard}`} aria-labelledby="danger-title">
          <h2 id="danger-title" className={styles.sectionTitle}>Delete</h2>
          <p className="hint">Deleting removes every award given for it. That can&apos;t be undone.</p>
          <ConfirmAction
            action={deleteAchievement}
            fields={{ achievementId: achievement.id }}
            trigger="Delete achievement"
            triggerLabel={`Delete ${achievement.name}`}
            triggerClassName="btn btn-danger-outline"
            title={`Delete ${achievement.name}?`}
            body={`This removes the achievement and ${achievement.award_count} ${achievement.award_count === 1 ? "award" : "awards"} from every player's profile. The image is deleted too.`}
            confirmLabel="Delete achievement"
            confirmClassName="btn btn-danger"
          />
        </section>
      </div>

      <div className={styles.mainCol}>
        <section className="panel stack gap-16" aria-labelledby="preview-title">
          <h2 id="preview-title" className={styles.sectionTitle}>Image</h2>
          {/* eslint-disable-next-line @next/next/no-img-element -- public Storage object; next/image would need a remote pattern for no gain */}
          <img className={`pixel-4 ${styles.catalogImage}`} src={publicImageUrl(achievement.image_path)} alt="" width={160} height={160} />
          <p className="hint">Updated {when(achievement.updated_at)}.</p>
        </section>

        <section className={`panel ${styles.flush}`} aria-labelledby="awards-title">
          <h2 id="awards-title" className={`${styles.sectionTitle} ${styles.flushTitle}`}>Awards ({rows.length})</h2>
          {rows.length === 0 ? <p className={`muted ${styles.flushTitle}`}>Nobody has this achievement yet.</p> : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th scope="col">Player</th><th scope="col">Date</th><th scope="col">Event</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {rows.map((award) => (
                    <tr key={award.id}>
                      <td><Link href={`/admin/users/${award.user_id}`}>{award.display_name}</Link></td>
                      <td className="mono">{new Date(award.awarded_on).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium" })}</td>
                      <td data-dim={!award.event_name || undefined}>{award.event_name ?? "—"}</td>
                      <td className={styles.right}>
                        <ConfirmAction
                          action={revokeAward}
                          fields={{ achievementId: achievement.id, awardId: award.id }}
                          trigger="Revoke"
                          triggerLabel={`Revoke ${achievement.name} from ${award.display_name}`}
                          triggerClassName="btn btn-sm btn-danger-outline"
                          title={`Revoke ${achievement.name}?`}
                          body={`${award.display_name} loses this badge and the award is recorded in their history.`}
                          confirmLabel="Revoke award"
                          confirmClassName="btn btn-danger"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  </>;
}