"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowIcon, ShieldIcon } from "@/components/icons";
import {
  isValidMinecraftUsername,
  MAX_MINECRAFT_ACCOUNTS,
  normalizeMinecraftUsername,
  statusMessage,
  type RegistrationView,
} from "@/lib/registration";
import styles from "@/app/register/register.module.css";

type Props = {
  initialRegistrations: RegistrationView[];
  lookupFailed?: boolean;
  /** Adding (or switching to) a new Minecraft account requires a linked Chula SSO account. */
  canAdd: boolean;
};

type Editing = { id: string | null } | null;

export function RegistrationPanel({ initialRegistrations, lookupFailed = false, canAdd }: Props) {
  const [accounts, setAccounts] = useState(initialRegistrations);
  const [editing, setEditing] = useState<Editing>(initialRegistrations.length === 0 && canAdd ? { id: null } : null);
  const [removeError, setRemoveError] = useState("");

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
    if (!accounts.some((account) => account.syncStatus !== "synced")) return;
    const interval = window.setInterval(reload, 3500);
    return () => window.clearInterval(interval);
  }, [accounts, reload]);

  if (lookupFailed) {
    return (
      <section className={`${styles.card} ${styles.alertCard}`} role="status">
        <span className={styles.statusEmblem} aria-hidden="true"><i>!</i></span>
        <p className={styles.cardLabel}>Temporarily unavailable</p>
        <h2>We couldn’t load your registration</h2>
        <p className={styles.introCopy}>Please refresh in a moment. Your saved registration has not been changed.</p>
      </section>
    );
  }

  const full = accounts.length >= MAX_MINECRAFT_ACCOUNTS;

  async function remove(account: RegistrationView) {
    if (!window.confirm(`Remove ${account.minecraftUsername} from your list? It will also be removed from the whitelist.`)) return;
    setRemoveError("");
    try {
      const response = await fetch("/api/registration/minecraft", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: account.id }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { error?: string };
        setRemoveError(result.error || "We couldn’t remove that account. Please try again.");
      }
    } catch {
      setRemoveError("Connection problem. Please try again in a moment.");
    }
    await reload();
  }

  return (
    <section className={styles.card} aria-live="polite">
      <p className={styles.cardLabel}>Your Minecraft accounts · {accounts.length}/{MAX_MINECRAFT_ACCOUNTS}</p>
      <h2>Minecraft accounts</h2>
      {!canAdd && <p className={styles.statusNote}>Link your Chula SSO account above to add Minecraft accounts.</p>}

      <ul className={styles.accountList}>
        {accounts.map((account) => editing?.id === account.id ? (
          <li key={account.id}>
            <AccountForm
              id={account.id}
              initial={account.minecraftUsername}
              onCancel={() => setEditing(null)}
              onSaved={async () => { setEditing(null); await reload(); }}
            />
          </li>
        ) : (
          <li key={account.id} className={styles.accountRow}>
            <div>
              <strong>{account.minecraftUsername}</strong>
              <small>{statusMessage(account)}</small>
            </div>
            <div className={styles.rowActions}>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => setEditing({ id: account.id })}
                aria-label={`Change ${account.minecraftUsername}`}
              >✎</button>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => remove(account)}
                aria-label={`Remove ${account.minecraftUsername}`}
              >✕</button>
            </div>
          </li>
        ))}
      </ul>
      {removeError && <p className={styles.fieldError} role="alert">{removeError}</p>}

      {editing?.id === null ? (
        <AccountForm
          id={null}
          initial=""
          onCancel={accounts.length ? () => setEditing(null) : undefined}
          onSaved={async () => { setEditing(null); await reload(); }}
        />
      ) : canAdd && !full && (
        <button type="button" className={styles.iconButton} onClick={() => setEditing({ id: null })} aria-label="Add a Minecraft account">+</button>
      )}
      {full && <p className={styles.fieldHelp}>You’ve reached the limit of {MAX_MINECRAFT_ACCOUNTS} accounts. Change one with the pen button.</p>}

      <div className={styles.cardFooter}><ShieldIcon /> Only register Minecraft accounts that belong to you.</div>
    </section>
  );
}

function AccountForm({ id, initial, onCancel, onSaved }: {
  id: string | null;
  initial: string;
  onCancel?: () => void;
  onSaved: () => Promise<void>;
}) {
  const [username, setUsername] = useState(initial);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputId = `minecraft-username-${id ?? "new"}`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleaned = normalizeMinecraftUsername(username);
    if (!isValidMinecraftUsername(cleaned)) {
      setError("Enter 3–16 letters, numbers, or underscores.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/registration/minecraft", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id, minecraftUsername: cleaned } : { minecraftUsername: cleaned }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setError(result.error || "We couldn’t save that registration. Please try again.");
        return;
      }
      await onSaved();
    } catch {
      setError("Connection problem. Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor={inputId}>{id ? "Change Minecraft username" : "New Minecraft username"}</label>
      <div className={styles.inputWrap}>
        <span aria-hidden="true">✦</span>
        <input
          id={inputId}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Example_Player"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck="false"
          maxLength={16}
          required
          autoFocus={Boolean(onCancel)}
          aria-invalid={Boolean(error)}
          aria-describedby={`${inputId}-help ${inputId}-error`}
        />
      </div>
      <p id={`${inputId}-help`} className={styles.fieldHelp}>3–16 letters, numbers, or underscores. Java Edition only.</p>
      {error && <p id={`${inputId}-error`} className={styles.fieldError} role="alert">{error}</p>}
      <div className={styles.rowActions}>
        <button className={styles.submitButton} type="submit" disabled={submitting} aria-busy={submitting}>
          {submitting ? (
            <><span className={styles.loadingBloom} aria-hidden="true" /> Checking account…</>
          ) : (
            <>Save <ArrowIcon /></>
          )}
        </button>
        {onCancel && <button className={styles.cancelButton} type="button" onClick={onCancel} disabled={submitting}>Cancel</button>}
      </div>
    </form>
  );
}
