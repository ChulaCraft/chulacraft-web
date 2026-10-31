import { recordAppError } from "@/lib/app-errors";
import { toCsv } from "@/lib/csv";
import { staffCan } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";

type Cell = string | number | boolean | null;
type Client = Awaited<ReturnType<typeof createClient>>;

/** Excel needs this to read UTF-8 (Thai) correctly. */
const BOM = "﻿";
export const MAX_EXPORT_IDS = 5000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Streams a CSV one page at a time. A failure after the first byte errors the stream,
 * so the browser reports a failed download instead of saving a short file that looks whole.
 */
export function csvStream(filename: string, header: Cell[], pages: AsyncIterable<Cell[][]>, route = "/admin/export"): Response {
  const encoder = new TextEncoder();
  const iterator = pages[Symbol.asyncIterator]();
  let started = false;
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        if (!started) {
          started = true;
          controller.enqueue(encoder.encode(BOM + toCsv([header])));
          return;
        }
        const next = await iterator.next();
        if (next.done) controller.close();
        else controller.enqueue(encoder.encode(toCsv(next.value)));
      } catch (error) {
        await recordAppError({ kind: "server", route, message: error instanceof Error ? error.message : "export failed" });
        controller.error(error);
      }
    },
    async cancel() { await iterator.return?.(); },
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Pages a set-returning RPC with .range() and stops on an EMPTY page, never a short one:
 * PostgREST's max_rows can cut a page below the size we asked for without any error.
 */
export async function* fetchAllRpc(supabase: Pick<Client, "rpc">, fn: string, args: Record<string, unknown>, pageSize = 1000): AsyncGenerator<unknown[]> {
  for (let from = 0; ; from += pageSize) {
    // The generated rpc names are a closed union; this helper is shared by many.
    const { data, error } = await (supabase as unknown as { rpc: (f: string, a: unknown) => { range: (a: number, b: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }> } })
      .rpc(fn, args).range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return;
    yield data;
  }
}

/** Ticked rows arrive as repeated `id` form fields. */
export function parseIds(formData: FormData): { ids: string[] } | { error: "too_many" | "bad_id" } {
  const raw = formData.getAll("id");
  if (raw.length > MAX_EXPORT_IDS) return { error: "too_many" };
  const ids = new Set<string>();
  for (const value of raw) {
    if (typeof value !== "string" || !UUID.test(value)) return { error: "bad_id" };
    ids.add(value.toLowerCase());
  }
  return { ids: [...ids] };
}

const forbidden = () => new Response("Forbidden", { status: 403 });

/** Signed in, then admin or owner. POST also needs a same-origin Origin (the check Next.js uses for server actions). */
export async function exportGate(request: Request): Promise<{ ok: true; supabase: Client } | { ok: false; response: Response }> {
  if (request.method === "POST") {
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    let originHost: string | null = null;
    try { originHost = origin ? new URL(origin).host : null; } catch { /* malformed */ }
    if (!originHost || !host || originHost !== host) return { ok: false, response: forbidden() };
  }
  const supabase = await createClient();
  // Signed out, the RPCs fail on their anon grant rather than with FORBIDDEN.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, response: forbidden() };
  const { data: role } = await supabase.rpc("current_app_role");
  if (!staffCan(role as string | null, "admin")) return { ok: false, response: forbidden() };
  return { ok: true, supabase };
}
