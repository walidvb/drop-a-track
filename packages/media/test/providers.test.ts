import { describe, expect, it } from "vitest";
import { detectProvider, normalizeUrl } from "../src/core";

describe("detectProvider", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "youtube"],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ", "youtube"],
    ["https://music.youtube.com/watch?v=dQw4w9WgXcQ", "youtube"],
    ["https://youtu.be/dQw4w9WgXcQ?si=abc", "youtube"],
    ["youtube.com/watch?v=dQw4w9WgXcQ", "youtube"],
    ["  https://soundcloud.com/tycho/awake  ", "soundcloud"],
    ["https://m.soundcloud.com/tycho/awake", "soundcloud"],
    ["https://on.soundcloud.com/AbCdE", "soundcloud"],
    ["https://c418.bandcamp.com/track/subwoofer-lullaby", "bandcamp"],
    ["https://c418.bandcamp.com/album/minecraft-volume-alpha", "bandcamp"],
  ])("%s → %s", (url, provider) => {
    expect(detectProvider(url)).toBe(provider);
  });

  it.each([
    "https://c418.bandcamp.com/", // an artist page, not a release
    "https://c418.bandcamp.com/music",
    "https://open.spotify.com/track/abc",
    "https://notyoutube.com/watch?v=x",
    "ftp://youtube.com/watch?v=x",
    "not a url",
    "",
  ])("%s → null", (url) => {
    expect(detectProvider(url)).toBeNull();
  });
});

describe("normalizeUrl", () => {
  it("keeps only the video and start time on YouTube", () => {
    expect(normalizeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4&index=2&t=42s&si=x#c")).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s",
    );
    expect(normalizeUrl("https://youtu.be/dQw4w9WgXcQ?si=abc")).toBe("https://youtu.be/dQw4w9WgXcQ");
  });

  it("drops the query on SoundCloud and Bandcamp but keeps private-link paths", () => {
    expect(normalizeUrl("https://soundcloud.com/tycho/awake/s-SeCrEt?utm_source=x&si=y")).toBe(
      "https://soundcloud.com/tycho/awake/s-SeCrEt",
    );
    expect(normalizeUrl("http://c418.bandcamp.com/album/minecraft-volume-alpha?from=search")).toBe(
      "https://c418.bandcamp.com/album/minecraft-volume-alpha",
    );
  });

  it("is null for anything unsupported", () => {
    expect(normalizeUrl("https://example.com/song.mp3")).toBeNull();
  });
});
