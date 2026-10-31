import { describe, expect, it } from "vitest";
import { buildChanges, controlName, reviewRows, warningFor, type Draft, type Snapshot } from "./staged";

const snap: Snapshot = {
  role: "user",
  profile: { first: "Ann", last: "B", nick: "", level: "undergraduate", faculty: "Faculty of Law", major: "Law" },
  privacy: { profile: "public", minecraft: "public", achievements: "public", friends: "public" },
  banners: [{ id: "gold-1", name: "Gold", granted: false }, { id: "sky-2", name: "Sky", granted: true }],
  registrations: [{ id: "r1", name: "AnnMC", desired: true }],
  activeBanId: null,
  verification: "unverified",
};
const none: Draft = { role: "user", guest: false, reset: false, profile: snap.profile, privacy: snap.privacy, banners: {}, whitelist: {}, lift: false, ban: null };
const NOW = Date.UTC(2030, 0, 1);

describe("buildChanges", () => {
  it("is empty when nothing is staged", () => {
    expect(buildChanges(snap, none, NOW)).toEqual([]);
  });

  it("emits one entry per registration and per banner, in D1a order", () => {
    const draft: Draft = {
      ...none, role: "admin", guest: true, reset: true, lift: true,
      profile: { ...snap.profile, first: "Anna" },
      privacy: { ...snap.privacy, friends: "private" },
      banners: { "gold-1": true, "sky-2": false },
      whitelist: { r1: false },
      ban: { reason: " grief ", note: "", duration: "7d" },
    };
    const out = buildChanges({ ...snap, activeBanId: "b1" }, draft, NOW);
    expect(out.map((c) => c.kind)).toEqual(["role", "profile", "privacy", "banner", "banner", "chula_reset", "guest", "lift_ban", "whitelist", "ban"]);
    expect(out[3]).toEqual({ kind: "banner", banner_id: "gold-1", grant: true });
    expect(out[7]).toEqual({ kind: "lift_ban", ban_id: "b1" });
    expect(out[9]).toEqual({ kind: "ban", reason: "grief", public_note: "", expires_at: new Date(NOW + 7 * 86_400_000).toISOString() });
  });

  it("skips values equal to what is saved, and sends a permanent ban with no expiry", () => {
    const out = buildChanges(snap, { ...none, banners: { "gold-1": false }, whitelist: { r1: true }, ban: { reason: "x", note: "n", duration: "permanent" } }, NOW);
    expect(out).toEqual([{ kind: "ban", reason: "x", public_note: "n", expires_at: null }]);
  });
});

describe("review", () => {
  it("lists before and after for each change", () => {
    const rows = reviewRows(snap, buildChanges(snap, { ...none, role: "admin", privacy: { ...snap.privacy, friends: "private" }, banners: { "gold-1": true }, whitelist: { r1: false } }, NOW));
    expect(rows).toEqual([
      { label: "Role", before: "Player", after: "Admin" },
      { label: "Friend list", before: "Anyone signed in", after: "Nobody" },
      { label: "Banner Gold", before: "Not given", after: "Given" },
      { label: "Minecraft account AnnMC", before: "On the whitelist", after: "Removed" },
    ]);
  });

  it("warns for ban, Chula reset and role only", () => {
    expect(warningFor([{ kind: "guest" }, { kind: "privacy", profile: "a", minecraft: "a", achievements: "a", friends: "a" }])).toBeUndefined();
    const w = warningFor([{ kind: "ban", reason: "x", public_note: "", expires_at: null }, { kind: "chula_reset" }, { kind: "role", role: "admin" }]);
    expect(w).toMatch(/ban/i);
    expect(w).toMatch(/Chula/);
    expect(w).toMatch(/role/i);
  });

  it("names the control a failed apply points at", () => {
    expect(controlName(snap, { kind: "whitelist", target: "r1" })).toBe("Minecraft account AnnMC");
    expect(controlName(snap, { kind: "banner", target: "sky-2" })).toBe("Banner Sky");
    expect(controlName(snap, { kind: "ban", target: "u" })).toBe("Ban");
    expect(controlName(snap, { kind: "chula_reset", target: "u" })).toBe("Chula link");
    expect(controlName(snap, { kind: "mystery", target: "u" })).toBeNull();
  });
});
