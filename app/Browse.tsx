"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MediaEngine, usePlayerQueue } from "@cucu/media/react";
import { Player } from "@/components/ds/Player";
import { ellipsis, monoCaps } from "@/components/ds/styles";
import { TrackRow } from "@/components/ds/TrackRow";
import { FitText } from "@/components/FitText";
import { padNumber } from "@/lib/format";
import { bagPath, handleFromSlug } from "@/lib/handle";
import type { HomeBag, HomeTrack } from "@/lib/home";
import { streamRefresher } from "@/lib/streams";
import styles from "./browse.module.css";
import { Poster } from "./Poster";
import { ShirtModal } from "./ShirtModal";

// On arrival the list's header waits for the rest of the page (all in by 560 + 280ms, see
// browse.module.css) and the tracks follow it.
const HEADER_IN = 840;

/**
 * Home and every bag page: the poster, and beside it (below it on phones) a column with the
 * latest drops from every bag or one bag, and the player. Opening a bag puts its URL in the
 * address bar (/mira.k) without leaving the page (shallow navigation), so the player keeps
 * going; loading that URL renders this same view, bag open. The drop flow shows it too, after
 * a Skip or a drop.
 */
export function Browse({
  bags,
  drops,
  initialView = null,
  mine = [],
  drop,
  pendingDrops = 0,
}: {
  bags: HomeBag[];
  drops: HomeTrack[];
  initialView?: string | null;
  /** Drops made from this browser: highlighted as "Your drop". */
  mine?: string[];
  /** A drop still to make (a fresh scan): that bag offers to go back to the drop form. */
  drop?: { handle: string; onDrop: () => void };
  /** Bags this browser scanned and hasn't dropped into yet: counted on the poster's Your drops. */
  pendingDrops?: number;
}) {
  const asideRef = useRef<HTMLElement>(null);
  /** The panel shows the latest drops (null) or one bag, by handle. */
  const [view, setView] = useState<string | null>(initialView);
  /** Into a bag the column slides in from the right; back out, from the left. */
  const [dir, setDir] = useState<"in" | "out">("in");
  /** What plays next: the latest drops (null) or one bag — whichever the playing track was picked from. */
  const [queueKey, setQueueKey] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [shirt, setShirt] = useState(false);
  // Each list's tracks slide in one after the other, 200ms apart: after the poster on arrival,
  // at once when opened later. Past the first 10 (off screen anyway) they come in with the 10th.
  const [intro, setIntro] = useState(true);
  const slideIn = (i: number) => ({ ["--delay" as string]: `${(intro ? HEADER_IN + 200 : 0) + Math.min(i, 10) * 200}ms` });
  // The poster comes in once its fonts are ready (so the big words are fitted), or after 1.5s regardless.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    let live = true;
    let timer = setTimeout(() => setShown(true), 1500);
    document.fonts?.ready.then(() => {
      if (!live) return;
      clearTimeout(timer);
      timer = setTimeout(() => setShown(true), 60);
    });
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, []);

  const bag = view === null ? null : (bags.find((b) => b.handle === view) ?? null);
  const queueTracks = (queueKey === null ? null : bags.find((b) => b.handle === queueKey)?.tracks) ?? drops;
  const items = useMemo(() => queueTracks.map((t) => ({ id: t.id, media: t.media })), [queueTracks]);
  const queue = usePlayerQueue(items, { refreshStream: streamRefresher(queueTracks) });
  // The first track is cued (so its player loads early) but nothing counts as playing until a tap.
  const current = started ? (drops.find((t) => t.id === queue.currentId) ?? null) : null;

  const play = (t: HomeTrack, key: string | null) => {
    setQueueKey(key);
    setStarted(true);
    queue.toggle(t.id);
  };
  const scrollToPanel = () => {
    const a = asideRef.current;
    if (!a) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: a.getBoundingClientRect().top + window.scrollY, behavior: reduce ? "auto" : "smooth" });
  };
  const showView = (handle: string | null) => {
    setView(handle);
    setDir(handle ? "in" : "out");
    setIntro(false);
    if (asideRef.current) asideRef.current.scrollTop = 0;
  };
  const openBag = (handle: string | null) => {
    showView(handle);
    // Shallow navigation: the URL changes, the page (and the player) stays.
    const path = handle ? bagPath(handle) : "/";
    if (location.pathname !== path) history.pushState(null, "", path);
    const a = asideRef.current;
    if (a && a.getBoundingClientRect().top > window.innerHeight * 0.5) scrollToPanel();
  };
  // Arriving on a bag's URL with the column below the poster (phones): go straight to the bag.
  useEffect(() => {
    const a = asideRef.current;
    if (initialView && a && a.getBoundingClientRect().top > window.innerHeight * 0.5) window.scrollTo(0, a.getBoundingClientRect().top + window.scrollY);
  }, [initialView]);
  // Back and forward move between the bags opened here.
  useEffect(() => {
    const onPop = () => showView(handleFromSlug(location.pathname.slice(1)));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  // A URL whose bag isn't open (gone since) shows the latest drops, and is titled so.
  const title = bag ? `${bag.handle}’s bag · drop-a-track` : "drop-a-track";
  useEffect(() => {
    document.title = title;
  }, [title]);
  const columnIn = intro ? undefined : dir === "in" ? styles.columnIn : styles.columnBack;

  return (
    <div
      className={shown ? styles.shown : undefined}
      style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", background: "var(--paper)" }}
    >
      <Poster pendingDrops={pendingDrops} onLatestDrops={scrollToPanel} onGetShirt={() => setShirt(true)} />

      <aside
        ref={asideRef}
        style={{
          flex: "1 1 380px",
          minWidth: 0,
          maxWidth: "100%",
          position: "sticky",
          top: 0,
          height: "100vh",
          minHeight: 620,
          overflowY: "auto",
          overflowX: "hidden", // the column's slide stays inside it
          background: "var(--paper)",
          borderLeft: "4px solid var(--ink)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Keyed per list, so opening another one mounts it fresh: it slides in, and so do its rows. */}
        {bag === null ? (
          <div key="drops" className={columnIn}>
            {/* The column itself is there from the start; on arrival its header slides in first, then the tracks. */}
            <header
              className={intro ? styles.slide : undefined}
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
                className={intro ? styles.slide : undefined}
                style={{ ...slideIn(0), padding: "32px 12px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-secondary)" }}
              >
                Nothing dropped yet.
              </div>
            )}
            {drops.map((d, i) => (
              <div key={d.id} className={styles.slide} style={{ ...slideIn(i), display: "flex", flexDirection: "column" }}>
                {/* One header per run of drops into the same bag. */}
                {drops[i - 1]?.handle !== d.handle && (
                  <button type="button" className={styles.bar} onClick={() => openBag(d.handle)}>
                    <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Into {d.handle}{"’"}s bag</span>
                    <span style={{ whiteSpace: "nowrap" }}>#{padNumber(d.bagNumber)} →</span>
                  </button>
                )}
                <TrackRow
                  track={d}
                  index={drops.length - i}
                  active={d.id === current?.id}
                  playing={queue.playing}
                  mine={mine.includes(d.id)}
                  onPlay={() => play(d, null)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div key={`bag:${bag.handle}`} className={columnIn}>
            <header
              className={intro ? styles.slide : undefined}
              style={{
                ["--delay" as string]: `${HEADER_IN}ms`,
                position: "sticky",
                top: 0,
                zIndex: 2,
                background: "var(--ink)",
                color: "var(--paper)",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                padding: "12px 12px 16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <button
                  type="button"
                  className={styles.back}
                  onClick={() => openBag(null)}
                  style={{
                    ...monoCaps,
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    minHeight: 44,
                    padding: "0 12px",
                    marginLeft: -12,
                    border: 0,
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  ← Latest drops
                </button>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 48, lineHeight: 0.8, color: "transparent", WebkitTextStroke: "1.5px var(--paper)" }}>
                  #{padNumber(bag.number)}
                </span>
              </div>
              <h2 style={{ margin: 0, minWidth: 0, fontWeight: "normal" }}>
                <FitText
                  axis="w"
                  max={96}
                  style={{
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    fontFamily: "var(--font-display)",
                    lineHeight: 0.82,
                    letterSpacing: "-0.02em",
                    textTransform: "uppercase",
                  }}
                >
                  {bag.handle}
                </FitText>
              </h2>
              <span style={{ ...monoCaps, fontSize: 12, color: "var(--gray-400)" }}>
                Since {bag.since} · {padNumber(bag.tracks.length)} tracks
              </span>
            </header>
            {drop?.handle === bag.handle && (
              <button
                type="button"
                className={styles.bar}
                onClick={() => {
                  if (queue.playing) queue.toggle(); // the player stays behind with the bag
                  drop.onDrop();
                }}
              >
                <span>Still want to drop?</span>
                <span style={{ whiteSpace: "nowrap" }}>Drop yours →</span>
              </button>
            )}
            {bag.tracks.length === 0 && (
              <div style={{ padding: "32px 12px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-secondary)", borderBottom: "var(--rule)" }}>
                Nothing in the bag yet. Be the first.
              </div>
            )}
            {bag.tracks.map((t, i) => (
              <div key={t.id} className={styles.slide} style={slideIn(i)}>
                <TrackRow
                  track={t}
                  index={bag.tracks.length - i}
                  active={t.id === current?.id}
                  playing={queue.playing}
                  mine={mine.includes(t.id)}
                  ruled
                  onPlay={() => play(t, bag.handle)}
                />
              </div>
            ))}
          </div>
        )}
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
            <button
              type="button"
              className={styles.back}
              onClick={() => openBag(current.handle)}
              style={{
                minHeight: 32,
                padding: 0,
                border: 0,
                background: "transparent",
                font: "inherit",
                letterSpacing: "inherit",
                textTransform: "inherit",
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              From {current.handle}
              {"’"}s bag →
            </button>
            <span style={{ ...ellipsis, minWidth: 0, color: "var(--gray-400)" }}>
              {[current.droppedBy && current.droppedBy + (current.droppedFrom ? ", " + current.droppedFrom : ""), current.droppedAt]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
          <Player
            track={current}
            playing={queue.playing}
            buffering={queue.buffering}
            position={queue.progress.playedSeconds}
            duration={queue.progress.duration}
            onToggle={() => queue.toggle()}
            onNext={items.length > 1 ? queue.next : undefined}
            seekInputProps={queue.seekInputProps}
          />
        </div>
      )}
      {/* Mounted from the start, paused: the provider is loaded before the first tap (iOS only plays inside a gesture). */}
      {items.length > 0 && <MediaEngine {...queue.engineProps} />}
      {shirt && <ShirtModal onClose={() => setShirt(false)} />}
    </div>
  );
}
