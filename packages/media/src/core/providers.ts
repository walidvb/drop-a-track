/**
 * Which provider a track URL belongs to, and the canonical form we store and
 * play. Isomorphic, no dependencies: safe in the browser and on the server.
 */

export type Provider = "youtube" | "soundcloud" | "bandcamp";

export const PROVIDERS: readonly Provider[] = ["youtube", "soundcloud", "bandcamp"];

/** `www.`, `m.`, `music.` and `on.` are the same site for our purposes. */
const site = (host: string) => host.toLowerCase().replace(/^(www|m|music|on)\./, "");

/** A pasted string as an http(s) URL — tolerates a missing scheme and stray whitespace. */
export function parseUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export function detectProvider(raw: string): Provider | null {
  const url = parseUrl(raw);
  if (!url) return null;
  const host = site(url.hostname);
  if (host === "youtube.com" || host === "youtu.be") return "youtube";
  if (host === "soundcloud.com") return "soundcloud";
  // Only release pages carry a tracklist; an artist's front page is not a track.
  if (host.endsWith(".bandcamp.com") && /^\/(track|album)\/[^/]+/.test(url.pathname)) {
    return "bandcamp";
  }
  return null;
}

/** YouTube query params worth keeping: the video and its start time. */
const YOUTUBE_KEEP = new Set(["v", "t"]);

/**
 * The canonical URL for a supported link, or null. Strips tracking params and
 * fragments; for YouTube keeps only `v` and `t` — react-player v2 reads `list=`
 * or `channel=` as "load that playlist instead of the video", and a drop is one
 * piece of music, never a playlist.
 */
export function normalizeUrl(raw: string): string | null {
  const provider = detectProvider(raw);
  const url = parseUrl(raw);
  if (!provider || !url) return null;

  url.protocol = "https:";
  url.hash = "";
  if (provider === "youtube") {
    for (const key of [...url.searchParams.keys()]) {
      if (!YOUTUBE_KEEP.has(key)) url.searchParams.delete(key);
    }
  } else {
    // SoundCloud private links carry their secret in the path, not the query,
    // and Bandcamp's query is only referral noise (`?from=…`, `search_item_id`).
    url.search = "";
  }
  return url.toString();
}
