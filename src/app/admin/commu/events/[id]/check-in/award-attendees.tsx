"use client";

import { useState } from "react";
import { ConfirmAction } from "@/components/confirm-action";
import { awardAttendees } from "./actions";

/** The select lives outside ConfirmAction's dialog form, so the pick is
 *  handed to it as a hidden field. */
export function AwardAttendees({ eventId, attendees, achievements }: {
  eventId: string;
  attendees: number;
  achievements: { id: string; name: string }[];
}) {
  const [picked, setPicked] = useState("");
  const name = achievements.find((a) => a.id === picked)?.name;

  return <div className="stack gap-10">
    <div className="field">
      <label htmlFor="award-achievement">Achievement</label>
      <select id="award-achievement" className="input" value={picked} onChange={(e) => setPicked(e.target.value)}>
        <option value="">Choose an achievement</option>
        {achievements.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
      <p className="field-help">Players who already have it are skipped.</p>
    </div>
    {name ? (
      <ConfirmAction
        action={awardAttendees}
        fields={{ eventId, achievementId: picked }}
        trigger="Award badge to attendees"
        triggerClassName="btn btn-primary"
        title={`Award ${name}?`}
        body={`Everyone checked in (${attendees} ${attendees === 1 ? "player" : "players"}) who doesn't have ${name} yet gets it, linked to this event.`}
        confirmLabel="Award badge"
      />
    ) : (
      <button type="button" className="btn btn-primary" disabled>Award badge to attendees</button>
    )}
  </div>;
}
