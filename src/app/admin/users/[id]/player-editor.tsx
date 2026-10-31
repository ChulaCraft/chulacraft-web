"use client";

import { Fragment, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PixelIcon } from "@/components/icons";
import { BannerStrip } from "@/components/profile-banner";
import { ReviewDialog } from "@/components/review-dialog";
import { FACULTIES, STUDY_LEVELS, validateProfile, type ProfileDetails } from "@/lib/faculties";
import { LEVEL_OPTIONS, PRIVACY_FIELDS } from "@/lib/privacy";
import { MAX_MINECRAFT_ACCOUNTS, syncBadge, toSyncStatus } from "@/lib/registration";
import { ROLE_LABELS } from "@/lib/staff";
import styles from "../../admin.module.css";
import mine from "./player-editor.module.css";
import { applyPlayerChanges } from "./actions";
import { buildChanges, controlName, DURATIONS, ERRORS, reviewRows, warningFor, type Draft, type Snapshot } from "./staged";

/** Which controls this viewer gets. Decided on the server from the same role rules as before. */
export type Can = { guest: boolean; reset: boolean; role: boolean; removeStaff: boolean; ban: boolean; lift: boolean; profile: boolean; privacy: boolean; banners: boolean; whitelist: boolean };

type BanRow = { id: string; active: boolean; reason: string; publicNote: string | null; until: string; by: string; at: string; atIso: string; outcome: string };
type BannerRow = { id: string; name: string; colors: string[]; image: string | null; still: string | null; kind: string; granted: boolean; owned: boolean; selected: boolean; eventNames: string[] };
type Account = { id: string; name: string; uuid: string; desired: boolean; active: boolean; syncStatus: string };

type Props = {
  userId: string; name: string; handle: string; targetRole: string;
  snapshot: Snapshot; can: Can; chula: { email: string } | null; guest: boolean;
  bans: BanRow[]; banners: BannerRow[] | null; accounts: Account[];
  /** Server-rendered panels that never change: details at the top of the side column, the change log at the foot of the main one. */
  details: ReactNode; log: ReactNode;
};

const ROLE_BODY: Record<string, string> = {
  admin: "Admins can search players, reset Chula links, and restore accounts.",
  moderator: "Moderators see players and handle reports, appeals and bans.",
  event_staff: "Event staff see players and run achievements, events and announcements.",
  user: "Back to a regular player account.",
  owner: "Owners can change every player's role, including other owners and you. Only promote someone you'd trust to run the server.",
};

const start = (s: Snapshot): Draft => ({ role: s.role, guest: false, reset: false, profile: s.profile, privacy: s.privacy, banners: {}, whitelist: {}, lift: false, ban: null });

/** Setting a map entry to what is saved removes it, so "unchanged" has one shape. */
const setIn = (map: Record<string, boolean>, id: string, value: boolean, saved: boolean) => {
  const next = { ...map };
  if (value === saved) delete next[id]; else next[id] = value;
  return next;
};

function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return <label className={mine.choice}><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{children}</label>;
}

export function PlayerEditor({ userId, name, handle, targetRole, snapshot, can, chula, guest, bans, banners, accounts, details, log }: Props) {
  const router = useRouter();
  // null is view mode. Leaving the page unmounts this component, so staged changes are discarded.
  const [draft, setDraft] = useState<Draft | null>(null);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  // Only for the dates shown in the review; the real expiry is computed at confirm.
  const [openedAt, setOpenedAt] = useState(0);

  const canEdit = Object.values(can).some(Boolean);
  const editing = draft !== null;
  const activeBan = bans.find((b) => b.active);
  const update = (patch: Partial<Draft>) => setDraft((d) => d && { ...d, ...patch });

  const changes = draft ? buildChanges(snapshot, draft, openedAt) : [];
  const profileChanged = draft ? changes.some((c) => c.kind === "profile") : false;
  const profileErrors = draft && profileChanged ? validateProfile(draft.profile) : {};
  const makesOwner = draft?.role === "owner" && snapshot.role !== "owner";
  const problem = !draft ? null
    : Object.keys(profileErrors).length ? "Fix the profile details before reviewing."
    : draft.ban && !draft.ban.reason.trim() ? "Give a reason for the ban before reviewing."
    : makesOwner && typed !== handle ? `Type ${handle} to confirm making them an owner.`
    : null;

  const open = () => { setOpenedAt(Date.now()); setDraft(start(snapshot)); setTyped(""); setError(null); setSaved(false); };
  const cancel = () => { setDraft(null); setError(null); };

  async function confirm() {
    if (!draft) return;
    setError(null);
    const result = await applyPlayerChanges(userId, buildChanges(snapshot, draft, Date.now()));
    if (!result.ok) {
      const which = result.control ? controlName(snapshot, result.control) : null;
      setError(`${which ? `${which}: ` : ""}${ERRORS[result.code] ?? "The change couldn't be saved."} Nothing was saved.`);
      return;
    }
    setDraft(null);
    setSaved(true);
    router.refresh();
  }

  const setProfile = (k: keyof ProfileDetails) => (e: { target: { value: string } }) =>
    setDraft((d) => {
      if (!d) return d;
      if (k !== "faculty") return { ...d, profile: { ...d.profile, [k]: e.target.value } };
      const majors = FACULTIES.find((f) => f.name === e.target.value)?.majors ?? [];
      return { ...d, profile: { ...d.profile, faculty: e.target.value, major: majors.length === 1 ? majors[0] : "" } };
    });
  const faculty = draft ? FACULTIES.find((f) => f.name === draft.profile.faculty) : undefined;
  const p = snapshot.profile;
  const levelLabel = STUDY_LEVELS.find((l) => l.value === p.level)?.label;
  const hasProfile = Boolean(p.first || p.last || p.faculty);

  const showActions = editing && (can.guest || can.reset || can.role);
  const privacyLabel = (v: string) => LEVEL_OPTIONS.find((o) => o.value === v)?.label ?? v;

  return <>
    <div aria-live="polite">
      {saved && <p className="alert alert-success" role="status"><PixelIcon name="check" />Changes saved.</p>}
    </div>

    {canEdit && (
      <section className={`panel ${mine.bar}`} aria-label="Edit this player">
        {!editing
          ? <button type="button" className="btn btn-primary" onClick={open}>Edit</button>
          : <>
              <ReviewDialog
                action={confirm}
                trigger={`Review changes (${changes.length})`}
                triggerClassName="btn btn-primary"
                title={`Review changes for ${name}`}
                rows={reviewRows(snapshot, changes)}
                warning={warningFor(changes)}
                confirmLabel="Confirm and apply"
                confirmClassName={changes.some((c) => ["ban", "chula_reset", "role"].includes(c.kind)) ? "btn btn-danger" : "btn btn-primary"}
                error={error}
                disabled={changes.length === 0 || problem !== null}
                danger={makesOwner}
              />
              <button type="button" className="btn" onClick={cancel}>Cancel</button>
              <p className={`hint ${mine.grow}`} role="status">
                {problem ?? (changes.length === 0 ? "Nothing changed yet. Nothing is saved until you confirm." : "Nothing is saved until you confirm the review.")}
              </p>
            </>}
      </section>
    )}

    <div className={styles.columns}>
      <div className={styles.sideCol}>
        {details}

        {showActions && draft && (
          <section className={`panel ${styles.actionsCard}`} aria-labelledby="act-title">
            <h2 id="act-title" className={styles.sectionTitle}>Actions</h2>
            {can.guest && (
              <div className={styles.actionRow}>
                <p className="hint">Let someone without a Chula account add Minecraft accounts. Only for people an admin has invited.</p>
                <Check checked={draft.guest} onChange={(v) => update({ guest: v })}>Mark as verified (guest)</Check>
              </div>
            )}
            {can.reset && (
              <div className={styles.actionRow}>
                <p className="hint">{chula ? `Unlinks ${chula.email}${guest ? " and removes guest status" : ""}` : "Removes guest status"}, so they have to verify again.</p>
                <Check checked={draft.reset} onChange={(v) => update({ reset: v })}>Reset Chula link</Check>
              </div>
            )}
            {can.role && (
              <div className={styles.roleRow}>
                <div className="field">
                  <label htmlFor="role" className="label">Role</label>
                  <select id="role" className={`input ${styles.roleSelect}`} value={draft.role} onChange={(e) => { update({ role: e.target.value }); setTyped(""); }}>
                    {Object.keys(ROLE_LABELS).map((r) => <option key={r} value={r}>{r === "user" ? "User" : ROLE_LABELS[r]}</option>)}
                  </select>
                  {draft.role !== snapshot.role && <span className="field-help">{ROLE_BODY[draft.role]}</span>}
                </div>
                {makesOwner && (
                  <div className="field">
                    <label htmlFor="owner-confirm" className="label">Type {handle} to make them an owner</label>
                    <input id="owner-confirm" className="input" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {editing && draft && can.removeStaff && (
          <section className={`panel ${styles.actionsCard}`} aria-labelledby="staff-title">
            <h2 id="staff-title" className={styles.sectionTitle}>Staff role</h2>
            <div className={styles.actionRow}>
              <p className="hint">Admins can take a staff role away. Only an owner can give one.</p>
              <Check checked={draft.role === "user"} onChange={(v) => update({ role: v ? "user" : snapshot.role })}>Remove staff role</Check>
            </div>
            {draft.role === "user" && <p className="hint">{name} loses their {ROLE_LABELS[targetRole]} tools straight away.</p>}
          </section>
        )}

        {bans.length > 0 || (editing && can.ban) ? (
          <section className={`panel ${styles.actionsCard}`} aria-labelledby="ban-title">
            <h2 id="ban-title" className={styles.sectionTitle}>Ban</h2>
            {activeBan && (
              <dl className={styles.facts}>
                <dt>Reason</dt><dd>{activeBan.reason}</dd>
                <dt>Player sees</dt><dd>{activeBan.publicNote ?? <span className="hint">No note</span>}</dd>
                <dt>Until</dt><dd>{activeBan.until}</dd>
                <dt>By</dt><dd>{activeBan.by} · {activeBan.at}</dd>
              </dl>
            )}
            {editing && draft && can.lift && activeBan && (
              <Check checked={draft.lift} onChange={(v) => update({ lift: v })}>Lift ban</Check>
            )}
            {editing && draft && can.ban && !activeBan && (
              <>
                <Check checked={draft.ban !== null} onChange={(v) => update({ ban: v ? { reason: "", note: "", duration: "7d" } : null })}>Ban {name}</Check>
                {draft.ban && (
                  <div className={mine.nested}>
                    <label className="stack gap-6">
                      <span className="label">Reason (admins only)</span>
                      <textarea className={styles.textarea} rows={2} maxLength={1000} value={draft.ban.reason} onChange={(e) => update({ ban: { ...draft.ban!, reason: e.target.value } })} />
                    </label>
                    <label className="stack gap-6">
                      <span className="label">Note to the player <span className="optional">optional</span></span>
                      <textarea className={styles.textarea} rows={2} maxLength={1000} value={draft.ban.note} onChange={(e) => update({ ban: { ...draft.ban!, note: e.target.value } })} />
                    </label>
                    <label className="stack gap-6">
                      <span className="label">Length</span>
                      <select className="input" value={draft.ban.duration} onChange={(e) => update({ ban: { ...draft.ban!, duration: e.target.value as NonNullable<Draft["ban"]>["duration"] } })}>
                        {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                    </label>
                    <p className="hint">Every whitelisted account leaves the whitelist, they&apos;re kicked, and they lose their Discord roles until the ban ends.</p>
                  </div>
                )}
              </>
            )}
            {bans.some((b) => !b.active) && (
              <ol className={styles.log}>
                {bans.filter((b) => !b.active).map((b) => (
                  <li key={b.id}>
                    <time dateTime={b.atIso}>{b.at}</time>
                    <span>{b.reason} <span className="hint">· {b.outcome}</span></span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        ) : null}
      </div>

      <div className={styles.mainCol}>
        <section className="panel" aria-labelledby="profile-title">
          <div className={styles.listHead}><h2 id="profile-title" className={styles.sectionTitle}>Profile</h2></div>
          {editing && draft && can.profile ? (
            <div className="stack gap-10">
              <div className={mine.pair}>
                <div className="field">
                  <label htmlFor="pf-first">First name</label>
                  <input id="pf-first" className="input" maxLength={60} value={draft.profile.first} onChange={setProfile("first")} aria-invalid={Boolean((profileErrors as Record<string, boolean>).first)} />
                </div>
                <div className="field">
                  <label htmlFor="pf-last">Last name</label>
                  <input id="pf-last" className="input" maxLength={60} value={draft.profile.last} onChange={setProfile("last")} aria-invalid={Boolean((profileErrors as Record<string, boolean>).last)} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="pf-nick">Nickname <span className="optional">(optional)</span></label>
                <input id="pf-nick" className="input" maxLength={20} value={draft.profile.nick} onChange={setProfile("nick")} aria-invalid={Boolean((profileErrors as Record<string, boolean>).nick)} />
              </div>
              <fieldset className="field">
                <legend>Study level</legend>
                <div className={mine.levels}>
                  {STUDY_LEVELS.map((l) => (
                    <label key={l.value}><input type="radio" name="pf-level" value={l.value} checked={draft.profile.level === l.value} onChange={() => update({ profile: { ...draft.profile, level: l.value } })} /> {l.label}</label>
                  ))}
                </div>
              </fieldset>
              <div className="field">
                <label htmlFor="pf-faculty">Faculty</label>
                <select id="pf-faculty" className="input" value={draft.profile.faculty} onChange={setProfile("faculty")} aria-invalid={Boolean((profileErrors as Record<string, boolean>).faculty)}>
                  <option value="">Choose a faculty</option>
                  {FACULTIES.map((f) => <option key={f.name}>{f.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="pf-major">Major</label>
                <select id="pf-major" className="input" value={draft.profile.major} onChange={setProfile("major")} disabled={!faculty} aria-invalid={Boolean((profileErrors as Record<string, boolean>).major)}>
                  <option value="">{faculty ? "Choose a major" : "Pick a faculty first"}</option>
                  {faculty?.majors.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <dl className={styles.facts}>
              <dt>Name</dt><dd>{[p.first, p.last].filter(Boolean).join(" ") || <span className="hint">Not set</span>}</dd>
              <dt>Nickname</dt><dd>{p.nick || <span className="hint">Not set</span>}</dd>
              <dt>Study level</dt><dd>{hasProfile ? levelLabel : <span className="hint">Not set</span>}</dd>
              <dt>Faculty</dt><dd>{p.faculty || <span className="hint">Not set</span>}</dd>
              <dt>Major</dt><dd>{p.major || <span className="hint">Not set</span>}</dd>
            </dl>
          )}
        </section>

        <section className="panel" aria-labelledby="privacy-title">
          <h2 id="privacy-title" className={styles.sectionTitle}>Privacy</h2>
          {editing && draft && can.privacy ? (
            <div className={styles.privacyGrid}>
              {PRIVACY_FIELDS.map(([field, label]) => (
                <div className="field" key={field}>
                  <label htmlFor={`privacy-${field}`}>{label}</label>
                  <select id={`privacy-${field}`} className="input" value={draft.privacy[field]} onChange={(e) => update({ privacy: { ...draft.privacy, [field]: e.target.value } })}>
                    {LEVEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          ) : (
            <dl className={styles.facts}>
              {PRIVACY_FIELDS.map(([field, label]) => <Fragment key={field}><dt>{label}</dt><dd>{privacyLabel(snapshot.privacy[field])}</dd></Fragment>)}
            </dl>
          )}
        </section>

        {banners && (
          <section className="panel" aria-labelledby="banners-title">
            <h2 id="banners-title" className={styles.sectionTitle}>Banners</h2>
            <p className="hint">Defaults are free for everyone. These are earned at an event that rewards them, or given here.</p>
            <ul className={styles.bannerList}>
              {banners.filter((b) => b.kind === "unlock").map((banner) => (
                <li key={banner.id}>
                  <BannerStrip colors={banner.colors} image={banner.image} still={banner.still} className={styles.bannerSwatch} />
                  <span className={styles.bannerText}>
                    <strong>{banner.name}</strong>
                    <span className="hint">
                      {banner.granted ? "Given by staff" : banner.owned ? `Earned at ${banner.eventNames.join(", ") || "an event"}` : "Locked"}
                      {banner.selected && " · in use"}
                    </span>
                  </span>
                  {editing && draft && can.banners && (banner.granted || !banner.owned) && (
                    <Check checked={banner.id in draft.banners} onChange={(v) => update({ banners: setIn(draft.banners, banner.id, v ? !banner.granted : banner.granted, banner.granted) })}>
                      {banner.granted ? "Take back" : "Give"}<span className="sr-only"> {banner.name}</span>
                    </Check>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={`panel ${styles.flush}`} aria-labelledby="mc-title">
          <h2 id="mc-title" className={`${styles.sectionTitle} ${styles.flushTitle}`}>Minecraft accounts</h2>
          {accounts.length === 0 ? <p className={`muted ${styles.flushTitle}`}>No Minecraft accounts added yet.</p> : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th scope="col">Name</th><th scope="col">UUID</th><th scope="col">Whitelist</th><th scope="col">Sync</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {accounts.map((account) => {
                    const badge = syncBadge({ desiredWhitelisted: account.desired, syncStatus: toSyncStatus(account.syncStatus) });
                    return (
                      <tr key={account.id}>
                        <td className="mono" data-dim={!account.desired || undefined}>{account.name}</td>
                        <td className="mono" title={account.uuid}>{account.uuid.slice(0, 8)}…{account.uuid.slice(-4)}</td>
                        <td>{account.desired ? <span className="tone-green">Active</span> : account.active ? "Removed by admin" : "Removed by player"}</td>
                        <td>{account.desired ? <span className={`badge badge-${badge.tone}`}><PixelIcon name={badge.icon} />{badge.label}</span> : <span className="hint">—</span>}</td>
                        <td className={styles.right}>
                          {editing && draft && can.whitelist && (
                            <Check checked={account.id in draft.whitelist} onChange={(v) => update({ whitelist: setIn(draft.whitelist, account.id, v ? !account.desired : account.desired, account.desired) })}>
                              {account.desired ? "Remove" : "Restore"}<span className="sr-only"> {account.name}</span>
                            </Check>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {editing && can.whitelist && <p className={`hint ${styles.flushTitle}`}>A player can have up to {MAX_MINECRAFT_ACCOUNTS} active accounts.</p>}
        </section>

        {log}
      </div>
    </div>
  </>;
}
