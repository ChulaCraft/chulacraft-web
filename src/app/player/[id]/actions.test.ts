import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ rpc: vi.fn(), revalidatePath: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: m.rpc }) }));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidatePath }));
// Next's redirect() signals control flow by throwing, so the mock must too.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => { throw new Error(`NEXT_REDIRECT:${to}`); })
}));

import { blockPlayer, removeFriend, respondFriendRequest, sendFriendRequest } from "./actions";

const PLAYER_ID = "00000000-0000-0000-0000-0000000000c1";
// The mock's redirect throws `NEXT_REDIRECT:<to>`, so the expected string
// carries that prefix too.
const TARGET = `NEXT_REDIRECT:/player/${PLAYER_ID}`;

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const ask = () => form({ playerId: PLAYER_ID });
const redirected = async (action: (data: FormData) => Promise<void>, data: FormData) =>
  action(data).then(() => null, (error: Error) => error.message);

describe("player profile actions", () => {
  beforeEach(() => {
    m.rpc.mockReset().mockResolvedValue({ error: null });
    m.revalidatePath.mockReset();
  });

  it("never calls the database for an id that isn't a UUID", async () => {
    for (const bad of ["r1", "", "0000-0000", "00000000-0000-0000-0000-00000000000z", "null"]) {
      expect(await redirected(sendFriendRequest, form({ playerId: bad }))).toBe("NEXT_REDIRECT:/players");
      expect(await redirected(removeFriend, form({ playerId: bad }))).toBe("NEXT_REDIRECT:/players");
      expect(await redirected(blockPlayer, form({ playerId: bad }))).toBe("NEXT_REDIRECT:/players");
      expect(await redirected(respondFriendRequest, form({ requesterId: bad, accept: "true" }))).toBe("NEXT_REDIRECT:/players");
    }
    expect(m.rpc).not.toHaveBeenCalled();
    expect(m.revalidatePath).not.toHaveBeenCalled();
  });

  it("reports a raised code as an error and a clean call as done", async () => {
    m.rpc.mockResolvedValueOnce({ error: { message: "NOT_FOUND" } });
    expect(await redirected(sendFriendRequest, ask())).toBe(`${TARGET}?error=NOT_FOUND`);
    m.rpc.mockResolvedValueOnce({ error: { message: "ALREADY_FRIENDS" } });
    expect(await redirected(sendFriendRequest, ask())).toBe(`${TARGET}?error=ALREADY_FRIENDS`);
    m.rpc.mockResolvedValueOnce({ error: { message: "TOO_MANY_REQUESTS" } });
    expect(await redirected(sendFriendRequest, ask())).toBe(`${TARGET}?error=TOO_MANY_REQUESTS`);
    // Anything that isn't a single CODE-shaped message is an unexpected error.
    m.rpc.mockResolvedValueOnce({ error: { message: "connection reset" } });
    expect(await redirected(blockPlayer, ask())).toBe(`${TARGET}?error=FAILED`);

    m.rpc.mockResolvedValueOnce({ error: null });
    expect(await redirected(sendFriendRequest, ask())).toBe(`${TARGET}?done=requested`);
    m.rpc.mockResolvedValueOnce({ error: null });
    expect(await redirected(removeFriend, ask())).toBe(`${TARGET}?done=removed`);
    m.rpc.mockResolvedValueOnce({ error: null });
    expect(await redirected(blockPlayer, ask())).toBe(`${TARGET}?done=blocked`);
  });

  it("revalidates the profile and the dashboard before redirecting", async () => {
    await redirected(sendFriendRequest, ask());
    expect(m.revalidatePath).toHaveBeenCalledWith(`/player/${PLAYER_ID}`);
    expect(m.revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("forwards each form to its own RPC", async () => {
    await redirected(sendFriendRequest, ask());
    expect(m.rpc).toHaveBeenLastCalledWith("send_friend_request", { p_other: PLAYER_ID });

    await redirected(removeFriend, ask());
    expect(m.rpc).toHaveBeenLastCalledWith("remove_friend", { p_other: PLAYER_ID });

    await redirected(blockPlayer, ask());
    expect(m.rpc).toHaveBeenLastCalledWith("block_player", { p_other: PLAYER_ID });

    // Answering reads requesterId, not playerId: a tampered form must not be
    // able to answer a request against somebody else.
    await redirected(respondFriendRequest, form({ requesterId: PLAYER_ID, accept: "true" }));
    expect(m.rpc).toHaveBeenLastCalledWith("respond_friend_request", { p_requester: PLAYER_ID, p_accept: true });
    expect(await redirected(respondFriendRequest, form({ requesterId: PLAYER_ID, accept: "true" }))).toBe(`${TARGET}?done=accepted`);

    await redirected(respondFriendRequest, form({ requesterId: PLAYER_ID, accept: "false" }));
    expect(m.rpc).toHaveBeenLastCalledWith("respond_friend_request", { p_requester: PLAYER_ID, p_accept: false });
    expect(await redirected(respondFriendRequest, form({ requesterId: PLAYER_ID, accept: "false" }))).toBe(`${TARGET}?done=declined`);

    // Anything but the literal "true" means decline, so a stripped field
    // cannot accept a request by omission.
    await redirected(respondFriendRequest, form({ requesterId: PLAYER_ID }));
    expect(m.rpc).toHaveBeenLastCalledWith("respond_friend_request", { p_requester: PLAYER_ID, p_accept: false });

    // A playerId in the wrong field name is not read at all, so nothing reaches
    // the database.
    m.rpc.mockClear();
    expect(await redirected(removeFriend, form({ otherId: PLAYER_ID }))).toBe("NEXT_REDIRECT:/players");
    expect(m.rpc).not.toHaveBeenCalled();
  });
});