import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ role: "admin" as string | null, user: true, data: {} as Record<string, Record<string, unknown>[]>, fail: "", record: vi.fn() }));

vi.mock("@/lib/app-errors", () => ({ recordAppError: m.record }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: m.user ? { id: "u1" } : null } }) },
    rpc: (fn: string, args: Record<string, unknown> = {}) => {
      let rows = m.data[fn] ?? [];
      const ids = args.p_ids as string[] | undefined;
      if (ids) rows = rows.filter((r) => ids.includes((r.id ?? r.user_id) as string));
      if (fn === "admin_export_audit" && args.p_before_id) rows = [];
      if (typeof args.p_offset === "number") rows = rows.slice(args.p_offset, args.p_offset + (args.p_limit as number));
      const result = () => fn === "current_app_role" ? { data: m.role, error: null }
        : m.fail === fn ? { data: null, error: { message: "boom" } } : { data: rows, error: null };
      return { then: (ok: (v: unknown) => unknown) => Promise.resolve(result()).then(ok), range: async (a: number, b: number) => ({ ...result(), data: m.fail === fn ? null : rows.slice(a, b + 1) }) };
    },
  }),
}));

import * as reports from "./reports/export/route";
import * as appeals from "./appeals/export/route";
import * as audit from "./audit/export/route";
import * as achievements from "./commu/achievements/export/route";
import * as recipients from "./commu/achievements/[id]/export/route";
import * as events from "./commu/events/export/route";
import * as attendance from "./commu/events/[id]/check-in/export/route";
import * as players from "./players/export/route";

const ID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const base = { created_at: "2026-10-01T00:00:00Z", created: "t" };
const rowsOf = (n: number, extra: Record<string, unknown> = {}) => Array.from({ length: n }, (_, i) => ({ ...base, id: ID(i + 1), user_id: ID(i + 1), name: `n${i}`, display_name: `Player ${i}`, ...extra }));

type Mod = { GET: (r: Request, c: never) => Promise<Response>; POST: (r: Request, c: never) => Promise<Response> };
const ctx = { params: Promise.resolve({ id: ID(99) }) } as never;
const routes: [string, Mod, string, string][] = [
  ["reports", reports, "admin_export_reports", "/admin/reports/export"],
  ["appeals", appeals, "admin_export_appeals", "/admin/appeals/export"],
  ["audit", audit, "admin_export_audit", "/admin/audit/export"],
  ["achievements", achievements, "admin_list_achievements", "/admin/commu/achievements/export"],
  ["recipients", recipients, "admin_list_awards", "/admin/commu/achievements/x/export"],
  ["events", events, "admin_list_events", "/admin/commu/events/export"],
  ["attendance", attendance, "admin_list_attendance", "/admin/commu/events/x/check-in/export"],
  ["players", players, "admin_list_players", "/admin/players/export"],
];

const get = (mod: Mod, path: string) => mod.GET(new Request(`http://site.test${path}`), ctx);
const post = (mod: Mod, path: string, ids: string[], origin: string | null = "http://site.test", extra: [string, string][] = []) => {
  const body = new URLSearchParams();
  for (const id of ids) body.append("id", id);
  for (const [k, v] of extra) body.append(k, v);
  return mod.POST(new Request(`http://site.test${path}`, { method: "POST", body, headers: { ...(origin ? { origin } : {}), host: "site.test" } }), ctx);
};

/** Minimal RFC 4180 parser, so cell values are checked rather than substrings. */
function parseCsv(text: string): string[][] {
  const out: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false; } else cell += c; }
    else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\r") { /* paired with \n */ }
    else if (c === "\n") { row.push(cell); out.push(row); row = []; cell = ""; }
    else cell += c;
  }
  return out;
}
const csv = async (res: Response) => parseCsv(new TextDecoder("utf-8", { ignoreBOM: false }).decode(await res.arrayBuffer()).replace(/^\uFEFF/, ""));

beforeEach(() => {
  m.role = "admin"; m.user = true; m.fail = ""; m.record.mockReset();
  m.data = Object.fromEntries(routes.map(([, , fn]) => [fn, rowsOf(3)]));
});

describe.each(routes)("%s export", (_name, mod, fn, path) => {
  it("answers 403 to anon, moderator and event_staff, on GET and POST", async () => {
    m.user = false;
    expect((await get(mod, path)).status).toBe(403);
    expect((await post(mod, path, [])).status).toBe(403);
    m.user = true;
    for (const role of ["moderator", "event_staff", "user", null]) {
      m.role = role;
      expect((await get(mod, path)).status).toBe(403);
      expect((await post(mod, path, [])).status).toBe(403);
    }
  });

  it("gives owner and admin a CSV with a UTF-8 BOM and every row", async () => {
    for (const role of ["owner", "admin"]) {
      m.role = role;
      const res = await get(mod, path);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/csv");
      const bytes = new Uint8Array(await res.arrayBuffer());
      expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
      expect(parseCsv(new TextDecoder().decode(bytes)).length).toBe(4);
    }
  });

  it("POST with 2 ids returns exactly those 2 rows", async () => {
    const res = await post(mod, path, [ID(1), ID(3)]);
    expect(res.status).toBe(200);
    expect((await csv(res)).length).toBe(3);
  });

  it("POST with 5001 ids is 400; a wrong or missing Origin is 403", async () => {
    expect((await post(mod, path, Array.from({ length: 5001 }, (_, i) => ID(i)))).status).toBe(400);
    expect((await post(mod, path, [], "http://evil.test")).status).toBe(403);
    expect((await post(mod, path, [], null)).status).toBe(403);
  });

  it("errors the stream and records it when a page fails", async () => {
    m.fail = fn;
    const res = await get(mod, path);
    await expect(res.arrayBuffer()).rejects.toThrow("boom");
    expect(m.record).toHaveBeenCalledWith(expect.objectContaining({ kind: "server" }));
  });
});

describe("cell contents", () => {
  it("keeps Thai and neutralises formulas", async () => {
    m.data.admin_list_events = rowsOf(2).map((r, i) => ({ ...r, name: i ? "=SUM(A1)" : "กิจกรรมสร้างบ้าน" }));
    const rows = await csv(await get(events, "/admin/events/export"));
    expect(rows[1][1]).toBe("กิจกรรมสร้างบ้าน");
    expect(rows[2][1]).toBe("'=SUM(A1)");
    for (const lead of ["+", "-", "@"]) {
      m.data.admin_list_events = [{ ...rowsOf(1)[0], name: `${lead}x` }];
      expect((await csv(await get(events, "/e")))[1][1]).toBe(`'${lead}x`);
    }
  });
});

describe("filters", () => {
  it("reports and appeals keep the status; an unknown value falls back to open", async () => {
    expect((await get(reports, "/admin/reports/export?status=dismissed")).headers.get("Content-Disposition")).toContain("reports-dismissed");
    expect((await get(appeals, "/admin/appeals/export?status=bogus")).headers.get("Content-Disposition")).toContain("appeals-open");
  });

  it("players POST reads the screen's filters from the body and stops once every id is found", async () => {
    m.data.admin_list_players = rowsOf(3);
    const res = await post(players, "/admin/players/export", [ID(1)], "http://site.test", [["status", "guest"], ["q", "kai"]]);
    expect((await csv(res)).length).toBe(2);
  });

  it("audit pages by keyset until an empty page", async () => {
    m.data.admin_export_audit = rowsOf(3, { actor_user_id: ID(1) });
    expect((await csv(await get(audit, "/admin/audit/export"))).length).toBe(4);
  });
});
