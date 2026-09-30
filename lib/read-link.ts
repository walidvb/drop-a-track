import { eq } from "drizzle-orm";
import { normalizeUrl, type MediaInfo } from "@cucu/media/core";
import { readMedia, type ReadOutcome } from "@cucu/media/server";
import { db } from "@/db";
import { mediaCache } from "@/db/schema";
import { bandcampThrottle } from "./throttle";

/** Bandcamp streams outlive this by weeks; re-pastes and reloads never refetch. */
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface CachedRead {
  info: MediaInfo;
  fetchedAt: Date;
}

/** `readMedia`, behind the cache and the shared Bandcamp throttle. */
export async function readLink(raw: string): Promise<ReadOutcome & { fetchedAt?: Date }> {
  const url = normalizeUrl(raw);
  if (!url) return { kind: "unsupported" };

  const [cached] = await db.select().from(mediaCache).where(eq(mediaCache.url, url)).limit(1);
  if (cached && Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS) {
    return { kind: "ok", info: cached.payload as MediaInfo, fetchedAt: cached.fetchedAt };
  }

  const outcome = await readMedia(url, { throttle: bandcampThrottle });
  if (outcome.kind !== "ok") return outcome;
  // YouTube/SoundCloud read "ok" even when oEmbed failed (blank fields): don't pin that for a week.
  const { info } = outcome;
  if (info.provider !== "bandcamp" && !info.title && !info.artist && !info.artworkUrl) return outcome;

  const fetchedAt = new Date();
  await db
    .insert(mediaCache)
    .values({ url, payload: outcome.info, fetchedAt })
    .onConflictDoUpdate({ target: mediaCache.url, set: { payload: outcome.info, fetchedAt } });
  return { ...outcome, fetchedAt };
}

/** What each failure means to someone holding their phone. */
export const READ_ERRORS: Record<Exclude<ReadOutcome["kind"], "ok">, { status: number; message: string }> = {
  unsupported: { status: 422, message: "Bandcamp, SoundCloud or YouTube links only." },
  "not-found": { status: 404, message: "That release is gone." },
  unplayable: { status: 422, message: "Nothing on that release can be streamed. Pick another." },
  unavailable: { status: 503, message: "Couldn’t read that Bandcamp link. Try again in a moment." },
  busy: { status: 503, message: "Couldn’t read that Bandcamp link. Try again in a moment." },
};
