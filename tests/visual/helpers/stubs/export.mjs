// CSV export fixtures (tests/visual/export.spec.ts): one row for each admin list, and the
// export RPCs behind them. Staff roles with the admin area (owner, admin) pass; others get FORBIDDEN.
const ID = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const AT = "2026-10-01T10:00:00.000Z";
const EVENT_ID = ID(0xe2);

const report = { id: ID(0x101), created_at: AT, category: "grief", details: "=Griefed the spawn", evidence_url: null, status: "open", admin_note: null, handled_at: null, handled_by_name: null, reporter_id: ID(0x1), reporter_name: "Reporter", target_user_id: ID(0xc1), target_name: "สตีฟ", target_banned: false, target_open_reports: 1 };
const appeal = { id: ID(0x102), created_at: AT, status: "open", message: "Please unban me", admin_response: null, decided_at: null, decided_by_name: null, ban_id: ID(0x103), user_id: ID(0xc1), user_name: "สตีฟ", reason: "Griefing", public_note: null, banned_at: AT, expires_at: null, banned_by_name: "Visual Admin" };
const audit = { id: ID(0x104), created_at: AT, actor_user_id: ID(0x1), actor_name: "Visual Admin", target_user_id: ID(0xc1), target_name: "สตีฟ", entity: "profiles", entity_id: null, field: "role", old_value: "user", new_value: "moderator" };
const event = { id: EVENT_ID, name: "Spawn Build Night", description: null, starts_at: AT, ends_at: null, location: "Spawn", image_path: null, status: "published", category: "build", award_count: 0, created_at: AT, updated_at: AT };
const attendee = { user_id: ID(0xc1), display_name: "สตีฟ", avatar_url: null, method: "staff", recorded_by_name: "Visual Admin", created_at: AT };

const ROWS = {
  admin_list_reports: [report], admin_export_reports: [report],
  admin_list_appeals: [appeal], admin_export_appeals: [appeal],
  admin_audit_log: [audit], admin_export_audit: [audit],
  admin_list_events: [event], admin_list_attendance: [attendee], admin_list_awards: [],
};

export default function exportStub({ request, response, url, json, readJson, state }) {
  const fn = url.pathname.startsWith("/rest/v1/rpc/") ? url.pathname.slice("/rest/v1/rpc/".length) : "";
  if (request.method !== "POST" || !(fn in ROWS)) return false;
  readJson(request, (args) => {
    if (!state.authenticated || !["owner", "admin"].includes(state.role)) {
      json(response, 400, { code: "P0001", message: "FORBIDDEN", details: null, hint: null });
      return;
    }
    let rows = ROWS[fn];
    if (Array.isArray(args.p_ids)) rows = rows.filter((r) => args.p_ids.includes(r.id));
    // The audit export is keyset paged: a cursor means the last page was already served.
    if (args.p_before_id) rows = [];
    // .range() arrives as offset/limit query parameters; past the single page the answer is empty.
    json(response, 200, Number(url.searchParams.get("offset")) > 0 ? [] : rows);
  });
  return true;
}
