import { describe, expect, it } from "vitest";
import { bannerFileError } from "./size";

describe("bannerFileError", () => {
  it("accepts exactly 1500x300 for both file styles", () => {
    expect(bannerFileError("picture", { format: "png", width: 1500, height: 300 })).toBeNull();
    expect(bannerFileError("animated", { format: "gif", width: 1500, height: 300, pages: 12 })).toBeNull();
  });
  it("rejects any other size, even the same ratio", () => {
    expect(bannerFileError("picture", { format: "png", width: 3000, height: 600 })).toBe("BAD_SIZE");
    expect(bannerFileError("animated", { format: "gif", width: 1500, height: 301, pages: 2 })).toBe("BAD_SIZE");
  });
  it("keeps each style to its own format", () => {
    expect(bannerFileError("picture", { format: "webp", width: 1500, height: 300, pages: 4 })).toBe("ANIMATED");
    expect(bannerFileError("picture", { format: "gif", width: 1500, height: 300 })).toBe("BAD_IMAGE_TYPE");
    expect(bannerFileError("animated", { format: "png", width: 1500, height: 300 })).toBe("NOT_GIF");
  });
});
