import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  rpc: vi.fn<(...args: unknown[]) => Promise<{ data?: unknown; error: { message: string } | null }>>(),
  upload: vi.fn<(...args: unknown[]) => Promise<{ error: { message: string } | null }>>(),
  remove: vi.fn<(...args: unknown[]) => Promise<{ error: { message: string } | null }>>(),
  list: vi.fn<(...args: unknown[]) => Promise<{ data: unknown; error: null }>>(),
  revalidatePath: vi.fn<(path: string) => void>()
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    // Saves read the stored image path from the admin list RPC; kept apart so
    // the per-test overrides below still target the write.
    rpc: (name: string, ...rest: unknown[]) => (name.startsWith("admin_list_") ? m.list(name) : m.rpc(name, ...rest)), storage: { from: () => ({ upload: m.upload, remove: m.remove }) } })
}));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidatePath, updateTag: vi.fn() }));
// Next's redirect() signals control flow by throwing, so the mock must too.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => { throw new Error(`NEXT_REDIRECT:${to}`); })
}));

import { deleteEvent, saveEvent } from "./actions";

const ID = "00000000-0000-0000-0000-0000000000d1";
const COVER = "events/old.png";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const valid = (extra: Record<string, string> = {}) => form({
  eventId: ID, name: "Build night", description: "Bring a plan.", location: "Spawn",
  startsAt: "2026-10-20T19:00", endsAt: "2026-10-20T21:30",
  currentImage: COVER, status: "published", ...extra
});
const target = (query = "") => `NEXT_REDIRECT:/admin/achievements/events/${ID}${query}`;
const redirected = async (action: (data: FormData) => Promise<void>, data: FormData) =>
  action(data).then(() => null, (error: Error) => error.message);

const cover = (type: string, size = 1024) => new File([new Uint8Array(size)], "cover.png", { type });

describe("admin event actions", () => {
  beforeEach(() => {
    m.rpc.mockReset().mockResolvedValue({ data: ID, error: null });
    m.upload.mockReset().mockResolvedValue({ error: null });
    m.remove.mockReset().mockResolvedValue({ error: null });
    m.revalidatePath.mockReset();
    m.list.mockReset().mockResolvedValue({ data: [{ id: ID, image_path: COVER }], error: null });
  });

  it("never calls the database for an id that isn't a UUID", async () => {
    for (const bad of ["r1", "0000-0000", "00000000-0000-0000-0000-00000000000z"]) {
      expect(await redirected(saveEvent, form({ eventId: bad, name: "X", startsAt: "2026-10-20T19:00" }))).toBe("NEXT_REDIRECT:/admin/achievements");
      expect(await redirected(deleteEvent, form({ eventId: bad }))).toBe("NEXT_REDIRECT:/admin/achievements");
    }
    expect(m.rpc).not.toHaveBeenCalled();
    expect(m.upload).not.toHaveBeenCalled();
    expect(m.revalidatePath).not.toHaveBeenCalled();
  });

  it("reads the Bangkok start and end into timestamptz (D8)", async () => {
    expect(await redirected(saveEvent, valid())).toBe(`${target()}?done=saved`);
    expect(m.rpc).toHaveBeenCalledWith("admin_upsert_event", {
      p_id: ID, p_name: "Build night", p_description: "Bring a plan.",
      p_starts_at: "2026-10-20T12:00:00.000Z", p_ends_at: "2026-10-20T14:30:00.000Z",
      p_location: "Spawn", p_image_path: COVER, p_status: "published"
    });
    expect(m.upload).not.toHaveBeenCalled();
  });

  it("leaves ends_at empty when the form leaves it out", async () => {
    const data = valid({ endsAt: "" });
    data.delete("endsAt");
    expect(await redirected(saveEvent, data)).toBe(`${target()}?done=saved`);
    expect(m.rpc).toHaveBeenCalledWith("admin_upsert_event", expect.objectContaining({ p_ends_at: null }));
  });

  it("rejects a missing start or an end before the start", async () => {
    const noStart = valid();
    noStart.set("startsAt", "");
    expect(await redirected(saveEvent, noStart)).toBe(`${target()}?error=BAD_DATE`);
    expect(await redirected(saveEvent, valid({ startsAt: "2026-10-20T19:00", endsAt: "2026-10-20T18:00" }))).toBe(`${target()}?error=BAD_DATE`);
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("rejects an empty name or an over-long location before the call", async () => {
    expect(await redirected(saveEvent, valid({ name: " " }))).toBe(`${target()}?error=FAILED`);
    expect(await redirected(saveEvent, valid({ location: "x".repeat(121) }))).toBe(`${target()}?error=FAILED`);
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("rejects a wrong-type or oversized cover without uploading anything", async () => {
    const bad = valid();
    bad.set("cover", cover("application/pdf"));
    expect(await redirected(saveEvent, bad)).toBe(`${target()}?error=BAD_IMAGE_TYPE`);

    const big = valid();
    big.set("cover", cover("image/jpeg", 2097153));
    expect(await redirected(saveEvent, big)).toBe(`${target()}?error=IMAGE_TOO_LARGE`);
    expect(m.upload).not.toHaveBeenCalled();
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("uploads a cover under events/ and deletes the one it replaced", async () => {
    const data = valid();
    data.set("cover", cover("image/jpeg"));
    expect(await redirected(saveEvent, data)).toBe(`${target()}?done=saved`);
    const [key, , options] = m.upload.mock.calls[0];
    expect(key).toMatch(/^events\/[0-9a-f-]{36}\.jpg$/);
    expect(options).toEqual({ contentType: "image/jpeg" });
    expect(m.remove).toHaveBeenCalledExactlyOnceWith([COVER]);
  });

  it("removes the just-uploaded object when the save fails (D5)", async () => {
    m.rpc.mockResolvedValueOnce({ data: null, error: { message: "FORBIDDEN" } });
    const data = valid();
    data.set("cover", cover("image/png"));
    expect(await redirected(saveEvent, data)).toBe(`${target()}?error=FORBIDDEN`);
    expect(m.remove).toHaveBeenCalledExactlyOnceWith([m.upload.mock.calls[0][0]]);
  });

  it("creates an event under a fresh id and lands on its page", async () => {
    const created = "00000000-0000-0000-0000-0000000000d2";
    m.rpc.mockResolvedValueOnce({ data: created, error: null });
    const data = form({ name: "Race night", startsAt: "2026-11-01T18:00", status: "draft" });
    data.delete("eventId");
    data.delete("currentImage");
    expect(await redirected(saveEvent, data)).toBe(`NEXT_REDIRECT:/admin/achievements/events/${created}?done=created`);
    expect(m.rpc).toHaveBeenCalledWith("admin_upsert_event", expect.objectContaining({ p_id: expect.any(String), p_image_path: "" }));
  });

  it("keeps the uploaded cover when the save creates the event", async () => {
    // The RPC answers with the id it was asked for, so the cover survives.
    m.rpc.mockImplementationOnce(async (...args: unknown[]) => ({ data: (args[1] as Record<string, unknown>).p_id, error: null }));
    const data = form({ name: "Race night", startsAt: "2026-11-01T18:00", status: "draft" });
    data.set("cover", cover("image/png"));
    expect(await redirected(saveEvent, data)).toMatch(/^NEXT_REDIRECT:\/admin\/achievements\/events\/[0-9a-f-]{36}\?done=created$/);
    expect(m.remove).not.toHaveBeenCalled();
  });

  it("deletes the event and its cover, leaving awards alone", async () => {
    m.rpc.mockResolvedValueOnce({ data: [{ removed: 2, image_path: COVER }], error: null });
    expect(await redirected(deleteEvent, form({ eventId: ID }))).toBe("NEXT_REDIRECT:/admin/achievements?done=event-deleted");
    expect(m.remove).toHaveBeenCalledExactlyOnceWith([COVER]);

    m.remove.mockReset();
    m.rpc.mockResolvedValueOnce({ data: null, error: { message: "NOT_FOUND" } });
    expect(await redirected(deleteEvent, form({ eventId: ID }))).toBe("NEXT_REDIRECT:/admin/achievements?error=NOT_FOUND");
    expect(m.remove).not.toHaveBeenCalled();
  });
});