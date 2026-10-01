import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { findDropBy, getBagByHandle, getPublicDrops, mediaRefOf } from "@/lib/bags";
import { monthYear, relativeTime, SOURCE_LABEL } from "@/lib/format";
import { bagPath, handleFromSlug } from "@/lib/handle";
import { ticketCookieName, verifyTicket } from "@/lib/ticket";
import { UID_COOKIE, isUid } from "@/lib/uid";
import { BagApp, type BagTrack } from "./BagApp";

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const handle = handleFromSlug((await params).slug);
  return { title: handle ? `${handle}’s bag · drop-a-track` : "drop-a-track" };
}

/** A shirt's current bag. Public to look at; dropping needs a fresh scan (a ticket cookie). */
export default async function BagPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const handle = handleFromSlug(slug);
  if (!handle) notFound();
  if (slug !== handle) redirect(bagPath(handle)); // /@mira.k, /Mira.K → /mira.k
  const bag = await getBagByHandle(handle);
  if (!bag) notFound();

  const jar = await cookies();
  const uid = jar.get(UID_COOKIE)?.value;
  const [rows, ticketValid, myDropId] = await Promise.all([
    getPublicDrops(bag.bagId),
    verifyTicket(jar.get(ticketCookieName(bag.bagId))?.value, bag.bagId),
    isUid(uid) ? findDropBy(bag.bagId, [uid]) : null,
  ]);

  const now = new Date();
  const tracks: BagTrack[] = rows.map((d) => ({
    id: String(d.id),
    title: d.title,
    artist: d.artist,
    thumbnail: d.artworkUrl,
    source: SOURCE_LABEL[d.provider],
    duration: d.durationSec,
    droppedBy: d.droppedBy,
    droppedFrom: d.droppedFrom,
    droppedAt: relativeTime(d.createdAt, now),
    url: d.url,
    media: mediaRefOf(d),
  }));

  return (
    <BagApp
      owner={{ handle: bag.handle, number: bag.number, since: monthYear(bag.bagCreatedAt), theme: bag.theme }}
      bagId={bag.bagId}
      initialTracks={tracks}
      ticketValid={ticketValid}
      serverDropId={myDropId ? String(myDropId) : null}
      cookieUid={isUid(uid) ? uid : null}
    />
  );
}
