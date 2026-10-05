import type { MediaRef } from "@cucu/media/core";

/**
 * The player queue's `refreshStream` for a list of drops: a fresh Bandcamp stream for the
 * drop whose stored one stopped playing (see /api/media/refresh), or null.
 */
export const streamRefresher =
  (tracks: { id: string; media: MediaRef }[]) =>
  async (media: MediaRef): Promise<string | null> => {
    const t = tracks.find((x) => x.media === media);
    if (!t) return null;
    const res = await fetch("/api/media/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dropId: Number(t.id) }),
    });
    return res.ok ? ((await res.json()) as { streamUrl: string }).streamUrl : null;
  };
