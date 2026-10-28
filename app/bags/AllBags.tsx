"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type DragEvent, type InputHTMLAttributes, type MouseEvent } from "react";
import { MediaEngine, usePlayerQueue } from "@cucu/media/react";
import { Artwork } from "@/components/ds/Artwork";
import { Player } from "@/components/ds/Player";
import { TrackRow } from "@/components/ds/TrackRow";
import { fmtTime } from "@/components/ds/types";
import { Marquee } from "@/components/ds/Marquee";
import { FitText } from "@/components/FitText";
import { padCount, padNumber, sourceCode } from "@/lib/format";
import { bagPath, handleFromPath } from "@/lib/handle";
import type { HomeBag, HomeTrack } from "@/lib/home";
import { streamRefresher } from "@/lib/streams";
import styles from "./bags.module.css";

/** A row of covers is at least this long: a short bag shows its empty slots. */
const SLOTS = 12;

/** What a track carries when it's dragged: its id. */
const TRACK = "application/x-dat-track";

/** "Dropped by Ellie, London · 2w ago" */
const dropLine = (t: HomeTrack) => {
  const who = t.droppedBy ? t.droppedBy + (t.droppedFrom ? ", " + t.droppedFrom : "") : null;
  return [who && `Dropped by ${who}`, t.droppedAt].filter(Boolean).join(" · ");
};

const display = { fontFamily: "var(--font-display)", letterSpacing: "-0.02em", textTransform: "uppercase", whiteSpace: "nowrap" } as const;

/**
 * Every open bag, one under the other: Play and its count, its covers (tap one to play it), and
 * its handle fitted edge to edge. Playing goes on bag after bag, or through all of them shuffled.
 * Beside the bags (on a phone, in a sheet opened from the bar at the bottom): what's playing and
 * its bag's tracks.
 * A bag's own page (/bags/mira.k) is this page, scrolled to that bag. Its covers are in colour, as are
 * the playing bag's and the one under the pointer; the rest are black and white.
 */
export function AllBags({ bags: every, selected = null }: { bags: HomeBag[]; selected?: string | null }) {
  /** Empty bags are left out: nothing to see or play yet. */
  const bags = useMemo(() => every.filter((b) => b.tracks.length > 0), [every]);
  const all = useMemo(() => bags.flatMap((b) => b.tracks), [bags]);
  /**
   * What plays: what's on, then the tracks queued by hand (in the order they're put), then the rest
   * of what it's playing from: every bag in order, on from the last track played from them (into
   * the next bags, and round again), or every track shuffled. A track played from a bag plays on
   * from there, its earlier tracks skipped; the queue stays through all of it.
   */
  const [from, setFrom] = useState(all);
  const shuffled = from !== all;
  const [fromAt, setFromAt] = useState(0);
  const [queued, setQueued] = useState<HomeTrack[]>([]);
  /** What played before, most recent last: Previous goes back through it. */
  const [played, setPlayed] = useState<string[]>([]);
  // The player only needs to find what's on: what comes next is decided here (advance, below).
  const items = useMemo(() => all.map((t) => ({ id: t.id, media: t.media })), [all]);
  const queue = usePlayerQueue(items, { refreshStream: streamRefresher(all) });
  const nowId = queue.currentId;
  const now = all.find((t) => t.id === nowId) ?? null;
  const then = useMemo(() => {
    const skip = new Set([nowId, ...queued.map((t) => t.id)]);
    return [...from.slice(fromAt + 1), ...from.slice(0, fromAt + 1)].filter((t) => !skip.has(t.id));
  }, [from, fromAt, nowId, queued]);
  // The first track is cued (so its player loads early) but nothing counts as playing until a tap.
  const [started, setStarted] = useState(false);
  const [sheet, setSheet] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  /** The phone's player bar, measured: an open bag's handle sticks just above it. */
  const dock = useRef<HTMLDivElement>(null);
  const [dockH, setDockH] = useState(0);
  /** The open bag, its tracks laid out in full: the one whose page this is (from the URL). */
  const [picked, setPicked] = useState(selected);
  const closeSheet = () => {
    setSheet(false);
    opener.current?.focus();
  };

  const cued = now;
  const current = started ? cued : null;
  const bagOf = (t: HomeTrack) => bags.find((b) => b.handle === t.handle)!;
  /** "03/07": the track's number in its bag, oldest first, as its row in the list numbers it. */
  const place = (t: HomeTrack) => {
    const { tracks } = bagOf(t);
    return `${padCount(tracks.length - tracks.indexOf(t))}/${padCount(tracks.length)}`;
  };
  const dur = queue.progress.duration || current?.duration || 0;
  const pct = dur ? Math.min(100, (queue.progress.playedSeconds / dur) * 100) : 0;

  /**
   * Puts `t` on; what was on joins what played before. A queued `t` leaves the queue; one that
   * wasn't (or played from somewhere new, `nextFrom`) is the new place in what's playing from.
   */
  const go = (t: HomeTrack, nextFrom?: HomeTrack[]) => {
    setStarted(true);
    if (nowId) setPlayed((p) => [...p, nowId]);
    const wasQueued = queued.some((x) => x.id === t.id);
    if (wasQueued) setQueued((q) => q.filter((x) => x.id !== t.id));
    if (nextFrom || !wasQueued) {
      const f = nextFrom ?? from;
      setFrom(f);
      setFromAt(f.indexOf(t));
    }
    queue.select(t.id);
  };
  /** Next, and a track ending: the first queued, else the next of what it's playing from. */
  const upNext = queued[0] ?? then[0];
  const advance = () => (upNext ? go(upNext) : queue.toggle());
  /** A track played from a bag (or a bag's Play): on from there, bag after bag. */
  const playNow = (t: HomeTrack) => {
    if (t.id === nowId) return toggle();
    go(t, all);
  };
  /** Back to what played before; what was on comes back first in the queue. */
  const previous = () => {
    const id = played.at(-1);
    if (!id) return;
    setPlayed((p) => p.slice(0, -1));
    if (now) setQueued((q) => [now, ...q.filter((t) => t.id !== now.id)]);
    setStarted(true);
    queue.select(id);
  };
  // Tracks that won't play are skipped, until every one has failed in a row: then it stops.
  const failures = useRef(0);
  const { onProgress } = queue.engineProps;
  const engine = {
    ...queue.engineProps,
    onEnded: advance,
    onError: () => {
      failures.current += 1;
      if (failures.current < all.length) return advance();
      failures.current = 0;
      if (nowId) queue.cue(nowId);
    },
    onProgress:
      onProgress &&
      ((p: Parameters<typeof onProgress>[0]) => {
        failures.current = 0;
        onProgress(p);
      }),
  };
  /** A track (by id) into the queue before a queued one, or last; out of where it was if it's queued already. */
  const enqueue = (id: string, to: "end" | { before: string }) => {
    const t = all.find((x) => x.id === id);
    if (!t || t.id === nowId) return;
    setQueued((q) => {
      const rest = q.filter((x) => x.id !== t.id);
      const i = to === "end" ? rest.length : rest.findIndex((x) => x.id === to.before);
      return [...rest.slice(0, i), t, ...rest.slice(i)];
    });
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
    // Start on something else than what's playing (re-selecting it would only reset its progress bar).
    if (s.length > 1 && s[0].id === nowId) [s[0], s[1]] = [s[1], s[0]];
    go(s[0], s);
  };

  /**
   * Opening a bag (null: closing it) is shallow navigation to its page, so the player keeps going:
   * the URL changes, the page stays. Once it's laid out (the one open before has closed), it's
   * scrolled to.
   */
  const scrollToOpened = useRef(false);
  const openBag = (handle: string | null) => {
    setPicked(handle);
    const path = handle ? bagPath(handle) : "/bags";
    if (location.pathname !== path) history.pushState(null, "", path);
    scrollToOpened.current = handle !== null;
  };
  useEffect(() => {
    if (!picked || !scrollToOpened.current) return;
    scrollToOpened.current = false;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(`bag-${picked}`)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }, [picked]);
  const linkTo = (handle: string | null) => ({
    href: handle ? bagPath(handle) : "/bags",
    onClick: (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return; // a new tab or window: let it go
      e.preventDefault();
      openBag(handle);
    },
  });
  // Arriving on a bag's page: straight to it, once the handles above are fitted. Each FitText
  // measures at 100px (fonts loaded, then its first resize callback, a frame later), which
  // shortens the page for a moment and would pull an earlier scroll back up.
  useEffect(() => {
    if (!selected) return;
    const go = () => document.getElementById(`bag-${selected}`)?.scrollIntoView();
    document.fonts.ready.then(() => requestAnimationFrame(() => requestAnimationFrame(go)));
  }, [selected]);
  // Back and forward move between the bags opened here.
  useEffect(() => {
    const onPop = () => setPicked(handleFromPath(location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    document.title = picked ? `${picked}’s bag · drop-a-track` : "All bags · drop-a-track";
  }, [picked]);

  const docked = current !== null;
  useEffect(() => {
    const d = dock.current;
    if (!d) return setDockH(0);
    const ro = new ResizeObserver(() => setDockH(d.offsetHeight));
    ro.observe(d);
    return () => ro.disconnect();
  }, [docked]);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeSheet();
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
        started={started}
        playing={started && queue.playing}
        buffering={queue.buffering}
        position={queue.progress.playedSeconds}
        duration={dur}
        seekInputProps={queue.seekInputProps}
        onToggle={toggle}
        onPrevious={played.length ? previous : undefined}
        onNext={upNext ? advance : undefined}
        queued={queued}
        then={then}
        shuffled={shuffled}
        onPick={(t) => go(t)}
        onQueue={enqueue}
        onClear={() => setQueued([])}
        linkTo={linkTo}
      />
    );

  return (
    <div className={styles.page} style={{ ["--dock-h" as string]: `${dockH}px` }}>
      <main className={styles.main}>
        {/* Stays at the top of the screen: the way home, and how much there is. */}
        <div className={`${styles.meta} ${styles.top}`}>
          <Link href="/" className={styles.link}>
            ← D.A.T
          </Link>
          <span>
            {bags.length} bags · {all.length} tracks
          </span>
        </div>
        <header className={styles.head}>
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
          const tone = `${i % 2 === 0 ? styles.dark : ""} ${here ? styles.playing : ""}`;
          const open = b.handle === picked;
          const colour = `${here || open ? styles.selected : ""} ${open ? styles.open : ""}`;
          return (
            <section key={b.bagId} id={`bag-${b.handle}`} className={`${styles.bag} ${tone} ${colour}`} aria-label={`${b.handle}’s bag`}>
              <div className={styles.meta}>
                <button
                  type="button"
                  className={styles.metaButton}
                  aria-label={`${here && queue.playing ? "Pause" : "Play"} ${b.handle}’s bag`}
                  onClick={() => (here ? toggle() : playNow(b.tracks[0]))}
                >
                  {here ? `${queue.playing ? "❚❚" : "▶︎"} ${place(current!)}` : "▶︎ Play"}
                </button>
                <span>
                  #{padNumber(b.number)} · {padCount(b.tracks.length)} tracks
                </span>
              </div>
              {open ? (
                <div className={styles.grid} role="group" aria-label={`${b.handle}’s tracks`}>
                  {b.tracks.map((t) => (
                    <Item
                      key={t.id}
                      track={t}
                      now={t.id === cued?.id}
                      playing={started && queue.playing}
                      onPlay={() => playNow(t)}
                      onQueue={() => enqueue(t.id, "end")}
                    />
                  ))}
                </div>
              ) : (
                // Scrolls sideways once there's more than fits; a cut-off cover at the edge says so.
                // A cover opens the bag.
                <div className={styles.covers}>
                  {Array.from({ length: Math.max(SLOTS, b.tracks.length) }, (_, k) => {
                    const t = b.tracks[k];
                    if (!t) return <span key={`empty-${k}`} className={styles.empty} />;
                    const now = t.id === cued?.id;
                    return (
                      <button key={t.id} type="button" className={styles.cover} aria-label={`Open ${b.handle}’s bag`} onClick={() => openBag(b.handle)}>
                        <Artwork src={t.thumbnail} source={t.source} size="100%" mono={false} />
                        {now && <span className={styles.coverNow}>{started && queue.playing ? "❚❚" : "▶︎"}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
              <h2 className={styles.name}>
                <Link {...linkTo(open ? null : b.handle)} aria-expanded={open} className={styles.nameLink}>
                  <FitText style={display}>
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
        <div ref={dock} className={styles.dock}>
          <button ref={opener} type="button" className={styles.bar} aria-expanded={sheet} onClick={() => setSheet(true)}>
            <span>
              {current.handle}’s bag · {place(current)}
            </span>
            <span>▲ Queue</span>
          </button>
          <Player
            track={current}
            playing={queue.playing}
            buffering={queue.buffering}
            position={queue.progress.playedSeconds}
            duration={queue.progress.duration}
            onToggle={toggle}
            onNext={upNext ? advance : undefined}
            seekInputProps={queue.seekInputProps}
          />
        </div>
      )}
      {sheet && current && (
        <>
          <div className={styles.backdrop} aria-hidden="true" onClick={closeSheet} />
          <div role="dialog" aria-modal="true" aria-label="Now playing" className={styles.sheet}>
            {/* Focus starts here, as in Modal, and goes back to the bar on close. */}
            <button type="button" className={styles.bar} onClick={closeSheet} autoFocus>
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
      {items.length > 0 && <MediaEngine {...engine} />}
    </div>
  );
}

/**
 * One track of an open bag: plays on click (on from there), drags onto the queue; on a touch screen,
 * where there's no dragging, "+ Queue" queues it last.
 */
function Item({
  track,
  now,
  playing,
  onPlay,
  onQueue,
}: {
  track: HomeTrack;
  /** It's the player's track (playing, paused or only cued). */
  now: boolean;
  playing: boolean;
  onPlay: () => void;
  onQueue: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={now}
      aria-label={`${now && playing ? "Pause" : "Play"} ${track.title} by ${track.artist}`}
      className={styles.item}
      data-marquee-host
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(TRACK, track.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onPlay}
      onKeyDown={(k) => {
        if (k.key === "Enter" || k.key === " ") {
          k.preventDefault();
          onPlay();
        }
      }}
    >
      <span className={styles.itemCover}>
        <Artwork src={track.thumbnail} source={track.source} size="100%" mono={false} />
        {now && <span className={styles.coverNow}>{playing ? "❚❚" : "▶︎"}</span>}
      </span>
      <span className={styles.itemText}>
        <Marquee on={now && playing} className={styles.itemTitle}>
          {track.title}
        </Marquee>
        <span className={styles.itemArtist}>{track.artist}</span>
        <span className={styles.itemBy}>{dropLine(track)}</span>
        {track.url && (
          <a
            href={track.url}
            target="_blank"
            rel="noopener noreferrer"
            draggable={false}
            className={styles.itemSrc}
            // The item plays on click and Enter: the link must only open the original.
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {sourceCode(track.source)} ↗
          </a>
        )}
        <button
          type="button"
          className={styles.itemQueue}
          onClick={(e) => {
            e.stopPropagation();
            onQueue();
          }}
          onKeyDown={(e) => e.stopPropagation()}
        >
          + Queue
        </button>
      </span>
    </div>
  );
}

/**
 * What's playing, its transport, and what's next: Queued (by hand: a track dragged from an open bag
 * drops in where it's let go, and the queued ones drag to reorder), then Then (the rest of what it's
 * playing from). Big: the cover full width (beside the bags).
 */
function NowPlaying({
  track,
  bag,
  place,
  big,
  started,
  playing,
  buffering,
  position,
  duration,
  seekInputProps,
  onToggle,
  onPrevious,
  onNext,
  queued,
  then,
  shuffled,
  onPick,
  onQueue,
  onClear,
  linkTo,
}: {
  track: HomeTrack;
  bag: HomeBag;
  place: string;
  big: boolean;
  /** Nothing played yet: the track is only cued. */
  started: boolean;
  playing: boolean;
  buffering: boolean;
  position: number;
  duration: number;
  seekInputProps: InputHTMLAttributes<HTMLInputElement>;
  onToggle: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  queued: HomeTrack[];
  then: HomeTrack[];
  /** Then is every track shuffled (not bag after bag). */
  shuffled: boolean;
  onPick: (t: HomeTrack) => void;
  /** A dragged track (by id), let go before a queued track or at the end of the queue. */
  onQueue: (id: string, to: "end" | { before: string }) => void;
  onClear: () => void;
  /** A link to a bag that stays on this page. */
  linkTo: (handle: string) => { href: string; onClick: (e: MouseEvent) => void };
}) {
  /** Where a dragged track would land: before this track (by id), or at the end. */
  const [dropAt, setDropAt] = useState<string | null>(null);
  const target = (to: "end" | { before: string }) => ({
    onDragOver: (e: DragEvent) => {
      if (!e.dataTransfer.types.includes(TRACK)) return;
      e.preventDefault(); // allows the drop
      setDropAt(to === "end" ? "end" : to.before);
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      setDropAt(null);
      onQueue(e.dataTransfer.getData(TRACK), to);
    },
  });
  const text = (
    <div className={styles.npText}>
      <span className={styles.npTitle}>{track.title}</span>
      <span className={styles.npArtist}>{track.artist}</span>
      <span className={styles.npBy}>
        {dropLine(track)}
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
          <Link {...linkTo(bag.handle)} className={styles.npBag}>
            <span>
              {started ? "Now playing" : "Up first"} · {bag.handle}’s bag
            </span>
            <span>{place} →</span>
          </Link>
        )}
        {big ? (
          <>
            <div style={{ aspectRatio: "1" }}>
              <Artwork src={track.thumbnail} source={track.source} size="100%" mono={false} />
            </div>
            {text}
          </>
        ) : (
          <div className={styles.npRow}>
            <Artwork src={track.thumbnail} source={track.source} size={96} mono={false} />
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
      <div onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setDropAt(null)}>
        <div className={styles.npListHead}>
          <span>Queued · {padCount(queued.length)}</span>
          {queued.length > 0 && (
            <button type="button" className={styles.clear} onClick={onClear}>
              Clear
            </button>
          )}
        </div>
        <ol className={styles.queue}>
          {queued.map((t, i) => (
            <li
              key={t.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(TRACK, t.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              className={dropAt === t.id ? styles.dropHere : undefined}
              {...target({ before: t.id })}
            >
              <TrackRow track={t} index={i + 1} active={false} playing={false} ruled mono={false} onPlay={() => onPick(t)} />
            </li>
          ))}
          <li className={`${styles.queueEnd} ${dropAt === "end" ? styles.dropHere : ""}`} {...target("end")}>
            {queued.length ? "Drag here to queue last" : "Drag a track here to play it next"}
          </li>
        </ol>
        <div className={styles.npListHead}>
          <span>Then{shuffled ? " · shuffled" : ""}</span>
          <span>{padCount(then.length)}</span>
        </div>
        {/* Let go over these: queued last. */}
        <ol className={styles.queue} {...target("end")}>
          {then.map((t, i) => (
            <li key={t.id}>
              <TrackRow track={t} index={queued.length + i + 1} active={false} playing={false} ruled mono={false} onPlay={() => onPick(t)} />
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
