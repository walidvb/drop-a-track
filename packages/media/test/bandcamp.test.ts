// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { decodeEntities, extractTralbum, fetchRelease, parseTralbum, resolveBandcampStream } from "../src/server";

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
const ALBUM = fixture("bandcamp-album.html");
const TRACK = fixture("bandcamp-track.html");
const STRIPPED = fixture("bandcamp-stripped.html");

/** A fetch that answers every request with one canned response, and records calls. */
const fakeFetch = (body: string, status = 200) =>
  vi.fn<typeof fetch>(async () => new Response(body, { status }));

describe("decodeEntities", () => {
  it("decodes named and numeric entities", () => {
    expect(decodeEntities("&quot;a&quot; &amp; &lt;b&gt; it&#39;s &#x27;x&#x27; &apos;")).toBe(
      `"a" & <b> it's 'x' '`,
    );
  });

  it("leaves unknown entities alone", () => {
    expect(decodeEntities("&nbsp;")).toBe("&nbsp;");
  });
});

describe("parseTralbum (real fixtures)", () => {
  it("reads a whole album, defaulting to its featured track", () => {
    const release = parseTralbum(extractTralbum(ALBUM)!)!;
    expect(release.artist).toBe("C418");
    expect(release.album).toBe("Minecraft - Volume Alpha");
    expect(release.tracks).toHaveLength(24);
    expect(release.defaultTrackId).toBe("1660675500"); // "Key", the featured track
    expect(release.tracks[2]).toMatchObject({ trackId: "3682947588", title: "Subwoofer Lullaby" });
    expect(release.tracks[2].durationSec).toBeCloseTo(208.563);
    expect(release.tracks.every((t) => t.streamUrl?.startsWith("https://t4.bcbits.com/stream/"))).toBe(true);
    expect(release.artworkUrl).toBe("https://f4.bcbits.com/img/a3390257927_10.jpg");
  });

  it("reads a single track page, matching its og:title", () => {
    const release = parseTralbum(extractTralbum(TRACK)!)!;
    expect(release.tracks).toHaveLength(1);
    expect(release.defaultTrackId).toBe("3682947588");
    expect(TRACK).toContain(`content="${release.tracks[0].title}, by ${release.artist}"`);
  });

  it("never reads the footer's data-audiourl decoys", () => {
    const decoyIds = [...STRIPPED.matchAll(/data-trackid="(\d+)"/g)].map((m) => m[1]);
    expect(decoyIds.length).toBeGreaterThan(0);
    const ids = parseTralbum(extractTralbum(ALBUM)!)!.tracks.map((t) => t.trackId);
    expect(ids.filter((id) => decoyIds.includes(id))).toEqual([]);
  });

  it("keeps purchase-only tracks but never defaults to them", () => {
    const release = parseTralbum({
      artist: "A",
      trackinfo: [
        { track_id: 1, title: "locked", file: null },
        { track_id: 2, title: "open", file: { "mp3-128": "https://t4.bcbits.com/stream/x" } },
      ],
    })!;
    expect(release.tracks.map((t) => t.streamUrl)).toEqual([null, "https://t4.bcbits.com/stream/x"]);
    expect(release.defaultTrackId).toBe("2");
  });

  it("folds a /track/ page's `current` in when trackinfo lacks it", () => {
    const release = parseTralbum({ current: { track_id: 9, title: "solo", file: { "mp3-128": "s" } }, trackinfo: [] })!;
    expect(release.tracks).toEqual([{ trackId: "9", title: "solo", streamUrl: "s", durationSec: null }]);
  });

  it("is null without any track", () => {
    expect(parseTralbum({ trackinfo: [] })).toBeNull();
  });
});

describe("fetchRelease", () => {
  it("sends the full browser header set", async () => {
    const f = fakeFetch(TRACK);
    await fetchRelease("https://c418.bandcamp.com/track/subwoofer-lullaby", { fetch: f });
    const headers = f.mock.calls[0][1]?.headers as Record<string, string>;
    expect(Object.keys(headers)).toEqual(
      expect.arrayContaining(["User-Agent", "Accept", "Accept-Language", "Sec-Fetch-Mode"]),
    );
  });

  it.each([
    ["a stripped page", STRIPPED, 200, "transient"],
    ["a pulled release", "", 404, "not-found"],
    ["a gone release", "", 410, "not-found"],
    ["a server error", "", 503, "transient"],
  ])("maps %s to %s", async (_label, body, status, kind) => {
    expect((await fetchRelease("https://x.bandcamp.com/album/y", { fetch: fakeFetch(body, status) })).kind).toBe(kind);
  });

  it("treats a network failure as transient", async () => {
    const f = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    expect((await fetchRelease("https://x.bandcamp.com/album/y", { fetch: f })).kind).toBe("transient");
  });

  it("does not fetch when the throttle says no", async () => {
    const f = fakeFetch(ALBUM);
    const outcome = await fetchRelease("https://x.bandcamp.com/album/y", { fetch: f, throttle: async () => false });
    expect(outcome.kind).toBe("busy");
    expect(f).not.toHaveBeenCalled();
  });
});

describe("resolveBandcampStream", () => {
  it("returns the fresh stream for the requested track", async () => {
    const outcome = await resolveBandcampStream("https://c418.bandcamp.com/album/minecraft-volume-alpha", "3682947588", {
      fetch: fakeFetch(ALBUM),
    });
    expect(outcome.kind).toBe("ok");
    expect(outcome.kind === "ok" && outcome.streamUrl).toMatch(/\/mp3-128\/3682947588\?/);
  });

  it("is unplayable when the track left the release", async () => {
    const outcome = await resolveBandcampStream("https://x.bandcamp.com/album/y", "123", { fetch: fakeFetch(ALBUM) });
    expect(outcome.kind).toBe("unplayable");
  });
});
