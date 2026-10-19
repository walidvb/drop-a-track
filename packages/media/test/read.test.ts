// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { expandShortLink, readMedia, splitOembed } from "../src/server";

const ALBUM = readFileSync(new URL("./fixtures/bandcamp-album.html", import.meta.url), "utf8");

const json = (body: unknown, status = 200) =>
  vi.fn<typeof fetch>(async () => Response.json(body, { status }));

/** on.soundcloud.com answers a HEAD with a 302 to the track page, tracking params and all. */
const redirectTo = (location: string | null, status = 302) =>
  vi.fn<typeof fetch>(async () => new Response(null, { status, headers: location ? { location } : {} }));

const SHARED = "https://soundcloud.com/oazorar/rabarbar?ref=clipboard&p=a&c=1&si=725a&utm_source=clipboard";

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

describe("expandShortLink", () => {
  it("follows a SoundCloud app share to the canonical track page", async () => {
    const f = redirectTo(SHARED);
    expect(await expandShortLink("https://on.soundcloud.com/10ootmSePuMkRD8JuI", { fetch: f })).toBe(
      "https://soundcloud.com/oazorar/rabarbar",
    );
    expect(f.mock.calls[0][1]).toMatchObject({ method: "HEAD", redirect: "manual" });
  });

  it("leaves every other link alone without fetching", async () => {
    const f = redirectTo(SHARED);
    expect(await expandShortLink("https://soundcloud.com/tycho/awake", { fetch: f })).toBe("https://soundcloud.com/tycho/awake");
    expect(f).not.toHaveBeenCalled();
  });

  it.each([
    ["no redirect", redirectTo(null, 404)],
    ["a redirect off SoundCloud", redirectTo("https://example.com/")],
    ["a network error", vi.fn<typeof fetch>(async () => { throw new TypeError("fetch failed"); })],
  ])("is null on %s", async (_, f) => {
    expect(await expandShortLink("https://on.soundcloud.com/x", { fetch: f })).toBeNull();
  });

  it("is what readMedia stores and looks up oEmbed for", async () => {
    const f = vi.fn<typeof fetch>(async (input) =>
      String(input).startsWith("https://on.")
        ? new Response(null, { status: 302, headers: { location: SHARED } })
        : Response.json({ title: "Rabarbar by Oazorar", author_name: "Oazorar" }),
    );
    const outcome = await readMedia("https://on.soundcloud.com/10ootmSePuMkRD8JuI", { fetch: f });
    expect(outcome).toMatchObject({ kind: "ok", info: { url: "https://soundcloud.com/oazorar/rabarbar", title: "Rabarbar" } });
    expect(String(f.mock.calls[1][0])).toContain(encodeURIComponent("https://soundcloud.com/oazorar/rabarbar"));
  });

  it("makes readMedia unavailable when the short link goes nowhere", async () => {
    expect((await readMedia("https://on.soundcloud.com/x", { fetch: redirectTo(null, 404) })).kind).toBe("unavailable");
  });
});
