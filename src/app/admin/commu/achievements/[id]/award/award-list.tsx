"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { PixelIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import adminStyles from "@/app/admin/admin.module.css";
import { AWARD_KINDS, MAX_CSV_ROWS } from "@/lib/award-csv";
import { AWARD_PAGE_SIZE, MAX_SELECT_ALL } from "../../selection";
import { confirmAward, listFilteredIds, loadAwardPlayers, prefillInterested, previewAward, type AwardPlayer, type AwardPreview } from "./actions";
import styles from "./award.module.css";

export type AwardEvent = { id: string; label: string };

type Props = {
  achievementId: string;
  /** Players who already hold the achievement: shown ticked and locked, never counted. */
  recipients: string[];
  /** Ticked on arrival, from the Players bulk bar. */
  seed: string[];
  events: AwardEvent[];
  initial: { rows: AwardPlayer[]; total: number };
  awardedOn: string;
};

const plural = (n: number) => `${n} ${n === 1 ? "player" : "players"}`;

export function AwardList({ achievementId, recipients, seed, events, initial, awardedOn }: Props) {
  const existing = useRef(new Set(recipients)).current;
  const [selected, setSelected] = useState(() => new Set(seed));
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [page, setPage] = useState(initial);
  const [notice, setNotice] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [preview, setPreview] = useState<AwardPreview | null>(null);
  const [kind, setKind] = useState("discord");
  const [csv, setCsv] = useState("");
  const [prefillEvent, setPrefillEvent] = useState("");
  const [awardEvent, setAwardEvent] = useState("");
  const [busy, startTransition] = useTransition();
  const latest = useRef(0);
  const first = useRef(true);

  // Typing filters after a short pause; the newest request wins if answers cross.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const timer = setTimeout(() => load(query, 0), 250);
    return () => clearTimeout(timer);
  }, [query]);

  function load(text: string, nextOffset: number) {
    const ticket = ++latest.current;
    loadAwardPlayers(text, nextOffset).then((result) => {
      if (ticket !== latest.current) return;
      if ("error" in result) { setProblem("The player list couldn't be loaded. Please try again."); return; }
      setProblem(null);
      setOffset(nextOffset);
      setPage(result);
    });
  }

  function add(ids: string[]) {
    setSelected((current) => new Set([...current, ...ids]));
  }

  function toggle(id: string, on: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (on) next.add(id); else next.delete(id);
      return next;
    });
  }

  function selectAllFiltered() {
    startTransition(async () => {
      const result = await listFilteredIds(query);
      if ("error" in result) { setProblem("Couldn't select every match. Please try again."); return; }
      setProblem(null);
      add(result.ids);
      setNotice(result.capped
        ? `Only the first ${MAX_SELECT_ALL} matches were ticked. Narrow the search to reach the rest.`
        : `Ticked ${plural(result.ids.length)}.`);
    });
  }

  function checkList() {
    startTransition(async () => {
      const result = await previewAward(kind, csv);
      if ("error" in result) { setPreview(null); setProblem(result.error === "TOO_MANY" ? `That list has more than ${MAX_CSV_ROWS} rows. Split it into smaller lists.` : "The list couldn't be checked. Please try again."); return; }
      setProblem(null);
      setPreview(result);
      add(result.matched.map((row) => row.userId));
    });
  }

  function prefill() {
    startTransition(async () => {
      const result = await prefillInterested(prefillEvent);
      if ("error" in result) { setProblem(result.error === "PICK_EVENT" ? "Choose an event first, so we know whose interested players to tick." : "Couldn't load the interested players. Please try again."); return; }
      setProblem(null);
      add(result.ids);
      setNotice(`Ticked ${plural(result.ids.length)} who marked the event interesting.`);
    });
  }

  const ticked = [...selected].filter((id) => !existing.has(id));
  const pages = Math.max(1, Math.ceil(page.total / AWARD_PAGE_SIZE));
  const current = Math.floor(offset / AWARD_PAGE_SIZE) + 1;

  return <>
    <section className="panel" aria-labelledby="pick-title">
      <div className={adminStyles.listHead}>
        <h2 id="pick-title" className={adminStyles.sectionTitle}>Players</h2>
        <span className="hint" data-testid="ticked-count">{ticked.length} ticked</span>
      </div>

      <div className={adminStyles.searchInput}>
        <PixelIcon name="search" />
        <input className="input" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Discord, Chula email, or Minecraft name" aria-label="Filter players" />
      </div>

      <div className={styles.toolbar}>
        <button type="button" className="btn" onClick={selectAllFiltered} disabled={busy}>Select all filtered</button>
        <button type="button" className="btn" onClick={() => { setSelected(new Set()); setNotice(null); }} disabled={ticked.length === 0}>Clear ticks</button>
      </div>

      <div aria-live="polite">
        {problem && <p className="alert alert-error" role="alert"><PixelIcon name="warning" />{problem}</p>}
        {notice && <p className="field-help" role="status">{notice}</p>}
      </div>

      {page.rows.length === 0 ? <p className="muted">{query.trim() ? `No players found for “${query.trim()}”.` : "No players yet."}</p> : (
        <ul className={styles.list} aria-label="Players">
          {page.rows.map((player) => {
            const has = existing.has(player.id);
            return (
              <li key={player.id}>
                <label className={styles.row} data-disabled={has || undefined}>
                  <input type="checkbox" checked={has || selected.has(player.id)} disabled={has} onChange={(e) => toggle(player.id, e.target.checked)} />
                  <span>
                    <strong>{player.name}</strong>
                    <span className={`mono ${adminStyles.small}`}>{player.minecraft || "No Minecraft account"}</span>
                    {has && <span className={adminStyles.small}>Already awarded</span>}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <div className={styles.pager}>
        <button type="button" className="btn" onClick={() => load(query, offset - AWARD_PAGE_SIZE)} disabled={current <= 1}>Previous</button>
        <span className="hint">Page {current} of {pages}</span>
        <button type="button" className="btn" onClick={() => load(query, offset + AWARD_PAGE_SIZE)} disabled={current >= pages}>Next</button>
      </div>
    </section>

    <section className="panel stack gap-16" aria-labelledby="bulk-title">
      <h2 id="bulk-title" className={adminStyles.sectionTitle}>Tick from a list</h2>
      <div className="field">
        <label htmlFor="award-kind">Names in the list are</label>
        <select id="award-kind" className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
          {AWARD_KINDS.map((option) => <option key={option} value={option}>{option === "chula" ? "Chula emails" : `${option[0].toUpperCase()}${option.slice(1)} names`}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="award-csv">Paste names, one per line</label>
        <textarea id="award-csv" className={adminStyles.textarea} rows={6} value={csv} onChange={(e) => setCsv(e.target.value)} aria-describedby="csv-help" />
        <p id="csv-help" className="field-help">
          Up to {MAX_CSV_ROWS} rows. A first row reading {AWARD_KINDS.join(", ")} sets the kind; without one the first column is used.
        </p>
      </div>
      <div className={adminStyles.formButtons}>
        <button type="button" className="btn" onClick={checkList} disabled={busy || csv.trim() === ""}>Tick matches</button>
      </div>
      {preview && (
        <dl className={styles.report} aria-label="List result">
          <dt>Matched</dt><dd>{plural(preview.matched.length)}</dd>
          <dt>Unmatched</dt><dd>{preview.unmatched.length === 0 ? "None" : preview.unmatched.join(", ")}</dd>
          <dt>Duplicates</dt><dd>{preview.duplicates.length === 0 ? "None" : `${preview.duplicates.join(", ")} (awarded once)`}</dd>
        </dl>
      )}
    </section>

    <section className="panel stack gap-16" aria-labelledby="prefill-title">
      <h2 id="prefill-title" className={adminStyles.sectionTitle}>Tick interested players</h2>
      <p className="field-help">
        Interest is a maybe, not a sign-up. This ticks everyone who marked the event interesting so you can
        confirm who actually came. Nobody is awarded until you press the award button.
      </p>
      <div className="field">
        <label htmlFor="prefill-event">Event</label>
        <select id="prefill-event" className="input" value={prefillEvent} onChange={(e) => setPrefillEvent(e.target.value)}>
          <option value="">Choose an event first</option>
          {events.map((event) => <option key={event.id} value={event.id}>{event.label}</option>)}
        </select>
      </div>
      <div className={adminStyles.formButtons}>
        <button type="button" className="btn" onClick={prefill} disabled={busy || !prefillEvent}>Tick interested players</button>
      </div>
    </section>

    <section className="panel" aria-labelledby="confirm-title">
      <h2 id="confirm-title" className={adminStyles.sectionTitle}>Award</h2>
      <form action={confirmAward} className="stack gap-16">
        <input type="hidden" name="achievementId" value={achievementId} />
        <input type="hidden" name="sel" value={ticked.join(",")} />
        <div className="field">
          <label htmlFor="award-event">Awarded at an event</label>
          <select id="award-event" className="input" name="eventId" value={awardEvent} onChange={(e) => setAwardEvent(e.target.value)}>
            <option value="">No event — use the date below</option>
            {events.map((event) => <option key={event.id} value={event.id}>{event.label}</option>)}
          </select>
          <p className="field-help">An award at an event takes its date from the event&apos;s start date.</p>
        </div>
        <div className="field">
          <label htmlFor="award-date">Awarded on</label>
          <input id="award-date" className="input" type="date" name="awardedOn" defaultValue={awardedOn} disabled={Boolean(awardEvent)} aria-describedby="award-date-help" />
          <p id="award-date-help" className="field-help">Bangkok date, used only when no event is chosen.</p>
        </div>
        <div className={adminStyles.formButtons}>
          <SubmitButton className="btn btn-primary" disabled={ticked.length === 0}>Award {plural(ticked.length)}</SubmitButton>
        </div>
      </form>
    </section>
  </>;
}
