"use client";

import { TrackRow } from "./TrackRow";
import type { TrackView } from "./types";

export function TrackList({
  tracks,
  activeId,
  highlightId,
  highlightLabel,
  playing = false,
  onSelect,
  title = "The bag",
  count = true,
  newestFirst = true,
  emptyText = "Nothing in the bag yet. Be the first.",
}: {
  tracks: TrackView[];
  activeId?: string | null;
  highlightId?: string | null;
  highlightLabel?: string;
  playing?: boolean;
  onSelect?: (track: TrackView) => void;
  title?: string | null;
  count?: boolean;
  newestFirst?: boolean;
  emptyText?: string;
}) {
  return (
    <section style={{ borderTop: "var(--border-w-heavy) solid var(--ink)", color: "var(--ink)" }}>
      {title ? (
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            padding: "10px 12px",
            borderBottom: "var(--rule)",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "var(--tracking-caps)",
            textTransform: "uppercase",
          }}
        >
          <h2 style={{ margin: 0, font: "inherit" }}>{title}</h2>
          {count ? <span>{String(tracks.length).padStart(3, "0")} tracks</span> : null}
        </header>
      ) : null}
      {tracks.length ? (
        tracks.map((t, i) => (
          <TrackRow
            key={t.id}
            track={t}
            index={newestFirst ? tracks.length - i : i + 1}
            active={t.id === activeId}
            highlighted={t.id === highlightId}
            highlightLabel={highlightLabel}
            playing={playing}
            onPlay={onSelect}
          />
        ))
      ) : (
        <div style={{ padding: "32px 12px", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-secondary)", borderBottom: "var(--rule)" }}>
          {emptyText}
        </div>
      )}
    </section>
  );
}
