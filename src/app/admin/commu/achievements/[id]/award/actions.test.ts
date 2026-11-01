import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  rpc: vi.fn<(...args: unknown[]) => Promise<{ data?: unknown; error: { message: string } | null }>>(),
  revalidatePath: vi.fn<(path: string) => void>()
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: m.rpc }) }));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidatePath }));
// Next's redirect() signals control flow by throwing, so the mock must too.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => { throw new Error(`NEXT_REDIRECT:${to}`); })
}));

import { AWARD_PAGE_SIZE } from "../../selection";
import { confirmAward, listFilteredIds, loadAwardPlayers, prefillInterested, previewAward } from "./actions";

const ID = "00000000-0000-0000-0000-0000000000e1";
const USER = "00000000-0000-0000-0000-0000000000f1";
const OTHER = "00000000-0000-0000-0000-0000000000f2";
const EVENT = "00000000-0000-0000-0000-0000000000a9";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const target = (query = "") => `NEXT_REDIRECT:/admin/commu/achievements/${ID}/award${query}`;
const redirected = async (action: (data: FormData) => Promise<void>, data: FormData) =>
  action(data).then(() => null, (error: Error) => error.message);

describe("admin award actions", () => {
  beforeEach(() => {
    m.rpc.mockReset().mockResolvedValue({ data: [], error: null });
    m.revalidatePath.mockReset();
  });

  it("never reaches the database for an achievement id that isn't a UUID", async () => {
    for (const bad of ["", "e1", "0000-0000"]) {
      expect(await redirected(confirmAward, form({ achievementId: bad }))).toBe("NEXT_REDIRECT:/admin/commu/achievements");
    }
    expect(m.rpc).not.toHaveBeenCalled();
    expect(m.revalidatePath).not.toHaveBeenCalled();
  });

  it("loads one page of players for the typed filter and maps the rows", async () => {
    m.rpc.mockResolvedValueOnce({
      data: [
        { user_id: USER, display_name: "Steve", email: "s@x.test", minecraft_usernames: "SteveMC", total: 120 },
        { user_id: OTHER, display_name: "", email: "o@x.test", minecraft_usernames: "", total: 120 }
      ],
      error: null
    });
    const result = await loadAwardPlayers("  steve ", 50);
    expect(m.rpc).toHaveBeenCalledWith("admin_list_players", { p_query: "steve", p_offset: 50, p_limit: AWARD_PAGE_SIZE });
    expect(result).toEqual({
      rows: [
        { id: USER, name: "Steve", minecraft: "SteveMC" },
        { id: OTHER, name: "o@x.test", minecraft: "" }
      ],
      total: 120
    });
  });

  it("clamps a bad offset and reports a failed lookup without throwing", async () => {
    await loadAwardPlayers("", -5);
    expect(m.rpc).toHaveBeenCalledWith("admin_list_players", expect.objectContaining({ p_offset: 0 }));
    m.rpc.mockResolvedValueOnce({ data: null, error: { message: "FORBIDDEN" } });
    expect(await loadAwardPlayers("x", 0)).toEqual({ error: "FORBIDDEN" });
  });

  it("returns every id the filter matches and flags the 5000 cap", async () => {
    m.rpc.mockResolvedValueOnce({ data: [USER, OTHER], error: null });
    expect(await listFilteredIds(" steve ")).toEqual({ ids: [USER, OTHER], capped: false });
    expect(m.rpc).toHaveBeenCalledWith("admin_list_player_ids", { p_query: "steve" });

    m.rpc.mockResolvedValueOnce({ data: Array.from({ length: 5000 }, (_, i) => `id${i}`), error: null });
    expect(await listFilteredIds("")).toMatchObject({ capped: true });

    m.rpc.mockResolvedValueOnce({ data: null, error: { message: "FORBIDDEN" } });
    expect(await listFilteredIds("")).toEqual({ error: "FORBIDDEN" });
  });

  it("resolves the pasted list and reports matched, unmatched and duplicates without writing", async () => {
    m.rpc.mockResolvedValueOnce({ data: [{ value: "alice", user_id: USER }, { value: "nobody", user_id: null }], error: null });
    const result = await previewAward("discord", "alice\nnobody\nALICE");
    expect(result).toEqual({
      kind: "discord",
      matched: [{ value: "alice", userId: USER }],
      unmatched: ["nobody"],
      duplicates: ["ALICE"]
    });
    expect(m.rpc).toHaveBeenCalledWith("admin_resolve_identifiers", { p_kind: "discord", p_values: ["alice", "nobody"] });
    expect(m.revalidatePath).not.toHaveBeenCalled();
  });

  it("takes the kind from the list header over the dropdown", async () => {
    await previewAward("discord", "Minecraft\nsteve");
    expect(m.rpc).toHaveBeenCalledWith("admin_resolve_identifiers", { p_kind: "minecraft", p_values: ["steve"] });
  });

  it("refuses a list over the row cap before calling the resolver", async () => {
    const rows = Array.from({ length: 1001 }, (_, i) => `p${i}`);
    expect(await previewAward("discord", rows.join("\n"))).toEqual({ error: "TOO_MANY" });
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("reports a resolver failure as an error code", async () => {
    m.rpc.mockResolvedValueOnce({ data: null, error: { message: "FORBIDDEN" } });
    expect(await previewAward("discord", "alice")).toEqual({ error: "FORBIDDEN" });
  });

  it("awards the union of ticked and matched players, deduped, and reports what was really added", async () => {
    m.rpc.mockResolvedValueOnce({ data: 1, error: null });
    const data = form({ achievementId: ID, sel: `${USER},${OTHER},junk`, awardedOn: "2026-10-20", eventId: "" });
    data.append("matchedId", USER);
    // One of the two already held it, so the database skipped them: the page says 1, not 2.
    expect(await redirected(confirmAward, data)).toBe(`${target()}?done=awarded&count=1`);
    expect(m.rpc).toHaveBeenCalledWith("admin_award", {
      p_achievement_id: ID, p_event_id: null, p_awarded_on: "2026-10-20", p_user_ids: [USER, OTHER]
    });
    expect(m.revalidatePath).toHaveBeenCalledWith(`/admin/commu/achievements/${ID}`);
  });

  it("lets an event set the award date and keeps the date otherwise", async () => {
    m.rpc.mockResolvedValue({ data: 1, error: null });
    const data = form({ achievementId: ID, sel: USER, awardedOn: "2026-10-20", eventId: EVENT });
    expect(await redirected(confirmAward, data)).toBe(`${target()}?done=awarded&count=1`);
    expect(m.rpc).toHaveBeenCalledWith("admin_award", expect.objectContaining({ p_event_id: EVENT, p_awarded_on: "2026-10-20" }));

    m.rpc.mockReset().mockResolvedValue({ data: 1, error: null });
    const malformed = form({ achievementId: ID, sel: USER, awardedOn: "yesterday", eventId: "nope" });
    await redirected(confirmAward, malformed);
    const args = m.rpc.mock.calls[0][1] as Record<string, unknown>;
    // An unusable date falls back to today rather than reaching the database.
    expect(args.p_event_id).toBeNull();
    expect(args.p_awarded_on).toBe(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }));
  });

  it("awards nothing when no player is selected or resolved", async () => {
    expect(await redirected(confirmAward, form({ achievementId: ID, sel: "", awardedOn: "2026-10-20" })))
      .toBe(`${target()}?error=NO_PLAYERS`);
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("reports a raised code from admin_award as an error", async () => {
    m.rpc.mockResolvedValueOnce({ data: null, error: { message: "connection reset" } });
    expect(await redirected(confirmAward, form({ achievementId: ID, sel: USER, awardedOn: "2026-10-20" })))
      .toBe(`${target()}?error=FAILED`);
    expect(m.revalidatePath).toHaveBeenCalledWith(`/admin/commu/achievements/${ID}`);
  });

  it("returns the event's interested players without awarding anyone", async () => {
    m.rpc.mockResolvedValueOnce({ data: [{ user_id: USER }, { user_id: OTHER }], error: null });
    expect(await prefillInterested(EVENT)).toEqual({ ids: [USER, OTHER] });
    expect(m.rpc).toHaveBeenCalledWith("admin_list_event_interests", { p_event_id: EVENT });
    // Interest is a maybe: nothing was written.
    expect(m.revalidatePath).not.toHaveBeenCalled();
  });

  it("refuses to prefill without a real event, and reports a lookup failure", async () => {
    for (const bad of ["", "nope"]) expect(await prefillInterested(bad)).toEqual({ error: "PICK_EVENT" });
    expect(m.rpc).not.toHaveBeenCalled();

    m.rpc.mockResolvedValueOnce({ data: null, error: { message: "FORBIDDEN" } });
    expect(await prefillInterested(EVENT)).toEqual({ error: "FORBIDDEN" });
  });
});
