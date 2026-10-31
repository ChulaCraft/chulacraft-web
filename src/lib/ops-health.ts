// Server-only: the website's own health, for /api/ops/health and the website row on /admin/ops.
import { serviceClient } from "@/lib/supabase/service";

export type OpsHealth = { ok: boolean; db: "ok" | "down"; errors_5m: number; version: string };

/** Database reachable plus errors recorded in the last 5 minutes. Never throws. */
export async function opsHealth(): Promise<OpsHealth> {
  const version = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev";
  try {
    const { data, error } = await serviceClient().rpc("app_errors_recent", { p_minutes: 5 });
    if (error || typeof data !== "number") throw new Error(error?.message ?? "no count");
    return { ok: true, db: "ok", errors_5m: data, version };
  } catch {
    return { ok: false, db: "down", errors_5m: 0, version };
  }
}
