// Server-only: website error capture. Text is scrubbed here, before it reaches the database.
import { createHash } from "node:crypto";
import { normaliseRoute } from "@/lib/error-route";
import { serviceClient } from "@/lib/supabase/service";

export { normaliseRoute };

export type AppErrorKind = "server" | "client";

/** Strips what must never be stored: tokens, keys, emails and query strings or fragments in URLs. */
export function scrub(text: string): string {
  return text
    .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, "[jwt]")
    .replace(/sb_secret_[\w-]*/g, "[key]")
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "[email]")
    .replace(/\?[\w%.-]+=[^\s"'<>)#]*/g, "")
    .replace(/#[\w%.-]+=[^\s"'<>)]*/g, "");
}

/** Groups repeats of one error: ids and counts in the message don't split it. Same as record_app_error's fingerprint. */
export function fingerprint(kind: AppErrorKind, message: string, route: string): string {
  return createHash("sha1").update(`${kind}|${message.replace(/[0-9]+/g, "#")}|${route}`).digest("hex");
}

/** Stores one error. Never throws: reporting must not become a second failure. */
export async function recordAppError(e: { kind: AppErrorKind; route: string; message: string; digest?: string }): Promise<void> {
  try {
    const { error } = await serviceClient().rpc("record_app_error", {
      p_kind: e.kind,
      // Backstop: callers already send a pattern, but a raw path must never split a group or store an id.
      p_route: normaliseRoute(scrub(e.route)),
      p_message: scrub(e.message).slice(0, 500),
      // Always sent: PostgREST can't match the function when the key is missing. Null is
      // accepted; the generated type just does not say so.
      p_digest: (e.digest && /^[\w-]+$/.test(e.digest) ? e.digest.slice(0, 64) : null) as string
    });
    if (error) throw new Error(error.message);
  } catch (error) {
    console.error("app_error_not_recorded", { reason: error instanceof Error ? error.message : "unknown" });
  }
}
