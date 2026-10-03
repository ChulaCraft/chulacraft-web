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
    expect(describeChange("some_field", "a", "b")).toBe("changed some field");
  });
});
