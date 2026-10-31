import { describe, expect, it } from "vitest";
import { SERVICE_ID, managerErrorCode, parseBackups, parseImage, parseMetrics, parseServices, parseStatus, parseUptime } from "./ops";

describe("parseServices", () => {
  it("drops ids that could escape the manager path and defaults missing fields", () => {
    expect(parseServices([{ id: "../x" }, { id: "a/b" }, { id: "ok", name: "OK" }])).toEqual([
      { id: "ok", name: "OK", kind: "systemd", console: false, actions: [], backups: false, updatable: false }
    ]);
  });

  it("keeps what the manager says and drops unknown actions", () => {
    expect(parseServices([{ id: "discord-bot", name: "Bot", kind: "docker", console: true, actions: ["restart", "rm", "stop"], backups: true, updatable: true }])).toEqual([
      { id: "discord-bot", name: "Bot", kind: "docker", console: true, actions: ["stop", "restart"], backups: true, updatable: true }
    ]);
  });

  it("caps at 50 and tolerates junk", () => {
    expect(parseServices(Array.from({ length: 60 }, (_, i) => ({ id: `s${i}` })))).toHaveLength(50);
    expect(parseServices("nope")).toEqual([]);
    expect(parseServices([null, 3, "x", {}])).toEqual([]);
  });

  it("drops the reserved ids website and bot: their static pages would shadow them", () => {
    expect(parseServices([{ id: "website" }, { id: "bot" }, { id: "survival" }]).map((s) => s.id)).toEqual(["survival"]);
  });

  it("keeps the first of repeated ids", () => {
    expect(parseServices([{ id: "survival", name: "First" }, { id: "x" }, { id: "survival", name: "Second" }]).map((s) => s.name)).toEqual(["First", "x"]);
  });

  it("falls back to the id when the name is missing", () => {
    expect(parseServices([{ id: "survival" }])[0].name).toBe("survival");
  });
});

describe("parseStatus", () => {
  it("passes a good status through", () => {
    const status = { state: "up", since: "2026-10-22T09:01:20Z", last_restart: null, cpu_pct: 12.4, mem_bytes: 100, mem_limit_bytes: 0 };
    expect(parseStatus(status)).toEqual(status);
  });

  it("renders an unknown state as unknown and non-finite numbers as null", () => {
    const s = parseStatus({ state: "exploded", cpu_pct: "x", mem_bytes: Infinity, mem_limit_bytes: NaN });
    expect(s.state).toBe("unknown");
    expect(s.cpu_pct).toBeNull();
    expect(s.mem_bytes).toBeNull();
    expect(s.mem_limit_bytes).toBeNull();
  });

  it("turns a non-object into all-unknown", () => {
    expect(parseStatus("nope")).toEqual({ state: "unknown", since: null, last_restart: null, cpu_pct: null, mem_bytes: null, mem_limit_bytes: null });
  });
});

describe("SERVICE_ID", () => {
  it("accepts manager ids and rejects anything that could walk the URL path", () => {
    for (const id of ["survival", "minecraft@survival", "discord-bot", "a.b", "a_b"]) expect(SERVICE_ID.test(id), id).toBe(true);
    for (const id of [".", "..", "a..b", "../x", "x/..", "a/b", "", "x".repeat(65), "a b"]) expect(SERVICE_ID.test(id), id).toBe(false);
  });

  it("drops dot ids from the services list", () => {
    expect(parseServices([{ id: "." }, { id: ".." }, { id: "a..b" }, { id: "ok" }]).map((s) => s.id)).toEqual(["ok"]);
  });
});

describe("parseMetrics / parseUptime", () => {
  it("keeps good points, drops bad ones and clamps the ratio", () => {
    expect(parseMetrics([{ t: "2026-10-22T11:05:00Z", cpu_pct: 8.5, mem_bytes: 100 }, { t: 3 }, null, { t: "x", cpu_pct: "a", mem_bytes: 5 }])).toEqual([
      { t: "2026-10-22T11:05:00Z", cpu_pct: 8.5, mem_bytes: 100 },
      { t: "x", cpu_pct: null, mem_bytes: 5 }
    ]);
    expect(parseUptime([{ t: "a", up_ratio: 1.4 }, { t: "b", up_ratio: -1 }, { t: "c", up_ratio: "x" }, { up_ratio: 1 }])).toEqual([
      { t: "a", up_ratio: 1 }, { t: "b", up_ratio: 0 }, { t: "c", up_ratio: null }
    ]);
    expect(parseMetrics("nope")).toEqual([]);
  });

  it("caps the number of points (7 days of 5-minute samples; 7 days of hours)", () => {
    expect(parseMetrics(Array.from({ length: 3000 }, (_, i) => ({ t: String(i), cpu_pct: 1, mem_bytes: 1 })))).toHaveLength(2016);
    expect(parseUptime(Array.from({ length: 500 }, (_, i) => ({ t: String(i), up_ratio: 1 })))).toHaveLength(168);
  });
});

describe("parseBackups", () => {
  it("keeps known targets, kinds and statuses; unknown status reads as failed", () => {
    expect(parseBackups([
      { id: "bk-1", target: "world", kind: "nightly", size_bytes: 10, created_at: "2026-10-22T09:01:20Z", status: "ok" },
      { id: "bk-2", target: "supabase", kind: "weird", size_bytes: "x", created_at: null, status: "exploded" },
      { id: 3, target: "world" },
      { id: "bk-4", target: "/etc" }
    ])).toEqual([
      { id: "bk-1", target: "world", kind: "nightly", size_bytes: 10, created_at: "2026-10-22T09:01:20Z", status: "ok" },
      { id: "bk-2", target: "supabase", kind: "manual", size_bytes: null, created_at: null, status: "failed" }
    ]);
    expect(parseBackups({})).toEqual([]);
  });
});

describe("parseImage", () => {
  it("needs both tags", () => {
    expect(parseImage({ current: "a@1", latest: "a@2", checked_at: "t" })).toEqual({ current: "a@1", latest: "a@2", checked_at: "t" });
    expect(parseImage({ current: "a@1" })).toBeNull();
    expect(parseImage(null)).toBeNull();
  });
});

describe("managerErrorCode", () => {
  it("turns managerFetch failures into the contract's codes", () => {
    for (const code of [401, 403, 404, 409, 503]) expect(managerErrorCode(new Error(`MANAGER_${code}`))).toBe(`MANAGER_${code}`);
    expect(managerErrorCode(new Error("MANAGER_500"))).toBe("MANAGER");
    expect(managerErrorCode(new DOMException("timed out", "TimeoutError"))).toBe("MANAGER");
    expect(managerErrorCode("junk")).toBe("MANAGER");
  });
});
