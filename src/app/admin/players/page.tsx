import Link from "next/link";
import { PixelIcon } from "@/components/icons";
import { VerificationBadge, type VerificationKind } from "@/components/verification-badge";
import { createClient } from "@/lib/supabase/server";
import styles from "../admin.module.css";
import { StatRow, ToolCards, type Stats } from "../overview";

type UserRow = {
  user_id: string;
  role: string;
  email: string | null;
  discord_username: string | null;
  chula_email: string | null;
  minecraft_usernames: string | null;
  verification_kind: VerificationKind;
};

type Newest = { user_id: string; display_name: string | null; handle: string | null; verification_kind: VerificationKind; created_at: string };

export default async function AdminPlayersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q?.trim() ?? "";
  const supabase = await createClient();
  let users: UserRow[] = [];
  let failed = false;
  let stats: Stats | null = null;
  let newest: Newest[] = [];
  if (q) {
    const { data, error } = await supabase.rpc("admin_search_users", { p_query: q });
    users = (data ?? []) as UserRow[];
    failed = Boolean(error);
  } else {
    const [s, n] = await Promise.all([
      supabase.rpc("admin_overview_stats").single<Stats>(),
      supabase.rpc("admin_newest_players", { p_limit: 5 }),
    ]);
    stats = s.data;
    newest = (n.data ?? []) as Newest[];
    failed = Boolean(s.error || n.error);
  }

  return <>
    <div className={styles.titleRow}>
      <h1 className={styles.title}>Players</h1>
      <Link href="/admin/restore" className="link-button">Removed accounts →</Link>
    </div>

    <form className={`panel pixel-4 ${styles.search}`} role="search">
      <label htmlFor="admin-q" className="label">Search players</label>
      <div className={styles.searchRow}>
        <div className={styles.searchInput}>
          <PixelIcon name="search" />
          <input id="admin-q" className="input" name="q" defaultValue={q} placeholder="Discord, Chula email, or Minecraft name" aria-describedby="q-help" />
        </div>
        <button className="btn btn-primary" type="submit">Search</button>
      </div>
      <p id="q-help" className="field-help">Includes removed Minecraft accounts.</p>
    </form>

    <div aria-live="polite" className="hint">
      {q && !failed && `${users.length === 50 ? "First 50" : users.length} ${users.length === 1 ? "player" : "players"} found for “${q}”`}
    </div>

    {failed ? (
      <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">Couldn&apos;t load players. Please try again.</p></div>
    ) : !q ? <>
      {stats && <StatRow label="Player overview" stats={[
        { label: "All players", value: stats.players, rail: "var(--pink)" },
        { label: "Verified Chula", value: stats.verified, rail: "var(--green)" },
        { label: "Guests", value: stats.guests, rail: "var(--lavender)" },
        { label: "Unverified", value: stats.unverified, rail: "var(--edge)" },
      ]} />}

      <ToolCards title="Player tools" tools={[
        { title: "Removed accounts", desc: "Minecraft accounts taken off the whitelist. Put them back.", icon: "revoked", href: "/admin/restore", count: stats ? String(stats.removed_accounts) : undefined },
        { title: "Unverified players", desc: "Players who signed in but never verified Chula.", icon: "info" },
        { title: "Guest list", desc: "Every non-Chula player an admin let in.", icon: "shield" },
      ]} />

      <section aria-labelledby="new-title" className="panel">
        <div className={styles.listHead}>
          <h2 id="new-title">Newest players</h2>
        </div>
        {newest.length === 0 ? <p className="muted">No players yet.</p> : (
          <ul className={styles.newest}>
            {newest.map((n) => (
              <li key={n.user_id}>
                <Link href={`/admin/users/${n.user_id}`}>
                  <strong>{n.display_name ?? n.handle ?? "Player"}{n.handle && n.handle !== n.display_name && <span className="hint"> @{n.handle}</span>}</strong>
                  <VerificationBadge kind={n.verification_kind} />
                  <time dateTime={n.created_at}>{new Date(n.created_at).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium" })}</time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </> : users.length === 0 ? (
      <div className={styles.empty}>
        <p className="section-title">No players found</p>
        <p className="muted">Check the spelling, or try part of their email or Minecraft name.</p>
      </div>
    ) : (
      <ul className={styles.results} aria-label="Search results">
        {users.map((user) => {
          const name = user.discord_username ?? user.email ?? user.user_id;
          return (
            <li key={user.user_id}>
              <Link href={`/admin/users/${user.user_id}`}>
                <span className="avatar" aria-hidden="true" style={{ width: 40, height: 40 }}>{name.charAt(0).toUpperCase()}</span>
                <span className={styles.resultMain}>
                  <strong>{name}{user.role !== "user" && <span className="optional"> · {user.role}</span>}</strong>
                  <span className={`mono ${styles.small}`}>{user.chula_email ?? user.email ?? "No email"}</span>
                </span>
                <span className={`mono ${styles.resultMc}`}>{user.minecraft_usernames ?? "—"}</span>
                <VerificationBadge kind={user.verification_kind} />
                <PixelIcon name="arrow" />
              </Link>
            </li>
          );
        })}
      </ul>
    )}
  </>;
}

