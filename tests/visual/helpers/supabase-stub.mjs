import { createServer } from "node:http";
import { readdirSync } from "node:fs";
import { insightsFixture } from "./insights-fixture.mjs";
import { stubPort } from "./ports.mjs";

const host = "127.0.0.1";
const port = stubPort;
let authenticated = false;
// Insights tests sign in as a staff role; everyone else is a plain player.
let role = "user";
// Names an insights_* RPC that should fail, or "short_history" for a single snapshot row.
let fail = "";
// tests/visual/keyboard.spec.ts walks sign-up: "" (off, every other spec),
// "unverified" (Discord only, on /verify) or "new" (verified, no details yet;
// saving them sets `detailsSaved`, which unlocks /welcome and /settings).
let flow = "";
let detailsSaved = false;

// Mirror of staff_can(): which area each insights RPC needs, and who holds it.
const AREAS = {
  owner: ["players_read", "moderation", "community", "admin"],
  admin: ["players_read", "moderation", "community", "admin"],
  moderator: ["players_read", "moderation"],
  event_staff: ["players_read", "community"],
};
const INSIGHTS_AREA = {
  insights_players: "admin", insights_funnel: "admin", insights_staff: "admin",
  insights_events: "community", insights_community: "moderation",
};


// /admin/ops/bot: the stub plays the Discord bot (docs/bot-contract-ops.md). A
// saved setting is "checked" 2 s later: ok, or invalid "Unknown Channel" for a
// value ending 0000. Interval jobs run every 5 s, lazily, whenever the page reads
// them, until POST /__visual/bot?reporting=false. ?reset=1 restores the start.
const BOT_SETTINGS = [
  ["discord_guild_id", "guild", "restart", "Discord server", "The server the bot works in.", "100000000000000001"],
  ["discord_announcement_channel_id", "channel", "live", "Announcements channel", "Where /announce drafts are posted.", "100000000000000002"],
  ["discord_status_channel_id", "channel", "live", "Status channel", "Where down and recovery alerts go.", null],
  ["verified_role_id", "role", "live", "Verified role", "Given to every verified player.", "100000000000000003"],
  ["discord_announcement_admin_role_ids", "role_list", "live", "Announcement admin roles", "Roles that may use /announce.", "100000000000000004"],
  ["status_website_url", "url", "live", "Website URL", "Checked by the status monitor.", "https://chulacraft.com/"],
  ["status_monitor_interval_ms", "number", "live", "Status check interval (ms)", "How often the status monitor runs.", "60000"],
  ["openrouter_require_free_models", "boolean", "live", "Free models only", "Refuse paid OpenRouter models.", "true"],
  ["openrouter_allowed_models", "text_list", "live", "Allowed models", "Models /announce may use.", "openrouter/free"],
];
const BOT_JOBS = [
  ["web_announcements", "Web announcements", 5],
  ["status_monitor", "Status monitor", 5],
  ["verified_role_sync", "Verified role sync", null],
  ["managed_messages", "Managed messages", null],
];
let bot;
function resetBot() {
  const now = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  bot = {
    reporting: true,
    settings: BOT_SETTINGS.map(([key, kind, applies, label, description, default_value]) => ({
      key, kind, applies, label, description, default_value, value: null, min_value: kind === "number" ? 10000 : null, max_value: null,
      updated_by_name: null, updated_at: null, bot_status: "ok", bot_error: null, checked_at: iso(now - 60_000), retired_at: null, checkAt: null,
    })),
    jobs: BOT_JOBS.map(([name, label, interval_seconds]) => ({
      name, label, interval_seconds, enabled: true, last_started_at: iso(now - 2000), last_finished_at: iso(now - 1500), last_ok: true,
      last_items: 0, last_error: null, consecutive_failures: 0, registered_at: iso(now - 3_600_000), retired_at: null,
      runs: [{ started_at: iso(now - 2000), finished_at: iso(now - 1500), ok: true, items: 0, error: null }],
    })),
  };
  // One value already changed, one setting and one job the bot no longer sends.
  Object.assign(bot.settings.find((s) => s.key === "status_monitor_interval_ms"), { value: "120000", updated_by_name: "Visual Admin", updated_at: iso(now - 86_400_000) });
  bot.settings.push({ ...bot.settings[1], key: "discord_welcome_channel_id", label: "Old welcome channel", retired_at: iso(now - 86_400_000) });
  bot.jobs.push({ ...bot.jobs[2], name: "old_cleanup", label: "Old cleanup task", retired_at: iso(now - 86_400_000), runs: [] });
}
resetBot();

function botTick() {
  const now = Date.now();
  for (const s of bot.settings) {
    if (s.checkAt && now >= s.checkAt) {
      const bad = s.kind === "channel" && /0000$/.test(s.value ?? "");
      Object.assign(s, { checkAt: null, bot_status: bad ? "invalid" : "ok", bot_error: bad ? "Unknown Channel" : null, checked_at: new Date(now).toISOString() });
    }
  }
  if (!bot.reporting) return;
  for (const j of bot.jobs) {
    if (!j.enabled || j.retired_at || !j.interval_seconds) continue;
    if (now - Date.parse(j.last_started_at) < j.interval_seconds * 1000) continue;
    const run = { started_at: new Date(now - 200).toISOString(), finished_at: new Date(now).toISOString(), ok: true, items: 1, error: null };
    j.runs = [run, ...j.runs].slice(0, 20);
    Object.assign(j, { last_started_at: run.started_at, last_finished_at: run.finished_at, last_ok: true, last_items: 1, last_error: null, consecutive_failures: 0 });
  }
}

// Public event and player cards (tests/visual/a11y.spec.ts, seo.spec.ts). The
// event starts a week after the stub starts, so it is always upcoming.
const VISUAL_EVENT = {
  id: "00000000-0000-4000-8000-0000000000e1",
  name: "Spawn Build Night",
  description: "Build the new spawn together. Bring wood and stone.",
  starts_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  ends_at: null, location: "Survival spawn", category: "build", image_path: null, interest_count: 3,
};
const VISUAL_PLAYERS = {
  "00000000-0000-4000-8000-0000000000c1": {
    user_id: "00000000-0000-4000-8000-0000000000c1", display_name: "Steve Builder", avatar_url: null, hidden: false,
    relationship: "none", minecraft_names: ["SteveBuilder"], achievements: [], friends: [], friend_count: 0,
  },
  "00000000-0000-4000-8000-0000000000c2": {
    user_id: "00000000-0000-4000-8000-0000000000c2", display_name: "Hidden Alex", avatar_url: null, hidden: true, relationship: "none",
  },
};

// Staff-edited content, empty at start (site shows its built-in copy).
const siteSettings = new Map();
const sitePages = new Map();

const readJson = (request, then) => {
  let body = "";
  request.on("data", (chunk) => { body += chunk; });
  request.on("end", () => {
    let parsed = {};
    try { parsed = JSON.parse(body || "{}"); } catch { /* treated as empty */ }
    then(parsed);
  });
};
const NAMES = { owner: "Visual Owner", admin: "Visual Admin" };

const json = (response, status, body) => {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
};

// stubs/*.mjs: one file per task, each default-exporting (ctx) => boolean (see stubs/README.md).
const extraStubs = [];
for (const file of readdirSync(new URL("./stubs/", import.meta.url)).filter((f) => f.endsWith(".mjs")).sort()) {
  extraStubs.push((await import(new URL(`./stubs/${file}`, import.meta.url).href)).default);
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${host}:${port}`);

  if (request.method === "GET" && url.pathname === "/health") {
    response.writeHead(204).end();
    return;
  }

  if (request.method === "POST" && url.pathname === "/__visual/state") {
    authenticated = url.searchParams.get("authenticated") === "true";
    role = url.searchParams.get("role") || "user";
    fail = url.searchParams.get("fail") || "";
    flow = url.searchParams.get("flow") || "";
    detailsSaved = false;
    response.writeHead(204).end();
    return;
  }

  if (request.method === "GET" && url.pathname === "/auth/v1/user") {
    if (authenticated) {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({
        id: "00000000-0000-4000-8000-000000000001",
        aud: "authenticated",
        role: "authenticated",
        email: "visual-audit@example.test",
        app_metadata: { provider: "discord", providers: ["discord"] },
        user_metadata: { full_name: "Visual Player", user_name: "visual-player" },
        identities: [
          { id: "d1", identity_id: "i1", user_id: "00000000-0000-4000-8000-000000000001", provider: "discord", identity_data: {} },
          ...(flow === "unverified" ? [] : [{ id: "g1", identity_id: "i2", user_id: "00000000-0000-4000-8000-000000000001", provider: "google", identity_data: { email: "visual@student.chula.ac.th", email_verified: true } }])
        ],
        created_at: "2026-01-01T00:00:00.000Z"
      }));
      return;
    }
    response.writeHead(401, { "content-type": "application/json" });
    response.end(JSON.stringify({ message: "No authenticated visual-audit session" }));
    return;
  }

  if (flow && request.method === "GET" && url.pathname === "/rest/v1/chula_claims") {
    json(response, 200, flow === "unverified" ? null : { email: "visual@student.chula.ac.th", google_sub: "g1" });
    return;
  }
  if (flow && request.method === "GET" && url.pathname === "/rest/v1/profiles") {
    json(response, 200, detailsSaved ? { first_name: "Visual", last_name: "Player", nickname: "", study_level: "bachelor", faculty: "x", major: "x" } : null);
    return;
  }
  if (flow && request.method === "GET" && url.pathname === "/rest/v1/minecraft_registrations") {
    json(response, 200, []);
    return;
  }
  if (flow && request.method === "POST" && url.pathname === "/rest/v1/rpc/my_chula_claim") {
    json(response, 200, { email: "visual@student.chula.ac.th", google_sub: "g1" });
    return;
  }
  if (flow && request.method === "POST" && url.pathname === "/rest/v1/rpc/update_profile_details") {
    detailsSaved = true;
    json(response, 200, null);
    return;
  }
  if (request.method === "POST" && url.pathname === "/rest/v1/rpc/report_player") {
    json(response, 200, null);
    return;
  }

  if (request.method === "GET" && ["/rest/v1/minecraft_registrations", "/rest/v1/profiles"].includes(url.pathname)) {
    response.writeHead(200, { "content-type": "application/json" });
    response.end("null");
    return;
  }

  if (request.method === "POST" && url.pathname === "/rest/v1/rpc/am_i_player_verified") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(flow === "unverified" ? "false" : "true");
    return;
  }

  if (request.method === "POST" && url.pathname === "/rest/v1/rpc/current_app_role") {
    json(response, 200, authenticated ? role : null);
    return;
  }

  const rpc = url.pathname.startsWith("/rest/v1/rpc/insights_") ? url.pathname.slice("/rest/v1/rpc/".length) : null;
  if (request.method === "POST" && rpc && rpc in INSIGHTS_AREA) {
    if (!authenticated || !(AREAS[role] ?? []).includes(INSIGHTS_AREA[rpc])) {
      json(response, 400, { code: "P0001", message: "FORBIDDEN", details: null, hint: null });
      return;
    }
    if (fail === rpc) {
      json(response, 500, { code: "XX000", message: "visual stub failure", details: null, hint: null });
      return;
    }
    json(response, 200, insightsFixture(rpc, { shortHistory: fail === "short_history" }));
    return;
  }

  // /admin/ops: the role check before a manager token. Like the real RPC, owner and
  // admin pass and `update` is owner-only.
  if (request.method === "POST" && url.pathname === "/rest/v1/rpc/admin_ops_access") {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      let action = "";
      try { action = JSON.parse(body || "{}").p_action ?? ""; } catch { /* treated as unknown */ }
      const allowed = authenticated && (role === "owner" || (role === "admin" && action !== "update"));
      if (!allowed) json(response, 400, { code: "P0001", message: "FORBIDDEN", details: null, hint: null });
      else json(response, 200, role);
    });
    return;
  }
  // The website's own health (service role) and its grouped error feed.
  if (request.method === "POST" && url.pathname === "/rest/v1/rpc/app_errors_recent") {
    json(response, 200, 0);
    return;
  }
  if (request.method === "POST" && url.pathname === "/rest/v1/rpc/admin_app_errors") {
    if (!authenticated || !(AREAS[role] ?? []).includes("admin")) {
      json(response, 400, { code: "P0001", message: "FORBIDDEN", details: null, hint: null });
      return;
    }
    const at = new Date(Date.now() - 20 * 60_000).toISOString();
    json(response, 200, fail === "no_app_errors" ? [] : [
      { fingerprint: "f1", message: "Cannot read properties of undefined (reading 'name')", route: "/events/[id]", kind: "server", n: 4, first_at: at, last_at: at },
      { fingerprint: "f2", message: "Failed to fetch", route: "/dashboard", kind: "client", n: 1, first_at: at, last_at: at },
    ]);
    return;
  }


  if (request.method === "POST" && url.pathname === "/__visual/bot") {
    if (url.searchParams.get("reset")) resetBot();
    if (url.searchParams.has("reporting")) bot.reporting = url.searchParams.get("reporting") !== "false";
    response.writeHead(204).end();
    return;
  }
  const botRpc = ["admin_bot_overview", "admin_set_bot_setting", "admin_set_bot_job_enabled"].find((name) => url.pathname === `/rest/v1/rpc/${name}`);
  if (request.method === "POST" && botRpc) {
    if (!authenticated || !(AREAS[role] ?? []).includes("admin")) {
      json(response, 400, { code: "P0001", message: "FORBIDDEN", details: null, hint: null });
      return;
    }
    readJson(request, (args) => {
      botTick();
      const refuse = (message) => json(response, 400, { code: "P0001", message, details: null, hint: null });
      if (botRpc === "admin_bot_overview") {
        const settings = bot.settings.map((s) => ({ ...s, checkAt: undefined }));
        json(response, 200, { settings, jobs: bot.jobs, backlog: { role_changes: 3, announcements: 0, reminders_due: 1 } });
        return;
      }
      if (botRpc === "admin_set_bot_setting") {
        const s = bot.settings.find((x) => x.key === args.p_key);
        if (!s) return refuse("NOT_FOUND");
        if (s.retired_at) return refuse("RETIRED");
        const value = typeof args.p_value === "string" && args.p_value.trim() ? args.p_value.trim() : null;
        Object.assign(s, { value, updated_by_name: NAMES[role], updated_at: new Date().toISOString(), bot_status: null, bot_error: null, checked_at: null, checkAt: Date.now() + 2000 });
        json(response, 200, null);
        return;
      }
      const j = bot.jobs.find((x) => x.name === args.p_name);
      if (!j) return refuse("NOT_FOUND");
      if (j.retired_at) return refuse("RETIRED");
      j.enabled = args.p_enabled === true;
      json(response, 200, null);
    });
    return;
  }

  // The /admin/players table: one row for any staff role, so the page renders.
  if (request.method === "POST" && url.pathname === "/rest/v1/rpc/admin_list_players") {
    if (!authenticated || !(AREAS[role] ?? []).includes("players_read")) {
      json(response, 400, { code: "P0001", message: "FORBIDDEN", details: null, hint: null });
      return;
    }
    json(response, 200, [{
      banned: false, chula_email: "table@student.chula.ac.th", created_at: "2026-10-01T00:00:00.000Z",
      display_name: "Table Player One", email: "table@example.com", handle: "table-player-one",
      minecraft_usernames: "TablePlayer1", role: "user", total: 1, user_id: "00000000-0000-4000-8000-0000000000b1",
      verification_kind: "chula", whitelist: "whitelisted",
    }]);
    return;
  }
  if (request.method === "POST" && url.pathname === "/rest/v1/rpc/admin_list_achievements") {
    json(response, 200, []);
    return;
  }

  // Staff-edited site content (tests/visual/cache.spec.ts): saves round-trip in memory,
  // empty value / empty body clears the row like the real RPCs.
  if (request.method === "POST" && url.pathname === "/rest/v1/rpc/get_site_settings") {
    json(response, 200, [...siteSettings].map(([key, value]) => ({ key, value })));
    return;
  }
  if (request.method === "POST" && url.pathname === "/rest/v1/rpc/get_site_page") {
    readJson(request, (args) => {
      const row = sitePages.get(args.p_slug);
      json(response, 200, row ? [row] : []);
    });
    return;
  }
  if (request.method === "POST" && url.pathname === "/rest/v1/rpc/admin_list_discord_roles") {
    json(response, 200, []);
    return;
  }
  if (request.method === "POST" && ["/rest/v1/rpc/admin_save_site_settings", "/rest/v1/rpc/admin_save_site_page"].includes(url.pathname)) {
    if (!authenticated || !(AREAS[role] ?? []).includes("admin")) {
      json(response, 400, { code: "P0001", message: "FORBIDDEN", details: null, hint: null });
      return;
    }
    readJson(request, (args) => {
      if (url.pathname.endsWith("settings")) {
        for (const [key, value] of Object.entries(args.p_settings ?? {})) {
          if (value) siteSettings.set(key, String(value)); else siteSettings.delete(key);
        }
      } else if (args.p_body) {
        sitePages.set(args.p_slug, { body: args.p_body, updated_at: new Date().toISOString() });
      } else {
        sitePages.delete(args.p_slug);
      }
      json(response, 200, null);
    });
    return;
  }

  // a11y/seo specs: one upcoming event (no poster) and two players, one whose
  // profile is hidden from the viewer.
  if (request.method === "POST" && url.pathname === "/rest/v1/rpc/list_upcoming_events") {
    json(response, 200, [{ ...VISUAL_EVENT, description_excerpt: VISUAL_EVENT.description }]);
    return;
  }
  if (request.method === "POST" && url.pathname === "/rest/v1/rpc/list_past_events") {
    json(response, 200, []);
    return;
  }
  if (request.method === "POST" && url.pathname === "/rest/v1/rpc/get_event") {
    readJson(request, (args) => json(response, 200, args.p_id === VISUAL_EVENT.id ? { ...VISUAL_EVENT, me_interested: false, ended: false } : null));
    return;
  }
  if (request.method === "POST" && url.pathname === "/rest/v1/rpc/get_player_profile") {
    readJson(request, (args) => json(response, 200, authenticated ? VISUAL_PLAYERS[args.p_user_id] ?? null : null));
    return;
  }
  if (request.method === "POST" && url.pathname === "/rest/v1/rpc/get_player_event_history") {
    json(response, 200, []);
    return;
  }

  // One pinned announcement, so every audited page also carries the banner.
  if (request.method === "POST" && url.pathname === "/rest/v1/rpc/list_announcements") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify([{
      id: "00000000-0000-4000-8000-0000000000a1",
      title: "Maintenance on Saturday night",
      body: "The server restarts at 22:00 for a plugin update.\nExpect about 15 minutes of downtime.",
      severity: "maintenance",
      pinned: true,
      published_at: "2026-10-01T12:00:00.000Z"
    }]));
    return;
  }

  const ctx = { request, response, url, json, readJson, state: { get authenticated() { return authenticated; }, get role() { return role; } } };
  if (extraStubs.some((handle) => handle(ctx))) return;

  response.writeHead(405, { "content-type": "application/json" });
  response.end(JSON.stringify({ message: "Visual audit stub is read-only" }));
});

server.listen(port, host);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
