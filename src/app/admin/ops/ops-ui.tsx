import { PixelIcon } from "@/components/icons";
import type { JobState } from "@/lib/bot-admin";
import type { Backup, ServiceStatus, UptimePoint } from "@/lib/ops";
import styles from "./ops.module.css";

// Shared pieces of /admin/ops: the status chip, the 7-day uptime bar, the
// ?done= / ?error= copy, and number/time formatting. Status is always words
// plus an icon; colour only repeats it.

type Chip = { label: string; icon: "check" | "close" | "retry" | "info" | "warning" | "clock"; tone: string };

const SERVICE: Record<ServiceStatus["state"] | "error", Chip> = {
  up: { label: "Up", icon: "check", tone: "green" },
  down: { label: "Down", icon: "close", tone: "danger" },
  restarting: { label: "Restarting", icon: "retry", tone: "amber" },
  unknown: { label: "Unknown", icon: "info", tone: "muted" },
  error: { label: "Couldn't load status", icon: "warning", tone: "danger" }
};
const BACKUP: Record<Backup["status"], Chip> = {
  running: { label: "Running", icon: "clock", tone: "amber" },
  ok: { label: "OK", icon: "check", tone: "green" },
  failed: { label: "Failed", icon: "warning", tone: "danger" }
};

// Discord bot tasks (/admin/ops/bot and its row in the list).
const JOB: Record<JobState, Chip> = {
  ok: { label: "OK", icon: "check", tone: "green" },
  failing: { label: "Failing", icon: "warning", tone: "danger" },
  overdue: { label: "Overdue", icon: "clock", tone: "danger" },
  paused: { label: "Paused", icon: "info", tone: "muted" },
  never: { label: "Not run yet", icon: "clock", tone: "muted" },
  retired: { label: "Retired", icon: "close", tone: "muted" }
};

function Chip({ chip }: { chip: Chip }) {
  return <span className={`badge badge-${chip.tone}`} data-status-chip><PixelIcon name={chip.icon} />{chip.label}</span>;
}
export const StatusChip = ({ state }: { state: ServiceStatus["state"] | "error" }) => <Chip chip={SERVICE[state]} />;
export const JobChip = ({ state }: { state: JobState }) => <Chip chip={JOB[state]} />;
export const BackupChip = ({ status }: { status: Backup["status"] }) => <Chip chip={BACKUP[status]} />;

export const ERRORS: Record<string, string> = {
  FORBIDDEN: "You don't have permission to do that.",
  MANAGER_401: "The server manager didn't accept the website's token. Check that its public key matches MCSV_JWT_PRIVATE_KEY.",
  MANAGER_403: "The server manager says this action needs a permission the token didn't carry.",
  MANAGER_404: "The server manager doesn't offer that for this service.",
  MANAGER_409: "That is already running. Wait for it to finish, then try again.",
  MANAGER_503: "The server manager can't reach systemd or Docker right now. Try again in a minute.",
  MANAGER: "The server manager didn't accept that. Try again, and check its logs if it keeps failing."
};
export const DONE: Record<string, string> = {
  start: "Start sent. The status updates in a moment.",
  stop: "Stop sent. The status updates in a moment.",
  restart: "Restart sent. The status updates in a moment.",
  update: "Pull & restart sent. It is back once the new image is running.",
  backup: "Backup started. It shows as Running until it finishes."
};

/** The ?done= / ?error= outcome of the last action, announced politely. */
export function Outcome({ error, done }: { error?: string; done?: string }) {
  return <div aria-live="polite">
    {error && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{ERRORS[error] ?? ERRORS.MANAGER}</p></div>}
    {done && DONE[done] && <p className="alert alert-success" role="status"><PixelIcon name="check" />{DONE[done]}</p>}
  </div>;
}

const STAMP = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** "22 Oct, 16:01" in Bangkok time; "–" when missing or unparseable. */
export function stamp(iso: string | null) {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(t) ? "–" : STAMP.format(t);
}

/** "3 h", "2 d 4 h", "12 min" from `iso` until now; null when unknown. */
export function span(iso: string | null, now = Date.now()) {
  const t = iso ? Date.parse(iso) : NaN;
  if (Number.isNaN(t)) return null;
  const min = Math.max(0, Math.floor((now - t) / 60_000));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return h < 24 ? `${h} h` : `${Math.floor(h / 24)} d ${h % 24} h`;
}

export function bytes(n: number | null) {
  if (n === null) return "–";
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(1)} GB`;
  if (n >= 1024 ** 2) return `${Math.round(n / 1024 ** 2)} MB`;
  return `${Math.round(n / 1024)} KB`;
}

export const percent = (n: number | null) => (n === null ? "–" : `${n.toFixed(1)}%`);

/** "Up since 22 Oct, 16:01 (3 h) · Last restart 21 Oct, 09:00" for a row or a header. */
export function sinceLine(status: ServiceStatus) {
  const label = SERVICE[status.state].label;
  const length = span(status.since);
  const since = status.since ? `${label} since ${stamp(status.since)}${length ? ` (${length})` : ""}` : label;
  return `${since} · ${status.last_restart ? `Last restart ${stamp(status.last_restart)}` : "Never restarted"}`;
}

const BAR_H = 24;

/**
 * Hourly uptime as bars whose height is the fraction of the hour the service
 * was up, so a bad hour is a short bar (not just a different colour). The
 * total and the hours with downtime are also written out next to it.
 */
export function UptimeBar({ points }: { points: UptimePoint[] }) {
  const known = points.filter((p) => p.up_ratio !== null) as { t: string; up_ratio: number }[];
  if (known.length === 0) return <p className={styles.small}>No uptime data yet.</p>;
  const total = (known.reduce((sum, p) => sum + p.up_ratio, 0) / known.length) * 100;
  const bad = known.filter((p) => p.up_ratio < 1).length;
  const summary = `${total >= 99.95 ? "100" : total.toFixed(1)}% up${bad ? ` · ${bad} h with downtime` : ""}`;
  return <div className={styles.uptime}>
    <svg className={styles.uptimeBar} viewBox={`0 0 ${points.length} ${BAR_H}`} preserveAspectRatio="none" role="img"
      aria-label={`Uptime, last 7 days: ${summary}`}>
      {points.map((p, i) => p.up_ratio === null ? null : (
        <rect key={i} x={i + 0.1} width={0.8} y={BAR_H - Math.max(2, BAR_H * p.up_ratio)} height={Math.max(2, BAR_H * p.up_ratio)}
          className={p.up_ratio < 1 ? styles.barDown : styles.barUp} />
      ))}
    </svg>
    <span className={styles.small} aria-hidden="true">7 days: {summary}</span>
  </div>;
}
