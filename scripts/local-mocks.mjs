#!/usr/bin/env node
// LOCAL DEV ONLY: stand-ins for the services `next dev` + `supabase start` can't
// reach from a laptop, so every page and flow can be clicked through locally.
//
//   npm run dev:mocks -- --setup   once: dev signing key + env values (see below)
//   npm run dev:mocks              run the mocks (Ctrl+C to stop)
//
// What runs:
//   Discord OAuth   local Supabase Auth's Discord provider points here
//                   (supabase/config.toml url = env(LOCAL_DISCORD_MOCK_URL)),
//                   so "Continue with Discord" runs the real callback flow.
//                   Real Google can't be mocked: Supabase Auth ignores a URL
//                   override for Google. Use --google to attach a Google
//                   identity to a user and test /verify instead.
//   Server manager  /servers, status, rlog, start/stop/restart and the console
//                   WebSocket, checking the EdDSA token exactly like the real one.
//   Minecraft ping  answers the server-list ping, so the "Online · N/M" badge shows.
//
// Every listener binds to loopback, except the Discord mock, which binds to the
// Supabase docker network gateway (a host-only address) because both the browser
// and the Supabase Auth container must reach it at the same URL.

import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, randomBytes, randomUUID, verify } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { createServer as createTcpServer } from "node:net";

const ENV_FILE = ".env.development.local";
const SUPABASE_ENV_FILE = "supabase/.env";
const PORTS = { manager: 54340, minecraft: 54341, discord: 54342 };
const DOCKER_NETWORK = "supabase_network_chulacraft";

// ---------- env files ----------

function readEnv(file) {
  if (!existsSync(file)) return {};
  return Object.fromEntries(readFileSync(file, "utf8").split("\n")
    .map((line) => line.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].replace(/^"(.*)"$/, "$1")]));
}

/** Adds keys that are missing; never overwrites a value someone set by hand. */
function addEnv(file, values, header) {
  const current = readEnv(file);
  const missing = Object.entries(values).filter(([key]) => !(key in current));
  if (missing.length === 0) return [];
  const text = existsSync(file) ? readFileSync(file, "utf8") : "";
  const block = `${text && !text.endsWith("\n") ? "\n" : ""}${header}\n${missing.map(([k, v]) => `${k}=${v}`).join("\n")}\n`;
  writeFileSync(file, text + block);
  return missing.map(([key]) => key);
}

const env = readEnv(ENV_FILE);
// Same rule as DEV_LOGIN_ENABLED (src/lib/dev-login.ts): only against a local Supabase.
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(env.NEXT_PUBLIC_SUPABASE_URL ?? "")) {
  console.error(`Refusing to run: NEXT_PUBLIC_SUPABASE_URL in ${ENV_FILE} must be a local Supabase (http://127.0.0.1:…).`);
  process.exit(1);
}
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "");

function dockerGateway() {
  try {
    return execFileSync("docker", ["network", "inspect", DOCKER_NETWORK, "--format", "{{(index .IPAM.Config 0).Gateway}}"]).toString().trim();
  } catch {
    console.error(`Could not read the ${DOCKER_NETWORK} gateway. Is \`supabase start\` running?`);
    process.exit(1);
  }
}

// ---------- --setup ----------

if (process.argv.includes("--setup")) {
  const keyValues = {};
  if (!env.MCSV_JWT_PRIVATE_KEY) {
    const { privateKey } = generateKeyPairSync("ed25519");
    // Quoted: the PEM has spaces, so an unquoted value breaks `source .env.development.local`.
    keyValues.MCSV_JWT_PRIVATE_KEY = `"${privateKey.export({ type: "pkcs8", format: "pem" }).toString().trim().replace(/\n/g, "\\n")}"`;
  }
  const added = addEnv(ENV_FILE, {
    ...keyValues,
    MCSV_MANAGER_URL: `http://127.0.0.1:${PORTS.manager}`,
    NEXT_PUBLIC_MINECRAFT_SERVER_ADDRESS: `127.0.0.1:${PORTS.minecraft}`,
  }, "# LOCAL DEV ONLY (scripts/local-mocks.mjs): dev signing key and mock service addresses.");
  const discordUrl = `http://${dockerGateway()}:${PORTS.discord}`;
  const addedSupabase = addEnv(SUPABASE_ENV_FILE, { LOCAL_DISCORD_MOCK_URL: discordUrl },
    "# LOCAL DEV ONLY (scripts/local-mocks.mjs): Discord OAuth mock for supabase/config.toml.");
  console.log(added.length ? `${ENV_FILE}: added ${added.join(", ")}` : `${ENV_FILE}: already set up`);
  console.log(addedSupabase.length ? `${SUPABASE_ENV_FILE}: added LOCAL_DISCORD_MOCK_URL=${discordUrl}` : `${SUPABASE_ENV_FILE}: already set up`);
  if (added.length) console.log("Restart `npm run dev` so Next.js picks up the new values.");
  if (addedSupabase.length) console.log("Restart Supabase so Auth picks up the Discord mock: npx supabase stop && npx supabase start");
  process.exit(0);
}

// ---------- --google <email> [--unverified] [--sub <id>] ----------
// Attaches a Google identity to the user signed in most recently through the
// Discord mock (or --user <uuid>), as if they had linked Google. Load /verify
// next: it runs the same reconcileIdentities() as /auth/callback.

if (process.argv.includes("--google")) {
  const arg = (name) => process.argv[process.argv.indexOf(name) + 1];
  const email = arg("--google");
  const sub = process.argv.includes("--sub") ? arg("--sub") : `mock-google-${randomUUID()}`;
  const verified = !process.argv.includes("--unverified");
  const userSql = process.argv.includes("--user")
    ? `'${arg("--user").replace(/[^0-9a-f-]/gi, "")}'::uuid`
    : "(select user_id from auth.identities where provider = 'discord' and provider_id like 'mock-%' order by last_sign_in_at desc nulls last limit 1)";
  const quote = (s) => `'${String(s).replace(/'/g, "''")}'`;
  const sql = `insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    select ${quote(sub)}, u, jsonb_build_object('sub', ${quote(sub)}, 'email', ${quote(email)}, 'email_verified', ${verified}), 'google', now(), now(), now()
    from (select ${userSql} as u) t where u is not null returning user_id;`;
  const out = execFileSync("docker", ["exec", "-i", "supabase_db_chulacraft", "psql", "-U", "postgres", "-tA", "-c", sql]).toString().trim();
  console.log(out ? `Linked Google ${email} (${verified ? "verified" : "unverified"}, sub ${sub}) to user ${out.split("\n")[0]}. Now open /verify.` : "No mock-Discord user found; sign in with the Discord mock first or pass --user <uuid>.");
  process.exit(0);
}

// ---------- shared ----------

const html = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:480px;margin:40px auto;padding:0 16px;background:#202024;color:#eee}
button{display:block;width:100%;min-height:48px;margin:8px 0;font:inherit;font-weight:600;border:0;border-radius:6px;background:#5865f2;color:#fff;cursor:pointer}
button.deny{background:#444}small{color:#aaa}</style></head><body>${body}</body></html>`;

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// ---------- Discord OAuth mock ----------

// Seeded users from supabase/dev-seed.sql (provider_id is their Discord id), plus a new player.
const DISCORD_USERS = {
  "dev-discord-admin": { name: "Dev Admin", email: "admin@dev.local" },
  "dev-discord-owner": { name: "Dev Owner", email: "owner@dev.local" },
  "dev-discord-verified": { name: "Dev Verified", email: "verified@dev.local" },
  "dev-discord-guest": { name: "Dev Guest", email: "guest@dev.local" },
  "dev-discord-unverified": { name: "Dev Unverified", email: "unverified@dev.local" },
};
const codes = new Map();
const tokens = new Map();

function startDiscord(host) {
  // Only redirect back to the local Supabase Auth callback: no open redirect.
  const allowedRedirect = `${supabaseUrl}/auth/v1/callback`;
  createServer(async (req, res) => {
    const url = new URL(req.url, `http://${host}`);
    const send = (status, type, body, headers = {}) => { res.writeHead(status, { "content-type": type, ...headers }); res.end(body); };

    if (req.method === "GET" && url.pathname === "/api/oauth2/authorize") {
      const redirect = url.searchParams.get("redirect_uri") ?? "";
      if (redirect !== allowedRedirect) return send(400, "text/plain", `redirect_uri must be ${allowedRedirect}`);
      const hidden = `<input type="hidden" name="redirect_uri" value="${escapeHtml(redirect)}"><input type="hidden" name="state" value="${escapeHtml(url.searchParams.get("state") ?? "")}">`;
      const choices = Object.entries(DISCORD_USERS).map(([id, u]) => `<button name="pick" value="${id}">${escapeHtml(u.name)} <small>(${id})</small></button>`).join("");
      return send(200, "text/html", html("Mock Discord", `<h1>Mock Discord</h1><p>Local stand-in for Discord sign-in. Pick who to sign in as.</p>
        <form action="/api/oauth2/approve" method="get">${hidden}<button name="pick" value="new">New player <small>(fresh Discord account)</small></button>${choices}
        <button class="deny" name="pick" value="deny">Deny (Cancel)</button></form>`));
    }

    if (req.method === "GET" && url.pathname === "/api/oauth2/approve") {
      // Compare the raw value first: new URL() throws on junk and would take every mock down.
      if (url.searchParams.get("redirect_uri") !== allowedRedirect) return send(400, "text/plain", "bad redirect_uri");
      const redirect = new URL(allowedRedirect);
      redirect.searchParams.set("state", url.searchParams.get("state") ?? "");
      const pick = url.searchParams.get("pick");
      if (pick === "deny") {
        redirect.searchParams.set("error", "access_denied");
        redirect.searchParams.set("error_description", "The resource owner or authorization server denied the request");
      } else {
        const n = randomBytes(3).toString("hex");
        const user = pick && Object.hasOwn(DISCORD_USERS, pick)
          ? { id: pick, username: pick, global_name: DISCORD_USERS[pick].name, email: DISCORD_USERS[pick].email }
          : { id: `mock-${n}`, username: `newplayer_${n}`, global_name: `New Player ${n}`, email: `newplayer_${n}@mock.discord.local` };
        const code = randomUUID();
        codes.set(code, user);
        redirect.searchParams.set("code", code);
      }
      return send(302, "text/plain", "", { location: redirect.href });
    }

    if (req.method === "POST" && url.pathname === "/api/oauth2/token") {
      let body = "";
      for await (const chunk of req) body += chunk;
      const code = new URLSearchParams(body).get("code");
      const user = codes.get(code);
      if (!user) return send(400, "application/json", JSON.stringify({ error: "invalid_grant" }));
      codes.delete(code);
      const token = randomUUID();
      tokens.set(token, user);
      return send(200, "application/json", JSON.stringify({ access_token: token, token_type: "Bearer", expires_in: 604800, refresh_token: randomUUID(), scope: "identify email" }));
    }

    if (req.method === "GET" && url.pathname === "/api/users/@me") {
      const user = tokens.get((req.headers.authorization ?? "").replace(/^Bearer /, ""));
      if (!user) return send(401, "application/json", JSON.stringify({ message: "401: Unauthorized" }));
      return send(200, "application/json", JSON.stringify({ ...user, discriminator: "0", avatar: null, verified: true }));
    }

    send(404, "text/plain", "not found");
  }).listen(PORTS.discord, host, () => console.log(`Discord OAuth mock   http://${host}:${PORTS.discord}`));
}

// ---------- server manager mock ----------

const PERMISSION = { STATUS: 1, LOGS: 2, CONSOLE_READ: 4, CONSOLE_WRITE: 8, START: 16, STOP: 32, RESTART: 64 };
const ACTION_BITS = { start: PERMISSION.START, stop: PERMISSION.STOP, restart: PERMISSION.RESTART };

/** Same checks as chulacraft-server-manager: EdDSA signature, audience, expiry, permission bits. */
function checkToken(token, need, publicKey) {
  const [header, payload, signature] = (token ?? "").split(".");
  if (!signature) return "malformed token";
  if (!verify(null, Buffer.from(`${header}.${payload}`), publicKey, Buffer.from(signature, "base64url"))) return "bad signature";
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (claims.aud !== "mcsv-manager" || claims.iss !== "chulacraft-web") return "wrong audience";
  if (!Number.isFinite(claims.exp) || claims.exp * 1000 < Date.now()) return "expired";
  if ((claims.permission & need) !== need) return "missing permission";
  return null;
}

const servers = {
  survival: { active: true, startedAt: Date.now() - 3 * 3600 * 1000, log: [] },
  creative: { active: false, startedAt: 0, log: [] },
};
const consoles = new Set();

function log(name, message) {
  const line = `[${new Date().toISOString().slice(11, 19)} INFO]: ${message}`;
  const s = servers[name];
  s.log.push({ message: line, at: Date.now() * 1000 });
  if (s.log.length > 500) s.log.shift();
  for (const c of consoles) if (c.server === name) sendFrame(c.socket, JSON.stringify({ type: "log", message: line }));
}
for (const name of Object.keys(servers)) for (let i = 1; i <= 30; i++) log(name, `Mock ${name} boot line ${i}`);

/** Minimal RFC 6455 text frame (server frames are never masked). */
function sendFrame(socket, text, opcode = 0x1) {
  const data = Buffer.from(text);
  const head = data.length < 126 ? Buffer.from([0x80 | opcode, data.length])
    : Buffer.from([0x80 | opcode, 126, data.length >> 8, data.length & 0xff]);
  socket.write(Buffer.concat([head, data]));
}

/** Parses complete client frames out of `buffer`; returns [frames, rest]. */
function readFrames(buffer) {
  const frames = [];
  while (buffer.length >= 6) {
    const opcode = buffer[0] & 0x0f;
    let length = buffer[1] & 0x7f, offset = 2;
    if (length === 126) { length = buffer.readUInt16BE(2); offset = 4; }
    else if (length === 127) { length = Number(buffer.readBigUInt64BE(2)); offset = 10; }
    if (buffer.length < offset + 4 + length) break;
    const mask = buffer.subarray(offset, offset + 4);
    const data = Buffer.from(buffer.subarray(offset + 4, offset + 4 + length).map((b, i) => b ^ mask[i % 4]));
    frames.push({ opcode, data });
    buffer = buffer.subarray(offset + 4 + length);
  }
  return [frames, buffer];
}

function startManager() {
  const pem = env.MCSV_JWT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!pem) {
    console.error(`MCSV_JWT_PRIVATE_KEY missing in ${ENV_FILE}: run npm run dev:mocks -- --setup`);
    process.exit(1);
  }
  const publicKey = createPublicKey(createPrivateKey(pem));
  const status = (s) => ({
    unit: s.active ? { active_state: "active", sub_state: "running" } : { active_state: "inactive", sub_state: "dead" },
    ...(s.active ? { stat: { run_time: Math.floor((Date.now() - s.startedAt) / 1000), memory: 3.2 * 1024 ** 3, cpu_usage: 12 + Math.random() * 10 } } : {}),
  });

  const server = createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    const json = (code, body) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
    const token = (req.headers.authorization ?? "").replace(/^Bearer /, "");
    const deny = (need) => { const why = checkToken(token, need, publicKey); if (why) json(401, { error: why }); return why; };

    if (req.method === "GET" && url.pathname === "/servers") return deny(PERMISSION.STATUS) || json(200, Object.keys(servers));
    const m = url.pathname.match(/^\/server\/([A-Za-z0-9_.@-]+)\/(status|rlog|start|stop|restart)$/);
    if (!m || !servers[m[1]]) return json(404, { error: "not found" });
    const [, name, op] = m;
    const s = servers[name];
    if (req.method === "GET" && op === "status") return deny(PERMISSION.STATUS) || json(200, status(s));
    if (req.method === "GET" && op === "rlog") {
      if (deny(PERMISSION.LOGS)) return;
      const max = Math.min(Number(url.searchParams.get("max_lines")) || 200, 500);
      return json(200, s.log.slice(-max).reverse().map(({ message }) => ({ message })));
    }
    if (req.method === "POST" && ACTION_BITS[op]) {
      if (deny(ACTION_BITS[op])) return;
      if (op === "stop") { s.active = false; log(name, "Stopping the server"); }
      else { s.active = true; s.startedAt = Date.now(); log(name, op === "restart" ? "Restarting the server" : "Starting the server"); }
      return json(200, { ok: true });
    }
    json(405, { error: "method not allowed" });
  });

  server.on("upgrade", (req, socket) => {
    const m = new URL(req.url, "http://127.0.0.1").pathname.match(/^\/server\/([A-Za-z0-9_.@-]+)\/console$/);
    // Browsers can't set headers on a WebSocket, so the token rides as the second subprotocol.
    const [kind, token] = String(req.headers["sec-websocket-protocol"] ?? "").split(",").map((p) => p.trim());
    const why = !m || !servers[m[1]] ? "not found" : kind !== "mcsv.jwt" ? "missing token" : checkToken(token, PERMISSION.CONSOLE_READ, publicKey);
    if (why) { socket.end(`HTTP/1.1 401 Unauthorized\r\n\r\n${why}`); return; }
    const accept = createHash("sha1").update(`${req.headers["sec-websocket-key"]}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest("base64");
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\nSec-WebSocket-Protocol: mcsv.jwt\r\n\r\n`);
    const client = { socket, server: m[1], canWrite: !checkToken(token, PERMISSION.CONSOLE_WRITE, publicKey) };
    consoles.add(client);
    let pending = Buffer.alloc(0);
    socket.on("data", (chunk) => {
      const [frames, rest] = readFrames(Buffer.concat([pending, chunk]));
      pending = rest;
      for (const { opcode, data } of frames) {
        if (opcode === 0x8) { socket.end(); return; }
        if (opcode === 0x9) { sendFrame(socket, data.toString(), 0xa); continue; }
        if (opcode !== 0x1) continue;
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type !== "command") continue;
          if (!client.canWrite) sendFrame(socket, JSON.stringify({ type: "error", message: "This token can't send commands." }));
          else log(client.server, `[Server] ${String(msg.command).slice(0, 200)}`);
        } catch { /* not JSON */ }
      }
    });
    socket.on("close", () => consoles.delete(client));
    socket.on("error", () => consoles.delete(client));
  });

  // A heartbeat line so the live console visibly streams.
  setInterval(() => { if (servers.survival.active) log("survival", `Mock tick, ${3 + Math.floor(Math.random() * 5)} players online`); }, 5000).unref();
  server.listen(PORTS.manager, "127.0.0.1", () => console.log(`Server manager mock  http://127.0.0.1:${PORTS.manager}`));
}

// ---------- Minecraft server-list-ping mock ----------

function varInt(value) {
  const bytes = [];
  do { let b = value & 0x7f; value >>>= 7; if (value) b |= 0x80; bytes.push(b); } while (value);
  return Buffer.from(bytes);
}
const packet = (id, payload) => { const body = Buffer.concat([varInt(id), payload]); return Buffer.concat([varInt(body.length), body]); };

function startMinecraft() {
  const status = JSON.stringify({
    version: { name: "Paper 1.21.8 (mock)", protocol: 772 },
    players: { online: 3, max: 50, sample: [{ name: "GuestOne", id: randomUUID() }, { name: "Builder_42", id: randomUUID() }, { name: "Explorer", id: randomUUID() }] },
    description: { text: "ChulaCraft (local mock)" },
  });
  createTcpServer((socket) => {
    socket.setTimeout(3000, () => socket.destroy());
    let seen = Buffer.alloc(0);
    socket.on("data", (chunk) => {
      seen = Buffer.concat([seen, chunk]);
      // Handshake + empty status request arrive together; answer once.
      if (seen.length >= 2 && !socket.answered) {
        socket.answered = true;
        const json = Buffer.from(status);
        socket.write(packet(0x00, Buffer.concat([varInt(json.length), json])));
      }
    });
    socket.on("error", () => {});
  }).listen(PORTS.minecraft, "127.0.0.1", () => console.log(`Minecraft ping mock  127.0.0.1:${PORTS.minecraft}`));
}

startDiscord(dockerGateway());
startManager();
startMinecraft();
