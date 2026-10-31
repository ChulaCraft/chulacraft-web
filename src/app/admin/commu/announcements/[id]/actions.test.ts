import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  rpc: vi.fn<(...args: unknown[]) => Promise<{ data?: unknown; error: { message: string } | null }>>(),
  upload: vi.fn(async () => ({ error: null })),
  remove: vi.fn(async () => ({ error: null }))
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ rpc: m.rpc, storage: { from: () => ({ upload: m.upload, remove: m.remove }) } })
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// Next's redirect() signals control flow by throwing, so the mock must too.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => { throw new Error(`NEXT_REDIRECT:${to}`); })
}));

import { deleteAnnouncement, saveAnnouncement } from "./actions";

const ID = "00000000-0000-0000-0000-0000000000a1";
const BASE = "NEXT_REDIRECT:/admin/commu/announcements";

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
    m.upload.mockClear();
    m.remove.mockClear();
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

  it("swaps the picture and removes the one it replaced", async () => {
    const data = valid();
    data.set("image", new File(["x"], "a.png", { type: "image/png" }));
    m.rpc.mockResolvedValueOnce({ data: ID, error: null }).mockResolvedValueOnce({ data: "announcements/old.png", error: null });
    expect(await redirected(saveAnnouncement, data)).toBe(`${BASE}/${ID}?done=saved`);
    const key = (m.upload.mock.calls[0] as unknown[])[0] as string;
    expect(key).toMatch(/^announcements\/[0-9a-f-]{36}\.png$/);
    expect(m.rpc).toHaveBeenLastCalledWith("admin_set_announcement_image", { p_id: ID, p_path: key });
    expect(m.remove).toHaveBeenCalledWith(["announcements/old.png"]);
  });

  it("removes the picture when asked, and leaves it alone otherwise", async () => {
    await redirected(saveAnnouncement, valid());
    expect(m.rpc).not.toHaveBeenCalledWith("admin_set_announcement_image", expect.anything());
    m.rpc.mockResolvedValueOnce({ data: ID, error: null }).mockResolvedValueOnce({ data: "announcements/old.png", error: null });
    await redirected(saveAnnouncement, valid({ removeImage: "on" }));
    expect(m.rpc).toHaveBeenLastCalledWith("admin_set_announcement_image", { p_id: ID, p_path: null });
    expect(m.remove).toHaveBeenCalledWith(["announcements/old.png"]);
  });

  it("refuses a file that isn't a picture before uploading", async () => {
    const data = valid();
    data.set("image", new File(["x"], "a.txt", { type: "text/plain" }));
    expect(await redirected(saveAnnouncement, data)).toBe(`${BASE}/${ID}?error=BAD_IMAGE_TYPE`);
    expect(m.upload).not.toHaveBeenCalled();
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("deletes and returns to the list", async () => {
    m.rpc.mockResolvedValueOnce({ data: null, error: null });
    expect(await redirected(deleteAnnouncement, form({ announcementId: ID }))).toBe(`${BASE}?done=deleted`);
    expect(m.rpc).toHaveBeenCalledWith("admin_delete_announcement", { p_id: ID });
    m.rpc.mockResolvedValueOnce({ data: null, error: { message: "NOT_FOUND" } });
    expect(await redirected(deleteAnnouncement, form({ announcementId: ID }))).toBe(`${BASE}?error=NOT_FOUND`);
  });
});
