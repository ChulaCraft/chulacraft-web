import { describe, expect, it } from "vitest";
import { allowedTabs, pickTab } from "./tabs";

describe("allowedTabs", () => {
  it("mirrors staff_can", () => {
    expect(allowedTabs("moderator")).toEqual(["community"]);
    expect(allowedTabs("event_staff")).toEqual(["events"]);
    expect(allowedTabs("owner")).toEqual(["overview", "players", "events", "community", "staff"]);
    expect(allowedTabs("admin")).toEqual(allowedTabs("owner"));
    expect(allowedTabs("user")).toEqual([]);
    expect(allowedTabs(null)).toEqual([]);
  });
});

describe("pickTab", () => {
  it("falls back to the first allowed tab", () => {
    expect(pickTab("players", ["community"])).toBe("community");
    expect(pickTab("nope", ["events", "community"])).toBe("events");
    expect(pickTab("community", ["events", "community"])).toBe("community");
    expect(pickTab(undefined, [])).toBeNull();
  });
});
