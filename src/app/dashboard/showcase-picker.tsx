"use client";

import { useState } from "react";
import { TIER_LABELS, toTier, type AchievementGroup } from "@/components/achievement-grid";
import { SubmitButton } from "@/components/submit-button";
import { setShowcase } from "./actions";
import styles from "./dashboard.module.css";

const MAX = 3;

/** Ticks post in list order, which is the showcase order: current picks come
 *  first (by position), then the rest. Once three are ticked the others are
 *  disabled; set_my_showcase refuses a fourth anyway (INVALID). */
export function ShowcasePicker({ groups }: { groups: AchievementGroup[] }) {
  const ordered = [...groups].sort((a, b) => (a.showcase_position ?? MAX + 1) - (b.showcase_position ?? MAX + 1));
  const [picked, setPicked] = useState(() => new Set(groups.filter((g) => g.showcase_position != null).map((g) => g.achievement_id)));
  const full = picked.size >= MAX;

  function toggle(id: string, on: boolean) {
    setPicked((current) => {
      const next = new Set(current);
      if (on) next.add(id); else next.delete(id);
      return next;
    });
  }

  return (
    <form action={setShowcase} className="stack gap-10">
      <fieldset className={styles.showcaseList} aria-describedby="showcase-limit">
        <legend className="sr-only">Badges to feature</legend>
        {ordered.map((group) => {
          const checked = picked.has(group.achievement_id);
          return (
            <label key={group.achievement_id} className={styles.showcaseOption} data-disabled={(!checked && full) || undefined}>
              <input
                type="checkbox"
                name="achievementId"
                value={group.achievement_id}
                checked={checked}
                disabled={!checked && full}
                onChange={(event) => toggle(group.achievement_id, event.target.checked)}
              />
              <span className={styles.showcaseName}>{group.name}</span>
              <span className="hint">{TIER_LABELS[toTier(group.tier)]}</span>
            </label>
          );
        })}
      </fieldset>
      <p id="showcase-limit" className="hint" aria-live="polite">
        {full ? "That's 3, the most you can feature. Untick one to pick another." : `Pick up to ${MAX}. ${picked.size} picked.`}
      </p>
      <SubmitButton className="btn btn-primary">Save showcase</SubmitButton>
    </form>
  );
}
