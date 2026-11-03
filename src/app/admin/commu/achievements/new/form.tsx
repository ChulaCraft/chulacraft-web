"use client";

import { useActionState } from "react";
import Link from "next/link";
import { PixelIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import styles from "@/app/admin/admin.module.css";
import { createAchievement, type CreateAchievementState } from "../[id]/actions";
import { NEW_ACHIEVEMENT_ERRORS } from "../messages";
import { MetaFields } from "../meta-fields";

const INITIAL: CreateAchievementState = { code: null, values: { name: "", description: "", status: "draft", tier: "common", discordRoleId: "" } };

export function NewAchievementForm({ roles }: { roles: { role_id: string; label: string }[] | null }) {
  const [state, action] = useActionState(createAchievement, INITIAL);
  const { values } = state;
  // React resets the form after each action; keying on the typed values makes
  // the reset land on them (file inputs can't be refilled, see messages.ts).
  const formKey = JSON.stringify(values);
  return <>
    <div aria-live="polite">
      {state.code && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{NEW_ACHIEVEMENT_ERRORS[state.code] ?? NEW_ACHIEVEMENT_ERRORS.FAILED}</p></div>}
    </div>
    <form key={formKey} action={action} className={`panel ${styles.catalogForm}`}>
      <div className="field">
        <label htmlFor="n-name">Name</label>
        <input id="n-name" className="input" name="name" required maxLength={80} defaultValue={values.name} />
      </div>
      <div className="field">
        <label htmlFor="n-desc">Description <span className="optional">(optional)</span></label>
        <textarea id="n-desc" className={styles.textarea} name="description" rows={3} maxLength={500} defaultValue={values.description} />
      </div>
      <div className="field">
        <label htmlFor="n-image">Image</label>
        <input id="n-image" className="input" type="file" name="image" accept="image/png,image/jpeg,image/webp,image/gif" aria-describedby="n-image-help" />
        <p id="n-image-help" className="field-help">PNG, JPEG, WebP or GIF, up to 2 MB.</p>
      </div>
      <div className="field">
        <label htmlFor="n-status">Status</label>
        <select id="n-status" className="input" name="status" defaultValue={values.status}>
          <option value="draft">Draft — hidden from players</option>
          <option value="published">Published — players see it</option>
        </select>
      </div>
      <MetaFields idPrefix="n" roles={roles} tier={values.tier} roleId={values.discordRoleId || null} />
      <div className={styles.formButtons}>
        <SubmitButton className="btn btn-primary">Create achievement</SubmitButton>
        <Link href="/admin/commu/achievements" className="btn">Cancel</Link>
      </div>
    </form>
  </>;
}
