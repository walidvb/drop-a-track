import { getDropIdsBy } from "./bags";
import { relativeTime } from "./format";
import { loadHome, type HomeBag, type HomeTrack } from "./home";
import { readTickets } from "./ticket";

/** A bag this browser scanned but hasn't dropped into: its drop is still to make. */
export interface PendingDrop {
  handle: string;
  number: number;
  tracks: number;
  /** "Just now", "3h ago"… */
  scanned: string;
}

/** A drop this browser made, with its place in the bag (1 = the first in). */
export interface PastDrop {
  id: string;
  handle: string;
  title: string;
  artist: string;
  position: number;
}

/** The pending drops, latest scan first: a ticket for an open bag that none of this browser's drops is in. */
export async function pendingDrops(
  cookies: { name: string; value: string }[],
  bags: HomeBag[],
  mine: string[],
  now = new Date(),
): Promise<PendingDrop[]> {
  const tickets = await readTickets(cookies);
  return tickets
    .sort((a, b) => b.scannedAt.getTime() - a.scannedAt.getTime())
    .flatMap(({ bagId, scannedAt }) => {
      const bag = bags.find((b) => b.bagId === bagId);
      if (!bag || bag.tracks.some((t) => mine.includes(t.id))) return [];
      return [{ handle: bag.handle, number: bag.number, tracks: bag.tracks.length, scanned: relativeTime(scannedAt, now) }];
    });
}

/** This browser's drops, newest first. */
export function pastDrops({ bags, drops }: { bags: HomeBag[]; drops: HomeTrack[] }, mine: string[]): PastDrop[] {
  return drops
    .filter((d) => mine.includes(d.id))
    .map((d) => {
      const tracks = bags.find((b) => b.handle === d.handle)?.tracks ?? [];
      return { id: d.id, handle: d.handle, title: d.title, artist: d.artist, position: tracks.length - tracks.findIndex((t) => t.id === d.id) };
    });
}

/** /my-drops for this browser: its scan tickets, and the drops made under any of its uids (cookie, localStorage). */
export async function loadMyDrops(cookies: { name: string; value: string }[], uids: string[]) {
  const [home, ...ids] = await Promise.all([loadHome(), ...uids.map(getDropIdsBy)]);
  const mine = ids.flat();
  return { pending: await pendingDrops(cookies, home.bags, mine), past: pastDrops(home, mine) };
}
