import Link from "next/link";
import { useId } from "react";
import { monoCaps } from "@/components/ds/styles";
import { Texture } from "@/components/ds/Texture";
import { FitText } from "@/components/FitText";
import { padCount } from "@/lib/format";
import styles from "./browse.module.css";

/**
 * The pitch and the three ways in: wear one, scan one, listen. Sits on the poster beside the
 * drops; on phones it comes after the poster instead, scrolling up over it.
 */
function HowItWorks({ onGetShirt, className }: { onGetShirt: () => void; className: string }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={`${styles.reveal} ${styles.how} ${className}`}>
      <p className={styles.pitch}>
        Inspired by mixtapes passed hand to hand in simpler times, the D.A.T club is a participatory project by and for music lovers.
      </p>
      <h2 id={id} className={styles.howTitle}>
        How it works
      </h2>
      <div className={styles.cards}>
        <div className={styles.card}>
          <h3>Wear one</h3>
          <p>Get a shirt with your own bag code. It becomes a playlist of the people you crossed paths with.</p>
          <button type="button" className={`${styles.cta} ${styles.ctaPrimary}`} onClick={onGetShirt}>
            <span>Get your own</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className={styles.card}>
          <h3>Scan one</h3>
          <p>Spotted a D.A.T shirt? Scan it and paste a track you love. That’s your one drop for that bag.</p>
        </div>
        <div className={styles.card}>
          <h3>Listen</h3>
          <p>Check anyone’s bag and discover new music!</p>
          <Link href="/bags" className={styles.cta}>
            <span>Check all bags</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * The way to /my-drops on phones, where scans happen: a sticker slapped on the poster's top right,
 * over TRACK, there only while drops are waiting.
 */
function DropsWaiting({ pending }: { pending: number }) {
  return (
    <span className={styles.stackedOnly}>
      <Link href="/my-drops" className={`${styles.sticker} ${styles.waiting}`}>
        <span className={styles.stickerCount}>{padCount(pending)}</span>
        <span className={styles.stickerLabel}>
          Drops
          <br />
          waiting →
        </span>
      </Link>
    </span>
  );
}

/**
 * The D.A.T poster: the drifting moiré and How it works, with DROP A and TRACK fitted to its
 * edges. On phones the poster holds still (sticky, one screen tall) with just Check all bags on
 * it, and How it works follows it, scrolling up over it. It comes in (see browse.module.css) once
 * Browse marks the page .shown.
 */
export function Poster({
  pendingDrops,
  onGetShirt,
}: {
  /** Counted on the Drops waiting sticker, shown when there are any. */
  pendingDrops: number;
  onGetShirt: () => void;
}) {
  return (
  <>
  <main
    className={styles.poster}
    style={{
      flex: "999 1 620px",
      minWidth: 0,
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
        ["--pad-x" as string]: "clamp(16px,3vw,32px)",
        ["--pad-b" as string]: "clamp(16px,3vw,28px)",
        padding: "20px var(--pad-x) var(--pad-b)",
        gap: 20,
        minWidth: 0,
      }}
    >
      <header className={styles.head}>
        <span style={{ ...monoCaps, fontSize: 10, background: "var(--paper)", padding: "3px 8px" }}>© A Diggers Delights project</span>
        <span
          className={`${styles.reveal} ${styles.dat}`}
          style={{ fontFamily: "var(--font-display)", lineHeight: 0.8, color: "transparent", WebkitTextStroke: "2px var(--ink)" }}
        >
          D.A.T
        </span>
      </header>
      <div style={{ flex: 1 }} />
      <HowItWorks onGetShirt={onGetShirt} className={styles.besideOnly} />
      <span className={styles.stackedOnly}>
        <Link href="/bags" className={`${styles.reveal} ${styles.cta} ${styles.ctaPrimary}`}>
          <span>Check all bags</span>
          <span aria-hidden="true">→</span>
        </Link>
      </span>
      {/* Bleeds through the column's padding so DROP A kisses the left and bottom edges and TRACK. */}
      <div style={{ minWidth: 0, marginInline: "calc(-1 * var(--pad-x))", marginBottom: "calc(-1 * var(--pad-b))" }}>
        <FitText
          axis="w"
          className={styles.enter}
          style={{
            ["--d" as string]: "0ms",
            ["--from" as string]: "0 10px", // up
            fontFamily: "var(--font-display)",
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
          }}
        >
          DROP A
        </FitText>
      </div>
    </div>
    {/* The column turns, not the word: FitText's trims are uneven (cap side vs baseline), so
        rotating the word itself would turn it about the wrong centre and shift it off the edges. */}
    <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "flex-end", transform: "rotate(180deg)" }}>
      <FitText
        axis="h"
        max={400}
        className={styles.enter}
        style={{
          ["--d" as string]: "140ms",
          ["--from" as string]: "-10px 0", // inside the turned column: right to left on screen, "up" for the word
          writingMode: "vertical-rl",
          fontFamily: "var(--font-display)",
          whiteSpace: "nowrap",
        }}
      >
        TRACK
      </FitText>
    </div>
    {pendingDrops > 0 && <DropsWaiting pending={pendingDrops} />}
  </main>
  <div className={styles.howBelow}>
    <HowItWorks onGetShirt={onGetShirt} className="" />
  </div>
  </>
  );
}
