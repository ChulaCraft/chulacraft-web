import { createHash } from "node:crypto";
import { recordAppError } from "@/lib/app-errors";

const MAX_BODY_BYTES = 2048;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;

// Per-instance window, acceptable here: it only has to blunt a flood from one address.
const windows = new Map<string, { start: number; count: number }>();

function limited(ip: string, now: number): boolean {
  const key = createHash("sha256").update(ip).digest("hex");
  if (windows.size > 5000) for (const [k, w] of windows) if (now - w.start >= WINDOW_MS) windows.delete(k);
  const w = windows.get(key);
  if (!w || now - w.start >= WINDOW_MS) { windows.set(key, { start: now, count: 1 }); return false; }
  w.count += 1;
  return w.count > MAX_PER_WINDOW;
}

const fail = (status: number) => new Response(null, { status, headers: { "cache-control": "no-store" } });

/** Browser error reports from the error boundaries. Same-origin only; stored scrubbed. */
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return fail(403);
  if (limited(request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown", Date.now())) return fail(429);
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return fail(413);

  let body: unknown;
  try { body = JSON.parse(text); } catch { return fail(400); }
  const { route, message, digest } = (body ?? {}) as Record<string, unknown>;
  if (typeof route !== "string" || !route.startsWith("/") || typeof message !== "string" || (digest !== undefined && typeof digest !== "string")) return fail(400);

  await recordAppError({ kind: "client", route, message, digest });
  return fail(204);
}
