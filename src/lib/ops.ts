import { randomUUID } from "node:crypto";
import { discordName } from "@/lib/chula";
import { managerUrl, maskFor, mintToken } from "@/lib/mcsv-token";
import { createClient } from "@/lib/supabase/server";

// Types and parsers mirror docs/ops-manager-contract.md. Not a "use server"
// file: nothing here may become a callable endpoint.

/** Service ids from the manager config; anything else never reaches the manager's URL.
 *  "." and ".." (or any "..") would walk the path, so they never match. */
export const SERVICE_ID = /^(?!\.\.?$)(?!.*\.\.)[A-Za-z0-9_.@-]{1,64}$/;

const MAX_SERVICES = 50;
// /admin/ops/website and /admin/ops/bot are static pages that win over /admin/ops/[service],
// so a manager service with one of these ids could never be opened.
const RESERVED_IDS = new Set(["website", "bot"]);
// 7 days of 5-minute samples, 7 days of hours, and plenty of backups for a list.
const MAX_METRICS = 2016;
const MAX_UPTIME = 168;
const MAX_BACKUPS = 100;
const ACTIONS = ["start", "stop", "restart"] as const;
const STATES = ["up", "down", "restarting", "unknown"] as const;

export type OpsAction =
  | "status" | "logs" | "console" | "console_write" | "start" | "stop" | "restart" | "backup_list" | "backup_run" | "update";

export type Service = {
  id: string;
  name: string;
  kind: "systemd" | "docker";
  console: boolean;
  actions: (typeof ACTIONS)[number][];
  backups: boolean;
  updatable: boolean;
};

export type MetricPoint = { t: string; cpu_pct: number | null; mem_bytes: number | null };
export type UptimePoint = { t: string; up_ratio: number | null };
export type BackupTarget = "world" | "supabase";
export type Backup = {
  id: string;
  target: BackupTarget;
  kind: "manual" | "nightly";
  size_bytes: number | null;
  created_at: string | null;
  status: "running" | "ok" | "failed";
};
export type ServiceImage = { current: string; latest: string; checked_at: string | null };

export type ServiceStatus = {
  state: (typeof STATES)[number];
  since: string | null;
  last_restart: string | null;
  cpu_pct: number | null;
  mem_bytes: number | null;
  mem_limit_bytes: number | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const finite = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);
const text = (value: unknown) => (typeof value === "string" ? value : null);

/** The manager's /services list, defensively: bad, reserved and repeated ids dropped (the first
 *  wins), capped at 50, missing booleans false. */
export function parseServices(json: unknown): Service[] {
  if (!Array.isArray(json)) return [];
  const services: Service[] = [];
  const seen = new Set<string>();
  for (const item of json) {
    if (services.length >= MAX_SERVICES) break;
    if (!isRecord(item) || typeof item.id !== "string" || !SERVICE_ID.test(item.id)) continue;
    if (RESERVED_IDS.has(item.id) || seen.has(item.id)) continue;
    seen.add(item.id);
    services.push({
      id: item.id,
      name: typeof item.name === "string" && item.name ? item.name : item.id,
      kind: item.kind === "docker" ? "docker" : "systemd",
      console: item.console === true,
      actions: Array.isArray(item.actions) ? ACTIONS.filter((a) => (item.actions as unknown[]).includes(a)) : [],
      backups: item.backups === true,
      updatable: item.updatable === true
    });
  }
  return services;
}

/** The manager's /service/:id/status: an unknown state is "unknown", non-finite numbers are null. */
export function parseStatus(json: unknown): ServiceStatus {
  const o = isRecord(json) ? json : {};
  return {
    state: STATES.find((s) => s === o.state) ?? "unknown",
    since: text(o.since),
    last_restart: text(o.last_restart),
    cpu_pct: finite(o.cpu_pct),
    mem_bytes: finite(o.mem_bytes),
    mem_limit_bytes: finite(o.mem_limit_bytes)
  };
}

/** Points with a string `t`, oldest first as sent, capped; bad numbers become null gaps. */
function points<T>(json: unknown, max: number, map: (o: Record<string, unknown>, t: string) => T): T[] {
  if (!Array.isArray(json)) return [];
  const out: T[] = [];
  for (const item of json) {
    if (out.length >= max) break;
    if (isRecord(item) && typeof item.t === "string") out.push(map(item, item.t));
  }
  return out;
}

/** /service/:id/metrics: 5-minute CPU and memory points. */
export const parseMetrics = (json: unknown): MetricPoint[] =>
  points(json, MAX_METRICS, (o, t) => ({ t, cpu_pct: finite(o.cpu_pct), mem_bytes: finite(o.mem_bytes) }));

/** /service/:id/uptime: hourly fraction up, clamped to 0..1. */
export const parseUptime = (json: unknown): UptimePoint[] =>
  points(json, MAX_UPTIME, (o, t) => {
    const r = finite(o.up_ratio);
    return { t, up_ratio: r === null ? null : Math.min(1, Math.max(0, r)) };
  });

/** /backups: only the two contract targets; an unknown status reads as failed, never as ok. */
export function parseBackups(json: unknown): Backup[] {
  if (!Array.isArray(json)) return [];
  const out: Backup[] = [];
  for (const item of json) {
    if (out.length >= MAX_BACKUPS) break;
    if (!isRecord(item) || typeof item.id !== "string" || (item.target !== "world" && item.target !== "supabase")) continue;
    out.push({
      id: item.id,
      target: item.target,
      kind: item.kind === "nightly" ? "nightly" : "manual",
      size_bytes: finite(item.size_bytes),
      created_at: text(item.created_at),
      status: item.status === "running" || item.status === "ok" ? item.status : "failed"
    });
  }
  return out;
}

/** /service/:id/image, or null when either tag is missing. */
export function parseImage(json: unknown): ServiceImage | null {
  if (!isRecord(json) || typeof json.current !== "string" || typeof json.latest !== "string") return null;
  return { current: json.current, latest: json.latest, checked_at: text(json.checked_at) };
}

const KNOWN_CODES = ["MANAGER_401", "MANAGER_403", "MANAGER_404", "MANAGER_409", "MANAGER_503"];

/** A managerFetch failure as a contract error code the page has copy for; anything else (500, timeout) is MANAGER. */
export function managerErrorCode(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return KNOWN_CODES.includes(message) ? message : "MANAGER";
}

/**
 * A 60 s token carrying exactly `need` for one service (or backup target), or
 * null when the caller's role doesn't have all of it. The database checks the
 * role first and logs every non-read action it lets through, so a refusal by
 * the mask below (say, an admin asking to stop a service) is still on record.
 * A refusal by the RPC itself (no staff role, an admin asking for `update`)
 * raises before anything is logged.
 */
export async function opsGrant(action: OpsAction, need: number, service: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const jti = randomUUID();
  const { data: role, error } = await supabase.rpc("admin_ops_access", { p_jti: jti, p_service: service, p_action: action });
  if (error || (maskFor(role) & need) !== need) return null;
  // Only for the manager's log; the jti is what ties it to the audit row.
  const meta = user.user_metadata ?? {};
  const sub = discordName(user.identities) ?? (typeof meta.full_name === "string" ? meta.full_name : typeof meta.user_name === "string" ? meta.user_name : user.id);
  return mintToken(sub, need, jti);
}

export async function managerFetch(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${managerUrl()}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) throw new Error(`MANAGER_${response.status}`);
  return response;
}
