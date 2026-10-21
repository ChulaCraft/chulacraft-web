import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/confirm-action";
import { PixelIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { toCard } from "@/components/team-card";
import { UUID } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import { TEAM_SECTIONS } from "@/lib/team";
import styles from "@/app/admin/admin.module.css";
import { IMAGE_TYPES, publicImageUrl } from "@/app/admin/commu/achievements/images";
import { deleteTeamMember, moveTeamMember, saveTeamGeneration, saveTeamMember } from "../actions";
import { TEAM_DONE, TEAM_ERRORS } from "../messages";
import { MemberPreview } from "./member-preview";

export const metadata: Metadata = { title: "Team generation" };

const BLANK = { name: "", title: "", bio: "", photo: null, userId: null, linkUrl: null };

export default async function AdminTeamGenerationPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; done?: string; edit?: string; kind?: string }>;
}) {
  const { id } = await params;
  const { error: errorCode, done, edit, kind: kindParam } = await searchParams;
  if (!UUID.test(id)) notFound();
  const supabase = await createClient();
  const [gens, members] = await Promise.all([supabase.rpc("list_team_generations"), supabase.rpc("list_team")]);
  if (gens.error || members.error) {
    return <section className={`panel ${styles.errorCard}`} role="alert">
      <h1 className={styles.sectionTitle}><PixelIcon name="warning" size={22} className="tone-danger" />Couldn&apos;t load the team</h1>
      <p className="muted">Nothing was changed. Reload to try again.</p>
    </section>;
  }
  const gen = gens.data.find((g) => g.id === id);
  if (!gen) notFound();
  const people = members.data.filter((m) => m.generation_id === id);
  const editing = people.find((m) => m.id === edit);
  const kind = editing?.kind ?? (TEAM_SECTIONS.some((s) => s.kind === kindParam) ? kindParam! : "board");
  const section = TEAM_SECTIONS.find((s) => s.kind === kind)!;

  return <>
    <Link href="/admin/commu/team" className="back-link"><PixelIcon name="back" />Team</Link>

    <div aria-live="polite">
      {errorCode && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{TEAM_ERRORS[errorCode] ?? TEAM_ERRORS.FAILED}</p></div>}
      {done && TEAM_DONE[done] && <p className="alert alert-success" role="status"><PixelIcon name="check" />{TEAM_DONE[done]}</p>}
    </div>

    <form action={saveTeamGeneration} className={`panel ${styles.catalogForm}`} aria-labelledby="gen-title">
      <h1 id="gen-title" className={styles.sectionTitle}>{gen.name}</h1>
      <input type="hidden" name="generationId" value={gen.id} />
      <div className="field">
        <label htmlFor="gen-name">Generation name</label>
        <input id="gen-name" className="input" name="name" defaultValue={gen.name} required maxLength={40} />
      </div>
      <div className={styles.formButtons}>
        <SubmitButton className="btn btn-sm">Rename</SubmitButton>
      </div>
    </form>

    <div className={styles.editorGrid}>
      <form key={editing?.id ?? `new-${kind}`} id="member-form" action={saveTeamMember} className={`panel ${styles.catalogForm}`} aria-labelledby="form-title">
        <h2 id="form-title" className={styles.sectionTitle}>{editing ? `Edit ${editing.name}` : "Add someone"}</h2>
        {editing && <input type="hidden" name="memberId" value={editing.id} />}
        <input type="hidden" name="generationId" value={gen.id} />
        <fieldset className="field">
          <legend>Section</legend>
          {TEAM_SECTIONS.map((s) => (
            <label key={s.kind} className={styles.tick}>
              <input type="radio" name="kind" value={s.kind} defaultChecked={s.kind === kind} />
              <span><strong>{s.title}</strong><span className="hint">{s.lead}</span></span>
            </label>
          ))}
        </fieldset>
        <div className={styles.formRow}>
          <div className="field">
            <label htmlFor="t-name">Name</label>
            <input id="t-name" className="input" name="name" defaultValue={editing?.name} required maxLength={60} />
          </div>
          <div className="field">
            <label htmlFor="t-title">Role / department <span className="optional">(optional)</span></label>
            <input id="t-title" className="input" name="title" defaultValue={editing?.title} maxLength={60} aria-describedby="t-title-help" />
            <p id="t-title-help" className="field-help">{section.titleHint} Board: their department.</p>
          </div>
        </div>
        <div className="field">
          <label htmlFor="t-bio">Bio <span className="optional">(optional)</span></label>
          <textarea id="t-bio" className={styles.textarea} name="bio" rows={3} defaultValue={editing?.bio} maxLength={300} />
        </div>
        <div className={styles.formRow}>
          <div className="field">
            <label htmlFor="t-player">Player page <span className="optional">(optional)</span></label>
            <input id="t-player" className="input" name="player" defaultValue={editing?.user_id ? `/player/${editing.user_id}` : ""} aria-describedby="t-player-help" />
            <p id="t-player-help" className="field-help">Paste the address of their player page.</p>
          </div>
          <div className="field">
            <label htmlFor="t-link">Website <span className="optional">(optional)</span></label>
            <input id="t-link" className="input" type="url" name="link" defaultValue={editing?.link_url ?? ""} placeholder="https://" aria-describedby="t-link-help" />
            <p id="t-link-help" className="field-help">For sponsors. A player page wins if both are set.</p>
          </div>
        </div>
        <div className="field">
          <label htmlFor="t-photo">Photo or logo <span className="optional">(optional)</span></label>
          {editing?.image_path && <Image className={styles.previewImage} src={publicImageUrl(editing.image_path)} alt="Current photo" width={120} height={120} />}
          <input id="t-photo" className="input" type="file" name="photo" accept={IMAGE_TYPES.join(",")} aria-describedby="t-photo-help" />
          <p id="t-photo-help" className="field-help">Square works best. PNG, JPEG, WebP or GIF, up to 2 MB. Without one, the card shows their initial.</p>
          {editing?.image_path && (
            <label className={styles.tick}>
              <input type="checkbox" name="removePhoto" />
              <span><strong>Remove photo</strong></span>
            </label>
          )}
        </div>
        {editing && gens.data.length > 1 && (
          <div className="field">
            <label htmlFor="t-gen">Generation</label>
            <select id="t-gen" className="input" name="toGenerationId" defaultValue={gen.id}>
              {gens.data.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        )}
        <div className={styles.formButtons}>
          <SubmitButton className="btn btn-primary">{editing ? "Save" : "Add to team"}</SubmitButton>
          {editing ? <Link href={`/admin/commu/team/${gen.id}`} className="btn">Cancel</Link> : <button type="reset" className="btn">Clear</button>}
        </div>
      </form>
      <div className={styles.previewColumn}>
        <MemberPreview formId="member-form" kind={kind} saved={editing ? toCard(editing) : BLANK} />
      </div>
    </div>

    {TEAM_SECTIONS.map((s) => {
      const rows = people.filter((m) => m.kind === s.kind);
      return (
        <section key={s.kind} className="stack gap-10" aria-labelledby={`list-${s.kind}`}>
          <div className={styles.titleRow}>
            <h2 id={`list-${s.kind}`} className={styles.sectionTitle}>{s.title}</h2>
            <Link href={`/admin/commu/team/${gen.id}?kind=${s.kind}#member-form`} className="btn btn-sm">Add to {s.title}</Link>
          </div>
          {rows.length === 0 ? <p className="muted">Nobody yet. Empty sections don&apos;t show on the site.</p> : (
            <ul className={styles.itemList} aria-label={`${s.title}, in order`}>
              {rows.map((m, i) => (
                <li key={m.id}>
                  <span className={styles.itemText}>
                    <strong>{m.name}</strong>
                    {m.title && <span className="hint">{m.title}</span>}
                  </span>
                  <form action={moveTeamMember}>
                    <input type="hidden" name="memberId" value={m.id} />
                    <input type="hidden" name="generationId" value={gen.id} />
                    <button className="btn btn-sm" name="direction" value="up" disabled={i === 0} aria-label={`Move ${m.name} up`}>↑</button>
                    <button className="btn btn-sm" name="direction" value="down" disabled={i === rows.length - 1} aria-label={`Move ${m.name} down`}>↓</button>
                  </form>
                  <Link href={`/admin/commu/team/${gen.id}?edit=${m.id}#member-form`} className="btn btn-sm">Edit</Link>
                  <ConfirmAction
                    action={deleteTeamMember}
                    fields={{ memberId: m.id, generationId: gen.id }}
                    trigger="Remove"
                    triggerClassName="btn btn-sm btn-danger-outline"
                    title={`Remove ${m.name}?`}
                    body="They leave the team page straight away. This can't be undone."
                    confirmLabel="Remove"
                    confirmClassName="btn btn-danger"
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      );
    })}
  </>;
}
