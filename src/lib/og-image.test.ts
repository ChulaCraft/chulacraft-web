import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cardImage } from "./og-image";

const png = async (title: string) => Buffer.from(await (await cardImage({ kicker: "ChulaCraft event", title, lines: [] })).arrayBuffer());

// ImageResponse (@vercel/og) fetches a Google font at request time for any
// glyph the registered fonts lack. Block that, as a locked-down or offline
// server would, so only the fonts this module registers can draw.
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network disabled in og-image.test.ts"); }));
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cardImage", () => {
  // Without a Thai face every Thai letter is the same missing-glyph box, so two
  // different Thai titles of the same length draw the same image.
  it("draws Thai letters from a bundled font, not missing-glyph boxes", async () => {
    const [a, b] = await Promise.all([png("กขคง"), png("มนสห")]);
    expect(a.equals(b)).toBe(false);
  }, 20_000);

  it("draws a Latin title", async () => {
    const image = await png("Spawn Build Night");
    expect(image.subarray(1, 4).toString()).toBe("PNG");
  }, 20_000);
});
