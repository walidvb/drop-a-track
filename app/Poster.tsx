import Link from "next/link";
import { monoCaps } from "@/components/ds/styles";
import { Texture } from "@/components/ds/Texture";
import { FitText } from "@/components/FitText";
import { padCount } from "@/lib/format";
import styles from "./browse.module.css";

const STEPS = [
  ["01", "Flex your code.", "Your own QR code, printed on the back."],
  ["02", "Get scanned.", "Likeminded people point a phone at you."],
  ["03", "Get a drop", "They drop a single link into your bag. One per person."],
];

/**
 * The way to /my-drops on phones, where scans happen: a sticker slapped on the poster below the
 * bar, over TRACK, there only while drops are waiting.
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
 * The D.A.T poster: the drifting moiré, the pitch and the three steps, with DROP A and TRACK
 * fitted to its edges. It comes in (see browse.module.css) once Browse marks the page .shown.
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
        ["--pad-x" as string]: "clamp(16px,3vw,32px)",
        ["--pad-b" as string]: "clamp(16px,3vw,28px)",
        padding: "20px var(--pad-x) var(--pad-b)",
        gap: 20,
        minWidth: 0,
      }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <span style={{ ...monoCaps, fontSize: 10, background: "var(--paper)", padding: "3px 8px" }}>© A Diggers Delights project</span>
          <span
            className={styles.reveal}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(30px,7vw,96px)",
              lineHeight: 0.8,
              color: "transparent",
              WebkitTextStroke: "2px var(--ink)",
            }}
          >
            D.A.T
          </span>
        </div>
        <nav className={`${styles.reveal} ${styles.ways}`}>
          <button type="button" className={`${styles.way} ${styles.wayPrimary}`} onClick={onGetShirt}>
            <span>Get your own</span>
            <span aria-hidden="true">→</span>
          </button>
          <Link href="/bags" className={styles.way}>
            <span>Check all bags</span>
            <span aria-hidden="true">→</span>
          </Link>
          {pendingDrops > 0 && <DropsWaiting pending={pendingDrops} />}
        </nav>
      </header>
      <div style={{ flex: 1 }} />
      <div className={styles.reveal} style={{ display: "flex", alignItems: "flex-end", gap: 8, minWidth: 0 }}>
        <section
          className={styles.stepsBox}
          style={{ maxWidth: 560, minWidth: 0, flex: "0 1 560px", background: "var(--paper)", display: "flex", flexDirection: "column" }}
        >
          <p style={{ margin: 0, padding: "12px 14px", fontWeight: 500, fontSize: "clamp(15px,1.3vw,17px)", lineHeight: 1.25, textWrap: "pretty" }}>
            Inspired by mixtapes passed hand to hand in simpler times, the D.A.T club is a participatory project by and for music lovers.
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
  </main>
  );
}
