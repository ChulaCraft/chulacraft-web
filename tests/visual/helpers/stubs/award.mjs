// /admin/commu/achievements/<id>/award: 120 players, 2 who already hold the
// achievement, and an in-memory admin_award. Inert until a spec switches it on
// with POST /__visual/award?on=1, so other specs keep the default one-row table.
const ACH = "00000000-0000-4000-8000-0000000a0001";
const EVENT = "00000000-0000-4000-8000-0000000e0001";
const id = (n) => `00000000-0000-4000-8000-0000000b${n.toString(16).padStart(4, "0")}`;
const PLAYERS = Array.from({ length: 120 }, (_, i) => ({
  user_id: id(i + 1), display_name: `Player ${String(i + 1).padStart(3, "0")}`, email: `p${i + 1}@example.com`,
  minecraft_usernames: `MC${i + 1}`,
}));
const HOLDERS = [id(1), id(2)];
let on = false;
let posted = [];
const match = (q) => PLAYERS.filter((p) => !q || `${p.display_name} ${p.email} ${p.minecraft_usernames}`.toLowerCase().includes(q.toLowerCase()));
const refuse = (ctx, message) => ctx.json(ctx.response, 400, { code: "P0001", message, details: null, hint: null });

export default function awardStub(ctx) {
  const { request, url } = ctx;
  if (request.method !== "POST") return false;
  if (url.pathname === "/__visual/award") {
    on = url.searchParams.get("on") === "1";
    posted = [];
    ctx.response.writeHead(204).end();
    return true;
  }
  if (!on || !url.pathname.startsWith("/rest/v1/rpc/")) return false;
  const name = url.pathname.slice("/rest/v1/rpc/".length);
  const handlers = {
    admin_list_achievements: () => [{ id: ACH, name: "Builder", status: "published", description: "", image_path: null }],
    admin_list_events: () => [{ id: EVENT, name: "Spawn Build Night", status: "published", starts_at: "2026-10-20T12:00:00.000Z" }],
    admin_list_players: (a) => {
      const all = match(a.p_query);
      return all.slice(a.p_offset ?? 0, (a.p_offset ?? 0) + (a.p_limit ?? 50)).map((p) => ({ ...p, total: all.length }));
    },
    admin_list_player_ids: (a) => match(a.p_query).map((p) => p.user_id),
    admin_list_awards: () => {
      const rows = [...HOLDERS, ...posted].map((user_id) => ({ id: `a-${user_id}`, user_id, display_name: "x" }));
      const offset = Number(url.searchParams.get("offset") ?? 0);
      return rows.slice(offset, offset + Number(url.searchParams.get("limit") ?? 1000));
    },
    admin_list_event_interests: () => [id(5), id(6), id(7)].map((user_id) => ({ user_id, display_name: "x", created_at: "2026-10-01T00:00:00Z" })),
    admin_resolve_identifiers: (a) => a.p_values.map((value) => {
      const n = /^player (\d+)$/i.exec(value);
      return { value, user_id: n ? id(Number(n[1])) : null };
    }),
  };
  if (name === "admin_award") {
    ctx.readJson(request, (a) => {
      const fresh = [...new Set(a.p_user_ids)].filter((u) => !HOLDERS.includes(u) && !posted.includes(u));
      posted.push(...fresh);
      ctx.json(ctx.response, 200, fresh.length);
    });
    return true;
  }
  if (!(name in handlers)) return false;
  ctx.readJson(request, (a) => {
    if (!ctx.state.authenticated) return refuse(ctx, "FORBIDDEN");
    ctx.json(ctx.response, 200, handlers[name](a));
  });
  return true;
}
