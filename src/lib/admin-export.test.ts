import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ rpc: vi.fn(), getUser: vi.fn(), record: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: m.rpc, auth: { getUser: m.getUser } }) }));
vi.mock("@/lib/app-errors", () => ({ recordAppError: m.record }));

import { csvStream, exportGate, fetchAllRpc, MAX_EXPORT_IDS, parseIds } from "./admin-export";

const ID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const bytes = async (res: Response) => new Uint8Array(await res.arrayBuffer());

async function* pages(...p: (string | number | null)[][][]) { for (const x of p) yield x; }

describe("csvStream", () => {
  it("starts with a UTF-8 BOM, then header and rows", async () => {
    const res = csvStream("a.csv", ["x"], pages([["1"]]));
    const b = await bytes(res);
    expect([...b.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder("utf-8", { ignoreBOM: true }).decode(b).slice(1)).toBe("x\r\n1\r\n");
    expect(res.headers.get("Content-Disposition")).toBe('attachment; filename="a.csv"');
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
  it("neutralises formulas and keeps Thai intact", async () => {
    const text = new TextDecoder().decode(await bytes(csvStream("a.csv", ["n"], pages([["=1+1"], ["สวัสดี"]]))));
    expect(text).toContain("'=1+1\r\n");
    expect(text).toContain("สวัสดี\r\n");
  });
  it("errors the stream (not a short file) when a page fails, and records it", async () => {
    async function* bad() { yield [["ok"]]; throw new Error("boom"); }
    await expect(bytes(csvStream("a.csv", ["x"], bad(), "/admin/players/export"))).rejects.toThrow("boom");
    expect(m.record).toHaveBeenCalledWith(expect.objectContaining({ kind: "server", route: "/admin/players/export" }));
  });
});

describe("fetchAllRpc", () => {
  it("pages with range until an EMPTY page, even after a short one", async () => {
    const range = vi.fn()
      .mockResolvedValueOnce({ data: [1, 2, 3], error: null })
      .mockResolvedValueOnce({ data: [4], error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    const rpc = vi.fn(() => ({ range }));
    const out: number[][] = [];
    for await (const p of fetchAllRpc({ rpc } as never, "f", { a: 1 }, 3)) out.push(p as number[]);
    expect(out).toEqual([[1, 2, 3], [4]]);
    expect(range.mock.calls).toEqual([[0, 2], [3, 5], [6, 8]]);
    expect(rpc).toHaveBeenCalledWith("f", { a: 1 });
  });
  it("throws on an rpc error", async () => {
    const rpc = () => ({ range: async () => ({ data: null, error: { message: "FORBIDDEN" } }) });
    await expect((async () => { for await (const _ of fetchAllRpc({ rpc } as never, "f", {})) void _; })()).rejects.toThrow("FORBIDDEN");
  });
});

describe("parseIds", () => {
  const form = (ids: string[]) => { const f = new FormData(); ids.forEach((i) => f.append("id", i)); return f; };
  it("returns valid uuids, deduplicated", () => {
    expect(parseIds(form([ID(1), ID(1), ID(2)]))).toEqual({ ids: [ID(1), ID(2)] });
  });
  it("accepts exactly the cap and refuses one more", () => {
    expect("ids" in parseIds(form(Array.from({ length: MAX_EXPORT_IDS }, (_, i) => ID(i))))).toBe(true);
    expect(parseIds(form(Array.from({ length: MAX_EXPORT_IDS + 1 }, (_, i) => ID(i))))).toEqual({ error: "too_many" });
  });
  it("refuses a malformed id", () => {
    expect(parseIds(form(["nope"]))).toEqual({ error: "bad_id" });
  });
});

describe("exportGate", () => {
  const req = (method: string, headers: Record<string, string> = {}) => new Request("http://x/e", { method, headers });
  beforeEach(() => {
    m.getUser.mockReset().mockResolvedValue({ data: { user: { id: "u" } } });
    m.rpc.mockReset().mockResolvedValue({ data: "admin", error: null });
  });
  it("allows admin GET", async () => { expect((await exportGate(req("GET"))).ok).toBe(true); });
  it("403 when signed out, without touching the role rpc", async () => {
    m.getUser.mockResolvedValue({ data: { user: null } });
    const g = await exportGate(req("GET"));
    expect(g.ok === false && g.response.status).toBe(403);
    expect(m.rpc).not.toHaveBeenCalled();
  });
  it("403 for roles below admin", async () => {
    m.rpc.mockResolvedValue({ data: "moderator", error: null });
    const g = await exportGate(req("GET"));
    expect(g.ok === false && g.response.status).toBe(403);
  });
  it("POST needs an Origin matching x-forwarded-host, then host", async () => {
    const no = async (h: Record<string, string>) => { const g = await exportGate(req("POST", h)); return g.ok === false && g.response.status; };
    expect(await no({})).toBe(403);
    expect(await no({ origin: "https://evil.example", host: "www.chulacraft.com" })).toBe(403);
    expect(await no({ origin: "https://www.chulacraft.com", host: "internal:3000", "x-forwarded-host": "evil.example" })).toBe(403);
    expect((await exportGate(req("POST", { origin: "https://www.chulacraft.com", host: "internal:3000", "x-forwarded-host": "www.chulacraft.com" }))).ok).toBe(true);
    expect((await exportGate(req("POST", { origin: "http://localhost:3000", host: "localhost:3000" }))).ok).toBe(true);
    expect(await no({ origin: "not a url", host: "x" })).toBe(403);
  });
});
