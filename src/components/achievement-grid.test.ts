import { describe, expect, it } from "vitest";
import { showcase, type AchievementGroup } from "./achievement-grid";

const group = (name: string, entries: AchievementGroup["entries"]): AchievementGroup => ({
  achievement_id: name, name, description: null, image_path: "x.png", count: entries.length,
  first_on: entries[0].awarded_on, last_on: entries[entries.length - 1].awarded_on, entries,
  tier: "common", showcase_position: null
});

const badge = (name: string, tier: string, last_on: string, showcase_position: number | null = null): AchievementGroup => ({
  ...group(name, [{ awarded_on: last_on, event_name: null }]), tier, showcase_position
});

describe("showcase", () => {
  it("shows the player's picks in their order", () => {
    const groups = [badge("A", "legendary", "2026-10-01"), badge("B", "common", "2026-09-01", 2), badge("C", "rare", "2026-08-01", 1)];
    expect(showcase(groups).map((g) => g.name)).toEqual(["C", "B"]);
  });

  it("falls back to the highest tier, then the newest", () => {
    const groups = [
      badge("Old rare", "rare", "2026-01-01"),
      badge("Common", "common", "2026-10-01"),
      badge("Epic", "epic", "2026-02-01"),
      badge("New rare", "rare", "2026-09-01"),
      badge("Unknown", "mythic", "2026-10-05")
    ];
    expect(showcase(groups).map((g) => g.name)).toEqual(["Epic", "New rare", "Old rare"]);
  });

  it("returns fewer than three when the player has fewer", () => {
    expect(showcase([badge("Only", "common", "2026-10-01")]).map((g) => g.name)).toEqual(["Only"]);
  });

  it("is empty without badges", () => {
    expect(showcase([])).toEqual([]);
  });
});
