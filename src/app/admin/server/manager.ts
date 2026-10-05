import { randomUUID } from "node:crypto";
import { managerUrl, maskFor, mintToken } from "@/lib/mcsv-token";
import { createClient } from "@/lib/supabase/server";

// Not a "use server" file: nothing here may become a callable endpoint.

/** systemd instance names; anything else never reaches the manager's URL. */
export const SERVER_ID = /^[A-Za-z0-9_.@-]{1,64}$/;

export type ConsoleAction = "status" | "console" | "console_write" | "start" | "stop" | "restart";

/**
 * A 60 s token carrying exactly `need`, or null when the caller's role doesn't
 * have all of it. The database checks the role and writes the audit row first,
 * so a refused attempt to stop the server is still on record.
 */
export async function grant(action: ConsoleAction, need: number, server: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const jti = randomUUID();
  const { data: role, error } = await supabase.rpc("admin_server_console_access", { p_jti: jti, p_server: server, p_action: action });
  if (error || (maskFor(role) & need) !== need) return null;
  // Only for the manager's log; the jti is what ties it to the audit row.
  const meta = user.user_metadata ?? {};
  const sub = typeof meta.full_name === "string" ? meta.full_name : typeof meta.user_name === "string" ? meta.user_name : user.id;
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
