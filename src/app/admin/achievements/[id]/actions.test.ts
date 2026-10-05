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
vi.mock("next/cache", () => ({ revalidatePath: m.revalidatePath }));
// Next's redirect() signals control flow by throwing, so the mock must too.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => { throw new Error(`NEXT_REDIRECT:${to}`); })
}));

import { deleteAchievement, revokeAward, saveAchievement } from "./actions";

const ID = "00000000-0000-0000-0000-0000000000a1";
const AWARD_ID = "00000000-0000-0000-0000-0000000000b2";
const CURRENT = "achievements/old.png";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const valid = (extra: Record<string, string> = {}) => form({ achievementId: ID, name: "Builder", description: "Broke spawn.", currentImage: CURRENT, status: "published", ...extra });
const target = (query = "") => `NEXT_REDIRECT:/admin/achievements/${ID}${query}`;
const redirected = async (action: (data: FormData) => Promise<void>, data: FormData) =>
  action(data).then(() => null, (error: Error) => error.message);

const image = (type: string, size = 1024) => new File([new Uint8Array(size)], "badge.png", { type });

describe("admin achievement actions", () => {
  beforeEach(() => {
    m.rpc.mockReset().mockResolvedValue({ data: ID, error: null });
    m.upload.mockReset().mockResolvedValue({ error: null });
    m.remove.mockReset().mockResolvedValue({ error: null });
    m.revalidatePath.mockReset();
    m.list.mockReset().mockResolvedValue({ data: [{ id: ID, image_path: CURRENT }], error: null });
  });

  it("never calls the database for an id that isn't a UUID", async () => {
    for (const bad of ["", "r1", "0000-0000", "00000000-0000-0000-0000-00000000000z"]) {
      expect(await redirected(saveAchievement, form({ achievementId: bad, name: "X" }))).toBe("NEXT_REDIRECT:/admin/achievements");
      expect(await redirected(deleteAchievement, form({ achievementId: bad }))).toBe("NEXT_REDIRECT:/admin/achievements");
      expect(await redirected(revokeAward, form({ achievementId: bad, awardId: AWARD_ID }))).toBe("NEXT_REDIRECT:/admin/achievements");
    }
    expect(m.rpc).not.toHaveBeenCalled();
    expect(m.upload).not.toHaveBeenCalled();
    expect(m.revalidatePath).not.toHaveBeenCalled();
  });

  it("saves an edited achievement without touching Storage", async () => {
    expect(await redirected(saveAchievement, valid())).toBe(`${target()}?done=saved`);
    expect(m.rpc).toHaveBeenCalledWith("admin_upsert_achievement", {
      p_id: ID, p_name: "Builder", p_description: "Broke spawn.", p_image_path: CURRENT, p_status: "published"
    });
    expect(m.upload).not.toHaveBeenCalled();
    expect(m.remove).not.toHaveBeenCalled();
  });

  it("keeps the current image when the file input was left empty", async () => {
    const data = valid();
    data.set("image", new File([], "", { type: "application/octet-stream" }));
    expect(await redirected(saveAchievement, data)).toBe(`${target()}?done=saved`);
    expect(m.upload).not.toHaveBeenCalled();
    expect(m.rpc).toHaveBeenCalledWith("admin_upsert_achievement", expect.objectContaining({ p_image_path: CURRENT }));
  });

  it("never saves or deletes an image path posted by the form", async () => {
    const data = valid({ currentImage: "events/someone-elses.png" });
    data.set("image", image("image/png"));
    await redirected(saveAchievement, data);
    expect(m.remove).toHaveBeenCalledWith([CURRENT]);
    expect(m.remove).not.toHaveBeenCalledWith(["events/someone-elses.png"]);
  });

  it("falls back to draft for any status the form doesn't offer", async () => {
    await redirected(saveAchievement, valid({ status: "deleted" }));
    expect(m.rpc).toHaveBeenLastCalledWith("admin_upsert_achievement", expect.objectContaining({ p_status: "draft" }));
  });

  it("rejects a wrong-type or oversized file without uploading anything", async () => {
    const bad = valid();
    bad.set("image", image("text/plain"));
    expect(await redirected(saveAchievement, bad)).toBe(`${target()}?error=BAD_IMAGE_TYPE`);

    const big = valid();
    big.set("image", image("image/png", 2097153));
    expect(await redirected(saveAchievement, big)).toBe(`${target()}?error=IMAGE_TOO_LARGE`);
    expect(m.upload).not.toHaveBeenCalled();
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("treats an empty file input as keeping the current image", async () => {
    expect(await redirected(saveAchievement, valid({ image: "" }))).toBe(`${target()}?done=saved`);
    expect(m.upload).not.toHaveBeenCalled();
    expect(m.rpc).toHaveBeenCalledWith("admin_upsert_achievement", expect.objectContaining({ p_image_path: CURRENT }));
  });

  it("rejects an empty name or an over-long description before the call", async () => {
    expect(await redirected(saveAchievement, valid({ name: "   " }))).toBe(`${target()}?error=FAILED`);
    expect(await redirected(saveAchievement, valid({ description: "x".repeat(501) }))).toBe(`${target()}?error=FAILED`);
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("uploads a replacement image and deletes the one it replaced", async () => {
    const data = valid();
    data.set("image", image("image/png"));
    expect(await redirected(saveAchievement, data)).toBe(`${target()}?done=saved`);
    expect(m.upload).toHaveBeenCalledTimes(1);
    const [key, , options] = m.upload.mock.calls[0];
    expect(key).toMatch(/^achievements\/[0-9a-f-]{36}\.png$/);
    expect(options).toEqual({ contentType: "image/png" });
    expect(m.rpc).toHaveBeenCalledWith("admin_upsert_achievement", expect.objectContaining({ p_image_path: key }));
    // D5: the replaced object goes once the new path is the live one.
    expect(m.remove).toHaveBeenCalledExactlyOnceWith([CURRENT]);
  });

  it("removes the just-uploaded object when the save fails (D5)", async () => {
    m.rpc.mockResolvedValueOnce({ data: null, error: { message: "FORBIDDEN" } });
    const data = valid();
    data.set("image", image("image/webp"));
    expect(await redirected(saveAchievement, data)).toBe(`${target()}?error=FORBIDDEN`);
    expect(m.upload).toHaveBeenCalledTimes(1);
    const [key] = m.upload.mock.calls[0];
    expect(m.remove).toHaveBeenCalledExactlyOnceWith([key]);
  });

  it("removes the uploaded object when Storage itself fails", async () => {
    m.upload.mockResolvedValueOnce({ error: { message: "boom" } });
    const data = valid();
    data.set("image", image("image/gif"));
    expect(await redirected(saveAchievement, data)).toBe(`${target()}?error=UPLOAD_FAILED`);
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("creates an achievement under a fresh id and lands on its page", async () => {
    const created = "00000000-0000-0000-0000-0000000000c3";
    m.rpc.mockResolvedValueOnce({ data: created, error: null });
    expect(await redirected(saveAchievement, form({ name: "Miner", status: "draft", currentImage: "" })))
      .toBe(`NEXT_REDIRECT:/admin/achievements/${created}?done=created`);
    expect(m.rpc).toHaveBeenCalledWith("admin_upsert_achievement", expect.objectContaining({ p_id: expect.any(String), p_image_path: "" }));
  });

  it("reports a raised code as an error and a clean call as done", async () => {
    m.rpc.mockResolvedValueOnce({ error: { message: "connection reset" } });
    expect(await redirected(saveAchievement, valid())).toBe(`${target()}?error=FAILED`);
    m.revalidatePath.mockReset();

    m.rpc.mockResolvedValueOnce({ error: { message: "FORBIDDEN" } });
    expect(await redirected(revokeAward, form({ achievementId: ID, awardId: AWARD_ID }))).toBe(`${target()}?error=FORBIDDEN`);
    expect(m.revalidatePath).toHaveBeenCalledWith(`/admin/achievements/${ID}`);
  });

  it("keeps the uploaded image when the save creates the achievement", async () => {
    // The RPC answers with the id it was asked for, so the image survives.
    m.rpc.mockImplementationOnce(async (...args: unknown[]) => ({ data: (args[1] as Record<string, unknown>).p_id, error: null }));
    const data = form({ name: "Miner", status: "draft" });
    data.set("image", image("image/png"));
    expect(await redirected(saveAchievement, data)).toMatch(/^NEXT_REDIRECT:\/admin\/achievements\/[0-9a-f-]{36}\?done=created$/);
    expect(m.remove).not.toHaveBeenCalled();
  });

  it("deletes the achievement and its image, reporting a failure as an error", async () => {
    m.rpc.mockResolvedValueOnce({ data: [{ removed: 3, image_path: CURRENT }], error: null });
    expect(await redirected(deleteAchievement, form({ achievementId: ID }))).toBe("NEXT_REDIRECT:/admin/achievements?done=deleted");
    expect(m.remove).toHaveBeenCalledExactlyOnceWith([CURRENT]);

    m.remove.mockReset();
    m.rpc.mockResolvedValueOnce({ data: null, error: { message: "NOT_FOUND" } });
    expect(await redirected(deleteAchievement, form({ achievementId: ID }))).toBe("NEXT_REDIRECT:/admin/achievements?error=NOT_FOUND");
    expect(m.remove).not.toHaveBeenCalled();
  });
});