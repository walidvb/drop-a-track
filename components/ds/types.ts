/** A track as the design-system components display it. */
export interface TrackView {
  id: string;
  title: string;
  artist: string;
  thumbnail?: string | null;
  /** Display name of the provider: "YouTube", "SoundCloud", "Bandcamp". */
  source?: string | null;
  /** Seconds. */
  duration?: number | null;
  droppedBy?: string | null;
  droppedFrom?: string | null;
  /** Relative, ready to print: "2d ago". */
  droppedAt?: string | null;
  url?: string;
}

export const fmtTime = (s: number | null | undefined, pad = false) => {
  const t = Math.max(0, Math.floor(s || 0));
  const m = Math.floor(t / 60);
  return (pad ? String(m).padStart(2, "0") : String(m)) + ":" + String(t % 60).padStart(2, "0");
};
