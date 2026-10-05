import { describe, expect, it } from "vitest";

import { MAX_CSV_ROWS, parseAwardCsv, toAwardKind } from "./award-csv";

describe("toAwardKind", () => {
  it("accepts the three kinds and nothing else", () => {
    for (const kind of ["discord", "minecraft", "chula"]) expect(toAwardKind(kind)).toBe(kind);
    for (const bad of ["email", "DISCORD ", ""]) expect(toAwardKind(bad)).toBeNull();
  });
});

describe("parseAwardCsv", () => {
  it("takes the first column when there is no header", () => {
    const parsed = parseAwardCsv("alice\nbob");
    expect(parsed.header).toBeNull();
    expect(parsed.values).toEqual(["alice", "bob"]);
  });

  it("detects the header case-insensitively and drops it", () => {
    expect(parseAwardCsv("Minecraft\nSteve\nAlex").header).toBe("minecraft");
    expect(parseAwardCsv("CHULA\nstudent@chula.ac.th").values).toEqual(["student@chula.ac.th"]);
    // A header name somewhere other than the first cell still counts.
    expect(parseAwardCsv("name,Discord\nxa,zoe").header).toBe("discord");
  });

  it("keeps quoted cells whole and strips the quotes", () => {
    const parsed = parseAwardCsv('minecraft\n"Notch, Jr"\nPlain');
    expect(parsed.values).toEqual(["Notch, Jr", "Plain"]);
  });

  it("trims, skips blank lines and dedupes case-insensitively", () => {
    const parsed = parseAwardCsv("discord\n  alice  \n\nbob\nALICE\n\n");
    expect(parsed.values).toEqual(["alice", "bob"]);
    expect(parsed.duplicates).toEqual(["ALICE"]);
    expect(parsed.rowCount).toBe(3);
  });

  it("reports an empty file as nothing to award", () => {
    const parsed = parseAwardCsv("\n\n  \n");
    expect(parsed.values).toEqual([]);
    expect(parsed.header).toBeNull();
    expect(parseAwardCsv("discord\n").header).toBe("discord");
    expect(parseAwardCsv("discord\n").values).toEqual([]);
  });

  it("stops caring about 1001 rows so the RPC can answer TOO_MANY", () => {
    const rows = Array.from({ length: MAX_CSV_ROWS + 1 }, (_, i) => `player${i}`);
    expect(parseAwardCsv(rows.join("\n")).values).toHaveLength(MAX_CSV_ROWS + 1);
  });
});