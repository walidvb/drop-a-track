"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type InputHTMLAttributes } from "react";
import { MediaEngine, usePlayerQueue } from "@cucu/media/react";
import { Artwork } from "@/components/ds/Artwork";
import { Player } from "@/components/ds/Player";
import { TrackRow } from "@/components/ds/TrackRow";
import { fmtTime } from "@/components/ds/types";
import { FitText } from "@/components/FitText";
import { padCount, padNumber } from "@/lib/format";
import { bagPath } from "@/lib/handle";
import type { HomeBag, HomeTrack } from "@/lib/home";
import { streamRefresher } from "@/lib/streams";
import styles from "./bags.module.css";

/** A row of covers is at least this long: a short bag shows its empty slots. */
const SLOTS = 12;

const display = { fontFamily: "var(--font-display)", letterSpacing: "-0.02em", textTransform: "uppercase", whiteSpace: "nowrap" } as const;

/**
 * Every open bag, one under the other: its covers (tap one to play it) over its handle, fitted
 * edge to edge. Playing goes on bag after bag, or through all of them shuffled. Beside the bags
 * (on a phone, in a sheet opened from the bar at the bottom): what's playing and its bag's tracks.
 */
export function AllBags({ bags }: { bags: HomeBag[] }) {
  const all = useMemo(() => bags.flatMap((b) => b.tracks), [bags]);
  /** Every track in a random order once Shuffle is pressed; until then, bag after bag. */
  const [shuffled, setShuffled] = useState<HomeTrack[] | null>(null);
  const tracks = shuffled ?? all;
  const items = useMemo(() => tracks.map((t) => ({ id: t.id, media: t.media })), [tracks]);
  const queue = usePlayerQueue(items, { refreshStream: streamRefresher(tracks) });
  // The first track is cued (so its player loads early) but nothing counts as playing until a tap.
  const [started, setStarted] = useState(false);
  const [sheet, setSheet] = useState(false);

  const cued = all.find((t) => t.id === queue.currentId) ?? null;
  const current = started ? cued : null;
  const bagOf = (t: HomeTrack) => bags.find((b) => b.handle === t.handle)!;
  /** "03/07": the track's place in its bag. */
  const place = (t: HomeTrack) => `${padCount(bagOf(t).tracks.indexOf(t) + 1)}/${padCount(bagOf(t).tracks.length)}`;
  const dur = queue.progress.duration || current?.duration || 0;
  const pct = dur ? Math.min(100, (queue.progress.playedSeconds / dur) * 100) : 0;

  const play = (t: HomeTrack) => {
    setStarted(true);
    queue.toggle(t.id);
  };
  const toggle = () => {
    setStarted(true);
    queue.toggle();
  };
  const shuffle = () => {
    const s = [...all];
    for (let i = s.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [s[i], s[j]] = [s[j], s[i]];
    }
    setShuffled(s);
    setStarted(true);
    queue.select(s[0].id);
  };

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  const nowPlaying = (big: boolean) =>
    cued && (
      <NowPlaying
        track={cued}
        bag={bagOf(cued)}
        place={place(cued)}
        big={big}
        playing={started && queue.playing}
        buffering={queue.buffering}
        position={queue.progress.playedSeconds}
        duration={dur}
        seekInputProps={queue.seekInputProps}
        onToggle={toggle}
        onPrevious={items.length > 1 ? queue.previous : undefined}
        onNext={items.length > 1 ? queue.next : undefined}
        onPick={play}
      />
    );

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.head}>
          <div className={styles.meta}>
            <Link href="/" className={styles.link}>
              ← D.A.T
            </Link>
            <span>
              {padCount(bags.length)} bags · {padCount(all.length)} tracks
            </span>
          </div>
          <h1 className={styles.title}>
            {/* Outlined, so it never reads as one more bag. */}
            <FitText style={{ ...display, color: "transparent", WebkitTextStroke: "2px var(--ink)" }}>All bags</FitText>
          </h1>
          <button type="button" className={styles.shuffle} onClick={shuffle} disabled={all.length === 0}>
            <span>Shuffle every bag</span>
            <span aria-hidden="true">▶︎</span>
          </button>
        </header>

        {bags.length === 0 && <p className={styles.none}>No bags yet.</p>}
        {bags.map((b, i) => {
          const here = current?.handle === b.handle;
          const tone = here ? styles.playing : i % 2 === 0 ? styles.dark : "";
          return (
            <section key={b.bagId} className={`${styles.bag} ${tone}`} aria-label={`${b.handle}’s bag`}>
              <div className={styles.meta}>
                <span>
                  #{padNumber(b.number)} · {b.tracks.length ? `${padCount(b.tracks.length)} tracks` : "empty"}
                </span>
                {b.tracks.length > 0 && (
                  <button
                    type="button"
                    className={styles.metaButton}
                    aria-label={`${here && queue.playing ? "Pause" : "Play"} ${b.handle}’s bag`}
                    onClick={() => (here ? toggle() : play(b.tracks[0]))}
                  >
                    {here ? `${queue.playing ? "❚❚" : "▶︎"} ${place(current!)}` : "▶︎ Play"}
                  </button>
                )}
              </div>
              {/* Scrolls sideways once there's more than fits; a cut-off cover at the edge says so. */}
              <div className={styles.covers}>
                {Array.from({ length: Math.max(SLOTS, b.tracks.length) }, (_, k) => {
                  const t = b.tracks[k];
                  if (!t) return <span key={`empty-${k}`} className={styles.empty} />;
                  const now = t.id === current?.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={styles.cover}
                      aria-pressed={now}
                      aria-label={`${now && queue.playing ? "Pause" : "Play"} ${t.title} by ${t.artist}`}
                      onClick={() => play(t)}
                    >
                      <Artwork src={t.thumbnail} source={t.source} size="100%" />
                      {now && <span className={styles.coverNow}>{queue.playing ? "❚❚" : "▶︎"}</span>}
                    </button>
                  );
                })}
              </div>
              <h2 className={styles.name}>
                {/* An empty bag doesn't earn the full width: capped, and faded. */}
                <Link href={bagPath(b.handle)} className={styles.nameLink} style={b.tracks.length ? undefined : { opacity: 0.25 }}>
                  <FitText max={b.tracks.length ? undefined : 160} style={display}>
                    {b.handle}
                  </FitText>
                </Link>
              </h2>
              {here && (
                <span className={styles.progress}>
                  <span style={{ width: `${pct}%` }} />
                </span>
              )}
            </section>
          );
        })}
        {current && <div className={styles.dockSpace} />}
      </main>

      <aside className={styles.aside} aria-label="Now playing">
        {nowPlaying(true)}
      </aside>

      {current && (
        <div className={styles.dock}>
          <button type="button" className={styles.bar} aria-expanded={sheet} onClick={() => setSheet(true)}>
            <span>
              {current.handle}’s bag · {place(current)}
            </span>
            <span>▲ Tracks</span>
          </button>
          <Player
            track={current}
            playing={queue.playing}
            buffering={queue.buffering}
            position={queue.progress.playedSeconds}
            duration={queue.progress.duration}
            onToggle={toggle}
            onNext={items.length > 1 ? queue.next : undefined}
            seekInputProps={queue.seekInputProps}
          />
        </div>
      )}
      {sheet && current && (
        <>
          <div className={styles.backdrop} aria-hidden="true" onClick={() => setSheet(false)} />
          <div role="dialog" aria-modal="true" aria-label="Now playing" className={styles.sheet}>
            <button type="button" className={styles.bar} onClick={() => setSheet(false)}>
              <span>
                {current.handle}’s bag · {place(current)}
              </span>
              <span>▼ Close</span>
            </button>
            {nowPlaying(false)}
          </div>
        </>
      )}
      {/* Mounted from the start, paused: the provider is loaded before the first tap (iOS only plays inside a gesture). */}
      {items.length > 0 && <MediaEngine {...queue.engineProps} />}
    </div>
  );
}

/** What's playing, its transport, and the rest of its bag. Big: the cover full width (beside the bags). */
function NowPlaying({
  track,
  bag,
  place,
  big,
  playing,
  buffering,
  position,
  duration,
  seekInputProps,
  onToggle,
  onPrevious,
  onNext,
  onPick,
}: {
  track: HomeTrack;
  bag: HomeBag;
  place: string;
  big: boolean;
  playing: boolean;
  buffering: boolean;
  position: number;
  duration: number;
  seekInputProps: InputHTMLAttributes<HTMLInputElement>;
  onToggle: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onPick: (t: HomeTrack) => void;
}) {
  const who = track.droppedBy ? track.droppedBy + (track.droppedFrom ? ", " + track.droppedFrom : "") : null;
  const text = (
    <div className={styles.npText}>
      <span className={styles.npTitle}>{track.title}</span>
      <span className={styles.npArtist}>{track.artist}</span>
      <span className={styles.npBy}>
        {[who && `Dropped by ${who}`, track.droppedAt].filter(Boolean).join(" · ")}
        {track.url && (
          <>
            {" · "}
            <a href={track.url} target="_blank" rel="noreferrer">
              {track.source} ↗
            </a>
          </>
        )}
      </span>
    </div>
  );
  return (
    <>
      <div className={styles.np}>
        {big && (
          <Link href={bagPath(bag.handle)} className={styles.npBag}>
            <span>Now playing · {bag.handle}’s bag</span>
            <span>{place} →</span>
          </Link>
        )}
        {big ? (
          <>
            <div style={{ aspectRatio: "1" }}>
              <Artwork src={track.thumbnail} source={track.source} size="100%" />
            </div>
            {text}
          </>
        ) : (
          <div className={styles.npRow}>
            <Artwork src={track.thumbnail} source={track.source} size={96} />
            {text}
          </div>
        )}
        <div className={styles.npSeek}>
          <span className={styles.npBar}>
            <span style={{ width: `${duration ? Math.min(100, (position / duration) * 100) : 0}%` }} />
            {duration ? <input aria-label="Seek" {...seekInputProps} /> : null}
          </span>
          <span className={styles.npTimes}>
            <span>{buffering ? "Loading…" : fmtTime(position, true)}</span>
            <span>{fmtTime(duration, true)}</span>
          </span>
        </div>
        <div className={styles.npTransport}>
          <button type="button" aria-label="Previous track" onClick={onPrevious} disabled={!onPrevious}>
            ◀︎◀︎
          </button>
          <button type="button" aria-label={playing ? "Pause" : "Play"} onClick={onToggle}>
            {playing ? "❚❚" : "▶︎"}
          </button>
          <button type="button" aria-label="Next track" onClick={onNext} disabled={!onNext}>
            ▶︎▶︎
          </button>
        </div>
      </div>
      <div className={styles.npListHead}>
        <span>In {bag.handle}’s bag</span>
        <Link href={bagPath(bag.handle)} className={styles.link}>
          Open →
        </Link>
      </div>
      {bag.tracks.map((t, i) => (
        <TrackRow key={t.id} track={t} index={bag.tracks.length - i} active={t.id === track.id} playing={playing} ruled onPlay={() => onPick(t)} />
      ))}
    </>
  );
}
