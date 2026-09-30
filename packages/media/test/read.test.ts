// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { readMedia, splitOembed } from "../src/server";

const ALBUM = readFileSync(new URL("./fixtures/bandcamp-album.html", import.meta.url), "utf8");

const json = (body: unknown, status = 200) =>
  vi.fn<typeof fetch>(async () => Response.json(body, { status }));

describe("splitOembed", () => {
  it.each([
    [{ title: "Awake by Tycho", author_name: "Tycho" }, "Awake", "Tycho"],
    [{ title: "Rick Astley - Never Gonna Give You Up (Official Video)", author_name: "RickAstleyVEVO" }, "Never Gonna Give You Up (Official Video)", "Rick Astley"],
    [{ title: "A - B - C", author_name: "Label" }, "A - B - C", "Label"],
    [{ title: "Untitled", author_name: "" }, "Untitled", ""],
  ])("%j", (response, title, artist) => {
    expect(splitOembed(response)).toMatchObject({ title, artist });
  });
});

describe("readMedia", () => {
  it("rejects unsupported links without fetching", async () => {
    const f = json({});
    expect((await readMedia("https://open.spotify.com/track/x", { fetch: f })).kind).toBe("unsupported");
    expect(f).not.toHaveBeenCalled();
  });

  it("reads YouTube through oEmbed on the normalized URL", async () => {
    const f = json({ title: "Artist - Song", author_name: "Channel", thumbnail_url: "https://i.ytimg.com/x.jpg" });
    const outcome = await readMedia("https://youtu.be/dQw4w9WgXcQ?si=abc&list=RD", { fetch: f });
    expect(String(f.mock.calls[0][0])).toContain(encodeURIComponent("https://youtu.be/dQw4w9WgXcQ"));
    expect(outcome).toEqual({
      kind: "ok",
      info: {
        provider: "youtube",
        url: "https://youtu.be/dQw4w9WgXcQ",
        title: "Song",
        artist: "Artist",
        artworkUrl: "https://i.ytimg.com/x.jpg",
        durationSec: null,
      },
    });
  });

  it("still succeeds with empty fields when oEmbed fails", async () => {
    const outcome = await readMedia("https://soundcloud.com/a/b", { fetch: json({}, 404) });
    expect(outcome).toMatchObject({ kind: "ok", info: { provider: "soundcloud", title: "", artist: "", artworkUrl: null } });
  });

  it("reads a Bandcamp album with its tracklist, preselecting the featured track", async () => {
    const f = vi.fn(async () => new Response(ALBUM));
    const outcome = await readMedia("https://c418.bandcamp.com/album/minecraft-volume-alpha?from=x", { fetch: f });
    if (outcome.kind !== "ok") throw new Error(outcome.kind);
    expect(outcome.info).toMatchObject({
      provider: "bandcamp",
      url: "https://c418.bandcamp.com/album/minecraft-volume-alpha",
      title: "Key",
      artist: "C418",
      durationSec: 65,
      bandcamp: { album: "Minecraft - Volume Alpha", defaultTrackId: "1660675500" },
    });
    expect(outcome.info.bandcamp?.tracks).toHaveLength(24);
  });

  it("passes the throttle through to Bandcamp", async () => {
    const f = vi.fn(async () => new Response(ALBUM));
    const outcome = await readMedia("https://c418.bandcamp.com/album/x", { fetch: f, throttle: async () => false });
    expect(outcome.kind).toBe("busy");
    expect(f).not.toHaveBeenCalled();
  });
});
