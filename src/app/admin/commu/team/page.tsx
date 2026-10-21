import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmAction } from "@/components/confirm-action";
import { PixelIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/server";
import styles from "@/app/admin/admin.module.css";
import { deleteTeamGeneration, moveTeamGeneration, saveTeamGeneration } from "./actions";
import { TEAM_DONE, TEAM_ERRORS } from "./messages";

export const metadata: Metadata = { title: "Team" };

export default async function AdminTeamPage({ searchParams }: { searchParams: Promise<{ error?: string; done?: string }> }) {
  const { error: errorCode, done } = await searchParams;
  const supabase = await createClient();
  const [gens, members] = await Promise.all([supabase.rpc("list_team_generations"), supabase.rpc("list_team")]);
  const rows = gens.data ?? [];
  const count = (id: string) => (members.data ?? []).filter((m) => m.generation_id === id).length;

  return <>
    <div className={styles.titleRow}>
      <h1 className={styles.title}>Team</h1>
      <Link href="/team" className="link-button">View team page <PixelIcon name="arrow" size={14} /></Link>
    </div>

    <div aria-live="polite">
      {errorCode && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{TEAM_ERRORS[errorCode] ?? TEAM_ERRORS.FAILED}</p></div>}
      {done && TEAM_DONE[done] && <p className="alert alert-success" role="status"><PixelIcon name="check" />{TEAM_DONE[done]}</p>}
    </div>

    <form action={saveTeamGeneration} className={`panel ${styles.catalogForm}`} aria-labelledby="add-title">
      <h2 id="add-title" className={styles.sectionTitle}>New generation</h2>
      <p className="hint">Each generation has its own board, members, contributors and sponsors. The team page opens on the last one in this list that has people.</p>
      <div className="field">
        <label htmlFor="gen-name">Name</label>
        <input id="gen-name" className="input" name="name" required maxLength={40} placeholder="Gen 1" />
      </div>
      <div className={styles.formButtons}>
        <SubmitButton className="btn btn-primary">Create generation</SubmitButton>
      </div>
    </form>

    {gens.error || members.error ? (
      <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">Couldn&apos;t load the team. Please reload.</p></div>
    ) : rows.length === 0 ? (
      <p className="muted">No generations yet. Start with &ldquo;Gen 0&rdquo;.</p>
    ) : (
      <ul className={styles.itemList} aria-label="Generations, oldest first">
        {rows.map((g, i) => (
          <li key={g.id}>
            <span className={styles.itemText}>
              <strong>{g.name}</strong>
              <span className="hint">{count(g.id)} {count(g.id) === 1 ? "person" : "people"}{count(g.id) === 0 && " · hidden until someone is added"}</span>
            </span>
            <form action={moveTeamGeneration}>
              <input type="hidden" name="generationId" value={g.id} />
              <button className="btn btn-sm" name="direction" value="up" disabled={i === 0} aria-label={`Move ${g.name} up`}>↑</button>
              <button className="btn btn-sm" name="direction" value="down" disabled={i === rows.length - 1} aria-label={`Move ${g.name} down`}>↓</button>
            </form>
            <Link href={`/admin/commu/team/${g.id}`} className="btn btn-sm btn-primary">Open</Link>
            <ConfirmAction
              action={deleteTeamGeneration}
              fields={{ generationId: g.id }}
              trigger="Delete"
              triggerClassName="btn btn-sm btn-danger-outline"
              title={`Delete ${g.name}?`}
              body={`${g.name} and its ${count(g.id)} people leave the team page straight away. This can't be undone.`}
              confirmLabel="Delete generation"
              confirmClassName="btn btn-danger"
            />
          </li>
        ))}
      </ul>
    )}
  </>;
}
