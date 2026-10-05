import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ rpc: vi.fn(), revalidatePath: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ rpc: m.rpc }),
  // unlinkPersonalGoogle is not under test here, but the module imports it.
  createAdminClient: async () => ({ rpc: m.rpc })
}));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidatePath }));
// Next's redirect() signals control flow by throwing, so the mock must too.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => { throw new Error(`NEXT_REDIRECT:${to}`); })
}));

import { removeFriend, respondFriendRequest, unblockPlayer, updatePrivacy } from "./actions";

const OTHER_ID = "00000000-0000-0000-0000-0000000000d1";
const DASHBOARD = "/dashboard";
const SETTINGS = "/settings";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const other = (extra: Record<string, string> = {}) => form({ otherId: OTHER_ID, ...extra });
const allPublic = () => form({ profile: "public", minecraft: "public", achievements: "public", friends: "public" });
const redirected = async (action: (data: FormData) => Promise<void>, data: FormData) =>
  action(data).then(() => null, (error: Error) => error.message);

describe("dashboard social actions", () => {
  beforeEach(() => {
    m.rpc.mockReset().mockResolvedValue({ error: null });
    m.revalidatePath.mockReset();
  });

  it("never calls the database for an id that isn't a UUID", async () => {
    for (const bad of ["r1", "", "0000-0000", "00000000-0000-0000-0000-00000000000z"]) {
      expect(await redirected(respondFriendRequest, form({ otherId: bad, accept: "true" }))).toBe(`NEXT_REDIRECT:${DASHBOARD}`);
      expect(await redirected(removeFriend, form({ otherId: bad }))).toBe(`NEXT_REDIRECT:${DASHBOARD}`);
      expect(await redirected(unblockPlayer, form({ otherId: bad }))).toBe(`NEXT_REDIRECT:${DASHBOARD}`);
    }
    expect(m.rpc).not.toHaveBeenCalled();
    expect(m.revalidatePath).not.toHaveBeenCalled();
  });

  it("never saves a privacy form that isn't four known levels", async () => {
    const bad = [
      form({ profile: "everyone", minecraft: "public", achievements: "public", friends: "public" }),
      // A missing select would otherwise be read as an empty level, and the
      // database would refuse it as INVALID_LEVEL.
      form({ profile: "public", minecraft: "public", achievements: "public" }),
      form({ profile: "public", minecraft: "public", achievements: "public", friends: "" }),
      form({})
    ];
    for (const data of bad) {
      expect(await redirected(updatePrivacy, data)).toBe(`NEXT_REDIRECT:${SETTINGS}`);
    }
    expect(m.rpc).not.toHaveBeenCalled();
    expect(m.revalidatePath).not.toHaveBeenCalled();
  });

  it("reports a raised code as an error and a clean call as done", async () => {
    m.rpc.mockResolvedValueOnce({ error: { message: "NOT_FOUND" } });
    expect(await redirected(respondFriendRequest, other({ accept: "true" }))).toBe(`NEXT_REDIRECT:${DASHBOARD}?error=NOT_FOUND`);
    m.rpc.mockResolvedValueOnce({ error: { message: "INVALID_LEVEL" } });
    expect(await redirected(updatePrivacy, allPublic())).toBe(`NEXT_REDIRECT:${SETTINGS}?error=INVALID_LEVEL`);
    m.rpc.mockResolvedValueOnce({ error: { message: "connection reset" } });
    expect(await redirected(unblockPlayer, other())).toBe(`NEXT_REDIRECT:${DASHBOARD}?error=FAILED`);

    m.rpc.mockResolvedValueOnce({ error: null });
    expect(await redirected(respondFriendRequest, other({ accept: "true" }))).toBe(`NEXT_REDIRECT:${DASHBOARD}?done=accepted`);
    m.rpc.mockResolvedValueOnce({ error: null });
    expect(await redirected(respondFriendRequest, other({ accept: "false" }))).toBe(`NEXT_REDIRECT:${DASHBOARD}?done=declined`);
    m.rpc.mockResolvedValueOnce({ error: null });
    expect(await redirected(removeFriend, other())).toBe(`NEXT_REDIRECT:${DASHBOARD}?done=removed`);
    m.rpc.mockResolvedValueOnce({ error: null });
    expect(await redirected(unblockPlayer, other())).toBe(`NEXT_REDIRECT:${DASHBOARD}?done=unblocked`);
    m.rpc.mockResolvedValueOnce({ error: null });
    expect(await redirected(updatePrivacy, allPublic())).toBe(`NEXT_REDIRECT:${SETTINGS}?done=privacy`);
  });

  it("revalidates the dashboard and the search before redirecting", async () => {
    await redirected(removeFriend, other());
    expect(m.revalidatePath).toHaveBeenCalledWith(DASHBOARD);
    expect(m.revalidatePath).toHaveBeenCalledWith("/players");
    expect(m.revalidatePath).toHaveBeenCalledWith(SETTINGS);
  });

  it("forwards each form to its own RPC", async () => {
    await redirected(respondFriendRequest, other({ accept: "true" }));
    expect(m.rpc).toHaveBeenLastCalledWith("respond_friend_request", { p_requester: OTHER_ID, p_accept: true });
    await redirected(respondFriendRequest, other({ accept: "false" }));
    expect(m.rpc).toHaveBeenLastCalledWith("respond_friend_request", { p_requester: OTHER_ID, p_accept: false });
    // Not the literal "true" means decline, so a stripped field cannot accept.
    await redirected(respondFriendRequest, other());
    expect(m.rpc).toHaveBeenLastCalledWith("respond_friend_request", { p_requester: OTHER_ID, p_accept: false });

    await redirected(removeFriend, other());
    expect(m.rpc).toHaveBeenLastCalledWith("remove_friend", { p_other: OTHER_ID });
    await redirected(unblockPlayer, other());
    expect(m.rpc).toHaveBeenLastCalledWith("unblock_player", { p_other: OTHER_ID });
  });

  it("saves all four privacy levels in one call", async () => {
    await redirected(updatePrivacy, form({
      profile: "public",
      minecraft: "friends",
      achievements: "private",
      friends: "friends"
    }));
    expect(m.rpc).toHaveBeenLastCalledWith("update_privacy", {
      p_profile: "public",
      p_minecraft: "friends",
      p_achievements: "private",
      p_friends: "friends"
    });
  });
});