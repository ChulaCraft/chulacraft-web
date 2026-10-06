import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmAction } from "@/components/confirm-action";
import { PixelIcon } from "@/components/icons";
import { MAX_MINECRAFT_ACCOUNTS } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import styles from "../admin.module.css";
import { restoreAccount } from "./actions";

export const metadata: Metadata = { title: "Removed accounts" };

type RemovedRow = Database["public"]["Functions"]["admin_removed_accounts"]["Returns"][number];

const ERRORS: Record<string, string> = {
  FORBIDDEN: "You don't have permission to restore this player's account.",
  LIMIT_REACHED: `That player already has ${MAX_MINECRAFT_ACCOUNTS} active Minecraft accounts.`,
  NOT_FOUND: "That account no longer exists. Refresh and try again.",
};

export default async function RestorePage({ searchParams }: { searchParams: Promise<{ error?: string; restored?: string }> }) {
  const { error: code, restored } = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_removed_accounts");
  const rows: RemovedRow[] = data ?? [];

  return <>
    <Link href="/admin/players" className="back-link"><PixelIcon name="back" />Players</Link>
    <div className="stack gap-6">
      <h1 className={styles.title}>Removed accounts</h1>
      <p className="muted">Minecraft accounts removed by a player or an admin. Restoring puts the account back on the player&apos;s profile and the whitelist.</p>
    </div>

    <div aria-live="polite">
      {code && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{ERRORS[code] ?? "Couldn't restore that account. Please try again."}</p></div>}
      {restored && <p className="alert alert-success" role="status"><PixelIcon name="check" />Account restored.</p>}
    </div>

    {error ? (
      <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">Couldn&apos;t load removed accounts. Please refresh.</p></div>
    ) : rows.length === 0 ? (
      <div className={styles.empty}>
        <p className="section-title">Nothing to restore</p>
        <p className="muted">When a player or an admin removes a Minecraft account, it shows up here.</p>
      </div>
    ) : (
      <ul className={styles.results} aria-label="Removed accounts">
        {rows.map((row) => (
          <li key={row.id} className={styles.removedRow}>
            {/* eslint-disable-next-line @next/next/no-img-element -- third-party skin head */}
            <img className="pixel-4" src={`https://mc-heads.net/avatar/${encodeURIComponent(row.minecraft_username)}/40`} alt="" width={40} height={40} loading="lazy" />
            <span className={styles.resultMain}>
              <strong className="mono">{row.minecraft_username}</strong>
              <span className={styles.small}>
                <Link href={`/admin/users/${row.user_id}`}>{row.discord_username ?? row.user_id}</Link>
                {" · removed by "}{row.removed_by === "admin" ? "an admin" : row.removed_by === "self" ? "the player" : "unknown"}
                {" · "}<time dateTime={row.removed_at}>{new Date(row.removed_at).toLocaleString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium", timeStyle: "short" })}</time>
              </span>
            </span>
            <ConfirmAction
              action={restoreAccount}
              fields={{ registrationId: row.id }}
              trigger="Restore"
              triggerLabel={`Restore ${row.minecraft_username}`}
              triggerClassName="btn btn-sm btn-outline"
              title={`Restore ${row.minecraft_username}?`}
              body={`${row.minecraft_username} goes back on ${row.discord_username ?? "the player"}'s profile and the whitelist.`}
              confirmLabel="Restore account"
            />
          </li>
        ))}
      </ul>
    )}
    {rows.length === 200 && <p className="hint">Showing the 200 most recent removals.</p>}
  </>;
}
