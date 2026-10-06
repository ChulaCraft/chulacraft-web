import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmAction } from "@/components/confirm-action";
import { PixelIcon } from "@/components/icons";
import { PERMISSION, maskFor } from "@/lib/mcsv-token";
import { createClient } from "@/lib/supabase/server";
import styles from "../admin.module.css";
import { serverAction } from "./actions";
import { SERVER_ID, grant, managerFetch } from "./manager";
import { ServerConsole } from "./server-console";
import { SubmitButton } from "@/components/submit-button";

export const metadata: Metadata = { title: "Server" };

const ERRORS: Record<string, string> = {
  FORBIDDEN: "You don't have permission to do that.",
  MANAGER: "The server manager didn't accept that. Check the console and try again."
};
const DONE: Record<string, string> = { start: "Start sent.", stop: "Stop sent.", restart: "Restart sent." };

type Status = {
  unit: { active_state: string; sub_state: string };
  stat?: { cpu_usage?: number; memory?: number; run_time?: number };
};

const TONE: Record<string, string> = { active: "green", activating: "amber", deactivating: "amber", failed: "danger" };

function uptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  return h >= 1 ? `${h} h ${Math.floor((seconds % 3600) / 60)} min` : `${Math.floor(seconds / 60)} min`;
}

/** Everything the page shows comes from one STATUS|LOGS token; null when the manager can't be reached. */
async function load(picked: string | undefined) {
  try {
    // Inside the try: a missing signing key must show the alert below, not crash the page.
    const token = await grant("status", PERMISSION.STATUS | PERMISSION.LOGS, picked ?? "");
    if (!token) return null;
    const servers = ((await (await managerFetch("/servers", token)).json()) as unknown[]).map(String).filter((s) => SERVER_ID.test(s));
    const server = picked && servers.includes(picked) ? picked : servers[0];
    if (!server) return { servers, server: null, status: null, lines: [] };
    const [status, log] = await Promise.all([
      managerFetch(`/server/${server}/status`, token).then((r) => r.json() as Promise<Status>),
      // rlog is newest first, timestamps in microseconds.
      managerFetch(`/server/${server}/rlog?until=${Date.now() * 1000}&max_lines=200`, token).then((r) => r.json() as Promise<{ message: string }[]>)
    ]);
    return { servers, server, status, lines: log.map((l) => String(l.message)).reverse() };
  } catch {
    return null;
  }
}

export default async function AdminServerPage({ searchParams }: { searchParams: Promise<{ server?: string; error?: string; done?: string }> }) {
  const { server: picked, error: errorCode, done } = await searchParams;
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("current_app_role");
  const mask = maskFor(role);
  const can = (bit: number) => (mask & bit) === bit;
  const data = await load(picked && SERVER_ID.test(picked) ? picked : undefined);

  return <>
    <h1 className={styles.title}>Server</h1>

    <div aria-live="polite">
      {errorCode && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{ERRORS[errorCode] ?? ERRORS.MANAGER}</p></div>}
      {done && DONE[done] && <p className="alert alert-success" role="status"><PixelIcon name="check" />{DONE[done]}</p>}
    </div>

    {!data ? (
      <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">Couldn&apos;t reach the server manager. Please reload.</p></div>
    ) : !data.server ? (
      <div className={styles.empty}><p className="section-title">No servers</p><p className="muted">The manager has no Minecraft instances set up.</p></div>
    ) : <>
      {data.servers.length > 1 && (
        <nav className={styles.subnav} aria-label="Servers">
          {data.servers.map((s) => <Link key={s} href={`/admin/server?server=${encodeURIComponent(s)}`} aria-current={s === data.server ? "page" : undefined}>{s}</Link>)}
        </nav>
      )}

      <section aria-label="Status">
        <div className={styles.sectionTitle}>
          <span className="mono">{data.server}</span>
          <span className={`badge badge-${TONE[data.status.unit.active_state] ?? "muted"}`}>{data.status.unit.active_state} · {data.status.unit.sub_state}</span>
        </div>
        {data.status.stat?.run_time !== undefined && (
          <p className={styles.small}>
            Up {uptime(data.status.stat.run_time)}
            {data.status.stat.memory !== undefined && ` · ${Math.round(data.status.stat.memory / 1024 / 1024)} MB RAM`}
            {data.status.stat.cpu_usage !== undefined && ` · ${data.status.stat.cpu_usage.toFixed(0)}% CPU`}
          </p>
        )}
        <div className={styles.actions}>
          {can(PERMISSION.START) && (
            <form action={serverAction}>
              <input type="hidden" name="server" value={data.server} />
              <SubmitButton className="btn btn-sm" name="action" value="start">Start</SubmitButton>
            </form>
          )}
          {can(PERMISSION.RESTART) && (
            <ConfirmAction action={serverAction} fields={{ server: data.server, action: "restart" }}
              trigger={<><PixelIcon name="retry" />Restart</>} triggerClassName="btn btn-sm"
              title="Restart the server?" body="Everyone online is disconnected. The server is usually back within a minute."
              confirmLabel="Restart" />
          )}
          {can(PERMISSION.STOP) && (
            <ConfirmAction action={serverAction} fields={{ server: data.server, action: "stop" }}
              trigger="Stop" triggerClassName="btn btn-sm btn-danger"
              title="Stop the server?" body="Everyone online is disconnected and the server stays off until someone starts it."
              confirmLabel="Stop" confirmClassName="btn btn-danger" />
          )}
        </div>
      </section>

      {can(PERMISSION.CONSOLE_READ) && (
        <ServerConsole key={data.server} server={data.server} initial={data.lines} canWrite={can(PERMISSION.CONSOLE_WRITE)} />
      )}
    </>}
  </>;
}
