"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { PixelIcon } from "@/components/icons";
import { discordCommunityUrl } from "@/lib/site-links";
import {
  isValidMinecraftUsername,
  MAX_MINECRAFT_ACCOUNTS,
  normalizeMinecraftUsername,
  syncBadge,
  type RegistrationView,
} from "@/lib/registration";
import styles from "./registration-panel.module.css";

type Pending = { type: "remove"; account: RegistrationView } | { type: "replace"; account: RegistrationView; newName: string };

async function send(method: "POST" | "PATCH" | "DELETE", body: object): Promise<string | null> {
  try {
    const response = await fetch("/api/registration/minecraft", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.ok) return null;
    const result = await response.json().catch(() => ({})) as { error?: string };
    return result.error || "We couldn't save that change. Please try again.";
  } catch {
    return "Connection problem. Please try again in a moment.";
  }
}

function checkName(raw: string) {
  const name = normalizeMinecraftUsername(raw);
  return isValidMinecraftUsername(name) ? { name } : { error: "Use 3–16 letters, numbers, or underscores." };
}

export function RegistrationPanel({ initialRegistrations }: { initialRegistrations: RegistrationView[] }) {
  const [accounts, setAccounts] = useState(initialRegistrations);
  const [adding, setAdding] = useState(initialRegistrations.length === 0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [flash, setFlash] = useState("");
  const [actionError, setActionError] = useState("");

  const reload = useCallback(async () => {
    try {
      const response = await fetch("/api/registration/minecraft", { cache: "no-store" });
      if (!response.ok) return;
      const result = await response.json() as { registrations: RegistrationView[] };
      setAccounts(result.registrations);
    } catch {
      /* A later poll retries; do not create an unhandled rejection. */
    }
  }, []);

  useEffect(() => {
    if (!accounts.some((account) => account.desiredWhitelisted && account.syncStatus !== "synced")) return;
    const interval = window.setInterval(reload, 3500);
    return () => window.clearInterval(interval);
  }, [accounts, reload]);

  const full = accounts.length >= MAX_MINECRAFT_ACCOUNTS;

  async function add(name: string) {
    const error = await send("POST", { minecraftUsername: name });
    if (error) return error;
    setAdding(false);
    setFlash(`Added ${name}. It's pending until the server adds it to the whitelist.`);
    await reload();
    return null;
  }

  async function confirm() {
    if (!pending) return;
    setActionError("");
    const error = pending.type === "remove"
      ? await send("DELETE", { id: pending.account.id })
      : await send("PATCH", { id: pending.account.id, minecraftUsername: pending.newName });
    if (error) {
      setActionError(error);
    } else {
      setFlash(pending.type === "remove"
        ? `Removed ${pending.account.minecraftUsername}. It's no longer on the whitelist.`
        : `Replaced ${pending.account.minecraftUsername} with ${pending.newName}. It's pending until the server adds it to the whitelist.`);
      setEditingId(null);
    }
    setPending(null);
    await reload();
  }

  return (
    <section id="add-account" className={`panel ${styles.panel}`} aria-labelledby="mc-title">
      <div className={styles.head}>
        <div className="stack" style={{ "--gap": "6px" } as React.CSSProperties}>
          <h2 id="mc-title" className={styles.title}>Minecraft accounts</h2>
          <div className={styles.slots}>
            <div aria-hidden="true">
              {Array.from({ length: MAX_MINECRAFT_ACCOUNTS }, (_, i) => <span key={i} data-used={i < accounts.length || undefined} />)}
            </div>
            <span>{accounts.length} of {MAX_MINECRAFT_ACCOUNTS} used</span>
          </div>
        </div>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => { setAdding(true); setFlash(""); }}
          disabled={full || adding} aria-expanded={adding} aria-controls="add-form" aria-describedby={full ? "full-note" : undefined}>
          <PixelIcon name="plus" />Add account
        </button>
      </div>

      {full && (
        <p id="full-note" className={styles.note}><PixelIcon name="info" />All {MAX_MINECRAFT_ACCOUNTS} slots are in use. Remove an account to add a different one.</p>
      )}

      <div role="status" aria-live="polite">
        {flash && <p className={`alert alert-success ${styles.flash}`}><PixelIcon name="check" />{flash}</p>}
      </div>
      {actionError && <p className={`alert alert-error ${styles.flash}`} role="alert"><PixelIcon name="warning" />{actionError}</p>}

      {adding && !full && (
        <NameForm
          id="add-form"
          label="Minecraft Java username"
          submitLabel="Add account"
          onCancel={accounts.length ? () => setAdding(false) : undefined}
          onSubmit={add}
        />
      )}

      {accounts.length === 0 && !adding && (
        <div className={styles.empty}>
          <p className="section-title">No Minecraft accounts yet</p>
          <p className="muted">Add your Java username to get on the whitelist. You can add up to {MAX_MINECRAFT_ACCOUNTS}.</p>
        </div>
      )}

      <ul className={styles.list}>
        {accounts.map((account) => {
          const badge = syncBadge(account);
          return (
            <li key={account.id}>
              {editingId === account.id ? (
                <NameForm
                  id={`edit-${account.id}`}
                  label={<>Replace <span className="mono">{account.minecraftUsername}</span> with</>}
                  submitLabel="Replace"
                  onCancel={() => setEditingId(null)}
                  onSubmit={async (newName) => { setPending({ type: "replace", account, newName }); return null; }}
                />
              ) : (
                <div className={styles.row}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- third-party skin head; next/image would need a remote pattern for no gain */}
                  <img className={`pixel-4 ${styles.skin}`} src={`https://mc-heads.net/avatar/${encodeURIComponent(account.minecraftUsername)}/44`} alt="" width={44} height={44} loading="lazy" />
                  <div className={styles.info}>
                    <div className={styles.nameLine}>
                      <p className={`mono ${styles.name}`} data-revoked={!account.desiredWhitelisted || undefined}>{account.minecraftUsername}</p>
                      <span className={`badge badge-${badge.tone} pixel-4`}><PixelIcon name={badge.icon} />{badge.label}</span>
                    </div>
                    <p className={styles.noteText}>
                      {badge.note}
                      {!account.desiredWhitelisted && <> Think it&apos;s a mistake? <a href={discordCommunityUrl} target="_blank" rel="noreferrer">Ask on Discord</a>.</>}
                    </p>
                  </div>
                  <div className={styles.actions}>
                    <button type="button" className={styles.iconButton} onClick={() => { setEditingId(account.id); setFlash(""); }} aria-label={`Replace ${account.minecraftUsername} with a different account`} title="Replace">
                      <PixelIcon name="retry" />
                    </button>
                    <button type="button" className={styles.iconButton} data-danger onClick={() => { setPending({ type: "remove", account }); setFlash(""); }} aria-label={`Remove ${account.minecraftUsername}`} title="Remove">
                      <PixelIcon name="close" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className={styles.footer}><PixelIcon name="shield" />Only add Minecraft accounts that belong to you.</p>

      <ConfirmDialog pending={pending} onCancel={() => setPending(null)} onConfirm={confirm} />
    </section>
  );
}

function NameForm({ id, label, submitLabel, onCancel, onSubmit }: {
  id: string;
  label: React.ReactNode;
  submitLabel: string;
  onCancel?: () => void;
  onSubmit: (name: string) => Promise<string | null>;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const checked = checkName(value);
    if ("error" in checked) return setError(checked.error ?? "");
    setBusy(true);
    setError("");
    const failure = await onSubmit(checked.name);
    setBusy(false);
    if (failure) setError(failure);
  }

  return (
    <form id={id} className={`pixel-4 ${styles.form}`} onSubmit={submit} noValidate>
      <label className="label" htmlFor={`${id}-name`}>{label}</label>
      <p id={`${id}-help`} className="field-help">3–16 characters: letters, numbers, and underscores. Java Edition only.</p>
      <div className={styles.formRow}>
        <input
          id={`${id}-name`}
          className={`input mono ${styles.formInput}`}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          readOnly={busy}
          placeholder="Example_Player"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck="false"
          maxLength={16}
          autoFocus={Boolean(onCancel)}
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-help ${id}-err`}
        />
        <div className={styles.formButtons}>
          <button type="submit" className="btn btn-primary" disabled={busy} aria-busy={busy}>{busy ? "Checking with Mojang…" : submitLabel}</button>
          {onCancel && <button type="button" className="btn" onClick={onCancel} disabled={busy}>Cancel</button>}
        </div>
      </div>
      <div id={`${id}-err`}>{error && <p className="field-error" role="alert"><PixelIcon name="warning" size={14} />{error}</p>}</div>
    </form>
  );
}

function ConfirmDialog({ pending, onCancel, onConfirm }: { pending: Pending | null; onCancel: () => void; onConfirm: () => Promise<void> }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (pending && !dialog.open) dialog.showModal();
    if (!pending && dialog.open) dialog.close();
  }, [pending]);

  const name = pending?.account.minecraftUsername;
  return (
    <dialog ref={ref} className="dialog" aria-labelledby="mc-dialog-title" onClose={onCancel} onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      {pending && (
        <div className="dialog-body">
          <h2 id="mc-dialog-title" className="dialog-title">{pending.type === "remove" ? `Remove ${name}?` : `Replace ${name}?`}</h2>
          <p className="muted">
            {pending.type === "remove"
              ? `${name} will leave the whitelist and can't join the server anymore. You can add it again later if you have a free slot.`
              : `${name} will leave the whitelist and ${pending.newName} takes its slot. ${pending.newName} is pending until the server adds it.`}
          </p>
          <div className="dialog-actions">
            <button type="button" className="btn" onClick={onCancel} disabled={busy} autoFocus>Cancel</button>
            <button type="button" className={pending.type === "remove" ? "btn btn-danger" : "btn btn-primary"} disabled={busy} aria-busy={busy}
              onClick={async () => { setBusy(true); await onConfirm(); setBusy(false); }}>
              {pending.type === "remove" ? "Remove account" : "Replace account"}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
