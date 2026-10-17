import { describe, expect, it } from "vitest";
import { eventHistory, type AchievementGroup } from "./achievement-grid";

const group = (name: string, entries: AchievementGroup["entries"]): AchievementGroup => ({
  achievement_id: name, name, description: null, image_path: "x.png", count: entries.length,
  first_on: entries[0].awarded_on, last_on: entries[entries.length - 1].awarded_on, entries
});

describe("eventHistory", () => {
  it("lists each event once, newest first, with the badges earned there", () => {
    const groups = [
      group("Builder", [{ awarded_on: "2026-09-01", event_name: "Build Jam" }, { awarded_on: "2026-10-01", event_name: "Halloween" }]),
      group("Winner", [{ awarded_on: "2026-09-02", event_name: "Build Jam" }]),
      group("Veteran", [{ awarded_on: "2026-08-01", event_name: null }])
    ];
    expect(eventHistory(groups)).toEqual([
      { name: "Halloween", last_on: "2026-10-01", badges: ["Builder"] },
      { name: "Build Jam", last_on: "2026-09-02", badges: ["Builder", "Winner"] }
    ]);
  });

  it("lists a badge earned twice at one event once", () => {
    const groups = [group("Fisher", [{ awarded_on: "2026-09-01", event_name: "Fish Off" }, { awarded_on: "2026-09-03", event_name: "Fish Off" }])];
    expect(eventHistory(groups)).toEqual([{ name: "Fish Off", last_on: "2026-09-03", badges: ["Fisher"] }]);
  });

  it("is empty without event badges", () => {
    expect(eventHistory([])).toEqual([]);
  });
});
