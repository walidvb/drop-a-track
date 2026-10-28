import { describe, expect, it } from "vitest";
import { fuzzyMatch } from "./search";

const track = ["semla", "Prząśniczka", "Marek & Wacek", "Laura, Warsaw"];

describe("fuzzyMatch", () => {
  it("finds words as typed, any case or accent", () => {
    expect(fuzzyMatch("SEMLA", track)).toBe(true);
    expect(fuzzyMatch("przasn", track)).toBe(true);
    expect(fuzzyMatch("wacek laura", track)).toBe(true);
    expect(fuzzyMatch("", track)).toBe(true);
  });

  it("forgives one typo from four letters on", () => {
    expect(fuzzyMatch("przsn", track)).toBe(true); // a missing letter
    expect(fuzzyMatch("warsw", track)).toBe(true);
    expect(fuzzyMatch("mrek", track)).toBe(true);
    expect(fuzzyMatch("lxxra", track)).toBe(false); // two
    expect(fuzzyMatch("smla", ["semla"])).toBe(true);
    expect(fuzzyMatch("sml", ["semla"])).toBe(false); // too short to guess
  });

  it("needs every word", () => {
    expect(fuzzyMatch("semla berlin", track)).toBe(false);
  });
});
