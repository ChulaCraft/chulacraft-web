import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ rpc: vi.fn(), revalidatePath: vi.fn(), upload: vi.fn(), remove: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ rpc: m.rpc, storage: { from: () => ({ upload: m.upload, remove: m.remove }) } })
}));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidatePath }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => { throw new Error(`NEXT_REDIRECT:${to}`); })
}));

import sharp from "sharp";
import { deleteBanner, saveBanner } from "./actions";

const raw = (width: number, height: number, color: string) => sharp({ create: { width, height, channels: 3, background: color } });
const png = async (width: number, height: number) =>
  new File([new Uint8Array(await raw(width, height, "#ff8800").png().toBuffer())], "b.png", { type: "image/png" });
/** A real animated GIF: three 1500x300 frames stacked, split by pageHeight. */
const gif = async () => {
  const frames = await Promise.all(["#ff0000", "#00ff00", "#0000ff"].map((c) => raw(1500, 300, c).raw().toBuffer()));
  const bytes = await sharp(Buffer.concat(frames), { raw: { width: 1500, height: 900, channels: 3, pageHeight: 300 } }).gif().toBuffer();
  return new File([new Uint8Array(bytes)], "b.gif", { type: "image/gif" });
};

const form = (fields: Record<string, string | File>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};
const colors = { c1: "#111111", c2: "#222222", c3: "#333333", c4: "#444444" };
const redirected = (action: (data: FormData) => Promise<void>, data: FormData) =>
  action(data).then(() => null, (error: Error) => error.message);
const saved = () => m.rpc.mock.calls.find(([fn]) => fn === "admin_save_banner")?.[1];

describe("banner admin actions", () => {
  beforeEach(() => {
    m.rpc.mockReset().mockResolvedValue({ data: "b-1", error: null });
    m.upload.mockReset().mockResolvedValue({ error: null });
    m.remove.mockReset().mockResolvedValue({ error: null });
  });

  it("creates a colour banner with no file", async () => {
    expect(await redirected(saveBanner, form({ bannerId: "", name: " Lava ", style: "color", ...colors }))).toBe("NEXT_REDIRECT:/admin/commu/banners?done=created");
    expect(saved()).toEqual({ p_id: null, p_name: "Lava", p_colors: ["#111111", "#222222", "#333333", "#444444"], p_style: "color", p_image_path: null, p_still_path: null });
  });

  it("keeps bad input away from the database", async () => {
    expect(await redirected(saveBanner, form({ bannerId: "", name: "Lava", style: "color", ...colors, c4: "red" }))).toBe("NEXT_REDIRECT:/admin/commu/banners?error=INVALID");
    expect(await redirected(saveBanner, form({ bannerId: "", name: "Lava", style: "sparkly" }))).toBe("NEXT_REDIRECT:/admin/commu/banners?error=INVALID");
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("rejects a file that isn't exactly 1500x300 before uploading it", async () => {
    expect(await redirected(saveBanner, form({ bannerId: "", name: "Lava", style: "picture", picture: await png(1500, 500) }))).toBe("NEXT_REDIRECT:/admin/commu/banners?error=BAD_SIZE");
    expect(m.upload).not.toHaveBeenCalled();
  });

  it("rejects a file that only claims to be an image, and a still picture posing as animated", async () => {
    const fake = new File(["not an image"], "b.png", { type: "image/png" });
    expect(await redirected(saveBanner, form({ bannerId: "", name: "Lava", style: "picture", picture: fake }))).toBe("NEXT_REDIRECT:/admin/commu/banners?error=BAD_IMAGE_TYPE");
    expect(await redirected(saveBanner, form({ bannerId: "", name: "Lava", style: "animated", picture: await png(1500, 300) }))).toBe("NEXT_REDIRECT:/admin/commu/banners?error=NOT_GIF");
    expect(m.upload).not.toHaveBeenCalled();
  });

  it("uploads a picture, takes its colours from it, and removes the old files", async () => {
    m.rpc.mockImplementation(async (fn: string) => fn === "admin_list_banners"
      ? { data: [{ id: "b-1", style: "animated", colors: [], image_path: "banners/old.gif", still_path: "banners/old.png" }], error: null }
      : { data: "b-1", error: null });
    expect(await redirected(saveBanner, form({ bannerId: "b-1", name: "Lava", style: "picture", picture: await png(1500, 300) }))).toBe("NEXT_REDIRECT:/admin/commu/banners?done=saved");
    const key = m.upload.mock.calls[0][0] as string;
    expect(key).toMatch(/^banners\/[0-9a-f-]{36}\.png$/);
    expect(saved()).toMatchObject({ p_style: "picture", p_image_path: key, p_still_path: null, p_colors: ["#ff8800", "#ff8800", "#ff8800", "#ff8800"] });
    expect(m.remove).toHaveBeenCalledWith(["banners/old.gif", "banners/old.png"]);
  });

  it("stores an animated GIF with a PNG of its first frame", async () => {
    expect(await redirected(saveBanner, form({ bannerId: "", name: "Disco", style: "animated", picture: await gif() }))).toBe("NEXT_REDIRECT:/admin/commu/banners?done=created");
    const [gifKey, stillKey] = m.upload.mock.calls.map(([key]) => key as string);
    expect(gifKey).toMatch(/\.gif$/);
    expect(stillKey).toMatch(/\.png$/);
    expect(saved()).toMatchObject({ p_style: "animated", p_image_path: gifKey, p_still_path: stillKey, p_colors: ["#ff0000", "#ff0000", "#ff0000", "#ff0000"] });
  });

  it("needs a file when switching to a file style", async () => {
    m.rpc.mockImplementation(async (fn: string) => fn === "admin_list_banners"
      ? { data: [{ id: "b-1", style: "color", colors: [], image_path: null, still_path: null }], error: null }
      : { data: "b-1", error: null });
    expect(await redirected(saveBanner, form({ bannerId: "b-1", name: "Lava", style: "picture" }))).toBe("NEXT_REDIRECT:/admin/commu/banners?edit=b-1&error=NEED_FILE");
  });

  it("removes the uploaded files when the save fails", async () => {
    m.rpc.mockResolvedValueOnce({ error: { message: "FORBIDDEN" } });
    await redirected(saveBanner, form({ bannerId: "", name: "Disco", style: "animated", picture: await gif() }));
    expect(m.remove).toHaveBeenCalledWith(m.upload.mock.calls.map(([key]) => key));
  });

  it("deletes both files with the banner, and passes refusals back", async () => {
    m.rpc.mockReturnValueOnce({ maybeSingle: async () => ({ data: { image_path: "banners/a.gif", still_path: "banners/a.png" }, error: null }) });
    expect(await redirected(deleteBanner, form({ bannerId: "b-1" }))).toBe("NEXT_REDIRECT:/admin/commu/banners?done=deleted");
    expect(m.remove).toHaveBeenCalledWith(["banners/a.gif", "banners/a.png"]);
    m.rpc.mockReturnValueOnce({ maybeSingle: async () => ({ data: null, error: { message: "DEFAULT_LOCKED" } }) });
    expect(await redirected(deleteBanner, form({ bannerId: "dusk" }))).toBe("NEXT_REDIRECT:/admin/commu/banners?error=DEFAULT_LOCKED");
  });
});
