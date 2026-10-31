import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: m.rpc }) }));

import { adminSearch } from "./actions";

describe("admin search", () => {
  beforeEach(() => {
    m.rpc.mockReset().mockImplementation(async (fn: string) => {
      if (fn === "admin_list_players") return { data: [{ user_id: "u1", display_name: "Kai", handle: "kaikubez", verification_kind: "verified" }], error: null };
      if (fn === "admin_list_achievements") return { data: [{ id: "a1", name: "Lobby Builder", status: "published" }, { id: "a2", name: "First Night", status: "draft" }], error: null };
      if (fn === "admin_list_events") return { data: [{ id: "e1", name: "Lobby Build Week", starts_at: "2026-10-19T12:00:00Z" }], error: null };
      return { data: null, error: { message: "?" } };
    });
  });

  it("does nothing for one character", async () => {
    expect(await adminSearch(" k ")).toEqual([]);
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("finds players, achievements and events by name", async () => {
    const hits = await adminSearch("lobby");
    expect(m.rpc).toHaveBeenCalledWith("admin_list_players", { p_query: "lobby", p_limit: 6 });
    expect(hits).toEqual([
      { kind: "Player", label: "Kai", hint: "kaikubez", href: "/admin/users/u1" },
      { kind: "Achievement", label: "Lobby Builder", hint: "published", href: "/admin/commu/achievements/a1" },
      { kind: "Event", label: "Lobby Build Week", hint: "19 Oct 2026", href: "/admin/commu/events/e1" },
    ]);
  });

  it("still returns what loaded when one list fails", async () => {
    m.rpc.mockImplementation(async (fn: string) => fn === "admin_list_players" ? { data: null, error: { message: "FORBIDDEN" } } : { data: [{ id: "a1", name: "Lobby Builder", status: "published" }], error: null });
    expect((await adminSearch("lobby")).map((h) => h.kind)).toEqual(["Achievement", "Event"]);
  });
});
