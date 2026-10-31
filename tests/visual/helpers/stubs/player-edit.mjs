// /admin/users/[id] for the player-edit spec: one player, applied in memory.
// POST /__visual/player-edit?reset=1&fail=1 restores the start and (fail=1) makes the
// next apply refuse with FORBIDDEN on the first whitelist change; GET answers {applies}.
export const PLAYER_ID = "00000000-0000-4000-8000-0000000000d1";
const REG_ID = "00000000-0000-4000-8000-0000000000d2";

let player;
let applies = 0;
let failNext = false;
function reset() {
  applies = 0;
  failNext = false;
  player = {
    role: "user", verified: false, guest: false,
    profile: { first_name: "Edit", last_name: "Target", nickname: "", faculty: "Faculty of Law", major: "Law", study_level: "undergraduate" },
    privacy: { profile: "public", minecraft: "public", achievements: "public", friends: "public" },
    granted: false, whitelisted: true, banned: false,
  };
}
reset();

const detail = () => ({
  user: { id: PLAYER_ID, email: "edit@example.com", created_at: "2026-10-01T00:00:00.000Z", role: player.role },
  discord: { id: "100000000000000099", username: "edit-target" },
  verification_kind: player.guest ? "guest" : "unverified",
  chula: player.guest ? null : { email: "edit@student.chula.ac.th", claimed_at: "2026-10-02T00:00:00.000Z" },
  guest: player.guest ? { verified_at: "2026-10-03T00:00:00.000Z", verified_by_name: "Visual Owner" } : null,
  google: [],
  registrations: [{ id: REG_ID, minecraft_username: "EditSteve", minecraft_uuid: "11111111-2222-4333-8444-555555555555", desired_whitelisted: player.whitelisted, is_active: true, sync_status: "synced" }],
  log: [],
});

export default function playerEdit({ request, response, url, json, readJson, state }) {
  if (url.pathname === "/__visual/player-edit") {
    if (request.method === "POST") {
      reset();
      failNext = url.searchParams.get("fail") === "1";
      response.writeHead(204).end();
    } else json(response, 200, { applies, player });
    return true;
  }
  if (request.method !== "POST" || !url.pathname.startsWith("/rest/v1/rpc/")) return false;
  const rpc = url.pathname.slice("/rest/v1/rpc/".length);
  const forbidden = () => json(response, 400, { code: "P0001", message: "FORBIDDEN", details: null, hint: null });
  switch (rpc) {
    case "admin_get_user": return state.authenticated && state.role !== "user" ? (json(response, 200, detail()), true) : (forbidden(), true);
    case "admin_user_bans":
      json(response, 200, player.banned ? [{ id: "00000000-0000-4000-8000-0000000000d3", active: true, reason: player.banReason, public_note: null, expires_at: null, created_at: new Date().toISOString(), created_by_name: "Visual Owner", lifted_at: null, lifted_by_name: null }] : []);
      return true;
    case "admin_user_profile": json(response, 200, { ...player.profile, privacy: player.privacy }); return true;
    case "admin_user_banners":
      json(response, 200, [{ id: "gold-1", name: "Gold Rush", kind: "unlock", colors: ["#caa", "#cab", "#cac", "#cad"], image_path: null, still_path: null, style: "gradient", granted: player.granted, owned: player.granted, selected: false, event_names: [] }]);
      return true;
    case "admin_apply_player_changes":
      if (!state.authenticated || !["owner", "admin"].includes(state.role)) { forbidden(); return true; }
      readJson(request, (args) => {
        const list = args.p_changes ?? [];
        if (failNext && list.some((c) => c.kind === "whitelist")) {
          json(response, 400, { code: "P0001", message: "FORBIDDEN", details: `whitelist:${REG_ID}`, hint: null });
          return;
        }
        applies += 1;
        for (const c of list) {
          if (c.kind === "role") player.role = c.role;
          if (c.kind === "profile") player.profile = { first_name: c.first_name, last_name: c.last_name, nickname: c.nickname, faculty: c.faculty, major: c.major, study_level: c.study_level };
          if (c.kind === "privacy") { const { kind, ...levels } = c; player.privacy = levels; }
          if (c.kind === "banner") player.granted = c.grant;
          if (c.kind === "whitelist") player.whitelisted = c.value;
          if (c.kind === "guest") player.guest = true;
          if (c.kind === "ban") { player.banned = true; player.banReason = c.reason; }
        }
        json(response, 200, null);
      });
      return true;
    default: return false;
  }
}
