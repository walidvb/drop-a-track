import { and, count, desc, eq, inArray } from "drizzle-orm";
import type { MediaRef } from "@cucu/media/core";
import { resolveBandcampStream } from "@cucu/media/server";
import { db } from "@/db";
import { bags, drops, qrCodes } from "@/db/schema";
import { bandcampThrottle } from "./throttle";

export interface BagOwner {
  qrCodeId: number;
  number: number;
  handle: string;
  bagId: number;
  bagCreatedAt: Date;
}

/** The current bag of the shirt with this handle. */
export async function getBagByHandle(handle: string): Promise<BagOwner | null> {
  const [row] = await db
    .select({
      qrCodeId: qrCodes.id,
      number: qrCodes.number,
      handle: qrCodes.handle,
      bagId: bags.id,
      bagCreatedAt: bags.createdAt,
    })
    .from(qrCodes)
    .innerJoin(bags, eq(bags.id, qrCodes.currentBagId))
    .where(eq(qrCodes.handle, handle))
    .limit(1);
  return row && row.handle ? { ...row, handle: row.handle } : null;
}

/** What a scan resolves to: the shirt, and its current bag if it's open. */
export async function getScanTarget(token: string) {
  const [row] = await db
    .select({ number: qrCodes.number, handle: qrCodes.handle, bagId: qrCodes.currentBagId })
    .from(qrCodes)
    .where(eq(qrCodes.token, token))
    .limit(1);
  return row ?? null;
}

/** A bag's drops as the public sees them: no uids, no coordinates. Newest first. */
export async function getPublicDrops(bagId: number) {
  return db
    .select({
      id: drops.id,
      url: drops.url,
      provider: drops.provider,
      providerTrackId: drops.providerTrackId,
      streamUrl: drops.streamUrl,
      title: drops.title,
      artist: drops.artist,
      artworkUrl: drops.artworkUrl,
      durationSec: drops.durationSec,
      droppedBy: drops.droppedBy,
      droppedFrom: drops.droppedFrom,
      createdAt: drops.createdAt,
    })
    .from(drops)
    .where(eq(drops.bagId, bagId))
    .orderBy(desc(drops.createdAt), desc(drops.id));
}

export type PublicDrop = Awaited<ReturnType<typeof getPublicDrops>>[number];

export const mediaRefOf = (d: Pick<PublicDrop, "provider" | "url" | "providerTrackId" | "streamUrl">): MediaRef => ({
  provider: d.provider,
  url: d.url,
  providerTrackId: d.providerTrackId,
  streamUrl: d.streamUrl,
});

/** The drop any of these uids already made in this bag. */
export async function findDropBy(bagId: number, uids: string[]): Promise<number | null> {
  if (uids.length === 0) return null;
  const [row] = await db
    .select({ id: drops.id })
    .from(drops)
    .where(and(eq(drops.bagId, bagId), inArray(drops.dropperUid, uids)))
    .limit(1);
  return row?.id ?? null;
}

export async function countDrops(bagId: number): Promise<number> {
  const [row] = await db.select({ n: count() }).from(drops).where(eq(drops.bagId, bagId));
  return row?.n ?? 0;
}

/** A refreshed stream is good for weeks; within this window, hand back the one we have. */
const REFRESH_COOLDOWN_MS = 10 * 60 * 1000;

/**
 * A fresh Bandcamp stream for a drop whose stored one stopped playing. At most
 * one page fetch per drop per 10 minutes, and through the shared throttle.
 */
export async function refreshDropStream(dropId: number): Promise<string | null> {
  const [d] = await db
    .select({
      url: drops.url,
      provider: drops.provider,
      providerTrackId: drops.providerTrackId,
      streamUrl: drops.streamUrl,
      streamRefreshedAt: drops.streamRefreshedAt,
    })
    .from(drops)
    .where(eq(drops.id, dropId))
    .limit(1);
  if (!d || d.provider !== "bandcamp" || !d.providerTrackId) return null;
  if (d.streamRefreshedAt && Date.now() - d.streamRefreshedAt.getTime() < REFRESH_COOLDOWN_MS) {
    return d.streamUrl;
  }

  const outcome = await resolveBandcampStream(d.url, d.providerTrackId, { throttle: bandcampThrottle });
  if (outcome.kind === "busy" || outcome.kind === "transient") return null;

  // A pulled release or vanished track is recorded too, so it isn't re-fetched on every play.
  const streamUrl = outcome.kind === "ok" ? outcome.streamUrl : null;
  await db.update(drops).set({ streamUrl, streamRefreshedAt: new Date() }).where(eq(drops.id, dropId));
  return streamUrl;
}
