import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmAction } from "@/components/confirm-action";
import { PixelIcon } from "@/components/icons";
import { type BotOverview, jobState, worstJobState } from "@/lib/bot-admin";
import { PERMISSION, maskFor } from "@/lib/mcsv-token";
import { managerFetch, opsGrant, parseBackups, parseServices, parseStatus, parseUptime, type Service, type ServiceStatus, type UptimePoint } from "@/lib/ops";
import { opsHealth } from "@/lib/ops-health";
import { createClient } from "@/lib/supabase/server";
import adminStyles from "../admin.module.css";
import { myRole } from "../staff-gate";
import { opsAction } from "./actions";
import { BackupChip, JobChip, Outcome, StatusChip, UptimeBar, bytes, sinceLine, stamp } from "./ops-ui";
import styles from "./ops.module.css";
import { timed } from "@/lib/perf";

export const metadata: Metadata = { title: "Ops" };

const TARGETS = [
  { id: "world", label: "Minecraft world" },
  { id: "supabase", label: "Database" }
] as const;
const targetLabel = (id: string) => TARGETS.find((t) => t.id === id)?.label ?? id;

/** /services with one STATUS token, then each service's status and 7-day
 *  uptime in parallel. One service failing only fails its own row; the manager
 *  failing (or taking over 5 s) gives null and an error panel. */
async function loadServices() {
  try {
    // Inside the try: a missing signing key must show the panel, not crash the page.
    const token = await timed("opsGrant", opsGrant("status", PERMISSION.STATUS, ""));
    if (!token) return null;
    const services = parseServices(await (await timed("managerFetch " + "/services", managerFetch("/services", token))).json());
    return await Promise.all(services.map(async (service) => {
      const [status, uptime] = await Promise.allSettled([
        timed("managerFetch status", managerFetch(`/service/${service.id}/status`, token)).then((r) => r.json()).then(parseStatus),
        timed("managerFetch uptime", managerFetch(`/service/${service.id}/uptime?days=7`, token)).then((r) => r.json()).then(parseUptime)
      ]);
      return {
        service,
        status: status.status === "fulfilled" ? status.value : null,
        uptime: uptime.status === "fulfilled" ? uptime.value : null
      };
    }));
  } catch {
    return null;
  }
}

async function loadBackups() {
  try {
    const token = await timed("opsGrant", opsGrant("backup_list", PERMISSION.BACKUP_READ, ""));
    if (!token) return null;
    return parseBackups(await (await timed("managerFetch " + "/backups", managerFetch("/backups", token))).json());
  } catch {
    return null;
  }
}

/** The Discord bot's settings and tasks, straight from the database (the bot's
 *  container is a manager row of its own). Null when the read fails. */
async function loadBot() {
  const supabase = await createClient();
  const { data, error } = await timed("admin_bot_overview", supabase.rpc("admin_bot_overview"));
  if (error || !data) return null;
  const { jobs, settings } = data as unknown as BotOverview;
  const now = Date.now();
  return {
    worst: worstJobState(jobs, now),
    tasks: jobs.filter((j) => !j.retired_at).length,
    overdue: jobs.filter((j) => jobState(j, now) === "overdue").length,
    invalid: settings.filter((s) => !s.retired_at && s.bot_status === "invalid").length
  };
}

export default async function OpsPage({ searchParams }: { searchParams: Promise<{ error?: string; done?: string }> }) {
  const { error, done } = await searchParams;
  const mask = maskFor(await timed("myRole", myRole()));
  const can = (bit: number) => (mask & bit) === bit;
  const [rows, backups, health, bot] = await Promise.all([loadServices(), can(PERMISSION.BACKUP_READ) ? loadBackups() : null, timed("opsHealth", opsHealth()), loadBot()]);
  return <div className={styles.page}>
    <div>
      <h1 className={adminStyles.title}>Ops</h1>
      <p className="muted">Every service the server manager runs, plus this website. Status is from when the page loaded.</p>
    </div>
    <Outcome error={error} done={done} />

    <section aria-labelledby="ops-services">
      <h2 id="ops-services" className={adminStyles.sectionTitle}>Services</h2>
      {!rows && (
        <div className="alert alert-error" role="alert"><PixelIcon name="warning" />
          <p className="alert-body">Couldn&apos;t reach the server manager, so only the website is listed. Reload to try again.</p>
        </div>
      )}
      {rows?.length === 0 && <p className={styles.small}>The server manager lists no services.</p>}
      <ul className={styles.list} aria-label="Services">
        {rows?.map(({ service, status, uptime }) => <ServiceRow key={service.id} service={service} status={status} uptime={uptime} />)}
        <li className={styles.row} data-service="bot">
          <div className={styles.rowHead}>
            <Link href="/admin/ops/bot" className={styles.rowName}>Discord bot: settings &amp; tasks</Link>
            <span className="badge badge-muted">database</span>
            {!bot ? <StatusChip state="error" /> : bot.worst ? <JobChip state={bot.worst} /> : <StatusChip state="unknown" />}
          </div>
          <p className={styles.small}>
            {!bot ? "Couldn't load the bot's tasks."
              : bot.tasks === 0 ? "The bot hasn't registered any tasks yet."
              : `${bot.tasks} task${bot.tasks === 1 ? "" : "s"}${bot.overdue ? ` · ${bot.overdue} overdue` : ""}${bot.invalid ? ` · ${bot.invalid} setting${bot.invalid === 1 ? "" : "s"} the bot rejected` : ""}`}
          </p>
        </li>
        <li className={styles.row} data-service="website">
          <div className={styles.rowHead}>
            <Link href="/admin/ops/website" className={styles.rowName}>Website</Link>
            <span className="badge badge-muted">vercel</span>
            <StatusChip state={health.ok ? "up" : "down"} />
          </div>
          <p className={styles.small}>
            Database {health.db === "ok" ? "reachable" : "unreachable"} · {health.errors_5m} error{health.errors_5m === 1 ? "" : "s"} in the last 5 min · version <span className="mono">{health.version}</span>
          </p>
          <p className={styles.small}>Uptime history and alerts come from the Discord bot&apos;s status monitor.</p>
        </li>
      </ul>
    </section>

    {can(PERMISSION.BACKUP_READ) && (
      <section aria-label="Backups">
        <h2 className={adminStyles.sectionTitle}>Backups</h2>
        <p className={styles.small}>Nightly and manual backups the server manager keeps. Restoring is a manual step in OPERATOR_RUNBOOK.md (&quot;Ops console, backups and restore&quot;), never a button.</p>
        {can(PERMISSION.BACKUP_RUN) && (
          <div className={adminStyles.actions}>
            {TARGETS.map((t) => (
              <ConfirmAction key={t.id} action={opsAction} fields={{ action: "backup", target: t.id }}
                trigger={<><PixelIcon name="plus" />Back up now: {t.label}</>} triggerClassName="btn btn-sm"
                title={`Back up the ${t.label.toLowerCase()}?`} body="The backup runs on the server in the background. Players stay connected."
                confirmLabel="Start backup" />
            ))}
          </div>
        )}
        {!backups ? (
          <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">Couldn&apos;t load the backup list. Reload to try again.</p></div>
        ) : backups.length === 0 ? (
          <p className={styles.small}>No backups yet.</p>
        ) : (
          <div className={`${adminStyles.tableWrap} ${styles.tableGap}`}>
            <table className={adminStyles.table}>
              <caption className="sr-only">Backups, newest first</caption>
              <thead><tr><th scope="col">Backup</th><th scope="col">Started</th><th scope="col">Status</th></tr></thead>
              <tbody>
                {backups.slice(0, 20).map((b) => (
                  <tr key={b.id}>
                    <td>
                      {targetLabel(b.target)}
                      <span className={styles.cellNote}>{b.kind === "nightly" ? "Nightly" : "Manual"}{b.status === "ok" ? ` · ${bytes(b.size_bytes)}` : ""}</span>
                    </td>
                    <td>{stamp(b.created_at)}</td>
                    <td><BackupChip status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    )}
  </div>;
}

function ServiceRow({ service, status, uptime }: { service: Service; status: ServiceStatus | null; uptime: UptimePoint[] | null }) {
  return <li className={styles.row} data-service={service.id}>
    <div className={styles.rowHead}>
      <Link href={`/admin/ops/${encodeURIComponent(service.id)}`} className={styles.rowName}>{service.name}</Link>
      <span className="badge badge-muted">{service.kind}</span>
      <StatusChip state={status ? status.state : "error"} />
    </div>
    {status && <p className={styles.small}>{sinceLine(status)}</p>}
    {uptime ? <UptimeBar points={uptime} /> : <p className={styles.small}>Couldn&apos;t load uptime.</p>}
  </li>;
}
