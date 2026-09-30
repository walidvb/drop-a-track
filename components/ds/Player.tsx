"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Artwork } from "./Artwork";
import { fmtTime, type TrackView } from "./types";

const G = { play: "▶︎", pause: "❚❚", next: "▶︎▶︎" };

function Ctl({ glyph, label, onClick, accent }: { glyph: string; label: string; onClick?: () => void; accent?: boolean }) {
  const [h, setH] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: 48,
        height: 48,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "var(--border-w) solid var(--paper)",
        borderRadius: 0,
        background: h ? "var(--paper)" : accent ? "var(--magenta)" : "transparent",
        color: h || accent ? "var(--ink)" : "var(--paper)",
        fontFamily: "var(--font-body)",
        fontSize: accent ? "16px" : "12px",
        letterSpacing: "-2px",
        cursor: "pointer",
        transition: "background var(--dur-fast) var(--ease-snap)",
      }}
    >
      {glyph}
    </button>
  );
}

/**
 * The compact bar docked at the bottom of a bag. Transport only — playback
 * itself is `MediaEngine` from @cucu/media, driven by the same queue state.
 */
export function Player({
  track,
  playing = false,
  position = 0,
  duration = 0,
  buffering = false,
  onToggle,
  onNext,
  seekInputProps,
}: {
  track: TrackView | null;
  playing?: boolean;
  /** Seconds. */
  position?: number;
  /** Seconds; falls back to the track's stored length until the provider reports one. */
  duration?: number;
  buffering?: boolean;
  onToggle?: () => void;
  onNext?: () => void;
  /** An invisible range input laid over the bar, so dragging works on touch screens. */
  seekInputProps?: InputHTMLAttributes<HTMLInputElement>;
}) {
  const dur = duration || track?.duration || 0;
  const pct = dur ? Math.min(100, (position / dur) * 100) : 0;
  return (
    <div
      style={{
        background: "var(--ink)",
        color: "var(--paper)",
        display: "grid",
        gridTemplateColumns: "auto minmax(0,1fr) auto",
        alignItems: "center",
        gap: "12px",
        padding: "10px 12px",
        borderTop: "var(--border-w) solid var(--magenta)",
      }}
    >
      <Artwork src={track?.thumbnail} source={track?.source} size={44} />
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
        <span
          style={{
            fontFamily: "var(--font-display-wide)",
            fontSize: "14px",
            lineHeight: 1.05,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {track?.title || "Nothing playing"}
        </span>
        <span
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "8px",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--gray-400)",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{track?.artist}</span>
          <span>{buffering ? "Loading…" : fmtTime(position, true) + " / " + fmtTime(dur, true)}</span>
        </span>
        <div style={{ position: "relative", height: "14px", display: "flex", alignItems: "center" }}>
          <div style={{ position: "absolute", left: 0, right: 0, height: "2px", background: "var(--gray-600)" }} />
          <div style={{ position: "absolute", left: 0, width: pct + "%", height: "4px", background: "var(--magenta)" }} />
          <div style={{ position: "absolute", left: `calc(${pct}% - 2px)`, width: "4px", height: "14px", background: "var(--paper)" }} />
          {seekInputProps && dur ? (
            <input
              aria-label="Seek"
              {...seekInputProps}
              style={{ position: "absolute", inset: "-8px 0", width: "100%", height: "30px", margin: 0, opacity: 0, cursor: "pointer" }}
            />
          ) : null}
        </div>
      </div>
      <div style={{ display: "flex", gap: "6px" }}>
        <Ctl glyph={playing ? G.pause : G.play} label={playing ? "Pause" : "Play"} onClick={onToggle} accent />
        {onNext ? <Ctl glyph={G.next} label="Next" onClick={onNext} /> : null}
      </div>
    </div>
  );
}
