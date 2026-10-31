import type { Metadata } from "next";
import Link from "next/link";
import { PixelIcon } from "@/components/icons";
import { describeChange } from "@/lib/change-log";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import styles from "./admin.module.css";
import { StatRow, timeSince, ToolCards, when, type Stats } from "./overview";
import { playersHref } from "./players/params";
import { staffCan } from "@/lib/staff";
import { myRole } from "./staff-gate";
import { timed } from "@/lib/perf";

// The admin layout's title template only reaches child segments, not this page.
export const metadata: Metadata = { title: "Admin dashboard" };

type Activity = Database["public"]["Functions"]["admin_recent_activity"]["Returns"][number];

export default async function AdminPage() {
  const supabase = await createClient();
  const role = await timed("myRole", myRole());
  const isAdmin = staffCan(role, "admin");
  const [stats, activity] = await Promise.all([
    timed("admin_overview_stats", supabase.rpc("admin_overview_stats").single<Stats>()),
    isAdmin ? timed("admin_recent_activity", supabase.rpc("admin_recent_activity", { p_limit: 5 })) : Promise.resolve({ data: [], error: null }),
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
                <Link href={playersHref({ whitelist: ["retrying"] })} data-tone="amber">
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
                <Link href={playersHref({ role: ["user"], status: ["unverified"] })}>
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
        { label: "Players", value: s.players, href: playersHref({ role: ["user"] }) },
        { label: "Verified Chula", value: s.verified, href: playersHref({ role: ["user"], status: ["verified"] }) },
        { label: "Guests", value: s.guests, href: playersHref({ role: ["user"], status: ["guest"] }) },
        { label: "Whitelisted accounts", value: s.whitelisted_accounts, href: playersHref({ whitelist: ["whitelisted", "pending", "retrying"] }) },
        { label: "Pending sync", value: s.pending_sync, href: playersHref({ whitelist: ["pending"] }) },
      ]} />
    </>}

    <ToolCards title="Categories" tools={([
      { area: "players_read", title: "Players", desc: "Manage players, verify guests, change roles, restore removed accounts.", icon: "user", href: playersHref({ role: ["user"] }), cta: "Open players", count: s ? String(s.players) : undefined },
      { area: "moderation", title: "Moderation", desc: "Player reports, ban appeals and bans.", icon: "shield", href: "/admin/reports", cta: "Open reports" },
      { area: "community", title: "Community", desc: "Achievements, events, and announcements on the site and Discord.", icon: "info", href: "/admin/commu", cta: "Open community" },
      { area: "admin", title: "Ops", desc: "Every service's status, logs and console, start, stop or restart, backups and updates.", icon: "retry", href: "/admin/ops", cta: "Open ops" },
      { area: "admin", title: "Audit log", desc: "Every admin action across all players.", icon: "lock", href: "/admin/audit", cta: "Open audit log" },
    ] as const).filter((t) => staffCan(role, t.area))} />

    {isAdmin && <>
    <section aria-labelledby="act-title" className="panel">
      <div className={styles.listHead}>
        <h2 id="act-title">Recent admin activity</h2>
        <Link href="/admin/audit" className="hint">Last 5 actions · see all</Link>
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
    </>}
  </>;
}
