import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import styles from "./admin.module.css";

type UserRow = {
  user_id: string;
  role: string;
  email: string | null;
  discord_username: string | null;
  chula_username: string | null;
  minecraft_usernames: string | null;
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q?.trim() ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_search_users", { p_query: q });
  const users = (data ?? []) as UserRow[];

  return (
    <section className={styles.panel} aria-labelledby="admin-title">
      <h1 id="admin-title">Players</h1>
      <form className={styles.search} role="search">
        <label htmlFor="admin-q" className="sr-only">Search players</label>
        <input id="admin-q" name="q" defaultValue={q} placeholder="Discord, Chula, email, or Minecraft name" />
        <button className="button button-header-signup" type="submit">Search</button>
      </form>
      {error ? (
        <p className={styles.error} role="alert">Could not load players. Please refresh.</p>
      ) : users.length === 0 ? (
        <p className={styles.muted}>No players found.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Discord</th><th>Chula</th><th>Minecraft</th><th>Role</th></tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id}>
                  <td><Link href={`/admin/users/${user.user_id}`}>{user.discord_username ?? user.email ?? user.user_id}</Link></td>
                  <td>{user.chula_username ?? <span className={styles.muted}>—</span>}</td>
                  <td>{user.minecraft_usernames ?? <span className={styles.muted}>—</span>}</td>
                  <td>{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {users.length === 50 && <p className={styles.muted}>Showing the first 50 matches. Refine your search to narrow it down.</p>}
    </section>
  );
}
