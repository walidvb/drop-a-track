import { getAllBags, toTrack, type Track } from "./bags";
import { monthYear } from "./format";

/** A drop on the home page also knows which bag it went into. */
export type HomeTrack = Track & { handle: string; bagNumber: number };
export interface HomeBag {
  handle: string;
  number: number;
  since: string;
  /** Newest first. */
  tracks: HomeTrack[];
}

/** What the home page shows: every open bag, and all their drops in one list, newest first. */
export async function loadHome(): Promise<{ bags: HomeBag[]; drops: HomeTrack[] }> {
  const now = new Date();
  const all = await getAllBags();
  const bags: HomeBag[] = all.map((b) => ({
    handle: b.handle,
    number: b.number,
    since: monthYear(b.bagCreatedAt),
    tracks: b.drops.map((d) => ({ ...toTrack(d, now), handle: b.handle, bagNumber: b.number })),
  }));
  const created = new Map(all.flatMap((b) => b.drops.map((d) => [String(d.id), d.createdAt.getTime()])));
  const drops = bags.flatMap((b) => b.tracks).sort((x, y) => created.get(y.id)! - created.get(x.id)! || Number(y.id) - Number(x.id));
  return { bags, drops };
}
