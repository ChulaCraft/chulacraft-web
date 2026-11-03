import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ rpc: vi.fn(), revalidatePath: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: m.rpc }) }));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidatePath }));

import { applyPlayerChanges } from "./actions";

const USER_ID = "00000000-0000-0000-0000-0000000000a1";
const REG_ID = "00000000-0000-0000-0000-0000000000b2";
const BAN_ID = "00000000-0000-0000-0000-0000000000c3";

const profile = { kind: "profile", first_name: "Ratchaphon", last_name: "P", nickname: "", faculty: "Faculty of Engineering", major: "Computer Engineering and Digital Technology (CEDT)", study_level: "undergraduate" };
const privacy = { kind: "privacy", profile: "friends", minecraft: "private", achievements: "public", friends: "friends" };
const ban = { kind: "ban", reason: "grief", public_note: "", expires_at: "2030-01-01T00:00:00.000Z" };

describe("applyPlayerChanges", () => {
  beforeEach(() => {
    m.rpc.mockReset().mockResolvedValue({ error: null });
    m.revalidatePath.mockReset();
  });

  it("sends the whole list to one RPC and refreshes the page", async () => {
    const changes = [
      { kind: "role", role: "admin" }, profile, privacy,
      { kind: "banner", banner_id: "gold-1", grant: true },
      { kind: "chula_reset" }, { kind: "guest" },
      { kind: "lift_ban", ban_id: BAN_ID }, { kind: "whitelist", registration_id: REG_ID, value: false }, ban,
    ];
    expect(await applyPlayerChanges(USER_ID, changes)).toEqual({ ok: true });
    expect(m.rpc).toHaveBeenCalledTimes(1);
    expect(m.rpc).toHaveBeenCalledWith("admin_apply_player_changes", { p_user_id: USER_ID, p_changes: changes });
    expect(m.revalidatePath).toHaveBeenCalledWith(`/admin/users/${USER_ID}`);
  });

  it("never calls the database for a bad id or an empty or oversized list", async () => {
    expect(await applyPlayerChanges("nope", [{ kind: "guest" }])).toEqual({ ok: false, code: "INVALID", control: null });
    expect(await applyPlayerChanges(USER_ID, [])).toEqual({ ok: false, code: "INVALID", control: null });
    expect(await applyPlayerChanges(USER_ID, "x")).toEqual({ ok: false, code: "INVALID", control: null });
    expect(await applyPlayerChanges(USER_ID, Array(61).fill({ kind: "guest" }))).toEqual({ ok: false, code: "INVALID", control: null });
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it.each([
    ["unknown kind", { kind: "delete_everything" }],
    ["role not allowed", { kind: "role", role: "superuser" }],
    ["invalid profile", { ...profile, first_name: "" }],
    ["bad privacy level", { ...privacy, friends: "everyone" }],
    ["bad banner id", { kind: "banner", banner_id: "../x", grant: true }],
    ["banner grant not boolean", { kind: "banner", banner_id: "gold-1", grant: "yes" }],
    ["bad ban id", { kind: "lift_ban", ban_id: "1" }],
    ["bad registration id", { kind: "whitelist", registration_id: "1", value: true }],
    ["whitelist value not boolean", { kind: "whitelist", registration_id: REG_ID, value: "true" }],
    ["empty ban reason", { ...ban, reason: "  " }],
    ["bad ban expiry", { ...ban, expires_at: "soon" }],
  ])("rejects %s without calling the database", async (_name, change) => {
    expect(await applyPlayerChanges(USER_ID, [change])).toEqual({ ok: false, code: "INVALID", control: null });
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("drops fields it doesn't know about", async () => {
    await applyPlayerChanges(USER_ID, [{ kind: "guest", extra: 1 }, { kind: "role", role: "user", evil: true }]);
    expect(m.rpc).toHaveBeenCalledWith("admin_apply_player_changes", { p_user_id: USER_ID, p_changes: [{ kind: "guest" }, { kind: "role", role: "user" }] });
  });

  it("allows a permanent ban", async () => {
    await applyPlayerChanges(USER_ID, [{ kind: "ban", reason: "grief", public_note: "", expires_at: null }]);
    expect(m.rpc.mock.lastCall![1].p_changes[0].expires_at).toBeNull();
  });

  it("names the failed control from the RPC detail", async () => {
    m.rpc.mockResolvedValue({ error: { message: "ALREADY_VERIFIED", details: `guest:${USER_ID}` } });
    expect(await applyPlayerChanges(USER_ID, [{ kind: "guest" }])).toEqual({ ok: false, code: "ALREADY_VERIFIED", control: { kind: "guest", target: USER_ID } });
    expect(m.revalidatePath).not.toHaveBeenCalled();
  });

  it("reports a failure with no code or detail as FAILED", async () => {
    m.rpc.mockResolvedValue({ error: { message: "connection reset" } });
    expect(await applyPlayerChanges(USER_ID, [{ kind: "guest" }])).toEqual({ ok: false, code: "FAILED", control: null });
    m.rpc.mockRejectedValue(new Error("fetch failed"));
    expect(await applyPlayerChanges(USER_ID, [{ kind: "guest" }])).toEqual({ ok: false, code: "FAILED", control: null });
  });
});
