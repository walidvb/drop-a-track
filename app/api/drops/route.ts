import type { Provider } from "@cucu/media/core";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { drops } from "@/db/schema";
import { countDrops, findDropBy } from "@/lib/bags";
import { READ_ERRORS, readLink } from "@/lib/read-link";
import { ticketCookieName, verifyTicket } from "@/lib/ticket";
import { UID_COOKIE, UID_MAX_AGE, isUid } from "@/lib/uid";
import { findUpload } from "@/lib/upload";

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const coord = (v: unknown, limit: number) => (typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= limit ? v : null);

/** What a drop plays and shows. Title and artist are suggestions the dropper's own override. */
interface Source {
  url: string;
  provider: Provider;
  providerTrackId: string | null;
  streamUrl: string | null;
  streamRefreshedAt: Date | null;
  title: string;
  artist: string;
  artworkUrl: string | null;
  durationSec: number | null;
}
type Refusal = { error: string; status: number };

/** A pasted link, re-read server-side (from cache). */
async function fromLink(body: Record<string, unknown>): Promise<Source | Refusal> {
  const read = await readLink(text(body.url, 1000));
  if (read.kind !== "ok") {
    const { status, message } = READ_ERRORS[read.kind];
    return { error: message, status };
  }
  const { info } = read;

  let track: { trackId: string; title: string; streamUrl: string; durationSec: number | null } | null = null;
  if (info.provider === "bandcamp") {
    const chosen = info.bandcamp?.tracks.find((t) => t.trackId === body.trackId && t.streamUrl);
    if (!chosen?.streamUrl) return { error: "Pick a track that can be streamed.", status: 422 };
    track = { ...chosen, streamUrl: chosen.streamUrl };
  }
  return {
    url: info.url,
    provider: info.provider,
    providerTrackId: track?.trackId ?? null,
    streamUrl: track?.streamUrl ?? null,
    streamRefreshedAt: track ? (read.fetchedAt ?? new Date()) : null,
    title: track?.title || info.title,
    artist: info.artist,
    artworkUrl: info.artworkUrl,
    durationSec: track ? track.durationSec : info.durationSec,
  };
}

/** An uploaded or recorded file, already in Blob storage. Its length is the browser's word: display only. */
async function fromUpload(body: Record<string, unknown>, bagId: number): Promise<Source | Refusal> {
  const file = await findUpload(text(body.fileUrl, 1000), bagId);
  if (!file) return { error: "That upload didn’t go through. Try again.", status: 422 };
  const d = body.durationSec;
  return {
    url: file.url,
    provider: "file",
    providerTrackId: null,
    streamUrl: null,
    streamRefreshedAt: null,
    title: "",
    artist: "",
    artworkUrl: null,
    durationSec: typeof d === "number" && Number.isFinite(d) && d > 0 ? Math.min(d, 24 * 3600) : null,
  };
}

/**
 * DROP! One per browser per bag, only with a scan ticket. A link is re-read
 * server-side and an upload is looked up in Blob storage, so provider,
 * artwork and stream never come from the client; only title and artist —
 * which the dropper may correct — do.
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

  const source = body.fileUrl ? await fromUpload(body, bagId) : await fromLink(body);
  if ("error" in source) return Response.json({ error: source.error }, { status: source.status });

  const title = text(body.title, 200) || source.title;
  if (!title) return Response.json({ error: "Give it a title." }, { status: 422 });
  const artist = text(body.artist, 200) || source.artist;
  const hasCoords = coord(body.lat, 90) !== null && coord(body.lng, 180) !== null;

  // Record the localStorage uid when there is one, and mirror it into the cookie below: once the
  // two agree, clearing either one alone doesn't buy another drop.
  const uid = isUid(body.uid) ? body.uid : uids[0];
  const [created] = await db
    .insert(drops)
    .values({
      bagId,
      dropperUid: uid,
      url: source.url,
      provider: source.provider,
      providerTrackId: source.providerTrackId,
      streamUrl: source.streamUrl,
      streamRefreshedAt: source.streamRefreshedAt,
      title,
      artist,
      artworkUrl: source.artworkUrl,
      durationSec: source.durationSec,
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
        url: source.url,
        provider: source.provider,
        providerTrackId: source.providerTrackId,
        streamUrl: created.streamUrl,
        title,
        artist,
        artworkUrl: source.artworkUrl,
        durationSec: source.durationSec,
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
