"use server";

import { redirect } from "next/navigation";
import { PERMISSION, managerUrl } from "@/lib/mcsv-token";
import { SERVICE_ID, managerErrorCode, managerFetch, opsGrant } from "@/lib/ops";

const SERVICE_ACTIONS = { start: PERMISSION.START, stop: PERMISSION.STOP, restart: PERMISSION.RESTART, update: PERMISSION.UPDATE } as const;
const TARGETS = ["world", "supabase"];

/** Start, stop, restart or update one service, or back up one target. Every
 *  outcome comes back as ?done= or ?error= (a contract code) for the page to word. */
export async function opsAction(formData: FormData) {
  const action = String(formData.get("action") ?? "");
  let back: string, token: string | null, path: string, init: RequestInit;

  if (action === "backup") {
    const target = String(formData.get("target") ?? "");
    if (!TARGETS.includes(target)) redirect("/admin/ops");
    back = "/admin/ops";
    token = await opsGrant("backup_run", PERMISSION.BACKUP_RUN, target);
    path = "/backups";
    init = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target }) };
  } else {
    const service = String(formData.get("service") ?? "");
    if (!SERVICE_ID.test(service) || !Object.hasOwn(SERVICE_ACTIONS, action)) redirect("/admin/ops");
    const name = action as keyof typeof SERVICE_ACTIONS;
    back = `/admin/ops/${encodeURIComponent(service)}`;
    token = await opsGrant(name, SERVICE_ACTIONS[name], service);
    path = `/service/${service}/${name}`;
    init = { method: "POST" };
  }

  if (!token) redirect(`${back}?error=FORBIDDEN`);
  let failed: string | null = null;
  try {
    await managerFetch(path, token, init);
  } catch (error) {
    failed = managerErrorCode(error);
  }
  redirect(failed ? `${back}?error=${failed}` : `${back}?done=${action}`);
}

/** Where and how the browser opens the console socket. The token rides as a
 *  subprotocol because browsers can't set headers on a WebSocket. */
export async function openConsole(service: string, write: boolean) {
  if (!SERVICE_ID.test(service)) return null;
  const need = PERMISSION.CONSOLE_READ | (write ? PERMISSION.CONSOLE_WRITE : 0);
  const token = await opsGrant(write ? "console_write" : "console", need, service);
  if (!token) return null;
  return { url: `${managerUrl().replace(/^http/, "ws")}/service/${service}/console`, protocols: ["mcsv.jwt", token] };
}
