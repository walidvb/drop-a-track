import { describe, expect, it } from "vitest";
import { bagPath, handleFromSlug, parseHandle } from "./handle";

describe("handles", () => {
  it("normalize and validate", () => {
    expect(parseHandle("@Mira.K")).toBe("mira.k");
    expect(parseHandle("a")).toBeNull();
    expect(parseHandle("no spaces")).toBeNull();
    expect(parseHandle("x".repeat(31))).toBeNull();
  });

  it("refuse only bags: every other app path is clear of /bags/…", () => {
    expect(parseHandle("bags")).toBeNull();
    expect(parseHandle("Bags")).toBeNull();
    expect(parseHandle("admin")).toBe("admin");
    expect(parseHandle("manage")).toBe("manage");
  });

  it("read slugs, old @ links and encodings included", () => {
    expect(handleFromSlug("mira.k")).toBe("mira.k");
    expect(handleFromSlug("@mira.k")).toBe("mira.k");
    expect(handleFromSlug("%40mira.k")).toBe("mira.k");
    expect(handleFromSlug("mira%")).toBeNull();
    expect(bagPath("mira.k")).toBe("/bags/mira.k");
  });
});
