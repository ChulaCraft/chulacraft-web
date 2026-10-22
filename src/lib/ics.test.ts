import { describe, expect, it } from "vitest";
import { eventIcs, icsFilename } from "./ics";

const NOW = new Date("2026-10-22T00:00:00Z");
const base = {
  id: "00000000-0000-0000-0000-0000000000e1",
  name: "Build night",
  description: null,
  starts_at: "2026-10-20T02:00:00Z",
  ends_at: null,
  location: null
};
const unfolded = (ics: string) => ics.replace(/\r\n /g, "");
const octets = (line: string) => new TextEncoder().encode(line).length;

describe("eventIcs", () => {
  it("uses CRLF and the required fields, in UTC", () => {
    const ics = eventIcs(base, "https://chulacraft.example/", NOW);
    expect(ics.endsWith("\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
    expect(ics).toContain("UID:00000000-0000-0000-0000-0000000000e1@chulacraft\r\n");
    expect(ics).toContain("DTSTAMP:20261022T000000Z\r\n");
    // 09:00 Bangkok
    expect(ics).toContain("DTSTART:20261020T020000Z\r\n");
    expect(ics).toContain("URL:https://chulacraft.example/events/00000000-0000-0000-0000-0000000000e1\r\n");
    expect(ics).toContain("SUMMARY:Build night\r\n");
  });

  it("ends two hours after the start unless an end is set", () => {
    expect(eventIcs(base, "https://x", NOW)).toContain("DTEND:20261020T040000Z");
    expect(eventIcs({ ...base, ends_at: "2026-10-20T09:30:00Z" }, "https://x", NOW)).toContain("DTEND:20261020T093000Z");
  });

  it("escapes backslash, semicolon, comma and newline", () => {
    const ics = eventIcs({ ...base, name: "a\\b;c,d", location: "Hall 1,\nFloor 2" }, "https://x", NOW);
    expect(ics).toContain("SUMMARY:a\\\\b\\;c\\,d\r\n");
    expect(ics).toContain("LOCATION:Hall 1\\,\\nFloor 2\r\n");
  });

  it("strips Markdown from the description", () => {
    const ics = eventIcs({ ...base, description: "## Plan\n**Bring** a [map](https://x.y)" }, "https://x", NOW);
    expect(ics).toContain("DESCRIPTION:Plan Bring a map\r\n");
  });

  it("folds at 75 octets without splitting a Thai character", () => {
    const name = "กิจกรรมสร้างบ้านกลางคืน".repeat(5);
    const ics = eventIcs({ ...base, name }, "https://x", NOW);
    const lines = ics.split("\r\n");
    expect(lines.some((l) => l.startsWith(" "))).toBe(true);
    for (const line of lines) expect(octets(line)).toBeLessThanOrEqual(75);
    expect(unfolded(ics)).toContain(`SUMMARY:${name}\r\n`);
  });
});

describe("icsFilename", () => {
  it("slugs the name", () => {
    expect(icsFilename(base)).toBe("build-night.ics");
  });
  it("falls back to the id for a Thai-only name", () => {
    expect(icsFilename({ id: base.id, name: "กิจกรรม" })).toBe(`${base.id}.ics`);
  });
});
