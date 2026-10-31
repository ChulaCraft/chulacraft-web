import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  rpc: vi.fn<(...args: unknown[]) => Promise<{ data?: unknown; error: { message: string } | null }>>(),
  revalidatePath: vi.fn<(path: string) => void>()
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: m.rpc }) }));
vi.mock("@/lib/env", () => ({ getSiteUrl: () => "https://example.test/" }));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidatePath }));
// Next's redirect() signals control flow by throwing, so the mock must too.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => { throw new Error(`NEXT_REDIRECT:${to}`); })
}));

import { awardAttendees, checkInPlayer, nextToken, removeAttendance, resetCode } from "./actions";

const ID = "00000000-0000-0000-0000-0000000000d1";
const USER = "00000000-0000-0000-0000-0000000000a1";
const ACH = "00000000-0000-0000-0000-0000000000c1";
const PAGE = `NEXT_REDIRECT:/admin/commu/events/${ID}/check-in`;
const CODES = ["FORBIDDEN", "NOT_FOUND", "CHECKIN_CLOSED"];

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}
const redirected = async (action: (data: FormData) => Promise<void>, data: FormData) =>
  action(data).then(() => null, (error: Error) => error.message);

describe("staff check-in actions", () => {
  beforeEach(() => {
    m.rpc.mockReset().mockResolvedValue({ data: null, error: null });
    m.revalidatePath.mockReset();
  });

  describe("nextToken", () => {
    it("draws an SVG QR of the start URL and returns when it expires", async () => {
      m.rpc.mockResolvedValue({ data: [{ token: "123.abc", expires_at: "2026-10-22T10:00:30+00:00" }], error: null });
      const result = await nextToken(ID);
      expect(m.rpc).toHaveBeenCalledWith("admin_checkin_token", { p_event_id: ID });
      expect(result).toEqual({ svg: expect.stringMatching(/^<svg[\s\S]*<\/svg>\s*$/), expiresAt: Date.parse("2026-10-22T10:00:30Z") });
    });

    it("maps every raised code, and an unexpected one to FAILED", async () => {
      for (const c of CODES) {
        m.rpc.mockResolvedValueOnce({ data: null, error: { message: c } });
        expect(await nextToken(ID)).toEqual({ error: c });
      }
      m.rpc.mockResolvedValueOnce({ data: null, error: { message: "timeout" } });
      expect(await nextToken(ID)).toEqual({ error: "FAILED" });
      m.rpc.mockResolvedValueOnce({ data: [], error: null });
      expect(await nextToken(ID)).toEqual({ error: "FAILED" });
    });

    it("never calls the database for an id that isn't a UUID", async () => {
      expect(await nextToken("r1")).toEqual({ error: "NOT_FOUND" });
      expect(m.rpc).not.toHaveBeenCalled();
    });
  });

  describe("checkInPlayer", () => {
    it("normalises a typed code and returns the player for staff to eyeball", async () => {
      m.rpc.mockResolvedValue({ data: [{ status: "recorded", user_id: USER, display_name: "สมชาย", avatar_url: null }], error: null });
      expect(await checkInPlayer(ID, "  cc-abcdefgh23 ")).toEqual({ status: "recorded", name: "สมชาย", avatarUrl: null });
      expect(m.rpc).toHaveBeenCalledWith("admin_check_in_player", { p_event_id: ID, p_code: "CC-ABCDEFGH23" });
      expect(m.revalidatePath).toHaveBeenCalledWith(`/admin/commu/events/${ID}/check-in`);
    });

    it("reports a repeat scan as already", async () => {
      m.rpc.mockResolvedValue({ data: [{ status: "already", user_id: USER, display_name: "A", avatar_url: "https://cdn.discordapp.com/a.png" }], error: null });
      expect(await checkInPlayer(ID, "CC-ABCDEFGH23")).toEqual({ status: "already", name: "A", avatarUrl: "https://cdn.discordapp.com/a.png" });
    });

    it("rejects anything that isn't a personal code without a call", async () => {
      for (const bad of ["", "CC-ABC", "https://example.test/events/x/check-in/start?t=1", "CC-ABCDEFGH01", "XX-ABCDEFGH23"]) {
        expect(await checkInPlayer(ID, bad)).toEqual({ error: "UNKNOWN_CODE" });
      }
      expect(await checkInPlayer("r1", "CC-ABCDEFGH23")).toEqual({ error: "NOT_FOUND" });
      expect(m.rpc).not.toHaveBeenCalled();
    });

    it("maps every raised code, and an unexpected one to FAILED", async () => {
      for (const c of [...CODES, "UNKNOWN_CODE", "BANNED", "NOT_VERIFIED"]) {
        m.rpc.mockResolvedValueOnce({ data: null, error: { message: c } });
        expect(await checkInPlayer(ID, "CC-ABCDEFGH23")).toEqual({ error: c });
      }
      m.rpc.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
      expect(await checkInPlayer(ID, "CC-ABCDEFGH23")).toEqual({ error: "FAILED" });
    });
  });

  describe("form actions", () => {
    it("never calls the database for an event id that isn't a UUID", async () => {
      for (const action of [removeAttendance, awardAttendees, resetCode]) {
        expect(await redirected(action, form({ eventId: "r1", userId: USER, achievementId: ACH }))).toBe("NEXT_REDIRECT:/admin/commu/events");
      }
      expect(await redirected(removeAttendance, form({ eventId: ID, userId: "x" }))).toBe(`${PAGE}?error=NOT_FOUND`);
      expect(await redirected(awardAttendees, form({ eventId: ID, achievementId: "" }))).toBe(`${PAGE}?error=NO_ACHIEVEMENT`);
      expect(m.rpc).not.toHaveBeenCalled();
    });

    it("removes one attendee", async () => {
      expect(await redirected(removeAttendance, form({ eventId: ID, userId: USER }))).toBe(`${PAGE}?done=removed`);
      expect(m.rpc).toHaveBeenCalledWith("admin_remove_attendance", { p_event_id: ID, p_user_id: USER });
    });

    it("awards attendees and reports how many got it, zero included", async () => {
      m.rpc.mockResolvedValueOnce({ data: 4, error: null });
      expect(await redirected(awardAttendees, form({ eventId: ID, achievementId: ACH }))).toBe(`${PAGE}?done=awarded&n=4`);
      expect(m.rpc).toHaveBeenCalledWith("admin_award_attendees", { p_event_id: ID, p_achievement_id: ACH });
      m.rpc.mockResolvedValueOnce({ data: 0, error: null });
      expect(await redirected(awardAttendees, form({ eventId: ID, achievementId: ACH }))).toBe(`${PAGE}?done=awarded&n=0`);
    });

    it("resets the code", async () => {
      expect(await redirected(resetCode, form({ eventId: ID }))).toBe(`${PAGE}?done=reset`);
      expect(m.rpc).toHaveBeenCalledWith("admin_rotate_checkin_secret", { p_event_id: ID });
    });

    it("maps every raised code, and an unexpected one to FAILED", async () => {
      for (const c of ["FORBIDDEN", "NOT_FOUND", "boom"]) {
        const want = c === "boom" ? "FAILED" : c;
        m.rpc.mockResolvedValueOnce({ data: null, error: { message: c } });
        expect(await redirected(removeAttendance, form({ eventId: ID, userId: USER }))).toBe(`${PAGE}?error=${want}`);
        m.rpc.mockResolvedValueOnce({ data: null, error: { message: c } });
        expect(await redirected(awardAttendees, form({ eventId: ID, achievementId: ACH }))).toBe(`${PAGE}?error=${want}`);
        m.rpc.mockResolvedValueOnce({ data: null, error: { message: c } });
        expect(await redirected(resetCode, form({ eventId: ID }))).toBe(`${PAGE}?error=${want}`);
      }
    });
  });
});
