"use client";

import { sourceCode } from "@/lib/format";
import { Artwork } from "./Artwork";
import { ellipsis, monoCaps } from "./styles";
import styles from "./track-row.module.css";
import type { TrackView } from "./types";

/** One track: plays on click; the source code on the right opens the original. */
export function TrackRow({
  track,
  index,
  active,
  playing,
  mine = false,
  ruled = false,
  onPlay,
}: {
  track: TrackView;
  index: number;
  active: boolean;
  playing: boolean;
  /** This browser dropped it: magenta, labelled. */
  mine?: boolean;
  /** A rule between the text and the source link (inside a bag). */
  ruled?: boolean;
  onPlay: () => void;
}) {
  const who = track.droppedBy ? track.droppedBy + (track.droppedFrom ? ", " + track.droppedFrom : "") : null;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={active}
      className={mine ? `${styles.row} ${styles.mine}` : styles.row}
      onClick={onPlay}
      onKeyDown={(k) => {
        if (k.key === "Enter" || k.key === " ") {
          k.preventDefault();
          onPlay();
        }
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 26,
          lineHeight: 0.85,
          WebkitTextFillColor: active || mine ? "currentColor" : "transparent",
          WebkitTextStroke: "1.5px currentColor",
        }}
      >
        {active && playing ? "▶︎" : String(index).padStart(2, "0")}
      </span>
      <Artwork src={track.thumbnail} source={track.source} size={48} />
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
        {mine && (
          <span style={{ ...monoCaps, fontSize: 10, background: "var(--ink)", color: "var(--magenta)", padding: "2px 6px", marginBottom: 2 }}>Your drop</span>
        )}
        <span style={{ ...ellipsis, fontFamily: "var(--font-display-wide)", fontSize: 15, lineHeight: 1.05, textTransform: "uppercase" }}>
          {track.title}
        </span>
        <span style={{ ...ellipsis, fontWeight: 700, fontSize: 13 }}>{track.artist}</span>
        <span style={{ ...ellipsis, fontFamily: "var(--font-mono)", fontSize: 11 }}>{[who, track.droppedAt].filter(Boolean).join(" · ")}</span>
      </div>
      <a
        href={track.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open on ${track.source}`}
        className={styles.src}
        // The row plays on click and Enter: the link must only open the original.
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        style={{ borderLeft: ruled ? "1px solid currentColor" : 0 }}
      >
        {sourceCode(track.source)} ↗
      </a>
    </div>
  );
}
