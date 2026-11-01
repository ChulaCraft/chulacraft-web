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

import { createAchievement, deleteAchievement, revokeAward, saveAchievement } from "./actions";

const ID = "00000000-0000-0000-0000-0000000000a1";
const AWARD_ID = "00000000-0000-0000-0000-0000000000b2";
const CURRENT = "achievements/old.png";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const valid = (extra: Record<string, string> = {}) => form({ achievementId: ID, name: "Builder", description: "Broke spawn.", currentImage: CURRENT, status: "published", ...extra });
const target = (query = "") => `NEXT_REDIRECT:/admin/commu/achievements/${ID}${query}`;
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
      expect(await redirected(saveAchievement, form({ achievementId: bad, name: "X" }))).toBe("NEXT_REDIRECT:/admin/commu/achievements");
      expect(await redirected(deleteAchievement, form({ achievementId: bad }))).toBe("NEXT_REDIRECT:/admin/commu/achievements");
      expect(await redirected(revokeAward, form({ achievementId: bad, awardId: AWARD_ID }))).toBe("NEXT_REDIRECT:/admin/commu/achievements");
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

  it("sets the tier and Discord role after the save, a blank role clearing it", async () => {
    expect(await redirected(saveAchievement, valid({ tier: "epic", discordRoleId: " 123456789012345678 " }))).toBe(`${target()}?done=saved`);
    expect(m.rpc.mock.calls.map((call) => call[0])).toEqual(["admin_upsert_achievement", "admin_set_achievement_meta"]);
    expect(m.rpc).toHaveBeenLastCalledWith("admin_set_achievement_meta", { p_id: ID, p_tier: "epic", p_discord_role_id: "123456789012345678" });

    await redirected(saveAchievement, valid({ tier: "rare", discordRoleId: "" }));
    expect(m.rpc).toHaveBeenLastCalledWith("admin_set_achievement_meta", { p_id: ID, p_tier: "rare", p_discord_role_id: null });
  });

  it("reports a refused tier or role, still cleaning up the replaced image", async () => {
    m.rpc.mockResolvedValueOnce({ data: ID, error: null }).mockResolvedValueOnce({ error: { message: "ROLE_NOT_ALLOWED" } });
    const data = valid({ tier: "rare", discordRoleId: "123456789012345678" });
    data.set("image", image("image/png"));
    expect(await redirected(saveAchievement, data)).toBe(`${target()}?error=ROLE_NOT_ALLOWED`);
    expect(m.remove).toHaveBeenCalledExactlyOnceWith([CURRENT]);

    m.rpc.mockResolvedValueOnce({ data: ID, error: null }).mockResolvedValueOnce({ error: { message: "INVALID" } });
    expect(await redirected(saveAchievement, valid({ tier: "mythic" }))).toBe(`${target()}?error=INVALID`);
  });

  it("skips the tier call when the save itself fails", async () => {
    m.rpc.mockResolvedValueOnce({ data: null, error: { message: "FORBIDDEN" } });
    expect(await redirected(saveAchievement, valid())).toBe(`${target()}?error=FORBIDDEN`);
    expect(m.rpc).toHaveBeenCalledTimes(1);
  });

  it("sets the tier on a newly created achievement and lands on its page", async () => {
    const created = "00000000-0000-0000-0000-0000000000c4";
    m.rpc.mockResolvedValueOnce({ data: created, error: null }).mockResolvedValueOnce({ error: { message: "ROLE_NOT_ALLOWED" } });
    expect(await redirected(saveAchievement, form({ name: "Miner", status: "draft", tier: "legendary", discordRoleId: "123456789012345678" })))
      .toBe(`NEXT_REDIRECT:/admin/commu/achievements/${created}?error=ROLE_NOT_ALLOWED`);
    expect(m.rpc).toHaveBeenLastCalledWith("admin_set_achievement_meta", { p_id: created, p_tier: "legendary", p_discord_role_id: "123456789012345678" });
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
    expect(m.rpc).toHaveBeenCalledWith("admin_upsert_achievement", expect.objectContaining({ p_status: "draft" }));
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
      .toBe(`NEXT_REDIRECT:/admin/commu/achievements/${created}?done=created`);
    expect(m.rpc).toHaveBeenCalledWith("admin_upsert_achievement", expect.objectContaining({ p_id: expect.any(String), p_image_path: "" }));
  });

  it("reports a raised code as an error and a clean call as done", async () => {
    m.rpc.mockResolvedValueOnce({ error: { message: "connection reset" } });
    expect(await redirected(saveAchievement, valid())).toBe(`${target()}?error=FAILED`);
    m.revalidatePath.mockReset();

    m.rpc.mockResolvedValueOnce({ error: { message: "FORBIDDEN" } });
    expect(await redirected(revokeAward, form({ achievementId: ID, awardId: AWARD_ID }))).toBe(`${target()}?error=FORBIDDEN`);
    expect(m.revalidatePath).toHaveBeenCalledWith(`/admin/commu/achievements/${ID}`);
  });

  it("keeps the uploaded image when the save creates the achievement", async () => {
    // The RPC answers with the id it was asked for, so the image survives.
    m.rpc.mockImplementationOnce(async (...args: unknown[]) => ({ data: (args[1] as Record<string, unknown>).p_id, error: null }));
    const data = form({ name: "Miner", status: "draft" });
    data.set("image", image("image/png"));
    expect(await redirected(saveAchievement, data)).toMatch(/^NEXT_REDIRECT:\/admin\/commu\/achievements\/[0-9a-f-]{36}\?done=created$/);
    expect(m.remove).not.toHaveBeenCalled();
  });

  it("deletes the achievement and its image, reporting a failure as an error", async () => {
    m.rpc.mockResolvedValueOnce({ data: [{ removed: 3, image_path: CURRENT }], error: null });
    expect(await redirected(deleteAchievement, form({ achievementId: ID }))).toBe("NEXT_REDIRECT:/admin/commu/achievements?done=deleted");
    expect(m.remove).toHaveBeenCalledExactlyOnceWith([CURRENT]);

    m.remove.mockReset();
    m.rpc.mockResolvedValueOnce({ data: null, error: { message: "NOT_FOUND" } });
    expect(await redirected(deleteAchievement, form({ achievementId: ID }))).toBe("NEXT_REDIRECT:/admin/commu/achievements?error=NOT_FOUND");
    expect(m.remove).not.toHaveBeenCalled();
  });

  describe("createAchievement (D11)", () => {
    const START = { code: null, values: { name: "", description: "", status: "draft", tier: "common", discordRoleId: "" } };
    const fresh = (extra: Record<string, string> = {}) => form({ name: "Miner", description: "Dug deep.", status: "published", tier: "rare", discordRoleId: "123456789012345678", ...extra });
    // A failure stays on /new: no redirect, the error code and the typed text come back as state.
    const kept = { name: "Miner", description: "Dug deep.", status: "published", tier: "rare", discordRoleId: "123456789012345678" };

    it("stays on the form with the typed text when the name is blank", async () => {
      const state = await createAchievement(START, fresh({ name: "   " }));
      expect(state).toEqual({ code: "NAME_INVALID", values: { ...kept, name: "" } });
      expect(m.rpc).not.toHaveBeenCalled();
      expect(m.upload).not.toHaveBeenCalled();
    });

    it("stays on the form when the image type is wrong", async () => {
      const data = fresh();
      data.set("image", image("text/plain"));
      expect(await createAchievement(START, data)).toEqual({ code: "BAD_IMAGE_TYPE", values: kept });
      expect(m.upload).not.toHaveBeenCalled();
      expect(m.rpc).not.toHaveBeenCalled();
    });

    it("stays on the form when the image is over 2 MB", async () => {
      const data = fresh();
      data.set("image", image("image/png", 2097153));
      expect(await createAchievement(START, data)).toEqual({ code: "IMAGE_TOO_LARGE", values: kept });
      expect(m.upload).not.toHaveBeenCalled();
      expect(m.rpc).not.toHaveBeenCalled();
    });

    it("stays on the form when the upload fails, creating nothing", async () => {
      m.upload.mockResolvedValueOnce({ error: { message: "boom" } });
      const data = fresh();
      data.set("image", image("image/png"));
      expect(await createAchievement(START, data)).toEqual({ code: "UPLOAD_FAILED", values: kept });
      expect(m.rpc).not.toHaveBeenCalled();
    });

    it("stays on the form when the save is refused, removing the uploaded image", async () => {
      m.rpc.mockResolvedValueOnce({ data: null, error: { message: "FORBIDDEN" } });
      const data = fresh();
      data.set("image", image("image/png"));
      expect(await createAchievement(START, data)).toEqual({ code: "FORBIDDEN", values: kept });
      const [key] = m.upload.mock.calls[0];
      expect(m.remove).toHaveBeenCalledExactlyOnceWith([key]);
      expect(m.rpc).toHaveBeenCalledTimes(1);
    });

    it("deletes the new row and its image when the tier or role is refused, so a resubmit can't duplicate it", async () => {
      m.rpc
        .mockImplementationOnce(async (...args: unknown[]) => ({ data: (args[1] as Record<string, unknown>).p_id, error: null }))
        .mockResolvedValueOnce({ error: { message: "ROLE_NOT_ALLOWED" } })
        .mockResolvedValueOnce({ data: [{ removed: 0, image_path: "" }], error: null });
      const data = fresh();
      data.set("image", image("image/png"));
      expect(await createAchievement(START, data)).toEqual({ code: "ROLE_NOT_ALLOWED", values: kept });
      const upsertId = (m.rpc.mock.calls[0][1] as Record<string, string>).p_id;
      expect(m.rpc.mock.calls.map((call) => call[0])).toEqual(["admin_upsert_achievement", "admin_set_achievement_meta", "admin_delete_achievement"]);
      expect(m.rpc).toHaveBeenLastCalledWith("admin_delete_achievement", { p_id: upsertId });
      const [key] = m.upload.mock.calls[0];
      expect(m.remove).toHaveBeenCalledExactlyOnceWith([key]);
    });
  });
});
