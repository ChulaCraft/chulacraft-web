import type { Metadata } from "next";
import Link from "next/link";
import { PixelIcon } from "@/components/icons";
import styles from "../../admin.module.css";
import { saveAchievement } from "../[id]/actions";
import { SubmitButton } from "@/components/submit-button";

export const metadata: Metadata = { title: "New achievement" };

/** Creating is the edit form with nothing filled in; saveAchievement mints the
 *  id when none is posted. */
export default function NewAchievementPage() {
  return <>
    <Link href="/admin/achievements" className="back-link"><PixelIcon name="back" />Achievements</Link>
    <h1 className={styles.title}>New achievement</h1>

    <form action={saveAchievement} className={`panel ${styles.catalogForm}`}>
      <div className="field">
        <label htmlFor="n-name">Name</label>
        <input id="n-name" className="input" name="name" required maxLength={80} />
      </div>
      <div className="field">
        <label htmlFor="n-desc">Description <span className="optional">(optional)</span></label>
        <textarea id="n-desc" className={styles.textarea} name="description" rows={3} maxLength={500} />
      </div>
      <div className="field">
        <label htmlFor="n-image">Image</label>
        <input id="n-image" className="input" type="file" name="image" accept="image/png,image/jpeg,image/webp,image/gif" aria-describedby="n-image-help" />
        <p id="n-image-help" className="field-help">PNG, JPEG, WebP or GIF, up to 2 MB.</p>
      </div>
      <div className="field">
        <label htmlFor="n-status">Status</label>
        <select id="n-status" className="input" name="status" defaultValue="draft">
          <option value="draft">Draft — hidden from players</option>
          <option value="published">Published — players see it</option>
        </select>
      </div>
      <div className={styles.formButtons}>
        <SubmitButton className="btn btn-primary">Create achievement</SubmitButton>
        <Link href="/admin/achievements" className="btn">Cancel</Link>
      </div>
    </form>
  </>;
}