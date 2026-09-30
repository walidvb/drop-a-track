"use client";

/* eslint-disable @next/next/no-img-element -- remote provider artwork of unknown hosts, shown tiny and filtered */
import { useState } from "react";
import { Texture } from "./Texture";

const ABBR: Record<string, string> = { bandcamp: "BC", soundcloud: "SC", youtube: "YT" };

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
  const k = (source || "").toLowerCase().replace(/[^a-z]/g, "");
  const ab = ABBR[k] || (source ? source.slice(0, 2).toUpperCase() : "--");
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0, overflow: "hidden", background: "var(--ink)" }}>
      {src && failed !== src ? (
        <img
          src={src}
          alt={alt}
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
