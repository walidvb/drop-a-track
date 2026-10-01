import { connection } from "next/server";
import { getAllBags, mediaRefOf } from "@/lib/bags";
import { monthYear, relativeTime, SOURCE_LABEL } from "@/lib/format";
import { Landing, type HomeBag, type HomeTrack } from "./Landing";

/** The poster, and the latest drops from every open bag (no QR codes: dropping still takes a scan of the shirt). */
export default async function Home() {
  await connection(); // live drops: never prerendered at build
  const now = new Date();
  const all = await getAllBags();
  const bags: HomeBag[] = all.map((b) => ({
    handle: b.handle,
    number: b.number,
    since: monthYear(b.bagCreatedAt),
    tracks: b.drops.map(
      (d): HomeTrack => ({
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
        handle: b.handle,
        bagNumber: b.number,
      }),
    ),
  }));
  // Every bag's drops in one list, newest first.
  const created = new Map(all.flatMap((b) => b.drops.map((d) => [String(d.id), d.createdAt.getTime()])));
  const drops = bags.flatMap((b) => b.tracks).sort((x, y) => created.get(y.id)! - created.get(x.id)! || Number(y.id) - Number(x.id));
  return <Landing bags={bags} drops={drops} />;
}
