import { describe, expect, it } from "vitest";
import { TOKEN_ALPHABET, generateToken, parseToken } from "./token";

describe("tokens", () => {
  it("are 6 chars from the look-alike-free alphabet", () => {
    for (let i = 0; i < 500; i++) expect(generateToken()).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
    expect(TOKEN_ALPHABET).not.toMatch(/[01IO]/);
  });

  it("parse case-insensitively and reject anything else", () => {
    expect(parseToken(" k7m2qp ")).toBe("K7M2QP");
    expect(parseToken("K7M2Q")).toBeNull();
    expect(parseToken("K7M2Q0")).toBeNull(); // 0 is not in the alphabet
  });
});
