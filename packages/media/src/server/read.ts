import { detectProvider, normalizeUrl } from "../core/providers";
import type { MediaInfo } from "../core/types";
import { fetchRelease, type FetchOptions } from "./bandcamp";
import { lookupOembed } from "./oembed";

export type ReadOutcome =
  | { kind: "ok"; info: MediaInfo }
  | { kind: "unsupported" } // not a YouTube / SoundCloud / Bandcamp track link
  | { kind: "not-found" } // Bandcamp release pulled (404/410)
  | { kind: "unplayable" } // Bandcamp release with nothing publicly streamable
  | { kind: "unavailable" } // Bandcamp didn't answer usefully — try again later
  | { kind: "busy" }; // the throttle said no

/**
 * What a pasted link is. YouTube/SoundCloud always succeed (a failed oEmbed
 * lookup just leaves the text fields empty for the user to fill); Bandcamp
 * needs its page, because the stream lives there.
 */
export async function readMedia(raw: string, options: FetchOptions = {}): Promise<ReadOutcome> {
  const provider = detectProvider(raw);
  const url = normalizeUrl(raw);
  if (!provider || !url) return { kind: "unsupported" };

  if (provider !== "bandcamp") {
    const meta = await lookupOembed(provider, url, options);
    return {
      kind: "ok",
      info: {
        provider,
        url,
        title: meta?.title ?? "",
        artist: meta?.artist ?? "",
        artworkUrl: meta?.artworkUrl || null,
        durationSec: null, // oEmbed has none; the player reports it once playing
      },
    };
  }

  const outcome = await fetchRelease(url, options);
  switch (outcome.kind) {
    case "ok": {
      const { release } = outcome;
      if (!release.defaultTrackId) return { kind: "unplayable" };
      const track = release.tracks.find((t) => t.trackId === release.defaultTrackId)!;
      return {
        kind: "ok",
        info: {
          provider,
          url,
          title: track.title,
          artist: release.artist,
          artworkUrl: release.artworkUrl,
          durationSec: track.durationSec,
          bandcamp: {
            album: release.album,
            tracks: release.tracks,
            defaultTrackId: release.defaultTrackId,
          },
        },
      };
    }
    case "no-tracklist":
      return { kind: "unplayable" };
    case "not-found":
      return { kind: "not-found" };
    case "busy":
      return { kind: "busy" };
    case "transient":
      return { kind: "unavailable" };
  }
}
