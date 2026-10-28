"use client";

import Link from "next/link";
import { useState, type DragEvent, type MouseEvent } from "react";
import { Artwork } from "@/components/ds/Artwork";
import { TrackRow } from "@/components/ds/TrackRow";
import { fmtTime } from "@/components/ds/types";
import { padCount } from "@/lib/format";
import type { HomeBag, HomeTrack } from "@/lib/home";
import { usePlayer } from "../PlayerProvider";
import styles from "./bags.module.css";

/** What a track carries when it's dragged: its id. */
export const TRACK = "application/x-dat-track";

/** Where a dragged track lands in the queue: before a queued track (by id), or last. */
export type QueueSpot = { before: string } | "end";

/** "Dropped by Ellie, London · 2w ago" */
export const dropLine = (t: HomeTrack) => {
  const who = t.droppedBy ? t.droppedBy + (t.droppedFrom ? ", " + t.droppedFrom : "") : null;
  return [who && `Dropped by ${who}`, t.droppedAt].filter(Boolean).join(" · ");
};

/** "03/07": a track's number in its bag, oldest first, as its row in the list numbers it. */
export const placeIn = (bag: HomeBag | undefined, t: HomeTrack) =>
  bag ? `${padCount(bag.tracks.length - bag.tracks.findIndex((x) => x.id === t.id))}/${padCount(bag.tracks.length)}` : "";

/** Makes an element drag `t` onto the queue. */
export const dragTrack = (t: HomeTrack) => ({
  draggable: true,
  onDragStart: (e: DragEvent) => {
    e.dataTransfer.setData(TRACK, t.id);
    e.dataTransfer.effectAllowed = "move";
  },
});

/**
 * What's on, its transport, and what's next: Queued (by hand: a track dragged from an open bag
 * drops in where it's let go, and the queued ones drag to reorder), then Then (what follows:
 * tracks gone back from, and the rest of what it's playing from). Big: the cover full width
 * (beside the bags).
 */
export function NowPlaying({
  big,
  bagOf,
  mine,
  onQueue,
  linkTo,
}: {
  big: boolean;
  bagOf: (t: HomeTrack) => HomeBag | undefined;
  /** Drops made from this browser: marked "Your drop". */
  mine: string[];
  /** A dragged track (by id) let go in the queue. */
  onQueue: (id: string, to: QueueSpot) => void;
  /** A link to a bag that stays on this page. */
  linkTo: (handle: string) => { href: string; onClick: (e: MouseEvent) => void };
}) {
  const player = usePlayer();
  /** Where a dragged track would land: before this track (by id), or at the end. */
  const [dropAt, setDropAt] = useState<string | null>(null);
  const track = player.now;
  if (!track) return null;
  const target = (to: QueueSpot) => ({
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
  const duration = player.progress.duration || track.duration || 0;
  const position = player.progress.playedSeconds;
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
          <Link {...linkTo(track.handle)} className={styles.npBag}>
            <span>
              {player.started ? "Now playing" : "Up first"} · {track.handle}’s bag
            </span>
            <span>{placeIn(bagOf(track), track)} →</span>
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
            {duration ? <input aria-label="Seek" {...player.seekInputProps} /> : null}
          </span>
          <span className={styles.npTimes}>
            <span>{player.buffering ? "Loading…" : fmtTime(position, true)}</span>
            <span>{fmtTime(duration, true)}</span>
          </span>
        </div>
        <div className={styles.npTransport}>
          <button type="button" aria-label="Previous track" onClick={player.previous} disabled={!player.hasPrevious}>
            ◀︎◀︎
          </button>
          <button type="button" aria-label={player.playing ? "Pause" : "Play"} onClick={player.toggle}>
            {player.playing ? "❚❚" : "▶︎"}
          </button>
          <button type="button" aria-label="Next track" onClick={player.next} disabled={!player.hasNext}>
            ▶︎▶︎
          </button>
        </div>
      </div>
      <div onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setDropAt(null)}>
        <div className={styles.npListHead}>
          <span>Queued · {padCount(player.queued.length)}</span>
          {player.queued.length > 0 && (
            <button type="button" className={styles.clear} onClick={player.clear}>
              Clear
            </button>
          )}
        </div>
        <ol className={styles.queue}>
          {player.queued.map((t, i) => (
            <li key={t.id} {...dragTrack(t)} className={dropAt === t.id ? styles.dropHere : undefined} {...target({ before: t.id })}>
              <TrackRow track={t} index={i + 1} active={false} playing={false} ruled mono={false} mine={mine.includes(t.id)} onPlay={() => player.play(t)} />
            </li>
          ))}
          <li className={`${styles.queueEnd} ${dropAt === "end" ? styles.dropHere : ""}`} {...target("end")}>
            {player.queued.length ? "Drag here to queue last" : "Drag a track here to play it next"}
          </li>
        </ol>
        <div className={styles.npListHead}>
          <span>Then{player.source === "shuffle" ? " · shuffled" : ""}</span>
          <span>{padCount(player.rest.length)}</span>
        </div>
        {/* Let go over these: queued last. */}
        <ol className={styles.queue} {...target("end")}>
          {player.rest.map((t, i) => (
            <li key={t.id}>
              <TrackRow
                track={t}
                index={player.queued.length + i + 1}
                active={false}
                playing={false}
                ruled
                mono={false}
                mine={mine.includes(t.id)}
                onPlay={() => player.play(t)}
              />
            </li>
          ))}
          {player.after === "shuffle" && <li className={styles.queueAfter}>Then everything, shuffled</li>}
        </ol>
      </div>
    </>
  );
}
