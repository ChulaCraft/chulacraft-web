import { generateKeyPairSync, randomUUID, sign } from "node:crypto";
import { describe, expect, it } from "vitest";
import { visualManagerKey } from "../visual/helpers/manager-key.mjs";

// One suite, two targets: the local mock (scripts/local-mocks.mjs --manager-only) and the real
// manager built with --features fake-backend (scripts/conformance.sh in chulacraft-server-manager).
// Requests carry tokens from the website's own mintToken and responses go through the website's
// own parsers, so a mock that drifts from the manager, or a manager that drifts from what the
// website reads, fails here. The contract is docs/ops-manager-contract.md.

process.env.MCSV_JWT_PRIVATE_KEY ||= visualManagerKey;
const { PERMISSION: P, mintToken } = await import("@/lib/mcsv-token");
const ops = await import("@/lib/ops");

const BASE = (process.env.MANAGER_URL ?? "http://127.0.0.1:3212").replace(/\/+$/, "");
const ALL = 2147483647;
const RFC3339 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const BACKUP_ID = /^bk-[0-9TZ]+-(world|supabase|bot)$/;

type Reply = { status: number; body: unknown; text: string };

async function send(method: string, path: string, token: string | null, body?: unknown): Promise<Reply> {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { "Content-Type": "application/json" })
    },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(10_000)
  });
  const text = await response.text();
  let parsed: unknown = null;
  try { parsed = JSON.parse(text); } catch { /* not JSON */ }
  return { status: response.status, body: parsed, text };
}

const call = (method: string, path: string, permission: number, body?: unknown) =>
  send(method, path, mintToken("contract", permission), body);
const get = (path: string, permission: number) => call("GET", path, permission);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Same as `call`, but waits out a 409 (an earlier action on that service still running). */
async function settled(method: string, path: string, permission: number, body?: unknown) {
  for (let i = 0; i < 40; i++) {
    const reply = await call(method, path, permission, body);
    if (reply.status !== 409) return reply;
    await sleep(250);
  }
  return call(method, path, permission, body);
}

function expectError(reply: Reply, status: number) {
  expect(reply.status, reply.text.slice(0, 200)).toBe(status);
  expect(reply.body, reply.text.slice(0, 200)).toEqual({ error: expect.any(String) });
}

/** Signs arbitrary claims the way mintToken does, to forge the tokens the manager must refuse. */
function forge(claims: Record<string, unknown>, key = visualManagerKey) {
  const b64 = (v: unknown) => Buffer.from(JSON.stringify(v)).toString("base64url");
  const signing = `${b64({ alg: "EdDSA", typ: "JWT" })}.${b64(claims)}`;
  return `${signing}.${sign(null, Buffer.from(signing), key).toString("base64url")}`;
}
const goodClaims = (over: Record<string, unknown> = {}) => {
  const iat = Math.floor(Date.now() / 1000);
  return { iss: "chulacraft-web", aud: "mcsv-manager", sub: "forged", jti: randomUUID(), iat, exp: iat + 60, permission: ALL, ...over };
};

// ---- discovery: what this manager offers decides which optional cases run ----

const listed = await get("/services", P.STATUS);
const services = listed.status === 200 ? ops.parseServices(listed.body) : [];
const systemd = services.find((s) => s.kind === "systemd");
const updatable = services.find((s) => s.updatable);
const plain = services.find((s) => !s.updatable);
const withConsole = services.find((s) => s.console);
const SVC = systemd?.id ?? "survival";

describe("the manager is reachable and lists services", () => {
  it("answers GET /services with at least one systemd service to test against", () => {
    expect(listed.status, `${BASE}: ${listed.text}`).toBe(200);
    expect(systemd, "the manager config needs one systemd service").toBeDefined();
  });
});

describe("authentication", () => {
  it("401 with no token, with garbage, and with an empty bearer", async () => {
    for (const token of [null, "garbage", "a.b.c", ""]) expectError(await send("GET", "/services", token), 401);
  });

  it("401 for an expired token", async () => {
    expectError(await send("GET", "/services", mintToken("contract", ALL, undefined, Date.now() - 120_000)), 401);
  });

  it("401 for a token signed by another key", async () => {
    const other = generateKeyPairSync("ed25519").privateKey;
    expectError(await send("GET", "/services", forge(goodClaims(), other)), 401);
  });

  it("401 for the wrong issuer or audience", async () => {
    expectError(await send("GET", "/services", forge(goodClaims({ iss: "someone-else" }))), 401);
    expectError(await send("GET", "/services", forge(goodClaims({ aud: "other-service" }))), 401);
  });

  it("401 for a tampered payload", async () => {
    const [head, , sig] = mintToken("contract", P.STATUS).split(".");
    const payload = Buffer.from(JSON.stringify(goodClaims())).toString("base64url");
    expectError(await send("GET", "/services", `${head}.${payload}.${sig}`), 401);
  });

  it("a valid token with the bit is accepted and one with no bits is 403", async () => {
    expect((await get("/services", P.STATUS)).status).toBe(200);
    expectError(await get("/services", 0), 403);
  });

  // Every endpoint refuses a token that carries every bit except the one it needs: 403, never 401, 404 or 200.
  const gated: [string, string, number, unknown?][] = [
    ["GET", "/services", P.STATUS],
    ["GET", `/service/${SVC}/status`, P.STATUS],
    ["GET", `/service/${SVC}/metrics`, P.STATUS],
    ["GET", `/service/${SVC}/uptime`, P.STATUS],
    ["GET", `/service/${SVC}/image`, P.STATUS],
    ["GET", `/service/${SVC}/rlog`, P.LOGS],
    ["POST", `/service/${SVC}/start`, P.START],
    ["POST", `/service/${SVC}/stop`, P.STOP],
    ["POST", `/service/${SVC}/restart`, P.RESTART],
    ["POST", `/service/${SVC}/update`, P.UPDATE],
    ["GET", "/backups", P.BACKUP_READ],
    ["POST", "/backups", P.BACKUP_RUN, { target: "bot" }],
    ["GET", "/servers", P.STATUS],
    ["GET", `/server/${SVC}/status`, P.STATUS],
    ["GET", `/server/${SVC}/rlog?until=9999999999999999`, P.LOGS]
  ];
  it.each(gated)("%s %s: 401 without a token, 403 without its bit", async (method, path, bit, body) => {
    const legacy = path.startsWith("/server");
    // The aliases are "unchanged": their 401 and 403 may keep their empty body.
    const check = (reply: Reply, status: number) => (legacy ? expect(reply.status).toBe(status) : expectError(reply, status));
    check(await send(method, path, null, body), 401);
    check(await call(method, path, ALL & ~bit, body), 403);
  });
});

describe("GET /services", () => {
  it("returns the contract fields, and the website's parser drops nothing", () => {
    expect(Array.isArray(listed.body)).toBe(true);
    const raw = listed.body as Record<string, unknown>[];
    expect(services.length).toBe(raw.length);
    for (const item of raw) {
      expect(item.id).toMatch(ops.SERVICE_ID);
      expect(typeof item.name).toBe("string");
      expect(["systemd", "docker"]).toContain(item.kind);
      for (const flag of ["console", "backups", "updatable"]) expect(typeof item[flag], `${item.id}.${flag}`).toBe("boolean");
      expect(Array.isArray(item.actions)).toBe(true);
      for (const a of item.actions as string[]) expect(["start", "stop", "restart"]).toContain(a);
    }
    expect(new Set(raw.map((s) => s.id)).size).toBe(raw.length);
  });

  it("never lists the reserved ids the website has fixed pages for", () => {
    for (const s of listed.body as { id: string }[]) expect(["website", "bot"]).not.toContain(s.id);
  });

  it("only lists docker services as updatable, and updatable ones carry no systemd kind", () => {
    for (const s of services) if (s.updatable) expect(s.kind).toBe("docker");
  });
});

describe("GET /service/:id/status", () => {
  it("returns state, since, last_restart and numeric usage", async () => {
    const reply = await get(`/service/${SVC}/status`, P.STATUS);
    expect(reply.status, reply.text).toBe(200);
    const raw = reply.body as Record<string, unknown>;
    expect(["up", "down", "restarting", "unknown"]).toContain(raw.state);
    expect(raw.since).toMatch(RFC3339);
    if (raw.last_restart !== null) expect(raw.last_restart).toMatch(RFC3339);
    for (const k of ["cpu_pct", "mem_bytes", "mem_limit_bytes"]) expect(typeof raw[k], k).toBe("number");
    expect(raw.cpu_pct as number).toBeGreaterThanOrEqual(0);
    expect(raw.cpu_pct as number).toBeLessThanOrEqual(100);
    if (raw.state !== "up") for (const k of ["cpu_pct", "mem_bytes"]) expect(raw[k], `${k} when not up`).toBe(0);
    const parsed = ops.parseStatus(raw);
    expect(parsed.state).toBe(raw.state);
    expect(parsed.cpu_pct).toBe(raw.cpu_pct);
  });
});

describe("GET /service/:id/metrics", () => {
  it("returns 5-minute points oldest first, ending in the current bucket", async () => {
    const reply = await get(`/service/${SVC}/metrics?hours=1`, P.STATUS);
    expect(reply.status, reply.text).toBe(200);
    const raw = reply.body as { t: string; cpu_pct: number; mem_bytes: number }[];
    expect(Array.isArray(raw)).toBe(true);
    expect(raw.length).toBeLessThanOrEqual(13);
    for (const p of raw) {
      expect(p.t).toMatch(RFC3339);
      expect(typeof p.cpu_pct).toBe("number");
      expect(typeof p.mem_bytes).toBe("number");
      expect(Date.parse(p.t) % 300_000).toBe(0);
    }
    const times = raw.map((p) => Date.parse(p.t));
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(ops.parseMetrics(raw)).toHaveLength(raw.length);
  });

  it("defaults to 24 hours and accepts up to 168", async () => {
    expect((await get(`/service/${SVC}/metrics`, P.STATUS)).status).toBe(200);
    expect((await get(`/service/${SVC}/metrics?hours=168`, P.STATUS)).status).toBe(200);
  });

  it("400 for hours outside 1..168 or not a number", async () => {
    for (const hours of ["0", "169", "abc", "-1"]) expectError(await get(`/service/${SVC}/metrics?hours=${hours}`, P.STATUS), 400);
  });
});

describe("GET /service/:id/uptime", () => {
  it("returns hourly points oldest first with up_ratio in 0..1", async () => {
    const reply = await get(`/service/${SVC}/uptime?days=1`, P.STATUS);
    expect(reply.status, reply.text).toBe(200);
    const raw = reply.body as { t: string; up_ratio: number }[];
    expect(raw.length).toBeLessThanOrEqual(25);
    for (const p of raw) {
      expect(p.t).toMatch(RFC3339);
      expect(p.up_ratio).toBeGreaterThanOrEqual(0);
      expect(p.up_ratio).toBeLessThanOrEqual(1);
      expect(Date.parse(p.t) % 3_600_000).toBe(0);
    }
    const times = raw.map((p) => Date.parse(p.t));
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(ops.parseUptime(raw)).toHaveLength(raw.length);
  });

  it("defaults to 7 days; 400 for days outside 1..7", async () => {
    expect((await get(`/service/${SVC}/uptime`, P.STATUS)).status).toBe(200);
    for (const days of ["0", "8", "abc"]) expectError(await get(`/service/${SVC}/uptime?days=${days}`, P.STATUS), 400);
  });
});

describe("GET /service/:id/rlog", () => {
  it("returns objects with a message, newest first", async () => {
    const reply = await get(`/service/${SVC}/rlog?max_lines=5`, P.LOGS);
    expect(reply.status, reply.text).toBe(200);
    const raw = reply.body as { message: string }[];
    expect(Array.isArray(raw)).toBe(true);
    expect(raw.length).toBeLessThanOrEqual(5);
    for (const line of raw) expect(typeof line.message).toBe("string");
  });

  it("takes an until timestamp, and 400 when it is not RFC 3339", async () => {
    const past = await get(`/service/${SVC}/rlog?until=1960-01-01T00:00:00Z`, P.LOGS);
    expect(past.status, past.text).toBe(200);
    expect(past.body).toEqual([]);
    expect((await get(`/service/${SVC}/rlog?until=${encodeURIComponent(new Date().toISOString())}`, P.LOGS)).status).toBe(200);
    expectError(await get(`/service/${SVC}/rlog?until=yesterday`, P.LOGS), 400);
  });
});

describe("unknown services", () => {
  it("404 on every per-service endpoint, with an error body", async () => {
    const missing = "no-such-service";
    for (const [method, path, bit] of [
      ["GET", "status", P.STATUS], ["GET", "metrics", P.STATUS], ["GET", "uptime", P.STATUS], ["GET", "rlog", P.LOGS],
      ["GET", "image", P.STATUS], ["POST", "start", P.START], ["POST", "stop", P.STOP], ["POST", "restart", P.RESTART],
      ["POST", "update", P.UPDATE]
    ] as const) {
      expectError(await call(method, `/service/${missing}/${path}`, bit), 404);
    }
  });

  it("404 for an action the contract does not define", async () => {
    expectError(await call("POST", `/service/${SVC}/explode`, ALL), 404);
  });
});

describe("POST /service/:id/{start|stop|restart}", () => {
  it("restart answers 202 with an empty object and the state follows", async () => {
    const reply = await settled("POST", `/service/${SVC}/restart`, P.RESTART);
    expect(reply.status, reply.text).toBe(202);
    expect(reply.body).toEqual({});
    const status = await get(`/service/${SVC}/status`, P.STATUS);
    expect(["up", "restarting"]).toContain((status.body as { state: string }).state);
    expect((status.body as { last_restart: string | null }).last_restart).not.toBeNull();
  });

  it("stop then start answer 202 with an empty object", async () => {
    for (const [action, bit] of [["stop", P.STOP], ["start", P.START]] as const) {
      const reply = await settled("POST", `/service/${SVC}/${action}`, bit);
      expect(reply.status, `${action}: ${reply.text}`).toBe(202);
      expect(reply.body).toEqual({});
    }
  });

  it("two simultaneous actions on one service end in 202 and 409, never an error", async () => {
    await settled("POST", `/service/${SVC}/restart`, P.RESTART);
    await sleep(1000);
    const replies = await Promise.all([0, 1].map(() => call("POST", `/service/${SVC}/restart`, P.RESTART)));
    for (const r of replies) expect([202, 409], r.text).toContain(r.status);
    expect(replies.some((r) => r.status === 202)).toBe(true);
    await sleep(1000);
  });

  it.skipIf(!services.some((s) => s.actions.length < 3))("404 for an action the service does not allow", async () => {
    const limited = services.find((s) => s.actions.length < 3)!;
    const refused = (["start", "stop", "restart"] as const).find((a) => !limited.actions.includes(a))!;
    const bit = { start: P.START, stop: P.STOP, restart: P.RESTART }[refused];
    expectError(await call("POST", `/service/${limited.id}/${refused}`, bit), 404);
  });
});

describe("console WebSocket", () => {
  const open = (path: string, protocols: string[]) =>
    new Promise<"open" | "refused">((resolve) => {
      const socket = new WebSocket(`${BASE.replace(/^http/, "ws")}${path}`, protocols);
      const timer = setTimeout(() => { socket.close(); resolve("refused"); }, 5000);
      socket.onopen = () => { clearTimeout(timer); socket.close(); resolve("open"); };
      socket.onerror = () => { clearTimeout(timer); resolve("refused"); };
      socket.onclose = () => { clearTimeout(timer); resolve("refused"); };
    });

  it.skipIf(!withConsole)("opens with the token as the second subprotocol", async () => {
    expect(await open(`/service/${withConsole!.id}/console`, ["mcsv.jwt", mintToken("contract", P.CONSOLE_READ)])).toBe("open");
  });

  it.skipIf(!withConsole)("is refused without a token, with a bad token, and without CONSOLE_READ", async () => {
    const path = `/service/${withConsole!.id}/console`;
    expect(await open(path, ["mcsv.jwt"])).toBe("refused");
    expect(await open(path, ["mcsv.jwt", "garbage"])).toBe("refused");
    expect(await open(path, ["mcsv.jwt", mintToken("contract", ALL & ~P.CONSOLE_READ)])).toBe("refused");
  });

  it.skipIf(!plain || plain.console)("is 404 for a service without a console", async () => {
    expect(await open(`/service/${plain!.id}/console`, ["mcsv.jwt", mintToken("contract", P.CONSOLE_READ)])).toBe("refused");
  });
});

describe("backups", () => {
  async function untilIdle(target: string) {
    for (let i = 0; i < 40; i++) {
      const list = (await get("/backups", P.BACKUP_READ)).body as { target: string; status: string }[];
      if (!list.some((b) => b.target === target && b.status === "running")) return;
      await sleep(500);
    }
    throw new Error(`a ${target} backup is still running; restart the manager for a clean run`);
  }

  it("GET /backups lists the contract fields newest first, and the parser drops nothing", async () => {
    const reply = await get("/backups", P.BACKUP_READ);
    expect(reply.status, reply.text).toBe(200);
    const raw = reply.body as Record<string, unknown>[];
    expect(Array.isArray(raw)).toBe(true);
    for (const b of raw) {
      expect(b.id, "backup id").toMatch(BACKUP_ID);
      expect(["world", "supabase", "bot"]).toContain(b.target);
      expect(["manual", "nightly"]).toContain(b.kind);
      expect(["running", "ok", "failed"]).toContain(b.status);
      expect(typeof b.size_bytes).toBe("number");
      expect(b.created_at).toMatch(RFC3339);
    }
    const times = raw.map((b) => Date.parse(b.created_at as string));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
    expect(ops.parseBackups(raw)).toHaveLength(raw.length);
  });

  it("POST /backups: 400 for an unknown target, a missing target and a body that is not JSON", async () => {
    for (const body of [{ target: "etc" }, { target: "../world" }, {}, { target: 5 }, "{not json"]) {
      expectError(await call("POST", "/backups", P.BACKUP_RUN, body), 400);
    }
  });

  it("POST /backups answers 202 with a contract id, lists it as running, and a second request is 409", async () => {
    await untilIdle("bot");
    const reply = await call("POST", "/backups", P.BACKUP_RUN, { target: "bot" });
    expect(reply.status, reply.text).toBe(202);
    const id = (reply.body as { id: string }).id;
    expect(id).toMatch(BACKUP_ID);
    expect(id.endsWith("-bot")).toBe(true);

    const list = (await get("/backups", P.BACKUP_READ)).body as { id: string; kind: string; status: string }[];
    const entry = list.find((b) => b.id === id);
    expect(entry, `${id} in GET /backups`).toBeDefined();
    expect(entry).toMatchObject({ kind: "manual", status: "running" });

    expectError(await call("POST", "/backups", P.BACKUP_RUN, { target: "bot" }), 409);
  });
});

describe("images and updates", () => {
  it.skipIf(!updatable)("GET /service/:id/image reads as <image:tag>@<8 hex> and the parser accepts it", async () => {
    const reply = await get(`/service/${updatable!.id}/image`, P.STATUS);
    // A docker service on a host with no Docker answers 503 (the contract's error table), not a made-up body.
    if (reply.status === 503) return expectError(reply, 503);
    expect(reply.status, reply.text).toBe(200);
    const raw = reply.body as { current: string; latest: string; checked_at: string | null };
    for (const ref of [raw.current, raw.latest]) expect(ref).toMatch(/^[^@\s]+@([0-9a-f]{8}|unknown)$/);
    if (raw.checked_at !== null) expect(raw.checked_at).toMatch(RFC3339);
    expect(ops.parseImage(raw)).not.toBeNull();
  });

  it.skipIf(!plain || plain.updatable)("image and update are 404 on a service that is not updatable", async () => {
    expectError(await get(`/service/${plain!.id}/image`, P.STATUS), 404);
    expectError(await call("POST", `/service/${plain!.id}/update`, P.UPDATE), 404);
  });

  it.skipIf(!updatable)("POST /service/:id/update answers 202 and afterwards current equals latest", async () => {
    const reply = await settled("POST", `/service/${updatable!.id}/update`, P.UPDATE);
    if (reply.status === 503) return expectError(reply, 503);
    expect(reply.status, reply.text).toBe(202);
    for (let i = 0; i < 20; i++) {
      const image = (await get(`/service/${updatable!.id}/image`, P.STATUS)).body as { current: string; latest: string };
      if (image.current === image.latest) return;
      await sleep(500);
    }
    throw new Error("current never caught up with latest");
  });
});

describe("aliases (kept until the website no longer uses them)", () => {
  it("GET /servers lists the instance names", async () => {
    const reply = await get("/servers", P.STATUS);
    expect(reply.status, reply.text).toBe(200);
    expect(reply.body).toContain(SVC);
  });

  it("GET /server/:id/status and /rlog answer 200, an unknown name does not", async () => {
    expect((await get(`/server/${SVC}/status`, P.STATUS)).status).toBe(200);
    const log = await get(`/server/${SVC}/rlog?max_lines=3&until=9999999999999999`, P.LOGS);
    expect(log.status, log.text).toBe(200);
    expect(Array.isArray(log.body)).toBe(true);
    expect((await get("/server/no-such-service/status", P.STATUS)).status).toBeGreaterThanOrEqual(400);
  });
});
