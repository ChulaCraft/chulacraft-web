import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ rpc: vi.fn(), revalidatePath: vi.fn(), upload: vi.fn(), remove: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ rpc: m.rpc, storage: { from: () => ({ upload: m.upload, remove: m.remove }) } })
}));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidatePath }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => { throw new Error(`NEXT_REDIRECT:${to}`); })
}));

import { setGalleryCover } from "./actions";

const ID = "a0000000-0000-4000-8000-000000000001";
const OLD = "gallery/b0000000-0000-4000-8000-000000000001.png";
const page = `/admin/commu/gallery/${ID}`;
const form = (fields: Record<string, string | File>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};
const picture = () => new File([new Uint8Array([1, 2, 3])], "c.png", { type: "image/png" });
const run = (data: FormData) => setGalleryCover(data).then(() => null, (e: Error) => e.message);

describe("setGalleryCover", () => {
  beforeEach(() => {
    m.rpc.mockReset().mockResolvedValue({ data: OLD, error: null });
    m.upload.mockReset().mockResolvedValue({ error: null });
    m.remove.mockReset().mockResolvedValue({ error: null });
    m.revalidatePath.mockReset();
  });

  it("uploads the new cover, saves it, and removes the previous object", async () => {
    expect(await run(form({ groupId: ID, cover: picture() }))).toBe(`NEXT_REDIRECT:${page}?done=cover-saved`);
    const key = m.upload.mock.calls[0][0] as string;
    expect(key).toMatch(/^gallery\/[0-9a-f-]{36}\.png$/);
    expect(m.rpc).toHaveBeenCalledWith("admin_set_gallery_cover", { p_id: ID, p_path: key });
    expect(m.remove).toHaveBeenCalledWith([OLD]);
    expect(m.revalidatePath).toHaveBeenCalledWith("/gallery", "layout");
  });

  it("removes the fresh upload, not the old cover, when the save fails", async () => {
    m.rpc.mockResolvedValue({ data: null, error: { message: "FORBIDDEN" } });
    expect(await run(form({ groupId: ID, cover: picture() }))).toBe(`NEXT_REDIRECT:${page}?error=FORBIDDEN`);
    expect(m.remove).toHaveBeenCalledWith([m.upload.mock.calls[0][0]]);
  });

  it("clears the cover and deletes its object", async () => {
    expect(await run(form({ groupId: ID, removeCover: "on" }))).toBe(`NEXT_REDIRECT:${page}?done=cover-removed`);
    expect(m.upload).not.toHaveBeenCalled();
    expect(m.rpc).toHaveBeenCalledWith("admin_set_gallery_cover", { p_id: ID, p_path: null });
    expect(m.remove).toHaveBeenCalledWith([OLD]);
  });

  it("asks for a file when none is posted, and never reaches the database", async () => {
    expect(await run(form({ groupId: ID }))).toBe(`NEXT_REDIRECT:${page}?error=NO_FILE`);
    expect(m.rpc).not.toHaveBeenCalled();
  });
});
