import { describe, expect, it } from "vitest";
import { validateProfile } from "./faculties";

const ok = { first: "Somchai", last: "Kittisak", nick: "", faculty: "Faculty of Engineering", major: "Computer Engineering" };

describe("validateProfile", () => {
  it("accepts a complete profile with no nickname", () => {
    expect(validateProfile(ok)).toEqual({});
  });

  it("flags blank names, unknown faculty and a major from another faculty", () => {
    expect(validateProfile({ ...ok, first: " ", last: "", faculty: "Hogwarts" })).toEqual({ first: true, last: true, faculty: true, major: true });
    expect(validateProfile({ ...ok, major: "Dentistry" })).toEqual({ major: true });
    expect(validateProfile({ ...ok, nick: "x".repeat(21) })).toEqual({ nick: true });
  });
});
