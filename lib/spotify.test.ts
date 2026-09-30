import { describe, expect, it } from "vitest";
import { isSpotify } from "./spotify";

describe("isSpotify", () => {
  it("catches track, share and short links", () => {
    expect(isSpotify("https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=abc")).toBe(true);
    expect(isSpotify(" https://spotify.link/xyz ")).toBe(true);
    expect(isSpotify("https://spoti.fi/xyz")).toBe(true);
    expect(isSpotify("https://www.spotify.com/")).toBe(true);
  });

  it("leaves everything else alone", () => {
    expect(isSpotify("https://soundcloud.com/a/b")).toBe(false);
    expect(isSpotify("https://notspotify.com/track/1")).toBe(false);
    expect(isSpotify("spotify")).toBe(false);
  });
});
