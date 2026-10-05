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

import { addPlayers, confirmAward, prefillInterested, previewAward } from "./actions";

const ID = "00000000-0000-0000-0000-0000000000e1";
const USER = "00000000-0000-0000-0000-0000000000f1";
const OTHER = "00000000-0000-0000-0000-0000000000f2";
const EVENT = "00000000-0000-0000-0000-0000000000a9";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const target = (query = "") => `NEXT_REDIRECT:/admin/achievements/${ID}/award${query}`;
const redirected = async (action: (data: FormData) => Promise<void>, data: FormData) =>
  action(data).then(() => null, (error: Error) => error.message);

const ticked = (data: FormData, ids: string[]) => ids.forEach((id) => data.append("playerId", id));

describe("admin award actions", () => {
  beforeEach(() => {
    m.rpc.mockReset().mockResolvedValue({ data: [], error: null });
    m.revalidatePath.mockReset();
  });

  it("never reaches the database for an achievement id that isn't a UUID", async () => {
    for (const bad of ["", "e1", "0000-0000"]) {
      expect(await redirected(addPlayers, form({ achievementId: bad }))).toBe("NEXT_REDIRECT:/admin/achievements");
      expect(await redirected(previewAward, form({ achievementId: bad, csv: "a" }))).toBe("NEXT_REDIRECT:/admin/achievements");
      expect(await redirected(confirmAward, form({ achievementId: bad }))).toBe("NEXT_REDIRECT:/admin/achievements");
    }
    expect(m.rpc).not.toHaveBeenCalled();
    expect(m.revalidatePath).not.toHaveBeenCalled();
  });

  it("adds ticked players to the existing selection, deduped", async () => {
    const data = form({ achievementId: ID, q: "steve", sel: `${OTHER},not-a-uuid` });
    ticked(data, [USER, OTHER]);
    const redirect = await redirected(addPlayers, data);
    expect(redirect).toBe(`NEXT_REDIRECT:/admin/achievements/${ID}/award?q=steve&sel=${OTHER}%2C${USER}`);
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("keeps the query when no search term was posted", async () => {
    const data = form({ achievementId: ID });
    ticked(data, [USER]);
    expect(await redirected(addPlayers, data)).toBe(`NEXT_REDIRECT:/admin/achievements/${ID}/award?sel=${USER}`);
  });

  it("resolves the list and previews it without writing anything", async () => {
    m.rpc.mockResolvedValueOnce({ data: [{ value: "alice", user_id: USER }, { value: "nobody", user_id: null }], error: null });
    const data = form({ achievementId: ID, kind: "discord", csv: "alice\nnobody\nALICE", sel: OTHER });
    const redirect = await redirected(previewAward, data);
    const url = new URL(`http://x${redirect!.replace("NEXT_REDIRECT:", "")}`);
    const preview = new URLSearchParams(url.searchParams.get("preview") ?? "");
    expect(preview.get("kind")).toBe("discord");
    expect(preview.getAll("matched")).toEqual([`alice|${USER}`]);
    expect(preview.getAll("unmatched")).toEqual(["nobody"]);
    expect(preview.getAll("duplicate")).toEqual(["ALICE"]);
    // The selection survives the preview step.
    expect(url.searchParams.get("sel")).toBe(OTHER);
    expect(m.rpc).toHaveBeenCalledWith("admin_resolve_identifiers", { p_kind: "discord", p_values: ["alice", "nobody"] });
    expect(m.revalidatePath).not.toHaveBeenCalled();
  });

  it("takes the kind from the list header over the dropdown", async () => {
    m.rpc.mockResolvedValueOnce({ data: [], error: null });
    await redirected(previewAward, form({ achievementId: ID, kind: "discord", csv: "Minecraft\nsteve" }));
    expect(m.rpc).toHaveBeenCalledWith("admin_resolve_identifiers", { p_kind: "minecraft", p_values: ["steve"] });
  });

  it("refuses a list over the row cap before calling the resolver", async () => {
    const rows = Array.from({ length: 1001 }, (_, i) => `p${i}`);
    expect(await redirected(previewAward, form({ achievementId: ID, kind: "discord", csv: rows.join("\n") })))
      .toBe(`${target()}?error=TOO_MANY`);
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("reports a resolver failure as an error code", async () => {
    m.rpc.mockResolvedValueOnce({ data: null, error: { message: "FORBIDDEN" } });
    expect(await redirected(previewAward, form({ achievementId: ID, kind: "discord", csv: "alice" })))
      .toBe(`${target()}?error=FORBIDDEN`);
  });

  it("awards the union of ticked and matched players, deduped", async () => {
    const data = form({ achievementId: ID, sel: `${USER},${OTHER},junk`, awardedOn: "2026-10-20", eventId: "" });
    data.append("matchedId", USER);
    data.append("matchedId", OTHER);
    expect(await redirected(confirmAward, data)).toBe(`${target()}?done=awarded&count=2`);
    expect(m.rpc).toHaveBeenCalledWith("admin_award", {
      p_achievement_id: ID, p_event_id: null, p_awarded_on: "2026-10-20", p_user_ids: [USER, OTHER]
    });
    expect(m.revalidatePath).toHaveBeenCalledWith(`/admin/achievements/${ID}`);
  });

  it("lets an event set the award date and keeps the date otherwise", async () => {
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
    expect(m.revalidatePath).toHaveBeenCalledWith(`/admin/achievements/${ID}`);
  });

  it("ticks the event's interested players without awarding anyone", async () => {
    m.rpc.mockResolvedValueOnce({ data: [{ user_id: USER }, { user_id: OTHER }], error: null });
    const redirect = await redirected(prefillInterested, form({ achievementId: ID, q: "steve", eventId: EVENT, sel: USER }));
    // USER was already selected, so it is listed once, and keeps its place.
    expect(redirect).toBe(`${target()}?q=steve&eventId=${EVENT}&sel=${USER}%2C${OTHER}`);
    expect(m.rpc).toHaveBeenCalledWith("admin_list_event_interests", { p_event_id: EVENT });
    // Interest is a maybe: nothing was written.
    expect(m.revalidatePath).not.toHaveBeenCalled();
  });

  it("refuses to prefill without a real event, and reports a lookup failure", async () => {
    for (const bad of ["", "nope"]) {
      expect(await redirected(prefillInterested, form({ achievementId: ID, eventId: bad })))
        .toBe(`${target()}?error=PICK_EVENT`);
    }
    expect(m.rpc).not.toHaveBeenCalled();

    m.rpc.mockResolvedValueOnce({ data: null, error: { message: "FORBIDDEN" } });
    expect(await redirected(prefillInterested, form({ achievementId: ID, eventId: EVENT })))
      .toBe(`${target()}?eventId=${EVENT}&error=FORBIDDEN`);
  });
});