"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { FocusScope } from "@radix-ui/react-focus-scope";
import { motion } from "motion/react";
import { Sheet } from "react-modal-sheet";
import { Artwork } from "@/components/ds/Artwork";
import { Marquee } from "@/components/ds/Marquee";
import { Player } from "@/components/ds/Player";
import { SourceLink } from "@/components/ds/SourceLink";
import { FitText } from "@/components/FitText";
import { padCount, padNumber } from "@/lib/format";
import { bagPath, handleFromPath } from "@/lib/handle";
import type { HomeBag, HomeTrack } from "@/lib/home";
import { fuzzyMatch } from "@/lib/search";
import { shuffle } from "@/lib/shuffle";
import { usePlayer } from "../PlayerProvider";
import { NowPlaying, dragTrack, dropLine, placeIn, type QueueSpot } from "./NowPlaying";
import styles from "./bags.module.css";
import { useEdgeScroll } from "./useEdgeScroll";

/** A row of covers is at least this long: a short bag shows its empty slots. */
const SLOTS = 12;

// Opening a bag, its covers fly between the strip and an open bag's grid, a few hundredths of a second
// apart, but in groups of six so they all seem to leave at once; each item's frame and details
// fade in as its own cover lands.
const FLY = 0.35;
const stagger = (i: number) => (i % 6) * 0.025;
/** An item's frame and details start fading in this long before its cover stops (s). */
const EARLY = 0.1;
const fly = (i: number) => ({ duration: FLY, ease: [0.2, 0.8, 0.2, 1] as const, delay: stagger(i) });

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const display = { fontFamily: "var(--font-display)", letterSpacing: "-0.02em", textTransform: "uppercase", whiteSpace: "nowrap" } as const;

/**
 * Every open bag, one under the other: Play and its count, its covers (one opens the bag: its
 * tracks laid out in full), and its handle fitted edge to edge. Playing goes on bag after bag
 * (then everything shuffled), or through all of them shuffled. Beside the bags (on a phone, in a
 * sheet opened from the bar at the bottom): what's playing and what's next. The player itself
 * lives in the layout, so it carries on across pages.
 * A bag's own page (/bags/mira.k) is this page, that bag open; the drop flow shows it too, after
 * a Skip or a drop. Its covers are in colour, as are the playing bag's and the one under the
 * pointer; the rest are black and white.
 */
export function AllBags({
  bags: withEmpty,
  selected = null,
  mine = [],
  drop,
}: {
  bags: HomeBag[];
  selected?: string | null;
  /** Drops made from this browser: marked "Your drop". */
  mine?: string[];
  /** A drop still to make (a fresh scan): that bag offers to go back to the drop form. */
  drop?: { handle: string; onDrop: () => void };
}) {
  /** Empty bags are left out (nothing to see or play yet), but for the one whose page this is. */
  const bags = useMemo(() => withEmpty.filter((b) => b.tracks.length > 0 || b.handle === selected), [withEmpty, selected]);
  const all = useMemo(() => bags.flatMap((b) => b.tracks), [bags]);
  /**
   * Search: the bags (and in them the tracks) whose holder, title, artist or dropper match what's
   * typed, typos forgiven (lib/search). Only what's shown is filtered: playing goes on through
   * every bag.
   */
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const searchField = useRef<HTMLInputElement>(null);
  const shown = useMemo(() => {
    if (!query.trim()) return bags;
    return bags.flatMap((b) => {
      const tracks = b.tracks.filter((t) => fuzzyMatch(query, [b.handle, t.title, t.artist, t.droppedBy]));
      return tracks.length || (!b.tracks.length && fuzzyMatch(query, [b.handle])) ? [{ ...b, tracks }] : [];
    });
  }, [bags, query]);
  const closeSearch = () => {
    setSearching(false);
    setQuery("");
  };
  const player = usePlayer();
  const now = player.now;
  const bagOf = (t: HomeTrack) => bags.find((b) => b.handle === t.handle);
  /** Once the last bag is done: everything, shuffled (a new order each time round). */
  const afterBags = useMemo(() => ({ source: "shuffle", list: () => shuffle(all) }), [all]);

  // Nothing on yet (a first visit to All bags): the first bag's first track, cued so its player
  // loads early. A bag's page cues that bag instead (below).
  useEffect(() => {
    if (!selected) player.cue(all, { source: "bags", then: afterBags });
  }, [player, all, afterBags, selected]);

  /** A track played from a bag (or a bag's Play): on from there, bag after bag. */
  const playNow = (t: HomeTrack) => (t.id === now?.id ? player.toggle() : player.playFrom(all, t, { source: "bags", then: afterBags }));
  const shuffleAll = () => {
    const s = shuffle(all);
    // Start on something else than what's playing (re-selecting it would only reset its progress bar).
    if (s.length > 1 && s[0].id === now?.id) [s[0], s[1]] = [s[1], s[0]];
    player.playFrom(s, s[0], { source: "shuffle", then: afterBags });
  };
  const queueTrack = (id: string, to: QueueSpot) => {
    const t = all.find((x) => x.id === id) ?? player.queued.find((x) => x.id === id);
    if (t) player.enqueue(t, to === "end" ? null : to.before);
  };

  const edgeScroll = useEdgeScroll();
  const [sheet, setSheet] = useState(false);
  const sheetClose = useRef<HTMLButtonElement>(null);
  /** The phone's player bar, measured: an open bag's handle sticks just above it. */
  const dock = useRef<HTMLDivElement>(null);
  const [dockH, setDockH] = useState(0);
  /** The open bag, its tracks laid out in full: the one whose page this is (from the URL). */
  const [picked, setPicked] = useState(selected);

  /**
   * Opening a bag (null: closing it) is shallow navigation to its page: the URL changes, the page
   * stays. Once it's laid out (the one open before has closed), it's scrolled to.
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
    const el = document.getElementById(`bag-${picked}`);
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return el.scrollIntoView();
    return glideTo(el, (FLY + stagger(5)) * 1000);
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
    const scrollToSelected = () => document.getElementById(`bag-${selected}`)?.scrollIntoView();
    document.fonts.ready.then(() => requestAnimationFrame(() => requestAnimationFrame(scrollToSelected)));
  }, [selected]);
  // What's next follows the bag open: from its first track (or on from what's on, if that's in it),
  // then the bags after it. What's on keeps playing; what's queued still goes first. Once per bag
  // opened (or arrived on).
  const followed = useRef<string | null>(null);
  useEffect(() => {
    if (followed.current === picked) return;
    followed.current = picked;
    if (!picked) return;
    const bag = bags.find((b) => b.handle === picked);
    if (!bag?.tracks.length) return;
    const at = now?.handle === picked ? all.findIndex((t) => t.id === now.id) + 1 : all.findIndex((t) => t.id === bag.tracks[0].id);
    player.follow(all, at, { source: "bags", then: afterBags });
  }, [picked, bags, all, now, player, afterBags]);
  // Back and forward move between the bags opened here.
  useEffect(() => {
    const onPop = () => setPicked(handleFromPath(location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    document.title = picked ? `${picked}’s bag · drop-a-track` : "All bags · drop-a-track";
  }, [picked]);

  // Escape closes the sheet (react-modal-sheet brings no keyboard handling). Caught on the way
  // down, before a row's own key handlers can stop it.
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(false);
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [sheet]);

  const docked = player.started;
  useEffect(() => {
    const d = dock.current;
    if (!d) return setDockH(0);
    const ro = new ResizeObserver(() => setDockH(d.offsetHeight));
    ro.observe(d);
    return () => ro.disconnect();
  }, [docked]);

  const current = player.started ? now : null;
  const dur = player.progress.duration || current?.duration || 0;
  const pct = dur ? Math.min(100, (player.progress.playedSeconds / dur) * 100) : 0;
  const nowPlaying = (big: boolean) => <NowPlaying big={big} bagOf={bagOf} mine={mine} onQueue={queueTrack} linkTo={linkTo} />;

  return (
    <div className={styles.page} style={{ ["--dock-h" as string]: `${dockH}px` }}>
      <main className={styles.main}>
        {/* Stays at the top of the screen: the way home, and how much there is. */}
        <div className={`${styles.meta} ${styles.top}`}>
          <Link href="/" className={styles.link}>
            ← D.A.T
          </Link>
          <span>
            {query.trim() ? `${shown.length} of ${bags.length} bags · ${plural(shown.reduce((n, b) => n + b.tracks.length, 0), "track")} found` : `${bags.length} bags · ${all.length} tracks`}
          </span>
        </div>
        <header className={styles.head}>
          <h1 className={styles.title}>
            {/* Outlined, so it never reads as one more bag. */}
            <FitText style={{ ...display, color: "transparent", WebkitTextStroke: "2px var(--ink)" }}>D.A.T club</FitText>
          </h1>
          {/* Shuffle, and beside it a search icon that grows into a field over it (Escape clears, then closes). */}
          <div className={`${styles.tools} ${searching ? styles.searching : ""}`}>
            <button type="button" className={styles.shuffle} onClick={shuffleAll} disabled={all.length === 0} tabIndex={searching ? -1 : undefined}>
              <span>Shuffle every bag</span>
              <span aria-hidden="true">▶︎</span>
            </button>
            <div className={styles.search}>
              <input
                ref={searchField}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && (query ? setQuery("") : closeSearch())}
                placeholder="Bag, track, artist, who dropped it"
                aria-label="Search the bags"
                tabIndex={searching ? undefined : -1}
              />
              <button
                type="button"
                className={styles.searchButton}
                aria-label={searching ? "Close search" : "Search the bags"}
                aria-expanded={searching}
                onClick={() => {
                  if (searching) return closeSearch();
                  setSearching(true);
                  searchField.current?.focus({ preventScroll: true });
                }}
              >
                {searching ? (
                  "✕"
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" aria-hidden="true">
                    <circle cx="10" cy="10" r="6.5" />
                    <path d="M15 15l6 6" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </header>

        {bags.length === 0 && <p className={styles.none}>No bags yet.</p>}
        {bags.length > 0 && shown.length === 0 && <p className={styles.none}>Nothing matches “{query.trim()}”.</p>}
        {shown.map((b, i) => {
          const here = current?.handle === b.handle;
          const tone = `${i % 2 === 0 ? styles.dark : ""} ${here ? styles.playing : ""}`;
          const open = b.handle === picked;
          const colour = `${here || open ? styles.selected : ""} ${open ? styles.open : ""}`;
          return (
            <section key={b.bagId} id={`bag-${b.handle}`} className={`${styles.bag} ${tone} ${colour}`} aria-label={`${b.handle}’s bag`}>
              <div className={styles.meta}>
                {b.tracks.length > 0 ? (
                  <button
                    type="button"
                    className={styles.metaButton}
                    aria-label={`${here && player.playing ? "Pause" : "Play"} ${b.handle}’s bag`}
                    onClick={() => (here ? player.toggle() : playNow(b.tracks[0]))}
                  >
                    {here ? `${player.playing ? "❚❚" : "▶︎"} ${placeIn(bagOf(current!), current!)}` : "▶︎ Play"}
                  </button>
                ) : (
                  <span />
                )}
                <span>
                  #{padNumber(b.number)} · {b.tracks.length ? `${padCount(b.tracks.length)} tracks` : "empty"}
                </span>
              </div>
              {drop?.handle === b.handle && (
                <button
                  type="button"
                  className={styles.stillDrop}
                  onClick={() => {
                    if (player.playing) player.toggle(); // the player stays behind with the bag
                    drop.onDrop();
                  }}
                >
                  <span>Still want to drop?</span>
                  <span>Drop yours →</span>
                </button>
              )}
              {/* The covers (or, open, the grid) open and close like an accordion. */}
              <Unfold>
                {open ? (
                  <div className={styles.grid} role="group" aria-label={`${b.handle}’s tracks`}>
                    {b.tracks.length === 0 && <p className={styles.none}>Nothing in the bag yet. Be the first.</p>}
                    {b.tracks.map((t, k) => (
                      <Item
                        key={t.id}
                        index={k}
                        track={t}
                        now={t.id === now?.id}
                        playing={player.playing}
                        mine={mine.includes(t.id)}
                        onPlay={() => playNow(t)}
                        onQueue={() => player.enqueue(t)}
                      />
                    ))}
                  </div>
                ) : (
                  // Scrolls sideways once there's more than fits; a cut-off cover at the edge says so,
                  // and the mouse near either end glides it that way.
                  // A cover plays its track and opens the bag.
                  <div className={styles.covers} {...edgeScroll}>
                    {Array.from({ length: Math.max(SLOTS, b.tracks.length) }, (_, k) => {
                      const t = b.tracks[k];
                      if (!t) return <span key={`empty-${k}`} className={styles.empty} />;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          className={styles.cover}
                          aria-label={`${t.id === now?.id && player.playing ? "Pause" : "Play"} ${t.title} by ${t.artist}`}
                          onClick={() => {
                            playNow(t);
                            openBag(b.handle);
                          }}
                        >
                          {/* Same layoutId as in the open bag's grid: covers fly between the two. */}
                          <motion.span layoutId={`cover-${t.id}`} transition={fly(k)} style={{ display: "block", width: "100%", height: "100%" }}>
                            <Artwork src={t.thumbnail} source={t.source} size="100%" mono={false} />
                          </motion.span>
                          {t.id === now?.id && <span className={styles.coverNow}>{player.playing ? "❚❚" : "▶︎"}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </Unfold>
              <h2 className={styles.name}>
                <Link {...linkTo(open ? null : b.handle)} aria-expanded={open} className={styles.nameLink}>
                  <FitText style={display}>{b.handle}</FitText>
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
          <button type="button" className={styles.bar} aria-expanded={sheet} onClick={() => setSheet(true)}>
            <span>
              {current.handle}’s bag · {placeIn(bagOf(current), current)}
            </span>
            <span>▲ Queue</span>
          </button>
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
      {/* Phones: the queue in a sheet that swipes down to close. Focus moves in once it's open (it
          mounts mid-animation, too early to take it), stays in it, and goes back to the bar after;
          Escape closes it too. */}
      <Sheet isOpen={sheet && current !== null} onClose={() => setSheet(false)} onOpenEnd={() => sheetClose.current?.focus()}>
        <Sheet.Container unstyled className={styles.sheet}>
          <FocusScope asChild trapped loop>
            <div role="dialog" aria-modal="true" aria-label="Queue" className={styles.sheetBody}>
              <Sheet.Header unstyled>
                <button ref={sheetClose} type="button" className={styles.bar} onClick={() => setSheet(false)}>
                  <span>{current && `${current.handle}’s bag · ${placeIn(bagOf(current), current)}`}</span>
                  <span>▼ Close</span>
                </button>
              </Sheet.Header>
              <Sheet.Content>{nowPlaying(false)}</Sheet.Content>
            </div>
          </FocusScope>
        </Sheet.Container>
        <Sheet.Backdrop unstyled className={styles.backdrop} onTap={() => setSheet(false)} />
      </Sheet>
    </div>
  );
}

/**
 * Scrolls to `el` (its scroll margin below the top) while the bags above and around it are still
 * opening or closing: its place is read again every frame, so the scroll ends on it, not on where
 * it was when the scroll began. Eases there; done once `ms` have passed and it's arrived (or can't
 * scroll further), or as soon as the reader scrolls. Returns a stop, for an effect's cleanup.
 */
function glideTo(el: HTMLElement, ms: number) {
  const start = performance.now();
  let last = NaN;
  let frame = requestAnimationFrame(function step(now) {
    const target = el.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(el).scrollMarginTop || "0");
    const left = target - scrollY;
    // Done once settled: arrived, or stuck (a bag near the bottom can't scroll all the way up).
    if (now - start > ms && (Math.abs(left) < 1 || scrollY === last)) return stop();
    last = scrollY;
    scrollTo(0, scrollY + left * 0.18);
    frame = requestAnimationFrame(step);
  });
  // The reader scrolling (wheel, touch, keys, the scrollbar) takes over: the glide lets go.
  // Not on "scroll" itself, which the glide's own steps fire too.
  const takeOver = ["wheel", "touchstart", "keydown", "mousedown"] as const;
  function stop() {
    cancelAnimationFrame(frame);
    for (const type of takeOver) removeEventListener(type, stop);
  }
  for (const type of takeOver) addEventListener(type, stop, { passive: true });
  return stop;
}

/**
 * Its content's height, animated: opening a bag (strip → grid) or closing it, the area
 * grows or shrinks over the covers' flight, and what's below slides instead of jumping. Clipped
 * while it does.
 */
function Unfold({ children }: { children: ReactNode }) {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");
  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <motion.div initial={false} animate={{ height }} transition={{ duration: FLY + stagger(5), ease: [0.2, 0.8, 0.2, 1] }} style={{ overflow: "clip" }}>
      <div ref={inner}>{children}</div>
    </motion.div>
  );
}

/**
 * One track of an open bag: plays on click (on from there), drags onto the queue; where there's no
 * queue to drag onto, "+ Queue" queues it last (not on the track that's on: it's already playing).
 */
function Item({
  index,
  track,
  now,
  playing,
  mine,
  onPlay,
  onQueue,
}: {
  /** Its place in the bag: when its cover flies in (see `fly`). */
  index: number;
  track: HomeTrack;
  /** It's the player's track (playing, paused or only cued). */
  now: boolean;
  playing: boolean;
  mine: boolean;
  onPlay: () => void;
  onQueue: () => void;
}) {
  // Its frame and details wait until its cover is about to land (or, when no cover
  // flies in, as on arriving at a bag's page, until it would have).
  const [landed, setLanded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLanded(true), (FLY + stagger(index)) * 1000 + 150);
    return () => clearTimeout(t);
  }, [index]);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={now}
      aria-label={`${now && playing ? "Pause" : "Play"} ${track.title} by ${track.artist}`}
      className={`${styles.item} ${mine ? styles.mine : ""} ${landed ? styles.landed : ""}`}
      data-marquee-host
      {...dragTrack(track)}
      onClick={onPlay}
      onKeyDown={(k) => {
        if (k.key === "Enter" || k.key === " ") {
          k.preventDefault();
          onPlay();
        }
      }}
    >
      <span className={styles.itemCover}>
        {/* Same layoutId as the cover in the strip. */}
        <motion.span
          layoutId={`cover-${track.id}`}
          transition={fly(index)}
          onLayoutAnimationStart={() => setTimeout(() => setLanded(true), (stagger(index) + FLY - EARLY) * 1000)}
          onLayoutAnimationComplete={() => setLanded(true)}
          style={{ display: "block", width: "100%", height: "100%" }}
        >
          <Artwork src={track.thumbnail} source={track.source} size="100%" mono={false} />
        </motion.span>
        {now && <span className={styles.coverNow}>{playing ? "❚❚" : "▶︎"}</span>}
      </span>
      <span className={styles.itemText}>
        {mine && <span className={styles.yourDrop}>Your drop</span>}
        <Marquee on={now && playing} className={styles.itemTitle}>
          {track.title}
        </Marquee>
        <span className={styles.itemArtist}>{track.artist}</span>
        <span className={styles.itemBy}>{dropLine(track)}</span>
        {track.url && (
          <SourceLink
            url={track.url}
            source={track.source}
            draggable={false}
            className={styles.itemSrc}
            // The item plays on click and Enter: the link must only open the original.
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          />
        )}
        {!now && (
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
        )}
      </span>
    </div>
  );
}
