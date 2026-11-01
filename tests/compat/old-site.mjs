#!/usr/bin/env node
// T3.6: old-site compatibility. Proves that pre-v1.1 website builds (ca8fb70, and the G1 build =
// ca8fb70 + Next 16.4.3) still work against the FINAL v1.1 schema on a LOCAL Supabase stack.
//
//   1. Catalog: every RPC the old code calls still exists exactly once, accepts the old arguments,
//      and still returns every column the old generated types declare.
//   2. Live: the six list RPCs called with the old argument shapes as a local owner.
//   3. HTTP: /, /events, /announcements return 200 and show seeded rows; admin pages load with an owner session.
//   4. /admin/server is the one expected break (admin_server_console_access was dropped).
//
// Local only: refuses any Supabase URL that is not loopback. Needs the dev users from supabase/dev-seed.sql,
// the old sites already built and running (`next start -H 127.0.0.1`), and the db container name.
//
//   SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_ANON_KEY=... \
//   OLD_SITES='ca8fb70=/path/old-ca8fb70=3360,g1=/path/old-g1=3361' node tests/compat/old-site.mjs
//
// Exit 0 = no unexpected failure. Cleans up the rows it creates.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const URL_ = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON = process.env.SUPABASE_ANON_KEY;
const DB = process.env.DB_CONTAINER ?? "supabase_db_chulacraft";
const SITES = (process.env.OLD_SITES ?? "").split(",").filter(Boolean).map((s) => {
  const [name, dir, port] = s.split("=");
  return { name, dir, base: `http://127.0.0.1:${port}` };
});
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(URL_)) throw new Error(`refusing non-local SUPABASE_URL ${URL_}`);
if (!ANON || !SITES.length) throw new Error("set SUPABASE_ANON_KEY and OLD_SITES (name=dir=port,...)");

const results = [];
const check = (label, ok, detail = "") => {
  results.push({ label, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${label}${detail ? ` -- ${detail}` : ""}`);
};

// ---- 1. catalog ------------------------------------------------------------------------------
const psql = (sql) => execFileSync("docker", ["exec", DB, "psql", "-U", "postgres", "-tA", "-c", sql], { encoding: "utf8" }).trim();
const catalog = JSON.parse(psql(`select coalesce(json_agg(json_build_object('name', p.proname, 'args', p.proargnames,
  'modes', p.proargmodes, 'nin', p.pronargs, 'ndef', p.pronargdefaults)), '[]') from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'`));
const byName = new Map();
for (const f of catalog) byName.set(f.name, [...(byName.get(f.name) ?? []), f]);

function parseTypes(dir) {
  const src = readFileSync(join(dir, "src/lib/supabase/database.types.ts"), "utf8");
  const fns = {};
  const re = /"([a-z_0-9]+)":\s*\{ Args: (Record<PropertyKey, never>|\{([^}]*)\}); Returns: (undefined|[^;\n]*?\{([^}]*)\}\s*\[\]|[^;\n]*?)\s*(?:\n|;)/g;
  for (const m of src.matchAll(re)) {
    const args = {};
    for (const a of (m[3] ?? "").matchAll(/"([a-z_0-9]+)"(\?)?:/g)) args[a[1]] = !a[2];
    const cols = [...(m[5] ?? "").matchAll(/"([a-z_0-9]+)":/g)].map((c) => c[1]);
    fns[m[1]] = { args, cols };
  }
  return fns;
}
function rpcNames(dir) {
  const out = execFileSync("grep", ["-rhoE", 'rpc\\("[a-z_0-9]+"', join(dir, "src")], { encoding: "utf8" });
  return [...new Set([...out.matchAll(/rpc\("([a-z_0-9]+)"/g)].map((m) => m[1]))].sort();
}

// ---- auth + rpc helpers -------------------------------------------------------------------------
async function signIn(email) {
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: ANON, "content-type": "application/json" },
    body: JSON.stringify({ email, password: "dev-password" })
  });
  if (!r.ok) throw new Error(`sign-in ${email}: ${r.status} ${await r.text()} (apply supabase/dev-seed.sql to the LOCAL stack)`);
  return r.json();
}
const rpc = async (token, name, args = {}) => {
  const r = await fetch(`${URL_}/rest/v1/rpc/${name}`, {
    method: "POST", headers: { apikey: ANON, authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(args)
  });
  const text = await r.text();
  let body; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: r.status, body };
};
function sessionCookie(session) {
  const ref = new URL(URL_).hostname.split(".")[0]; // @supabase/ssr: sb-<first label of host>-auth-token
  const enc = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
  const name = `sb-${ref}-auth-token`;
  if (enc.length <= 3180) return `${name}=${enc}`;
  const parts = []; for (let i = 0; i * 3180 < enc.length; i++) parts.push(`${name}.${i}=${enc.slice(i * 3180, (i + 1) * 3180)}`);
  return parts.join("; ");
}

const EXPECTED_DROPPED = new Set(["admin_server_console_access"]);
const SIX = ["list_upcoming_events", "list_past_events", "admin_list_events", "list_announcements", "admin_list_announcements", "admin_list_achievements"];
const SIX_ARGS = { list_upcoming_events: { p_limit: 12 }, list_past_events: { p_limit: 24 }, list_announcements: { p_limit: 50 } };

for (const site of SITES) {
  console.log(`\n== catalog: ${site.name} ==`);
  const types = parseTypes(site.dir);
  for (const name of rpcNames(site.dir)) {
    const old = types[name];
    const now = byName.get(name);
    if (!now) { check(`${site.name} rpc ${name} exists`, EXPECTED_DROPPED.has(name), EXPECTED_DROPPED.has(name) ? "dropped (expected)" : "MISSING"); continue; }
    const problems = [];
    if (now.length > 1) problems.push(`${now.length} overloads (PostgREST ambiguity risk)`);
    const f = now[0];
    const modes = f.modes ?? (f.args ?? []).map(() => "i");
    const names = f.args ?? [];
    const inArgs = names.filter((_, i) => ["i", "b", "v"].includes(modes[i]));
    const outCols = names.filter((_, i) => ["t", "o", "b"].includes(modes[i]));
    const required = inArgs.slice(0, Math.max(0, inArgs.length - f.ndef));
    if (old) {
      for (const [a, req] of Object.entries(old.args)) if (req && !inArgs.includes(a)) problems.push(`old always passes ${a}, no longer accepted`);
      for (const a of Object.keys(old.args)) if (!inArgs.includes(a) && !old.args[a]) problems.push(`old may pass optional ${a}, no longer accepted`);
      for (const a of required) if (!(a in old.args)) problems.push(`new required arg ${a} never passed by old code`);
      if (outCols.length) for (const c of old.cols) if (!outCols.includes(c)) problems.push(`column ${c} no longer returned`);
    } else problems.push("not in old generated types, only existence checked");
    const hard = problems.filter((p) => !p.startsWith("not in old"));
    check(`${site.name} rpc ${name} compatible`, hard.length === 0, problems.join("; "));
  }
}

// ---- 2 + 3. live data, HTTP ---------------------------------------------------------------------
const owner = await signIn("owner@dev.local");
const tok = owner.access_token;
const tag = `T36 compat ${Date.now()}`;
const created = { event: [], announcement: null, achievement: null };
const future = (d) => new Date(Date.now() + d * 864e5).toISOString();
try {
  const uuid = () => crypto.randomUUID();
  const ev = async (suffix, startDays) => {
    const id = uuid();
    const r = await rpc(tok, "admin_upsert_event", { p_id: id, p_name: `${tag} ${suffix}`, p_description: "compat", p_starts_at: future(startDays),
      p_ends_at: future(startDays + 0.1), p_location: "Compat Hall", p_image_path: "compat/t36.png", p_status: "published" });
    check(`seed admin_upsert_event ${suffix}`, r.status === 200 && r.body === id, JSON.stringify(r.body));
    created.event.push(id); return id;
  };
  const upcomingId = await ev("upcoming", 7);
  await ev("past", -7);
  const annId = uuid();
  let r = await rpc(tok, "admin_upsert_announcement", { p_id: annId, p_title: `${tag} announcement`, p_body: "compat body", p_severity: "info",
    p_pinned: true, p_published_at: future(-1), p_expires_at: null, p_post_to_discord: false });
  check("seed admin_upsert_announcement", r.status === 200 && r.body === annId, JSON.stringify(r.body));
  created.announcement = annId;
  const achId = uuid();
  r = await rpc(tok, "admin_upsert_achievement", { p_id: achId, p_name: `${tag} achievement`, p_description: "compat", p_image_path: "compat/t36.png", p_status: "published" });
  check("seed admin_upsert_achievement", r.status === 200 && r.body === achId, JSON.stringify(r.body));
  created.achievement = achId;

  console.log("\n== live RPC shapes (old argument shapes, owner) ==");
  const rows = {};
  for (const name of SIX) {
    const res = await rpc(tok, name, SIX_ARGS[name] ?? {});
    const ok = res.status === 200 && Array.isArray(res.body) && res.body.length > 0;
    check(`live ${name} returns rows`, ok, ok ? "" : `${res.status} ${JSON.stringify(res.body).slice(0, 200)}`);
    rows[name] = ok ? res.body[0] : null;
  }
  for (const site of SITES) {
    const types = parseTypes(site.dir);
    for (const name of SIX) if (rows[name]) {
      const missing = types[name].cols.filter((c) => !(c in rows[name]));
      check(`${site.name} live ${name} has every old column`, missing.length === 0, missing.length ? `missing ${missing.join(",")}` : "");
    }
  }
  r = await rpc(tok, "admin_server_console_access", { p_jti: uuid(), p_server: "x", p_action: "status" });
  check("admin_server_console_access is gone (expected break)", r.status === 404, `${r.status} ${JSON.stringify(r.body).slice(0, 120)}`);

  const cookie = sessionCookie(owner);
  const get = async (base, path, withCookie) => {
    const res = await fetch(base + path, { headers: withCookie ? { cookie } : {}, redirect: "manual" });
    return { status: res.status, text: await res.text() };
  };
  const BAD = /Something went wrong|Application error|Internal Server Error/;
  for (const site of SITES) {
    console.log(`\n== HTTP: ${site.name} ${site.base} ==`);
    for (const [path, needle] of [["/", null], ["/events", `${tag} upcoming`], ["/announcements", `${tag} announcement`]]) {
      const res = await get(site.base, path, false);
      check(`${site.name} GET ${path} 200`, res.status === 200 && !BAD.test(res.text) && (!needle || res.text.includes(needle)),
        `${res.status}${needle && !res.text.includes(needle) ? " seeded row not rendered" : ""}`);
    }
    // A 200 alone proves nothing: signed-out requests also get a 200 sign-in shell. Each page must show
    // data only the owner session can read.
    const adminPaths = [["/admin", "Dev Owner"], ["/admin/achievements", `${tag} achievement`], ["/admin/achievements/events/" + upcomingId, `${tag} upcoming`],
      ["/admin/achievements/" + achId, `${tag} achievement`], [`/admin/achievements/${achId}/award`, `${tag} achievement`],
      ["/admin/announcements", `${tag} announcement`], ["/admin/announcements/" + annId, `${tag} announcement`], ["/admin/players", "Dev Verified"],
      ["/admin/audit", "Dev Owner"], ["/admin/appeals", "Dev Owner"], ["/admin/reports", "Dev Owner"], ["/admin/restore", "Dev Owner"],
      ["/admin/users/00000000-0000-4000-8000-000000000005", "Dev Verified"]];
    for (const [path, needle] of adminPaths) {
      const res = await get(site.base, path, true);
      const ok = res.status === 200 && !BAD.test(res.text) && res.text.includes(needle);
      check(`${site.name} owner GET ${path} 200`, ok, `${res.status}${BAD.test(res.text) ? " error boundary" : ""}${res.text.includes(needle) ? "" : ` missing "${needle}"`}`);
    }
    // Expected break: its token mint calls the dropped RPC, so the page can only show "manager unreachable".
    const srv = await get(site.base, "/admin/server", true);
    console.log(`INFO ${site.name} GET /admin/server -> ${srv.status} (expected degraded: dropped RPC${/unreachable|can.t reach|could not/i.test(srv.text) ? ", unreachable alert shown" : ""})`);
  }
} finally {
  const del = (n, id) => id && rpc(tok, n, { p_id: id });
  for (const id of created.event) await del("admin_delete_event", id);
  await del("admin_delete_announcement", created.announcement);
  await del("admin_delete_achievement", created.achievement);
}

const failed = results.filter((x) => !x.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) { console.log("FAILURES:"); for (const f of failed) console.log(` - ${f.label} ${f.detail}`); }
process.exit(failed.length ? 1 : 0);
