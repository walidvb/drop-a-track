// @vitest-environment node
import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { randomTexture, TEXTURES } from "./textures";

describe("textures", () => {
  it("lists exactly the masks in public/textures", () => {
    const files = readdirSync(new URL("../public/textures", import.meta.url)).map((f) => `/textures/${f}`);
    expect([...TEXTURES].sort()).toEqual(files.sort());
  });

  it("picks one of them", () => {
    expect(TEXTURES).toContain(randomTexture());
  });
});
