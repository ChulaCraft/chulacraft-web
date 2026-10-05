import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ rpc: vi.fn(), getUser: vi.fn(), revalidatePath: vi.fn(), updateTag: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: m.getUser }, rpc: m.rpc })
}));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidatePath, updateTag: m.updateTag }));
// Next's redirect() signals control flow by throwing, so the mock must too.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => { throw new Error(`NEXT_REDIRECT:${to}`); })
}));

import { toggleInterest } from "./actions";

const EVENT_ID = "00000000-0000-0000-0000-0000000000e1";
const TARGET = `/events/${EVENT_ID}`;

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const interested = (value: boolean) => form({ eventId: EVENT_ID, interested: String(value) });
const redirected = async (data: FormData) => toggleInterest(data).then(() => null, (error: Error) => error.message);

describe("event interest action", () => {
  beforeEach(() => {
    m.rpc.mockReset().mockResolvedValue({ error: null });
    m.getUser.mockReset().mockResolvedValue({ data: { user: { id: "player-1" } } });
    m.revalidatePath.mockReset();
  });

  it("sends a logged-out visitor to sign in with a return path", async () => {
    m.getUser.mockResolvedValue({ data: { user: null } });

    expect(await redirected(interested(true))).toBe("NEXT_REDIRECT:/register");
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("treats an unreachable Supabase as signed out rather than as success", async () => {
    m.getUser.mockRejectedValue(new Error("connection reset"));

    expect(await redirected(interested(true))).toBe(`NEXT_REDIRECT:${TARGET}?error=FAILED`);
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("never calls the database for an id that isn't a UUID", async () => {
    m.getUser.mockResolvedValue({ data: { user: null } });
    for (const bad of ["r1", "", "0000-0000", "00000000-0000-0000-0000-00000000000z"]) {
      expect(await redirected(form({ eventId: bad, interested: "true" }))).toBe("NEXT_REDIRECT:/");
    }
    expect(m.rpc).not.toHaveBeenCalled();
    expect(m.revalidatePath).not.toHaveBeenCalled();
  });

  it("reports a raised code as an error and a clean call as done", async () => {
    m.rpc.mockResolvedValueOnce({ error: { message: "EVENT_ENDED" } });
    expect(await redirected(interested(true))).toBe(`NEXT_REDIRECT:${TARGET}?error=EVENT_ENDED`);
    expect(m.revalidatePath).toHaveBeenCalledWith(TARGET);
    expect(m.updateTag).toHaveBeenCalledWith("upcoming-events");

    m.rpc.mockResolvedValueOnce({ error: null });
    expect(await redirected(interested(true))).toBe(`NEXT_REDIRECT:${TARGET}?done=interested`);

    m.rpc.mockResolvedValueOnce({ error: { message: "connection reset" } });
    expect(await redirected(interested(false))).toBe(`NEXT_REDIRECT:${TARGET}?error=FAILED`);

    m.rpc.mockResolvedValueOnce({ error: null });
    expect(await redirected(interested(false))).toBe(`NEXT_REDIRECT:${TARGET}?done=cleared`);
  });

  it("forwards the toggled state to set_event_interest", async () => {
    await redirected(interested(true));
    expect(m.rpc).toHaveBeenLastCalledWith("set_event_interest", { p_event_id: EVENT_ID, p_interested: true });

    await redirected(interested(false));
    expect(m.rpc).toHaveBeenLastCalledWith("set_event_interest", { p_event_id: EVENT_ID, p_interested: false });

    // Anything that is not the literal "true" means taking it back, so a
    // tampered form cannot mark interest by omission.
    await redirected(form({ eventId: EVENT_ID }));
    expect(m.rpc).toHaveBeenLastCalledWith("set_event_interest", { p_event_id: EVENT_ID, p_interested: false });
  });
});