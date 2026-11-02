// Phase 5 (engagement) for tests/visual/phase5-engagement.spec.ts: Discord role
// allowlist, tier/role selects, badge cards and showcase, event check-in (staff
// QR, scanner, player scan), award-to-attendees, event reminders, notification bell.
// Inert until POST /__visual/phase5?on=1; every POST resets the state, then applies
// its query: window=open|before|after (default open), notifs=zero|unread|empty|error,
// checkin=recorded|already|closed|expired (what the player's `check_in` answers),
// proof=bad (the QR's token is refused), badges=none|some.
const EVENT_ID = "00000000-0000-4000-8000-0000000000e1";
const PLAYER_ID = "00000000-0000-4000-8000-0000000000c1";
const ACH = { epic: "00000000-0000-4000-8000-0000000a0501", rare: "00000000-0000-4000-8000-0000000a0502", common: "00000000-0000-4000-8000-0000000a0503", legendary: "00000000-0000-4000-8000-0000000a0504" };
const MIN = 60_000;

let on = false;
let s;
function reset(q = new URLSearchParams()) {
  s = {
    window: q.get("window") ?? "open",
    notifs: q.get("notifs") ?? "zero",
    checkin: q.get("checkin") ?? "recorded",
    proof: q.get("proof") ?? "ok",
    badges: q.get("badges") ?? "some",
    roles: [{ role_id: "100000000000000011", label: "Builder crew", created_at: "2026-10-01T00:00:00Z" }],
    showcase: [],
    reminders: [],
    attendees: [],
    awarded: false,
    unread: q.get("notifs") === "unread" ? 2 : 0,
    tokens: 0,
  };
}
reset();

const group = (id, name, tier, daysAgo) => ({
  achievement_id: id, name, description: `${name} badge`, image_path: `${id}.png`, count: 1,
  first_on: new Date(Date.now() - daysAgo * 86_400_000).toISOString(), last_on: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
  entries: [{ awarded_on: new Date(Date.now() - daysAgo * 86_400_000).toISOString(), event_name: null }], tier,
});
const groups = () => {
  if (s.badges === "none") return [];
  const all = [group(ACH.common, "Newcomer", "common", 40), group(ACH.rare, "Builder", "rare", 20), group(ACH.epic, "Architect", "epic", 10), group(ACH.legendary, "Founder", "legendary", 5)];
  return all.map((g) => ({ ...g, showcase_position: s.showcase.includes(g.achievement_id) ? s.showcase.indexOf(g.achievement_id) + 1 : null }));
};

const eventRow = () => {
  const now = Date.now();
  const [starts, ends] = s.window === "before" ? [now + 2 * 86_400_000, now + 2 * 86_400_000 + 3_600_000]
    : s.window === "after" ? [now - 2 * 86_400_000, now - 2 * 86_400_000 + 3_600_000]
    : [now - 10 * MIN, now + 60 * MIN];
  return {
    id: EVENT_ID, name: "Spawn Build Night", description: "Build the new spawn together.", location: "Survival spawn", category: "build",
    image_path: "", status: "published", award_count: 0, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z",
    starts_at: new Date(starts).toISOString(), ends_at: new Date(ends).toISOString(),
  };
};

export default function phase5(ctx) {
  const { request, response, url, json, readJson } = ctx;
  if (request.method === "POST" && url.pathname === "/__visual/phase5") {
    on = url.searchParams.get("on") === "1";
    reset(url.searchParams);
    response.writeHead(204).end();
    return true;
  }
  if (!on || request.method !== "POST" || !url.pathname.startsWith("/rest/v1/rpc/")) return false;
  const name = url.pathname.slice("/rest/v1/rpc/".length);
  const refuse = (message) => json(response, 400, { code: "P0001", message, details: null, hint: null });
  const staff = () => ctx.state.authenticated && ["owner", "admin", "event_staff"].includes(ctx.state.role);

  const handlers = {
    // Settings and the achievement form.
    admin_list_discord_roles: () => s.roles,
    admin_save_discord_role: (a) => {
      if (a.p_role_id.endsWith("9999")) return "ERROR:ROLE_MANAGED_BY_BOT";
      const row = s.roles.find((r) => r.role_id === a.p_role_id);
      if (row) row.label = a.p_label; else s.roles.push({ role_id: a.p_role_id, label: a.p_label, created_at: new Date().toISOString() });
      return null;
    },
    admin_delete_discord_role: (a) => { if (a.p_role_id === "100000000000000011" && s.badges !== "none") return "ERROR:IN_USE"; s.roles = s.roles.filter((r) => r.role_id !== a.p_role_id); return null; },
    // Player side: badges, showcase, check-in code, bell.
    my_achievements: () => groups(),
    set_my_showcase: (a) => { s.showcase = a.p_achievement_ids; return null; },
    my_checkin_code: () => "CC-ABCDEFGH23",
    my_unread_notifications: () => s.unread,
    my_notifications: () => {
      if (s.notifs === "error") return "ERROR";
      if (s.notifs !== "unread") return [];
      return [
        { id: "n1", kind: "award", payload: { name: "Architect" }, created_at: new Date(Date.now() - 3_600_000).toISOString(), read_at: null },
        { id: "n2", kind: "reminder", payload: { name: "Spawn Build Night", event_id: EVENT_ID, starts_at: new Date(Date.now() + 86_400_000).toISOString() }, created_at: new Date(Date.now() - 7_200_000).toISOString(), read_at: null },
      ];
    },
    mark_my_notifications_read: () => { s.unread = 0; return null; },
    get_player_profile: (a) => a.p_user_id === PLAYER_ID ? {
      user_id: PLAYER_ID, display_name: "Steve Builder", avatar_url: null, hidden: false, relationship: "none",
      minecraft_names: ["SteveBuilder"], achievements: groups(), friends: [], friend_count: 0,
    } : null,
    // Player scan.
    checkin_proof: (a) => (s.proof === "bad" || a.p_token === "expired" ? "ERROR:TOKEN_EXPIRED" : "proof-ok"),
    check_in: () => {
      if (s.checkin === "closed") return "ERROR:CHECKIN_CLOSED";
      if (s.checkin === "expired") return "ERROR:TOKEN_EXPIRED";
      return s.checkin;
    },
    // Staff check-in.
    admin_list_events: () => [eventRow()],
    admin_list_attendance: () => s.attendees,
    admin_list_achievements: () => [{
      id: ACH.epic, name: "Architect", status: "published", tier: "epic", discord_role_id: null, award_count: 0, description: "", image_path: "",
      created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z",
    }],
    admin_checkin_token: () => {
      if (s.window !== "open") return "ERROR:CHECKIN_CLOSED";
      s.tokens += 1;
      return [{ token: `tok-${s.tokens}`, expires_at: new Date(Date.now() + 8000).toISOString() }];
    },
    admin_check_in_player: (a) => {
      if (a.p_code === "CC-BANNED2222") return "ERROR:BANNED";
      const already = s.attendees.some((x) => x.user_id === PLAYER_ID);
      if (!already) s.attendees.push({ user_id: PLAYER_ID, display_name: "Steve Builder", avatar_url: null, method: "staff", recorded_by_name: "Visual Owner", created_at: new Date().toISOString() });
      return [{ user_id: PLAYER_ID, display_name: "Steve Builder", avatar_url: null, status: already ? "already" : "recorded" }];
    },
    admin_award_attendees: () => { const n = s.awarded ? 0 : s.attendees.length; s.awarded = true; return n; },
    // Event form and reminders.
    admin_event_reminders: () => s.reminders.map((m) => ({ offset_minutes: m, sent_at: null, skipped_at: null })),
    admin_set_event_reminders: (a) => { s.reminders = [...a.p_offsets]; return null; },
    admin_upsert_event: (a) => a.p_id,
    admin_set_event_category: () => null,
    admin_set_event_banner: () => null,
    admin_list_banners: () => [],
    admin_list_event_interests: () => [],
  };
  if (!(name in handlers)) return false;
  readJson(request, (args) => {
    const needsStaff = name.startsWith("admin_");
    if (needsStaff && !staff()) return refuse("FORBIDDEN");
    const result = handlers[name](args);
    if (result === "ERROR") return json(response, 500, { code: "XX000", message: "visual stub failure", details: null, hint: null });
    if (typeof result === "string" && result.startsWith("ERROR:")) return refuse(result.slice(6));
    json(response, 200, result);
  });
  return true;
}
