import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PixelIcon } from "@/components/icons";
import { AWARD_KINDS, MAX_CSV_ROWS, parseAwardCsv } from "@/lib/award-csv";
import { UUID } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../admin.module.css";
import { addPlayers, confirmAward, prefillInterested, previewAward } from "./actions";
import { selectionParam, selectionIds } from "../../selection";
import { SubmitButton } from "@/components/submit-button";

export const metadata: Metadata = { title: "Award achievement" };

const ERRORS: Record<string, string> = {
  FORBIDDEN: "You don't have permission to award this.",
  NOT_FOUND: "That achievement or event no longer exists. Refresh and try again.",
  TOO_MANY: `That list has more than ${MAX_CSV_ROWS} rows. Split it into smaller lists.`,
  NO_PLAYERS: "Pick at least one player first.",
  PICK_EVENT: "Choose an event first, so we know whose interested players to tick.",
  FAILED: "The award couldn't be saved. Please try again."
};

/** A "value|userId" pair from the preview query string. */
type Matched = { value: string; userId: string };

export default async function AdminAwardPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; done?: string; count?: string; q?: string; sel?: string; preview?: string; eventId?: string }>;
}) {
  const { id } = await params;
  const { error: errorCode, done, count, q = "", sel, preview, eventId: chosenEvent } = await searchParams;
  if (!UUID.test(id)) notFound();

  const selected = selectionIds(sel);
  const supabase = await createClient();
  const [catalog, events, search] = await Promise.all([
    supabase.rpc("admin_list_achievements"),
    supabase.rpc("admin_list_events"),
    // 50-row capped search, same as the Players page; bulk names go through the CSV.
    q.trim() ? supabase.rpc("admin_search_users", { p_query: q.trim() }) : Promise.resolve({ data: [], error: null })
  ]);
  const achievement = (catalog.data ?? []).find((row) => row.id === id);
  if (!achievement) notFound();
  const found: { user_id: string; discord_username: string | null; email: string | null; minecraft_usernames: string | null }[] = search.data ?? [];

  // The preview travels back as one query parameter, so the pasted list never
  // has to be held in component state and the confirm step can award without
  // resolving a second time.
  const step = new URLSearchParams(preview ?? "");
  const csv = step.get("csv") ?? "";
  const parsed = parseAwardCsv(csv);
  const kind = AWARD_KINDS.includes(step.get("kind") as never) ? step.get("kind")! : (parsed.header ?? "discord");
  const matched: Matched[] = step.getAll("matched").map((entry) => ({ value: entry.slice(0, entry.lastIndexOf("|")), userId: entry.slice(entry.lastIndexOf("|") + 1) }));
  const unmatched = step.getAll("unmatched");
  const duplicates = step.getAll("duplicate");
  const eventId = UUID.test(step.get("eventId") ?? "") ? step.get("eventId")! : (UUID.test(chosenEvent ?? "") ? chosenEvent! : "");
  // Today in Bangkok; toISOString() would give the UTC date, a day behind before 07:00.
  const awardedOn = step.get("awardedOn") ?? new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const previewing = preview !== undefined;
  // Ticked and pasted players can overlap; admin_award dedupes, so the button counts the same way.
  const recipients = new Set([...selected, ...matched.map((row) => row.userId)]).size;

  // Every link back into this page carries the current selection along.
  const link = (extra: Record<string, string>) => {
    const params = new URLSearchParams(extra);
    if (q) params.set("q", q);
    if (selected.length) params.set("sel", selectionParam(selected));
    return `/admin/achievements/${id}/award?${params}`;
  };

  return <>
    <Link href={`/admin/achievements/${id}`} className="back-link"><PixelIcon name="back" />{achievement.name}</Link>
    <h1 className={styles.title}>Award {achievement.name}</h1>

    <div aria-live="polite">
      {errorCode && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{ERRORS[errorCode] ?? ERRORS.FAILED}</p></div>}
      {done === "awarded" && <p className="alert alert-success" role="status"><PixelIcon name="check" />Awarded to {count} {count === "1" ? "player" : "players"}.</p>}
    </div>

    <section className="panel" aria-labelledby="search-title">
      <div className={styles.listHead}>
        <h2 id="search-title" className={styles.sectionTitle}>Find players</h2>
        <span className="hint">{selected.length} selected</span>
      </div>
      <form className="stack gap-10" role="search">
        {/* The selection rides along, so searching doesn't lose it. */}
        <input type="hidden" name="sel" value={selectionParam(selected)} />
        <div className={styles.searchRow}>
          <div className={styles.searchInput}>
            <PixelIcon name="search" />
            <input className="input" id="award-q" name="q" defaultValue={q} placeholder="Discord, Chula email, or Minecraft name" aria-label="Search players" />
          </div>
          <button className="btn btn-primary" type="submit">Search</button>
        </div>
      </form>

      {q.trim() && (
        <form action={addPlayers}>
          <input type="hidden" name="achievementId" value={achievement.id} />
          <input type="hidden" name="q" value={q} />
          <input type="hidden" name="sel" value={selectionParam(selected)} />
          {found.length === 0 ? <p className="muted">No players found for “{q}”.</p> : (
            <>
              <ul className={styles.ticks} aria-label="Search results">
                {found.map((user) => (
                  <li key={user.user_id}>
                    <label className={styles.tick}>
                      <input type="checkbox" name="playerId" value={user.user_id} defaultChecked={selected.includes(user.user_id)} />
                      <span>
                        <strong>{user.discord_username ?? user.email ?? user.user_id}</strong>
                        <span className={`mono ${styles.small}`}>{user.minecraft_usernames ?? "No Minecraft account"}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <div className={styles.formButtons}>
                <SubmitButton className="btn">Add ticked to award</SubmitButton>
              </div>
            </>
          )}
        </form>
      )}

      {selected.length > 0 && (
        <p className={styles.selection}>
          {selected.length} {selected.length === 1 ? "player" : "players"} selected ·{" "}
          <Link href={link({})} className="link-button">Clear</Link>
        </p>
      )}
    </section>

    <section className="panel stack gap-16" aria-labelledby="bulk-title">
      <h2 id="bulk-title" className={styles.sectionTitle}>Bulk award from a list</h2>
      <form action={previewAward} className="stack gap-16">
        <input type="hidden" name="achievementId" value={achievement.id} />
        <input type="hidden" name="sel" value={selectionParam(selected)} />
        <div className="field">
          <label htmlFor="award-kind">Names in the list are</label>
          <select id="award-kind" className="input" name="kind" defaultValue={kind}>
            {AWARD_KINDS.map((option) => <option key={option} value={option}>{option === "chula" ? "Chula emails" : `${option[0].toUpperCase()}${option.slice(1)} names`}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="award-csv">Paste names, one per line</label>
          <textarea id="award-csv" className={styles.textarea} name="csv" rows={6} defaultValue={csv} aria-describedby="csv-help" />
          <p id="csv-help" className="field-help">
            Up to {MAX_CSV_ROWS} rows. A first row reading {AWARD_KINDS.join(", ")} sets the kind; without one the first column is used.
          </p>
        </div>
        <div className={styles.formButtons}>
          <SubmitButton className="btn btn-primary">Preview matches</SubmitButton>
        </div>
      </form>
    </section>

    <section className="panel stack gap-16" aria-labelledby="prefill-title">
      <h2 id="prefill-title" className={styles.sectionTitle}>Prefill from interested players</h2>
      <p className="field-help">
        Interest is a maybe, not a sign-up. This ticks everyone who marked the event interesting so you can
        confirm who actually came — nobody is awarded until you press the award button.
      </p>
      <form action={prefillInterested} className="stack gap-16">
        <input type="hidden" name="achievementId" value={achievement.id} />
        <input type="hidden" name="q" value={q} />
        <input type="hidden" name="sel" value={selectionParam(selected)} />
        <div className="field">
          <label htmlFor="prefill-event">Event</label>
          <select id="prefill-event" className="input" name="eventId" defaultValue={eventId}>
            <option value="">Choose an event first</option>
            {(events.data ?? []).map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}{event.status === "draft" ? " (draft)" : ""} · {new Date(event.starts_at).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium" })}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.formButtons}>
          <SubmitButton className="btn" disabled={!eventId}>Tick interested players</SubmitButton>
        </div>
      </form>
    </section>

    {(previewing || selected.length > 0) && (
      <section className="panel" aria-labelledby="preview-title">
        <h2 id="preview-title" className={styles.sectionTitle}>Check before awarding</h2>
        {previewing && <dl className={styles.facts}>
          <dt>Matched</dt><dd>{matched.length} {matched.length === 1 ? "player" : "players"}</dd>
          <dt>Unmatched</dt><dd>{unmatched.length === 0 ? "None" : unmatched.join(", ")}</dd>
          <dt>Duplicates</dt><dd>{duplicates.length === 0 ? "None" : `${duplicates.join(", ")} (awarded once)`}</dd>
          <dt>Ticked</dt><dd>{selected.length}</dd>
        </dl>}
        {previewing && matched.length === 0 && unmatched.length === 0 && <p className="field-help">The list was empty, so there is nothing to award.</p>}
        {unmatched.length > 0 && <p className="field-help">Unmatched names are left out. Check the spelling, or the kind you picked.</p>}

        <form action={confirmAward} className={styles.confirmForm}>
          <input type="hidden" name="achievementId" value={achievement.id} />
          <input type="hidden" name="sel" value={selectionParam(selected)} />
          {matched.map((row) => <input key={row.userId} type="hidden" name="matchedId" value={row.userId} />)}

          <div className="field">
            <label htmlFor="award-event">Awarded at an event</label>
            <select id="award-event" className="input" name="eventId" defaultValue={eventId}>
              <option value="">No event — use the date below</option>
              {(events.data ?? []).map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}{event.status === "draft" ? " (draft)" : ""} · {new Date(event.starts_at).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium" })}
                </option>
              ))}
            </select>
            <p className="field-help">An award at an event takes its date from the event&apos;s start date.</p>
          </div>
          <div className="field">
            <label htmlFor="award-date">Awarded on</label>
            <input id="award-date" className="input" type="date" name="awardedOn" defaultValue={awardedOn} disabled={Boolean(eventId)} aria-describedby="award-date-help" />
            <p id="award-date-help" className="field-help">Bangkok date, used only when no event is chosen.</p>
          </div>

          <div className={styles.formButtons}>
            <SubmitButton className="btn btn-primary" disabled={recipients === 0}>
              Award {recipients} {recipients === 1 ? "player" : "players"}
            </SubmitButton>
            <Link href={link({})} className="btn">Start over</Link>
          </div>
        </form>
      </section>
    )}
  </>;
}