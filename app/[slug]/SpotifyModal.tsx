"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Button } from "@/components/ds/Button";
import { Texture } from "@/components/ds/Texture";
import { spotifyTitle } from "@/lib/spotify";

const mono: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  letterSpacing: "var(--tracking-caps)",
  textTransform: "uppercase",
};
const para: CSSProperties = { margin: 0, fontWeight: 800, fontSize: 17, lineHeight: 1.2 };

const READS = [
  ["https://harpers.org/archive/2025/01/the-ghosts-in-the-machine-liz-pelly-spotify-musicians/", "The Ghosts in the Machine — Harper’s"],
  ["https://www.cnbc.com/2025/06/17/spotifys-daniel-ek-leads-investment-in-defense-startup-helsing.html", "Ek leads €600M into Helsing — CNBC"],
];

/** A Spotify link was pasted: say why it's refused, and where to find the same track instead. */
export function SpotifyModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [title, setTitle] = useState<string | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    spotifyTitle(url, ctrl.signal).then((t) => {
      if (!ctrl.signal.aborted) setTitle(t);
    });
    return () => ctrl.abort();
  }, [url]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const q = encodeURIComponent(title ?? "");
  const alts = [
    ["Qobuz", title ? `https://www.qobuz.com/search?q=${q}` : "https://www.qobuz.com"],
    ["Tidal", title ? `https://listen.tidal.com/search?q=${q}` : "https://tidal.com"],
    ["Deezer", title ? `https://www.deezer.com/search/${q}` : "https://www.deezer.com"],
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dat-sp-t"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "var(--ink)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: 12,
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          margin: "auto",
          color: "var(--ink)",
          background: "var(--paper)",
          border: "var(--border-w-heavy) solid var(--paper)",
          boxShadow: "var(--shadow-hard-accent)",
        }}
      >
        <div style={{ position: "relative", overflow: "hidden", borderBottom: "var(--border-w-heavy) solid var(--ink)" }}>
          <Texture color="var(--magenta)" />
          <div style={{ position: "relative", padding: "16px 16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <span style={{ ...mono, background: "var(--ink)", color: "var(--paper)", padding: "3px 7px" }}>Link refused</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                autoFocus
                style={{
                  width: 44,
                  height: 44,
                  border: "var(--rule)",
                  background: "var(--paper)",
                  color: "var(--ink)",
                  borderRadius: 0,
                  cursor: "pointer",
                  fontFamily: "var(--font-heavy)",
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                ✕︎
              </button>
            </div>
            <h2
              id="dat-sp-t"
              style={{ margin: 0, fontWeight: "normal", fontFamily: "var(--font-display)", fontSize: "min(56px,10.5vw)", lineHeight: 0.82, letterSpacing: "-0.02em" }}
            >
              BOYCOTT
              <br />
              SPOTIFY.
            </h2>
          </div>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={para}>
            Spotify pads its playlists with cheap stock music from “ghost artists” so it can pay real musicians less, and pays nothing at all on
            tracks with under 1,000 streams a year.
          </p>
          <p style={para}>
            Its founder and executive chairman, Daniel Ek, also chairs Helsing, a military AI company that builds strike drones. In 2025 his
            investment firm led a €600 million funding round in it. Your subscription money helps make him rich enough to do that.
          </p>
          <p style={{ margin: 0, fontWeight: 500, fontSize: 15, lineHeight: 1.35 }}>
            This project is about getting music out of that machine. Drop the same track from somewhere that treats artists better.
          </p>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {READS.map(([href, label], i) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...mono,
                  fontSize: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  borderTop: i ? 0 : "var(--rule-hair)",
                  borderBottom: "var(--rule-hair)",
                  padding: "10px 0",
                }}
              >
                <span>Read: {label}</span>
                <span aria-hidden>↗</span>
              </a>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={mono}>{title ? `Find “${title}” on` : "Find it on"}</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
              {alts.map(([name, href]) => (
                <Button key={name} variant="outline" iconRight="↗" onClick={() => window.open(href, "_blank", "noopener")}>
                  {name}
                </Button>
              ))}
            </div>
          </div>
          <Button variant="primary" size="lg" fullWidth onClick={onClose}>
            Paste another link
          </Button>
        </div>
      </div>
    </div>
  );
}
