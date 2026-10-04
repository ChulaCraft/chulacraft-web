import Link from "next/link";
import { PixelIcon } from "@/components/icons";
import { describeChange } from "@/lib/change-log";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import styles from "./admin.module.css";
import { StatRow, timeSince, ToolCards, when, type Stats } from "./overview";

type Activity = Database["public"]["Functions"]["admin_recent_activity"]["Returns"][number];

export default async function AdminPage() {
  const supabase = await createClient();
  const [stats, activity] = await Promise.all([
    supabase.rpc("admin_overview_stats").single<Stats>(),
    supabase.rpc("admin_recent_activity", { p_limit: 5 }),
  ]);
  const s = stats.data;
  const log: Activity[] = activity.data ?? [];

  return <>
    <div className={styles.titleRow}>
      <div className={styles.header}>
        <p className={styles.headerKicker}>Admin</p>
        <h1 className={styles.title}>Dashboard</h1>
        <p className="muted">Snapshot from when this page loaded. Reload for fresh numbers.</p>
      </div>
      <Link href="/admin/players" className="btn btn-primary"><PixelIcon name="user" />Players</Link>
    </div>

    {stats.error || !s ? (
      <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">Couldn&apos;t load the numbers. Please reload.</p></div>
    ) : <>
      {(s.retrying_sync > 0 || s.unverified > 0) && (
        <section aria-labelledby="att-title" className="stack gap-10">
          <h2 id="att-title" className="section-title">Needs attention</h2>
          <ul className={styles.attention}>
            {s.retrying_sync > 0 && (
              <li>
                <Link href="/admin/players" data-tone="amber">
                  <PixelIcon name="retry" size={20} />
                  <span>
                    <strong>{s.retrying_sync} {s.retrying_sync === 1 ? "account" : "accounts"} retrying sync</strong><br />
                    <span className={styles.small}>{s.oldest_failing_since && `Oldest waiting ${timeSince(s.oldest_failing_since)}. `}The server retries on its own.</span>
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            )}
            {s.unverified > 0 && (
              <li>
                <Link href="/admin/players">
                  <PixelIcon name="info" size={20} />
                  <span>
                    <strong>{s.unverified} {s.unverified === 1 ? "player hasn't" : "players haven't"} verified</strong><br />
                    <span className={styles.small}>Signed in with Discord but no Chula account yet.</span>
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            )}
          </ul>
        </section>
      )}

      <StatRow label="Overview" stats={[
        { label: "Players", value: s.players },
        { label: "Verified Chula", value: s.verified },
        { label: "Guests", value: s.guests },
        { label: "Whitelisted accounts", value: s.whitelisted_accounts },
        { label: "Pending sync", value: s.pending_sync },
      ]} />
    </>}

    <ToolCards title="Categories" tools={[
      { title: "Players", desc: "Manage players, verify guests, change roles, restore removed accounts.", icon: "user", href: "/admin/players", cta: "Open players", count: s ? String(s.players) : undefined },
      { title: "Minecraft server", desc: "Server status, whitelist sync, and the sync queue.", icon: "retry" },
      { title: "Community", desc: "Announcements and events on the site and Discord.", icon: "info" },
      { title: "Audit log", desc: "Every admin action across all players.", icon: "lock" },
    ]} />

    <section aria-labelledby="act-title" className="panel">
      <div className={styles.listHead}>
        <h2 id="act-title">Recent admin activity</h2>
        <span className="hint">Last 5 actions</span>
      </div>
      {activity.error ? <p className="muted">Couldn&apos;t load recent activity.</p>
        : log.length === 0 ? <p className="muted">No admin actions yet.</p>
        : (
          <ol className={styles.log}>
            {log.map((entry, i) => (
              <li key={i}>
                <time dateTime={entry.created_at}>{when(entry.created_at)}</time>
                <span>
                  <strong>{entry.actor_name ?? "A removed admin"}</strong>{" "}
                  <span className="muted">{describeChange(entry.field, entry.old_value, entry.new_value)} for</span>{" "}
                  <Link href={`/admin/users/${entry.target_user_id}`}>{entry.target_name ?? "a player"}</Link>
                </span>
              </li>
            ))}
          </ol>
        )}
    </section>
  </>;
}
