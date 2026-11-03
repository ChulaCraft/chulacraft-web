import { exportGate, parseIds } from "@/lib/admin-export";

/**
 * Shared front half of every admin CSV route: the gate, then the filters and the
 * ticked ids. GET reads the filters from the URL and exports every row; POST reads
 * them from the form body next to repeated `id` fields (5000 at most, else 400).
 */
export async function readExport(request: Request) {
  const gate = await exportGate(request);
  if (!gate.ok) return gate;
  const { supabase } = gate;
  if (request.method !== "POST") return { ok: true as const, supabase, params: new URL(request.url).searchParams, ids: undefined };
  const form = await request.formData().catch(() => null);
  const parsed = form ? parseIds(form) : null;
  if (!form || !parsed || "error" in parsed) return { ok: false as const, response: new Response("Bad request", { status: 400 }) };
  const params = new URLSearchParams();
  for (const [key, value] of form) if (key !== "id" && typeof value === "string") params.append(key, value);
  return { ok: true as const, supabase, params, ids: parsed.ids };
}

/** yyyy-mm-dd for export file names. */
export const today = () => new Date().toISOString().slice(0, 10);
