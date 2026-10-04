import { describe, expect, it } from "vitest";
import { FACULTIES, facultyRole, unitRole, validateProfile, type ProfileDetails } from "./faculties";

const ok: ProfileDetails = { first: "Somchai", last: "Kittisak", nick: "", level: "undergraduate", faculty: "Faculty of Engineering", major: "Computer Engineering (CP)" };

/** The shared cross-repo example table: faculty + unit + level -> derived role names. */
const EXAMPLES: [faculty: string, unit: string | null, level: string | null, roles: string[]][] = [
  ["Faculty of Engineering", "Civil Engineering (CE)", "undergraduate", ["Engineering", "CE"]],
  ["Faculty of Engineering", "Computer Engineering and Digital Technology (CEDT)", "undergraduate", ["Engineering", "CEDT"]],
  ["Faculty of Arts", "French", "undergraduate", ["Arts", "French"]],
  ["Faculty of Engineering", "Electrical Engineering (EE)", "graduate", ["Engineering", "EE", "Graduate"]],
  ["Faculty of Dentistry", "Dentistry", "undergraduate", ["Dentistry"]],
  ["Faculty of Economics", "Economics", "undergraduate", ["Economics"]],
  ["Faculty of Medicine", "Doctor of Medicine (CU-MEDi)", "undergraduate", ["Medicine", "CU-MEDi"]]
];

/** What the bot's desiredRoleNames does, over the same derived names. */
function desiredRoles(faculty: string, unit: string | null, level: string | null): string[] {
  return [...new Set([facultyRole(faculty), ...(unit ? [unitRole(unit)] : []), ...(level === "graduate" ? ["Graduate"] : [])])];
}

const allPairs = FACULTIES.flatMap((f) => f.majors.map((m) => [f.name, m] as const));

describe("validateProfile", () => {
  it("accepts a complete profile with no nickname", () => {
    expect(validateProfile(ok)).toEqual({});
  });

  it("flags blank names, unknown faculty and a major from another faculty", () => {
    expect(validateProfile({ ...ok, first: " ", last: "", faculty: "Hogwarts" })).toEqual({ first: true, last: true, faculty: true, major: true });
    expect(validateProfile({ ...ok, major: "Dentistry" })).toEqual({ major: true });
    expect(validateProfile({ ...ok, nick: "x".repeat(21) })).toEqual({ nick: true });
  });

  it("requires a study level", () => {
    expect(validateProfile({ ...ok, level: "" as ProfileDetails["level"] })).toEqual({ level: true });
    expect(validateProfile({ ...ok, level: "postgraduate" as ProfileDetails["level"] })).toEqual({ level: true });
    expect(validateProfile({ ...ok, level: "graduate" })).toEqual({});
  });
});

describe("the faculty list", () => {
  it("gives every faculty at least one unit", () => {
    for (const f of FACULTIES) expect(f.majors.length, f.name).toBeGreaterThan(0);
  });

  it("has no duplicate (faculty, unit) pair", () => {
    expect(new Set(allPairs.map(([f, m]) => `${f}::${m}`)).size).toBe(allPairs.length);
  });

  it("only ever stores a trailing parenthetical in the verified-code format", () => {
    // The bot takes the code inside the parentheses as the role name, so a note
    // like "(Thai)" would become a role. Every parenthetical must be a code.
    for (const [f, m] of allPairs) {
      const tail = m.match(/\(([^)]*)\)$/);
      if (!tail) continue;
      expect(tail[1], `${f} / ${m}`).toMatch(/^[A-Za-z][A-Za-z-]*$/);
      expect(unitRole(m)).toBe(tail[1]);
    }
  });
});

describe("derived role names", () => {
  it.each(EXAMPLES)("%s / %s (%s) -> %j", (faculty, unit, level, roles) => {
    expect(desiredRoles(faculty, unit, level)).toEqual(roles);
  });

  it("is unique across all faculties, except a unit named like its own faculty", () => {
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const [faculty, unit] of allPairs) {
      const name = unitRole(unit);
      const owner = `${faculty} / ${unit}`;
      const first = seen.get(name);
      if (first && first !== owner) clashes.push(`${name}: ${first} vs ${owner}`);
      else seen.set(name, owner);
    }
    expect(clashes).toEqual([]);
  });

  it("never produces the Graduate or verified roles", () => {
    const names = allPairs.flatMap(([faculty, unit]) => [facultyRole(faculty), unitRole(unit)]);
    expect(names).not.toContain("Graduate");
    expect(names).not.toContain("verified");
  });

  it("keeps every name inside Discord's 100 character limit", () => {
    for (const [faculty, unit] of allPairs) {
      expect(facultyRole(faculty).length).toBeLessThanOrEqual(100);
      expect(unitRole(unit).length).toBeLessThanOrEqual(100);
    }
  });

  it("maps the faculty prefix off Faculty, College and School alike", () => {
    expect(facultyRole("Faculty of Sports Science")).toBe("Sports Science");
    expect(facultyRole("College of Public Health Sciences")).toBe("Public Health Sciences");
    expect(facultyRole("School of Integrated Innovation")).toBe("Integrated Innovation");
    expect(facultyRole("Hogwarts")).toBe("Hogwarts");
  });

  it("takes the code from the unit, or the whole name when there is none", () => {
    expect(unitRole("Civil Engineering (CE)")).toBe("CE");
    expect(unitRole("Doctor of Medicine (CU-MEDi)")).toBe("CU-MEDi");
    expect(unitRole("Language and Culture (BALAC)")).toBe("BALAC");
    expect(unitRole("French")).toBe("French");
    // (Thai) would also match, so the real guard is the FACULTIES list test above:
    // only verified codes are ever stored in the parentheses.
  });
});
