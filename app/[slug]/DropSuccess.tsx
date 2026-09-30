"use client";

import type { CSSProperties } from "react";
import { Artwork } from "@/components/ds/Artwork";
import { Button } from "@/components/ds/Button";
import { Texture } from "@/components/ds/Texture";
import { fmtTime, type TrackView } from "@/components/ds/types";
import { padNumber } from "@/lib/format";
import styles from "./success.module.css";

const mono: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  letterSpacing: "var(--tracking-caps)",
  textTransform: "uppercase",
};

/** Right after DROP!: your track, your number in the bag, then on to the bag. */
export function DropSuccess({
  handle,
  position,
  track,
  onOpenBag,
}: {
  handle: string;
  /** 1-based: how many tracks the bag holds now that yours is in. */
  position: number;
  track: TrackView;
  onOpenBag: () => void;
}) {
  const num = padNumber(position);
  const before = position - 1;
  const line =
    before === 0
      ? `First in ${handle}’s bag. Nobody got here before you.`
      : `${before} ${before === 1 ? "person" : "people"} dropped before you. You’re #${num} in ${handle}’s bag.`;

  return (
    <main
      className={styles.screen}
      style={{
        position: "relative",
        minHeight: "100dvh",
        background: "var(--ink)",
        color: "var(--paper)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Texture className={styles.tex} color="var(--paper)" opacity={0.35} style={{ inset: -60 }} />
      <div className={styles.body}>
        <div className={styles.top} style={{ ...mono, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={styles.dot} style={{ width: 10, height: 10, background: "var(--magenta)" }} />
            In the bag
          </span>
          <span>{handle}</span>
        </div>

        <div className={styles.artCol}>
          <div className={styles.art} style={{ position: "relative" }}>
            <div style={{ border: "2px solid var(--paper)", boxShadow: "var(--shadow-hard-accent)" }}>
              <Artwork src={track.thumbnail} source={track.source} size="var(--art)" />
            </div>
            <div
              className={styles.num}
              style={{
                position: "absolute",
                right: "-0.72em",
                bottom: "-0.43em",
                fontFamily: "var(--font-display)",
                fontSize: "var(--num)",
                lineHeight: 0.8,
                whiteSpace: "nowrap",
                letterSpacing: "-0.02em",
                color: "transparent",
                WebkitTextStroke: "2px var(--paper)",
              }}
            >
              #{num}
            </div>
          </div>
        </div>

        <div className={styles.text}>
          <h1
            className={styles.head}
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontWeight: "normal",
              fontSize: "var(--head)",
              lineHeight: 0.84,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              color: "var(--magenta)",
              transformOrigin: "left center",
            }}
          >
            Dropped.
          </h1>
          <p className={styles.line} style={{ margin: 0, fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 16, lineHeight: 1.35, textWrap: "pretty" }}>
            {line}
          </p>
          <div
            className={styles.details}
            style={{
              borderTop: "2px solid var(--paper)",
              borderBottom: "1px solid var(--gray-600)",
              padding: "12px 0",
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) auto",
              gap: "4px 16px",
              alignItems: "baseline",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display-wide)",
                fontSize: 16,
                lineHeight: 1.05,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {track.title}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{track.duration ? fmtTime(track.duration, true) : ""}</div>
            <div style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 14, color: "var(--gray-400)" }}>{track.artist}</div>
            <div style={{ ...mono, color: "var(--gray-400)" }}>{track.source}</div>
          </div>
        </div>

        <div className={styles.cta}>
          <div className={styles.btn}>
            <Button variant="inverse" size="lg" fullWidth iconRight="→" onClick={onOpenBag}>
              Open the bag
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
