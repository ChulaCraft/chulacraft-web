import { describe, expect, it } from "vitest";
import { describeChange } from "./change-log";

describe("describeChange", () => {
  it("phrases Minecraft add, remove and replace", () => {
    expect(describeChange("minecraft_username", null, "Mint")).toBe("added Mint");
    expect(describeChange("minecraft_username", "Mint", null)).toBe("removed Mint");
    expect(describeChange("minecraft_username", "Mint", "Choco")).toBe("replaced Mint with Choco");
  });

  it("phrases role, Chula and Google changes", () => {
    expect(describeChange("role", "user", "admin")).toBe("changed role to admin");
    expect(describeChange("email", "a@chula.ac.th", null)).toBe("reset the Chula link");
    expect(describeChange("google", "a@gmail.com", null)).toBe("unlinked personal Google");
    expect(describeChange("guest_verified", null, "true")).toBe("marked as verified (guest)");
    expect(describeChange("guest_verified", "true", null)).toBe("removed guest status");
  });

  it("falls back for profile and unknown fields", () => {
    expect(describeChange("faculty", null, "Engineering")).toBe("updated faculty");
    expect(describeChange("study_level", null, "graduate")).toBe("updated study level");
    expect(describeChange("some_field", "a", "b")).toBe("changed some field");
  });

  it("phrases content and server console actions", () => {
    expect(describeChange("banned", null, "2026-10-12 00:00:00+00")).toBe("issued a temporary ban");
    expect(describeChange("banned", null, null)).toBe("issued a permanent ban");
    expect(describeChange("appeal", null, "rejected")).toBe("rejected an appeal");
    expect(describeChange("report", null, "dismissed")).toBe("dismissed a report");
    expect(describeChange("awarded_on", null, "2026-10-05")).toBe("gave an achievement");
    expect(describeChange("awarded_on", "2026-10-05", null)).toBe("took back an achievement");
    expect(describeChange("created", null, "Server rules")).toBe("created Server rules");
    expect(describeChange("deleted", "Server rules", null)).toBe("deleted Server rules");
    expect(describeChange("console_write", null, "survival")).toBe("opened the console on survival");
    expect(describeChange("start", null, "survival")).toBe("started survival");
    expect(describeChange("stop", null, "survival")).toBe("stopped survival");
    expect(describeChange("restart", null, "survival")).toBe("restarted survival");
  });
});
