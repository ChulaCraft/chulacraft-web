import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  rpc: vi.fn<(...args: unknown[]) => Promise<{ data?: unknown; error: { message: string } | null }>>()
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: m.rpc }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// Next's redirect() signals control flow by throwing, so the mock must too.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => { throw new Error(`NEXT_REDIRECT:${to}`); })
}));

import { deleteAnnouncement, saveAnnouncement } from "./actions";

const ID = "00000000-0000-0000-0000-0000000000a1";
const BASE = "NEXT_REDIRECT:/admin/announcements";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const valid = (extra: Record<string, string> = {}) => form({
  announcementId: ID, title: "Maintenance tonight", body: "Back by 22:00.", severity: "maintenance",
  status: "published", publishAt: "2026-10-20T19:00", ...extra
});
const redirected = async (action: (data: FormData) => Promise<void>, data: FormData) =>
  action(data).then(() => null, (error: Error) => error.message);

describe("admin announcement actions", () => {
  beforeEach(() => {
    m.rpc.mockReset().mockResolvedValue({ data: ID, error: null });
  });

  it("never calls the database for an id that isn't a UUID", async () => {
    expect(await redirected(saveAnnouncement, valid({ announcementId: "r1" }))).toBe(BASE);
    expect(await redirected(deleteAnnouncement, form({ announcementId: "r1" }))).toBe(BASE);
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("reads Bangkok times and the checkboxes", async () => {
    expect(await redirected(saveAnnouncement, valid({ expiresAt: "2026-10-21T19:00", pinned: "on", postToDiscord: "on" })))
      .toBe(`${BASE}/${ID}?done=saved`);
    expect(m.rpc).toHaveBeenCalledWith("admin_upsert_announcement", {
      p_id: ID, p_title: "Maintenance tonight", p_body: "Back by 22:00.", p_severity: "maintenance",
      p_pinned: true, p_published_at: "2026-10-20T12:00:00.000Z", p_expires_at: "2026-10-21T12:00:00.000Z",
      p_post_to_discord: true
    });
  });

  it("saves a draft with no publish time, whatever the form's time says", async () => {
    await redirected(saveAnnouncement, valid({ status: "draft" }));
    expect(m.rpc).toHaveBeenCalledWith("admin_upsert_announcement", expect.objectContaining({
      p_published_at: null, p_expires_at: null, p_pinned: false, p_post_to_discord: false
    }));
  });

  it("publishes now when no time is given", async () => {
    const before = Date.now();
    await redirected(saveAnnouncement, valid({ publishAt: "" }));
    const at = Date.parse((m.rpc.mock.calls[0][1] as { p_published_at: string }).p_published_at);
    expect(at).toBeGreaterThanOrEqual(before);
    expect(at).toBeLessThanOrEqual(Date.now());
  });

  it("rejects bad text, severity or dates before the call", async () => {
    const invalid: Record<string, string>[] = [{ title: " " }, { body: "" }, { title: "x".repeat(121) }, { body: "x".repeat(2001) }, { severity: "loud" }];
    for (const bad of invalid) {
      expect(await redirected(saveAnnouncement, valid(bad))).toBe(`${BASE}/${ID}?error=FAILED`);
    }
    expect(await redirected(saveAnnouncement, valid({ expiresAt: "2026-10-20T19:00" }))).toBe(`${BASE}/${ID}?error=BAD_DATE`);
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("creates under a fresh id and lands on the new page", async () => {
    const created = "00000000-0000-0000-0000-0000000000a2";
    m.rpc.mockResolvedValueOnce({ data: created, error: null });
    const data = valid();
    data.delete("announcementId");
    expect(await redirected(saveAnnouncement, data)).toBe(`${BASE}/${created}?done=created`);
    expect(m.rpc).toHaveBeenCalledWith("admin_upsert_announcement", expect.objectContaining({ p_id: expect.stringMatching(/^[0-9a-f-]{36}$/) }));
  });

  it("reports a database refusal on the form it came from", async () => {
    m.rpc.mockResolvedValueOnce({ data: null, error: { message: "FORBIDDEN" } });
    expect(await redirected(saveAnnouncement, valid())).toBe(`${BASE}/${ID}?error=FORBIDDEN`);
    const data = valid();
    data.delete("announcementId");
    m.rpc.mockResolvedValueOnce({ data: null, error: { message: "boom: details" } });
    expect(await redirected(saveAnnouncement, data)).toBe(`${BASE}/new?error=FAILED`);
  });

  it("deletes and returns to the list", async () => {
    m.rpc.mockResolvedValueOnce({ data: null, error: null });
    expect(await redirected(deleteAnnouncement, form({ announcementId: ID }))).toBe(`${BASE}?done=deleted`);
    expect(m.rpc).toHaveBeenCalledWith("admin_delete_announcement", { p_id: ID });
    m.rpc.mockResolvedValueOnce({ data: null, error: { message: "NOT_FOUND" } });
    expect(await redirected(deleteAnnouncement, form({ announcementId: ID }))).toBe(`${BASE}?error=NOT_FOUND`);
  });
});
