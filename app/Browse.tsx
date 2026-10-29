"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { Player } from "@/components/ds/Player";
import { ellipsis, monoCaps } from "@/components/ds/styles";
import { TrackRow } from "@/components/ds/TrackRow";
import { padNumber } from "@/lib/format";
import { bagPath } from "@/lib/handle";
import type { HomeTrack } from "@/lib/home";
import { shuffle } from "@/lib/shuffle";
import { dropLine } from "./bags/NowPlaying";
import styles from "./browse.module.css";
import { usePlayer } from "./PlayerProvider";
import { Poster } from "./Poster";
import { ShirtModal } from "./ShirtModal";

// On arrival the list's header waits for the rest of the page (all in by 560 + 280ms, see
// browse.module.css) and the tracks follow it.
const HEADER_IN = 840;

/**
 * Home: the poster, and beside it (below it on phones) the latest drops from every bag, which
 * play from here (newest first, then everything shuffled). A bag opens on its own page, All bags;
 * the player lives in the layout, so what's playing carries on there.
 */
export function Browse({
  drops,
  mine = [],
  pendingDrops = 0,
}: {
  drops: HomeTrack[];
  /** Drops made from this browser: highlighted as "Your drop". */
  mine?: string[];
  /** Bags this browser scanned and hasn't dropped into yet: counted on the poster's Drops waiting sticker (phones). */
  pendingDrops?: number;
}) {
  const player = usePlayer();
  const [shirt, setShirt] = useState(false);
  // The tracks slide in one after the other, 200ms apart, after the poster. Past the first 10
  // (off screen anyway) they come in with the 10th.
  const slideIn = (i: number) => ({ ["--delay" as string]: `${HEADER_IN + 200 + Math.min(i, 10) * 200}ms` });

  /** Once the latest drops are done: everything, shuffled. */
  const afterDrops = useMemo(() => ({ source: "shuffle", list: () => shuffle(drops) }), [drops]);
  // Nothing on yet (a first visit): the newest drop, cued so its player loads before the first tap,
  // but a second after the page has: SoundCloud's widget alone is 1.2MB, and would hold up the poster.
  const cueDrops = useEffectEvent(() => player.cue(drops, { source: "drops", then: afterDrops }));
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const cue = () => (timer = setTimeout(cueDrops, 1000));
    if (document.readyState === "complete") cue();
    else window.addEventListener("load", cue, { once: true });
    return () => {
      window.removeEventListener("load", cue);
      clearTimeout(timer);
    };
  }, []);
  const play = (t: HomeTrack) => (t.id === player.now?.id ? player.toggle() : player.playFrom(drops, t, { source: "drops", then: afterDrops }));
  const current = player.started ? player.now : null;

  return (
    <div
      style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", background: "var(--paper)" }}
    >
      <Poster pendingDrops={pendingDrops} onGetShirt={() => setShirt(true)} />

      <aside
        className={styles.drops}
        style={{
          flex: "1 1 380px",
          minWidth: 0,
          maxWidth: "100%",
          position: "sticky",
          top: 0,
          height: "100vh",
          minHeight: 620,
          overflowY: "auto",
          background: "var(--paper)",
          display: "flex",
          flexDirection: "column",
        }}
      >
          <div>
            {/* The column itself is there from the start; on arrival its header slides in first, then the tracks. */}
            <header
              className={styles.slide}
              style={{
                ["--delay" as string]: `${HEADER_IN}ms`,
                position: "sticky",
                top: 0,
                zIndex: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: 12,
                padding: "20px 12px 14px",
                background: "var(--paper)",
                borderBottom: "4px solid var(--ink)",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: "var(--font-display)",
                  fontWeight: "normal",
                  fontSize: 32,
                  lineHeight: 0.82,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                }}
              >
                Latest drops
              </h2>
              <span style={{ ...monoCaps, fontSize: 12 }}>{padNumber(drops.length)} drops</span>
            </header>
            {drops.length === 0 && (
              <div
                className={styles.slide}
                style={{ ...slideIn(0), padding: "32px 12px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-secondary)" }}
              >
                Nothing dropped yet.
              </div>
            )}
            {drops.map((d, i) => (
              <div key={d.id} className={styles.slide} style={{ ...slideIn(i), display: "flex", flexDirection: "column" }}>
                {/* One header per run of drops into the same bag: it goes to the bag's page. */}
                {drops[i - 1]?.handle !== d.handle && (
                  <Link href={bagPath(d.handle)} className={styles.bar}>
                    <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Into {d.handle}{"’"}s bag</span>
                    <span style={{ whiteSpace: "nowrap" }}>#{padNumber(d.bagNumber)} →</span>
                  </Link>
                )}
                <TrackRow
                  track={d}
                  index={drops.length - i}
                  active={d.id === current?.id}
                  playing={player.playing}
                  mine={mine.includes(d.id)}
                  onPlay={() => play(d)}
                />
              </div>
            ))}
          </div>
        {current && <div style={{ flexShrink: 0, height: 100 }} />}
      </aside>

      {current && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 10 }}>
          <div
            style={{
              ...monoCaps,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              background: "var(--ink)",
              color: "var(--paper)",
              padding: "0 12px",
            }}
          >
            <Link href={bagPath(current.handle)} className={styles.back} style={{ display: "flex", alignItems: "center", minHeight: 32, whiteSpace: "nowrap", textDecoration: "none" }}>
              From {current.handle}
              {"’"}s bag →
            </Link>
            <span style={{ ...ellipsis, minWidth: 0, color: "var(--gray-400)" }}>{dropLine(current)}</span>
          </div>
          <Player
            track={current}
            playing={player.playing}
            buffering={player.buffering}
            position={player.progress.playedSeconds}
            duration={player.progress.duration}
            onToggle={player.toggle}
            onNext={player.hasNext ? player.next : undefined}
            seekInputProps={player.seekInputProps}
          />
        </div>
      )}
      {shirt && <ShirtModal onClose={() => setShirt(false)} />}
    </div>
  );
}
