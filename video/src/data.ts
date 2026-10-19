import type { TextureName } from "./components/Texture";

/**
 * Everything the story shows. The people and tracks are made up: swap in real ones
 * (keep seven tracks, or change "6 people dropped before you" along with them).
 */
export const SITE = "dropatrack.club";
/** What the video's QR codes open: the home page. Uppercase, as on the shirts: it makes a smaller code. */
export const QR_VALUE = `HTTPS://${SITE.toUpperCase()}`;

export const WEARER = {
  handle: "mira.k",
  number: 1,
  since: "09.2026",
  theme: "Something for the walk home after the club.",
};

export const DROPPER = { name: "Ana", from: "Berlin, Germany" };

export interface Track {
  title: string;
  artist: string;
  source: "Bandcamp" | "SoundCloud" | "YouTube";
  /** Seconds. */
  duration: number;
  url: string;
  droppedBy: string;
  droppedFrom: string;
  droppedAt: string;
  /** The placeholder cover's moiré (no artwork in the video). */
  cover: TextureName;
}

/** mira.k's bag, newest first: Ana's is the seventh drop. */
export const BAG: Track[] = [
  {
    title: "Night Bus Home",
    artist: "Lowtide",
    source: "Bandcamp",
    duration: 312,
    url: "https://lowtide.bandcamp.com/track/night-bus-home",
    droppedBy: DROPPER.name,
    droppedFrom: DROPPER.from,
    droppedAt: "Just now",
    cover: "9",
  },
  { title: "Lagoon Theory", artist: "Okane", source: "SoundCloud", duration: 287, url: "", droppedBy: "Jules", droppedFrom: "Kreuzberg, Berlin", droppedAt: "1h ago", cover: "18" },
  { title: "Slow Lights", artist: "Frida Moll", source: "Bandcamp", duration: 344, url: "", droppedBy: "Sam", droppedFrom: "Neukölln, Berlin", droppedAt: "2h ago", cover: "10" },
  { title: "Ferry at Five", artist: "Bassline Hotel", source: "YouTube", duration: 251, url: "", droppedBy: "Noor", droppedFrom: "Paris", droppedAt: "3d ago", cover: "14" },
  { title: "Concrete Bloom", artist: "Ilse Kraan", source: "Bandcamp", duration: 398, url: "", droppedBy: "Kofi", droppedFrom: "Lisbon", droppedAt: "5d ago", cover: "17" },
  { title: "Yesterday's Weather", artist: "Mondo Club", source: "SoundCloud", duration: 276, url: "", droppedBy: "Léa", droppedFrom: "Geneva", droppedAt: "1w ago", cover: "8" },
  { title: "Saltwater Tapes", artist: "Ruhig", source: "Bandcamp", duration: 305, url: "", droppedBy: "Theo", droppedFrom: "Zürich", droppedAt: "2w ago", cover: "15" },
];

export const DROP = BAG[0];
