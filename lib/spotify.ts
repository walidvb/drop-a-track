/** Spotify links are refused on purpose: pasting one opens the boycott modal instead. */
export function isSpotify(url: string): boolean {
  try {
    const host = new URL(url.trim()).hostname.replace(/^www\./, "");
    return host === "spotify.com" || host.endsWith(".spotify.com") || host === "spotify.link" || host === "spoti.fi";
  } catch {
    return false;
  }
}

/** The track's title from Spotify's oEmbed (CORS-open), to search for it elsewhere. Null if slow or unknown. */
export async function spotifyTitle(url: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, {
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(3000)]) : AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { title?: unknown };
    return typeof body.title === "string" && body.title ? body.title : null;
  } catch {
    return null;
  }
}
