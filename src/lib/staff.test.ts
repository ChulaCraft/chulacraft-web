import { describe, expect, it } from "vitest";
import { isStaff, staffCan } from "./staff";

describe("staffCan", () => {
  it("matches staff_can() in 20261019000001", () => {
    const table = (role: string | null) => (["players_read", "moderation", "community", "admin"] as const).map((a) => staffCan(role, a));
    expect(table("owner")).toEqual([true, true, true, true]);
    expect(table("admin")).toEqual([true, true, true, true]);
    expect(table("moderator")).toEqual([true, true, false, false]);
    expect(table("event_staff")).toEqual([true, false, true, false]);
    expect(table("user")).toEqual([false, false, false, false]);
    expect(table(null)).toEqual([false, false, false, false]);
  });

  it("knows who sees the admin area", () => {
    expect(["owner", "admin", "moderator", "event_staff", "user", null, "constructor"].map(isStaff)).toEqual([true, true, true, true, false, false, false]);
  });
});
