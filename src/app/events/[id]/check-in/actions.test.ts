import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  rpc: vi.fn(),
  getUser: vi.fn(),
  get: vi.fn<(name: string) => { value: string } | undefined>(),
  set: vi.fn<(name: string, value: string, options: Record<string, unknown>) => void>()
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: m.getUser }, rpc: m.rpc })
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: m.get, set: m.set }) }));
// Next's redirect() signals control flow by throwing, so the mock must too.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => { throw new Error(`NEXT_REDIRECT:${to}`); })
}));

import { checkIn } from "./actions";

const ID = "00000000-0000-0000-0000-0000000000e1";
const PAGE = `/events/${ID}/check-in`;

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}
const redirected = async (data: FormData) => checkIn(data).then(() => null, (error: Error) => error.message);
const cleared = () => m.set.mock.calls.map(([name, value, options]) => [name, value, options.path, options.maxAge]);

describe("player check-in action", () => {
  beforeEach(() => {
    m.rpc.mockReset().mockResolvedValue({ data: "recorded", error: null });
    m.getUser.mockReset().mockResolvedValue({ data: { user: { id: "player-1" } } });
    m.get.mockReset().mockImplementation((name) => (name === "cc_checkin" ? { value: "p.1.mac" } : undefined));
    m.set.mockReset();
  });

  it("never calls the database for an id that isn't a UUID", async () => {
    for (const bad of ["r1", "", "00000000-0000-0000-0000-00000000000z"]) {
      expect(await redirected(form({ eventId: bad }))).toBe("NEXT_REDIRECT:/");
    }
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("sends a signed-out visitor to sign in", async () => {
    m.getUser.mockResolvedValue({ data: { user: null } });
    expect(await redirected(form({ eventId: ID }))).toBe("NEXT_REDIRECT:/register");
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("treats an unreachable Supabase as a failure, not a check-in", async () => {
    m.getUser.mockRejectedValue(new Error("connection reset"));
    expect(await redirected(form({ eventId: ID }))).toBe(`NEXT_REDIRECT:${PAGE}?error=FAILED`);
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("asks for a rescan when the proof cookie is gone", async () => {
    m.get.mockReturnValue(undefined);
    expect(await redirected(form({ eventId: ID }))).toBe(`NEXT_REDIRECT:${PAGE}?error=TOKEN_EXPIRED`);
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("checks in with the cookie's proof, not anything posted, and clears both cookies", async () => {
    expect(await redirected(form({ eventId: ID, token: "forged" }))).toBe(`NEXT_REDIRECT:${PAGE}?done=recorded`);
    expect(m.rpc).toHaveBeenCalledExactlyOnceWith("check_in", { p_event_id: ID, p_token: "p.1.mac" });
    expect(cleared()).toEqual([["cc_checkin", "", PAGE, 0], ["cc_next", "", "/", 0]]);
  });

  it("reports a second scan as already checked in", async () => {
    m.rpc.mockResolvedValue({ data: "already", error: null });
    expect(await redirected(form({ eventId: ID }))).toBe(`NEXT_REDIRECT:${PAGE}?done=already`);
  });

  it("maps every raised code onto the page and clears the proof", async () => {
    for (const code of ["NOT_FOUND", "CHECKIN_CLOSED", "TOKEN_EXPIRED", "BANNED", "NOT_VERIFIED", "FORBIDDEN"]) {
      m.set.mockReset();
      m.rpc.mockResolvedValueOnce({ data: null, error: { message: code } });
      expect(await redirected(form({ eventId: ID }))).toBe(`NEXT_REDIRECT:${PAGE}?error=${code}`);
      expect(cleared()).toEqual([["cc_checkin", "", PAGE, 0], ["cc_next", "", "/", 0]]);
    }
  });

  it("keeps the proof after an unexpected error so pressing again can work", async () => {
    m.rpc.mockResolvedValue({ data: null, error: { message: "connection reset by peer" } });
    expect(await redirected(form({ eventId: ID }))).toBe(`NEXT_REDIRECT:${PAGE}?error=FAILED`);
    expect(cleared()).toEqual([["cc_next", "", "/", 0]]);
  });
});
