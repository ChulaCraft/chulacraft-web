// Server-only: anonymous failure counts for /admin/insights. No user id is ever sent.
import { serviceClient } from "@/lib/supabase/service";

const BY_STATUS: Record<number, string> = { 400: "INVALID_INPUT", 403: "CLOSED", 404: "NOT_FOUND", 409: "CONFLICT", 429: "RATE_LIMITED", 503: "UNAVAILABLE" };

/** The code stored for a failed registration request: the database's raised code
 *  when there is one, otherwise a name for the HTTP status. Always `[A-Z0-9_]{2,40}`. */
export function failureCode(status: number, raised?: string | null): string {
  if (raised && /^[A-Z0-9_]{2,40}$/.test(raised)) return raised;
  return BY_STATUS[status] ?? "ERROR";
}

/** Counts one failure. Never throws and never changes the caller's response. */
export async function recordFunnelFailure(step: "minecraft" | "verify", code: string): Promise<void> {
  try {
    const { error } = await serviceClient().rpc("record_funnel_failure", { p_step: step, p_code: code });
    if (error) throw new Error(error.message);
  } catch (error) {
    console.error("funnel_failure_not_recorded", { step, code, reason: error instanceof Error ? error.message : "unknown" });
  }
}
