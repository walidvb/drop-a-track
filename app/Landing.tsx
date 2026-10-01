"use client";

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { MediaRef } from "@cucu/media/core";
import { MediaEngine, usePlayerQueue } from "@cucu/media/react";
import { Artwork } from "@/components/ds/Artwork";
import { Button } from "@/components/ds/Button";
import { Player } from "@/components/ds/Player";
import { Texture } from "@/components/ds/Texture";
import type { TrackView } from "@/components/ds/types";
import { padNumber } from "@/lib/format";
import styles from "./landing.module.css";

export type HomeTrack = TrackView & { media: MediaRef; handle: string; bagNumber: number };
export interface HomeBag {
  handle: string;
  number: number;
  since: string;
  /** Newest first. */
  tracks: HomeTrack[];
}

const SHIRT_MAIL = "mailto:hello@walidvb.com?subject=I%20want%20a%20shirt";
const SOURCE_CODE: Record<string, string> = { Bandcamp: "BC", SoundCloud: "SC", YouTube: "YT" };

/** Text sized to fill its parent along one axis. Measures and sets the size directly — no re-render. */
function FitText({
  axis,
  max,
  className,
  style,
  children,
}: {
  axis: "h" | "w";
  max: number;
  className?: string;
  style: CSSProperties;
  children: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const box = el?.parentElement;
    if (!el || !box) return;
    const fit = () => {
      el.style.fontSize = "100px";
      const avail = axis === "h" ? box.clientHeight : box.clientWidth;
      const size = axis === "h" ? el.scrollHeight : el.scrollWidth;
      if (avail && size) el.style.fontSize = Math.min(max, Math.floor(((100 * avail) / size) * 0.98)) + "px";
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [axis, max, children]);
  return (
    <span ref={ref} className={className} style={{ ...style, fontSize: max }}>
      {children}
    </span>
  );
}

const mono: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  letterSpacing: "var(--tracking-caps)",
  textTransform: "uppercase",
};
const ellipsis: CSSProperties = { maxWidth: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

const STEPS = [
  ["01", "Flex your code.", "Your own QR code, printed on the back."],
  ["02", "Get scanned.", "Likeminded people point a phone at you."],
  ["03", "Get a drop", "They drop a single link into your bag. One per person."],
];

/** One track: plays on click; the source code on the right opens the original. */
function DropRow({
  track,
  index,
  active,
  playing,
  ruled,
  onPlay,
}: {
  track: HomeTrack;
  index: number;
  active: boolean;
  playing: boolean;
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
      className={styles.row}
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
          WebkitTextFillColor: active ? "currentColor" : "transparent",
          WebkitTextStroke: "1.5px currentColor",
        }}
      >
        {active && playing ? "▶︎" : String(index).padStart(2, "0")}
      </span>
      <Artwork src={track.thumbnail} source={track.source} size={48} />
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
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
        {SOURCE_CODE[track.source ?? ""] ?? track.source} ↗
      </a>
    </div>
  );
}

/** "Get your own": there's no shop, just an email. */
function ShirtModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20,
        background: "var(--ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        overflow: "hidden",
      }}
    >
      <Texture color="var(--paper)" opacity={0.35} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shirt-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 460,
          background: "var(--paper)",
          color: "var(--ink)",
          border: "var(--rule)",
          boxShadow: "var(--shadow-hard-accent)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, paddingLeft: 16, borderBottom: "var(--rule)" }}>
          <span style={mono}>DIY · no shop</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            autoFocus
            className={styles.close}
            style={{
              width: 48,
              height: 48,
              border: 0,
              borderLeft: "var(--rule)",
              background: "var(--paper)",
              color: "var(--ink)",
              fontWeight: 800,
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "24px 16px 16px" }}>
          <h2
            id="shirt-title"
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontWeight: "normal",
              fontSize: "clamp(36px,8vw,52px)",
              lineHeight: 0.82,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
            }}
          >
            Get a shirt
          </h2>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 17, lineHeight: 1.25, textWrap: "pretty" }}>
            This is a DIY project. No shop, no stock, no checkout.
          </p>
          <p style={{ margin: 0, fontWeight: 500, fontSize: 15, lineHeight: 1.35, textWrap: "pretty" }}>
            Drop us an email and we{"’"}ll get a shirt, and a bag, sorted for you.
          </p>
        </div>
        <div style={{ padding: "0 16px 16px" }}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            iconRight="→"
            onClick={() => {
              location.href = SHIRT_MAIL;
            }}
          >
            Write to us
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * The home page: the #001 poster, and beside it (below it on phones) the latest
 * drops from every bag, each opening onto its bag. Everything plays from here.
 */
export function Landing({ bags, drops }: { bags: HomeBag[]; drops: HomeTrack[] }) {
  const asideRef = useRef<HTMLElement>(null);
  /** The panel shows the latest drops (null) or one bag, by handle. */
  const [view, setView] = useState<string | null>(null);
  /** What plays next: the latest drops (null) or one bag — whichever the playing track was picked from. */
  const [queueKey, setQueueKey] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [shirt, setShirt] = useState(false);
  // Each list's tracks slide in one after the other: after the poster on arrival, at once when opened later.
  const [intro, setIntro] = useState(true);
  // On arrival the list's header waits for the rest of the page (all in by 560 + 280ms, see
  // landing.module.css) and the tracks follow it. 200ms apart; past the first 10 (off screen
  // anyway) they come in with the 10th.
  const HEADER_IN = 840;
  const slideIn = (i: number) => ({ ["--delay" as string]: `${(intro ? HEADER_IN + 200 : 0) + Math.min(i, 10) * 200}ms` });
  // The poster comes in once its fonts are ready (so the big words are fitted), or after 1.5s regardless.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    let timer = setTimeout(() => setShown(true), 1500);
    document.fonts?.ready.then(() => {
      clearTimeout(timer);
      timer = setTimeout(() => setShown(true), 60);
    });
    return () => clearTimeout(timer);
  }, []);

  const bag = view === null ? null : (bags.find((b) => b.handle === view) ?? null);
  const queueTracks = (queueKey === null ? null : bags.find((b) => b.handle === queueKey)?.tracks) ?? drops;
  const items = useMemo(() => queueTracks.map((t) => ({ id: t.id, media: t.media })), [queueTracks]);
  const refreshStream = async (media: MediaRef) => {
    const t = queueTracks.find((x) => x.media === media);
    if (!t) return null;
    const res = await fetch("/api/media/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dropId: Number(t.id) }),
    });
    return res.ok ? ((await res.json()) as { streamUrl: string }).streamUrl : null;
  };
  const queue = usePlayerQueue(items, { refreshStream });
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
  const openBag = (handle: string | null) => {
    setView(handle);
    setIntro(false);
    const a = asideRef.current;
    if (!a) return;
    a.scrollTop = 0;
    if (a.getBoundingClientRect().top > window.innerHeight * 0.5) scrollToPanel();
  };

  return (
    <div
      className={shown ? styles.shown : undefined}
      style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", background: "var(--paper)" }}
    >
      <main
        style={{
          flex: "999 1 620px",
          minWidth: 0,
          position: "relative",
          height: "100vh",
          minHeight: 620,
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) auto",
          background: "var(--paper)",
        }}
      >
        <Texture className={styles.drift} color="var(--magenta)" style={{ inset: "-10%" }} />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            padding: "20px clamp(16px,3vw,32px) clamp(16px,3vw,28px)",
            gap: 20,
            minWidth: 0,
          }}
        >
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
              <span style={{ ...mono, fontSize: 10, background: "var(--paper)", padding: "3px 8px" }}>© A Diggers Delights project</span>
              <div className={styles.reveal} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <span className={styles.stackedOnly}>
                  <Button variant="outline" size="md" iconRight="↓" onClick={scrollToPanel} style={{ background: "var(--paper)" }}>
                    Latest drops
                  </Button>
                </span>
                <Button variant="primary" size="md" iconRight="→" onClick={() => setShirt(true)}>
                  Get your own
                </Button>
              </div>
            </div>
            <span
              className={styles.reveal}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(48px,7vw,96px)",
                lineHeight: 0.8,
                color: "transparent",
                WebkitTextStroke: "2px var(--ink)",
              }}
            >
              D.A.T
            </span>
          </header>
          <div style={{ flex: 1 }} />
          <div className={styles.reveal} style={{ display: "flex", alignItems: "flex-end", gap: 8, minWidth: 0 }}>
            <section
              className={styles.stepsBox}
              style={{ maxWidth: 560, minWidth: 0, flex: "0 1 560px", background: "var(--paper)", display: "flex", flexDirection: "column" }}
            >
              <p style={{ margin: 0, padding: "12px 14px", fontWeight: 500, fontSize: "clamp(15px,1.3vw,17px)", lineHeight: 1.25, textWrap: "pretty" }}>
                A participatory project for music lovers, ever changing, ever evolving. Out of the algorithm, into the hands of the people you meet.
              </p>
              <div className={styles.steps}>
                {STEPS.map(([n, title, detail]) => (
                  <div key={n} style={{ padding: "10px 14px", minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span
                        style={{ fontFamily: "var(--font-display)", fontSize: 20, lineHeight: 0.8, color: "transparent", WebkitTextStroke: "1.2px var(--ink)" }}
                      >
                        {n}
                      </span>
                      <span style={{ fontWeight: 800, fontSize: 13, lineHeight: 1.15 }}>{title}</span>
                    </span>
                    <span style={{ fontWeight: 500, fontSize: 12, lineHeight: 1.3, color: "var(--text-secondary)" }}>{detail}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <div style={{ minWidth: 0 }}>
            <FitText
              axis="w"
              max={260}
              className={styles.enter}
              style={{
                ["--d" as string]: "0ms",
                ["--from" as string]: "0 10px", // up
                fontFamily: "var(--font-display)",
                lineHeight: 0.8,
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
                display: "inline-block",
                marginBottom: "-0.06em",
              }}
            >
              DROP A
            </FitText>
          </div>
        </div>
        <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "flex-end" }}>
          <FitText
            axis="h"
            max={400}
            className={styles.enter}
            style={{
              ["--d" as string]: "140ms",
              ["--from" as string]: "10px 0", // right to left: "up" for the rotated word
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              fontFamily: "var(--font-display)",
              lineHeight: 0.8,
              whiteSpace: "nowrap",
              marginLeft: "-0.04em",
            }}
          >
            TRACK
          </FitText>
        </div>
      </main>

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
          background: "var(--paper)",
          borderLeft: "4px solid var(--ink)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Keyed per list, so opening another one mounts fresh rows (and they slide in). */}
        {bag === null ? (
          <Fragment key="drops">
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
              <span style={{ ...mono, fontSize: 12 }}>{padNumber(drops.length)} drops</span>
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
                <DropRow
                  track={d}
                  index={drops.length - i}
                  active={d.id === current?.id}
                  playing={queue.playing}
                  onPlay={() => play(d, null)}
                />
              </div>
            ))}
          </Fragment>
        ) : (
          <Fragment key={`bag:${bag.handle}`}>
            <header
              style={{
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
                    ...mono,
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    minHeight: 44,
                    padding: "0 12px",
                    marginLeft: -12,
                    border: 0,
                    background: "transparent",
                    color: "var(--paper)",
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
              <span style={{ ...mono, fontSize: 12, color: "var(--gray-400)" }}>
                Since {bag.since} · {padNumber(bag.tracks.length)} tracks
              </span>
            </header>
            {bag.tracks.length === 0 && (
              <div style={{ padding: "32px 12px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-secondary)", borderBottom: "var(--rule)" }}>
                Nothing in the bag yet. Be the first.
              </div>
            )}
            {bag.tracks.map((t, i) => (
              <div key={t.id} className={styles.slide} style={slideIn(i)}>
                <DropRow
                  track={t}
                  index={bag.tracks.length - i}
                  active={t.id === current?.id}
                  playing={queue.playing}
                  ruled
                  onPlay={() => play(t, bag.handle)}
                />
              </div>
            ))}
          </Fragment>
        )}
        {current && <div style={{ flexShrink: 0, height: 100 }} />}
      </aside>

      {current && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 10 }}>
          <div
            style={{
              ...mono,
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
                color: "var(--paper)",
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
