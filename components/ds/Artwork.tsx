"use client";

/* eslint-disable @next/next/no-img-element -- remote provider artwork of unknown hosts, shown tiny and filtered */
import { useState } from "react";
import { sourceCode } from "@/lib/format";
import { Texture } from "./Texture";

/**
 * Provider artwork near the size it's drawn: stored Bandcamp art is 1200px (~1MB) and SoundCloud's
 * 500px, for a 48px square. Bandcamp's _9 is 210px, _16 700px; SoundCloud also serves t300x300.
 * YouTube's hqdefault (oEmbed's) is 4:3 with the video letterboxed in it; mqdefault is the 16:9
 * frame alone at 320px, so a square crop shows picture, not black bars.
 */
export function sizedArt(src: string, small: boolean) {
  const bandcamp = /(bcbits\.com\/img\/a\d+)_10\.jpg$/;
  return small
    ? src
        .replace(bandcamp, "$1_9.jpg")
        .replace(/-t500x500\.jpg$/, "-t300x300.jpg")
        .replace(/(ytimg\.com\/vi\/[^/]+)\/hqdefault\.jpg$/, "$1/mqdefault.jpg")
    : src.replace(bandcamp, "$1_16.jpg");
}

/** Up to here, the small art still covers the slot at 2x (Bandcamp's _9 is 210px). */
const SMALL = 105;

export function Artwork({
  src,
  source,
  size = 48,
  mono = true,
  alt = "",
}: {
  src?: string | null;
  source?: string | null;
  /** Pixels, or any CSS length (e.g. a variable that changes with the layout). */
  size?: number | string;
  mono?: boolean;
  alt?: string;
}) {
  // Remember which src failed rather than resetting a flag in an effect.
  const [failed, setFailed] = useState<string | null>(null);
  const ab = sourceCode(source);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0, overflow: "hidden", background: "var(--ink)" }}>
      {src && failed !== src ? (
        <img
          src={sizedArt(src, typeof size === "number" && size <= SMALL)}
          alt={alt}
          // Lazy also keeps React from preloading every artwork in <head>, ahead of the fonts.
          loading="lazy"
          decoding="async"
          onError={() => setFailed(src)}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: mono ? "grayscale(1) contrast(1.15)" : "none",
          }}
        />
      ) : (
        <>
          <Texture color="var(--paper)" opacity={0.45} />
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display-wide)",
              fontSize: typeof size === "number" ? Math.round(size * 0.3) : `calc(${size} * 0.3)`,
              color: "var(--paper)",
              lineHeight: 1,
            }}
          >
            {ab}
          </span>
        </>
      )}
    </div>
  );
}
