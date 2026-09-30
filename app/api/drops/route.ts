import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { drops } from "@/db/schema";
import { countDrops, findDropBy } from "@/lib/bags";
import { READ_ERRORS, readLink } from "@/lib/read-link";
import { ticketCookieName, verifyTicket } from "@/lib/ticket";
import { UID_COOKIE, UID_MAX_AGE, isUid } from "@/lib/uid";

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const coord = (v: unknown, limit: number) => (typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= limit ? v : null);

/**
 * DROP! One per browser per bag, only with a scan ticket. The link is re-read
 * server-side (from cache) so provider, artwork and stream never come from the
 * client; only title and artist — which the dropper may correct — do.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const bagId = Number(body?.bagId);
  if (!body || !Number.isInteger(bagId)) return Response.json({ error: "Bad request." }, { status: 400 });

  const ticketName = ticketCookieName(bagId);
  if (!(await verifyTicket(request.cookies.get(ticketName)?.value, bagId))) {
    return Response.json({ error: "Scan the shirt to drop a track." }, { status: 403 });
  }

  const cookieUid = request.cookies.get(UID_COOKIE)?.value;
  const uids = [cookieUid, body.uid].filter(isUid);
  if (uids.length === 0) return Response.json({ error: "Bad request." }, { status: 400 });
  if (await findDropBy(bagId, uids)) {
    return Response.json({ error: "You already dropped in this bag. That was your one." }, { status: 409 });
  }

  const droppedBy = text(body.droppedBy, 60);
  const droppedFrom = text(body.droppedFrom, 120);
  if (!droppedBy || !droppedFrom) return Response.json({ error: "Tell us who's dropping, and from where." }, { status: 422 });

  const read = await readLink(text(body.url, 1000));
  if (read.kind !== "ok") {
    const { status, message } = READ_ERRORS[read.kind];
    return Response.json({ error: message }, { status });
  }
  const { info } = read;

  let track: { trackId: string; title: string; streamUrl: string; durationSec: number | null } | null = null;
  if (info.provider === "bandcamp") {
    const chosen = info.bandcamp?.tracks.find((t) => t.trackId === body.trackId && t.streamUrl);
    if (!chosen?.streamUrl) return Response.json({ error: "Pick a track that can be streamed." }, { status: 422 });
    track = { ...chosen, streamUrl: chosen.streamUrl };
  }

  const title = text(body.title, 200) || track?.title || info.title;
  if (!title) return Response.json({ error: "Give it a title." }, { status: 422 });
  const hasCoords = coord(body.lat, 90) !== null && coord(body.lng, 180) !== null;

  // Record the localStorage uid when there is one, and mirror it into the cookie below: once the
  // two agree, clearing either one alone doesn't buy another drop.
  const uid = isUid(body.uid) ? body.uid : uids[0];
  const [created] = await db
    .insert(drops)
    .values({
      bagId,
      dropperUid: uid,
      url: info.url,
      provider: info.provider,
      providerTrackId: track?.trackId ?? null,
      streamUrl: track?.streamUrl ?? null,
      streamRefreshedAt: track ? (read.fetchedAt ?? new Date()) : null,
      title,
      artist: text(body.artist, 200) || info.artist,
      artworkUrl: info.artworkUrl,
      durationSec: track ? track.durationSec : info.durationSec,
      droppedBy,
      droppedFrom,
      lat: hasCoords ? coord(body.lat, 90) : null,
      lng: hasCoords ? coord(body.lng, 180) : null,
    })
    .onConflictDoNothing({ target: [drops.bagId, drops.dropperUid] })
    .returning({ id: drops.id, createdAt: drops.createdAt, streamUrl: drops.streamUrl });

  // Lost a race against another tab of the same browser.
  if (!created) return Response.json({ error: "You already dropped in this bag. That was your one." }, { status: 409 });

  const res = NextResponse.json(
    {
      drop: {
        id: created.id,
        url: info.url,
        provider: info.provider,
        providerTrackId: track?.trackId ?? null,
        streamUrl: created.streamUrl,
        title,
        artist: text(body.artist, 200) || info.artist,
        artworkUrl: info.artworkUrl,
        durationSec: track ? track.durationSec : info.durationSec,
        droppedBy,
        droppedFrom,
      },
      position: await countDrops(bagId),
    },
    { status: 201 },
  );
  // That was your one: the ticket is spent. Keep the uid cookie in step with localStorage.
  res.cookies.delete(ticketName);
  if (cookieUid !== uid) {
    const secure = request.nextUrl.protocol === "https:";
    res.cookies.set(UID_COOKIE, uid, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: UID_MAX_AGE });
  }
  return res;
}
