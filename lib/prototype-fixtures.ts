// PROTOTYPE, wipe me: sample bags for previewing designs without a DATABASE_URL.
import type { HomeBag, HomeTrack } from "./home";

const YT = [
  ["dQw4w9WgXcQ", "Never Gonna Give You Up", "Rick Astley", 213],
  ["fJ9rUzIMcZQ", "Bohemian Rhapsody", "Queen", 355],
  ["hTWKbfoikeg", "Smells Like Teen Spirit", "Nirvana", 301],
  ["9bZkp7q19f0", "Gangnam Style", "PSY", 252],
  ["kJQP7kiw5Fk", "Despacito", "Luis Fonsi", 282],
  ["jfKfPfyJRdk", "lofi hip hop radio", "Lofi Girl", 0],
  ["60ItHLz5WEA", "Faded", "Alan Walker", 212],
  ["JGwWNGJdvx8", "Shape of You", "Ed Sheeran", 263],
] as const;

const PEOPLE = [
  ["Ana", "Lisbon"],
  ["Yusuf", "Berlin"],
  ["Mo", null],
  ["Léa", "Geneva"],
  [null, null],
  ["Kenji", "Osaka"],
] as const;
const AGO = ["Just now", "12m ago", "1h ago", "3h ago", "Yesterday", "2d ago", "4d ago", "1w ago", "2w ago", "1mo ago"];

const BAGS: [string, number, string, number][] = [
  ["mira.k", 1, "Mar 2026", 7],
  ["djsweatpants", 2, "Apr 2026", 4],
  ["oxcucu", 3, "May 2026", 9],
  ["la.pluie", 4, "Jun 2026", 2],
  ["walidvb", 5, "Jun 2026", 6],
  ["a-very-long-handle-name", 6, "Aug 2026", 3],
  ["zo", 7, "Sep 2026", 0],
];

let n = 0;
export function prototypeHome(): { bags: HomeBag[]; drops: HomeTrack[] } {
  n = 0;
  const bags: HomeBag[] = BAGS.map(([handle, number, since, count], b) => ({
    bagId: number,
    handle,
    number,
    since,
    tracks: Array.from({ length: count }, (_, i) => {
      const [vid, title, artist, duration] = YT[(b * 3 + i) % YT.length];
      const [droppedBy, droppedFrom] = PEOPLE[(b + i) % PEOPLE.length];
      const id = String(++n);
      const url = `https://www.youtube.com/watch?v=${vid}`;
      return {
        id,
        title,
        artist,
        thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
        source: "YouTube",
        duration: duration || null,
        droppedBy,
        droppedFrom,
        droppedAt: AGO[Math.min(AGO.length - 1, i + b)],
        url,
        media: { provider: "youtube", url },
        handle,
        bagNumber: number,
      } satisfies HomeTrack;
    }),
  }));
  // Interleave so runs into the same bag stay short, like real traffic.
  const drops = bags.flatMap((b) => b.tracks).sort((x, y) => (Number(x.id) * 7) % 13 - (Number(y.id) * 7) % 13);
  return { bags, drops };
}
