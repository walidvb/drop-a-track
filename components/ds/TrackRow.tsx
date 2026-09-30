"use client";

import { useState } from "react";
import { Artwork } from "./Artwork";
import { fmtTime, type TrackView } from "./types";

const SOURCE_CODE: Record<string, string> = { bandcamp: "BC", soundcloud: "SC", youtube: "YT" };

export function TrackRow({
  track,
  index = 1,
  active = false,
  playing = false,
  highlighted = false,
  highlightLabel = "Your drop",
  onPlay,
  showMeta = true,
  showArtwork = true,
}: {
  track: TrackView;
  index?: number;
  active?: boolean;
  playing?: boolean;
  highlighted?: boolean;
  highlightLabel?: string;
  onPlay?: (track: TrackView) => void;
  showMeta?: boolean;
  showArtwork?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const [linkHov, setLinkHov] = useState(false);
  const hl = highlighted;
  const inv = (hov || active) && !hl;
  const bg = hl ? "var(--magenta)" : inv ? "var(--ink)" : "transparent";
  const fg = inv ? "var(--paper)" : "var(--ink)";
  const sub = inv ? "var(--gray-400)" : hl ? "var(--ink)" : "var(--text-secondary)";
  const solid = inv || hl;
  const who = track.droppedBy ? track.droppedBy + (track.droppedFrom ? ", " + track.droppedFrom : "") : null;
  const meta = showMeta ? [track.duration ? fmtTime(track.duration) : null, who, track.droppedAt].filter(Boolean).join(" · ") : "";
  const code = SOURCE_CODE[(track.source || "").toLowerCase().replace(/[^a-z]/g, "")] ?? track.source?.slice(0, 2).toUpperCase();
  const ellipsis = { maxWidth: "100%", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" };
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={active}
      onClick={() => onPlay?.(track)}
      onKeyDown={(k) => {
        if (k.key === "Enter" || k.key === " ") {
          k.preventDefault();
          onPlay?.(track);
        }
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "56px " + (showArtwork ? "48px " : "") + "minmax(0,1fr) auto",
        alignItems: "center",
        gap: "12px",
        minHeight: "var(--row-h)",
        padding: track.url ? "8px 4px 8px 12px" : "8px 12px",
        borderBottom: "var(--rule)",
        background: bg,
        color: fg,
        cursor: "pointer",
        transition: "background var(--dur-fast) var(--ease-snap)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "26px",
          lineHeight: 0.85,
          color: solid ? fg : "transparent",
          WebkitTextStroke: solid ? "0" : "1.5px var(--ink)",
        }}
      >
        {active && playing ? "▶︎" : String(index).padStart(2, "0")}
      </span>
      {showArtwork ? <Artwork src={track.thumbnail} source={track.source} size={48} /> : null}
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "3px", alignItems: "flex-start" }}>
        {hl ? (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "var(--tracking-caps)",
              textTransform: "uppercase",
              background: "var(--ink)",
              color: "var(--magenta)",
              padding: "2px 6px",
              marginBottom: "2px",
            }}
          >
            {highlightLabel}
          </span>
        ) : null}
        <span style={{ ...ellipsis, fontFamily: "var(--font-display-wide)", fontSize: "15px", lineHeight: 1.05, textTransform: "uppercase" }}>
          {track.title}
        </span>
        <span style={{ ...ellipsis, fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "13px", color: sub }}>{track.artist}</span>
        {meta ? <span style={{ ...ellipsis, fontFamily: "var(--font-mono)", fontSize: "11px", color: sub }}>{meta}</span> : null}
      </div>
      {track.url ? (
        <a
          href={track.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open original on ${track.source ?? "its site"}`}
          // The row plays on click and Enter: the link must only open the original.
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onMouseEnter={() => setLinkHov(true)}
          onMouseLeave={() => setLinkHov(false)}
          style={{
            minWidth: 44,
            minHeight: 44,
            padding: "0 8px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            textDecoration: "none",
            color: linkHov ? (hl ? "var(--paper)" : "var(--magenta)") : "inherit",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "var(--tracking-caps)",
            textTransform: "uppercase",
          }}
        >
          <span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>
            ↗
          </span>
          <span aria-hidden>{code}</span>
        </a>
      ) : (
        <span />
      )}
    </div>
  );
}
