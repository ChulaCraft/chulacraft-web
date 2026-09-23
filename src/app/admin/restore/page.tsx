import Link from "next/link";
import { MAX_MINECRAFT_ACCOUNTS } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import styles from "../admin.module.css";
import { restoreAccount } from "./actions";

type RemovedRow = {
  id: string;
  user_id: string;
  minecraft_username: string;
  discord_username: string | null;
  is_active: boolean;
  removed_by: string | null;
  removed_at: string;
};

const ERRORS: Record<string, string> = {
  FORBIDDEN: "You don't have permission to restore this player's account.",
  LIMIT_REACHED: `That player already has ${MAX_MINECRAFT_ACCOUNTS} active Minecraft accounts.`,
  NOT_FOUND: "That account no longer exists. Refresh and try again.",
};

export default async function RestorePage({ searchParams }: { searchParams: Promise<{ error?: string; restored?: string }> }) {
  const { error: code, restored } = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_removed_accounts");
  const rows = (data ?? []) as RemovedRow[];

  return (
    <section className={styles.panel} aria-labelledby="restore-title">
      <h1 id="restore-title">Restore accounts</h1>
      <p className={styles.muted}>Minecraft accounts removed by a player or an admin. Restoring puts the account back on the player’s profile and the whitelist.</p>
      {code && <p className={styles.error} role="alert">{ERRORS[code] ?? "Could not restore that account. Please try again."}</p>}
      {restored && <p className={styles.muted} role="status">Account restored.</p>}
      {error ? (
        <p className={styles.error} role="alert">Could not load removed accounts. Please refresh.</p>
      ) : rows.length === 0 ? (
        <p className={styles.muted}>No removed accounts.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Minecraft</th><th>Player</th><th>Removed by</th><th>When</th><th /></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.minecraft_username}</td>
                  <td><Link href={`/admin/users/${row.user_id}`}>{row.discord_username ?? row.user_id}</Link></td>
                  <td>{row.removed_by === "admin" ? "Admin" : row.removed_by === "self" ? "Player" : "Unknown"}{row.is_active ? "" : " · hidden"}</td>
                  <td className={styles.muted}>{new Date(row.removed_at).toLocaleString("en-GB", { timeZone: "Asia/Bangkok" })}</td>
                  <td>
                    <form action={restoreAccount}>
                      <input type="hidden" name="registrationId" value={row.id} />
                      <button className="button button-header-signup" type="submit">Restore</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length === 200 && <p className={styles.muted}>Showing the 200 most recent removals.</p>}
    </section>
  );
}
