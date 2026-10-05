import { Button } from "@/components/ds/Button";
import { monoCaps } from "@/components/ds/styles";
import { Texture } from "@/components/ds/Texture";
import { FitText } from "@/components/FitText";
import styles from "./browse.module.css";

const STEPS = [
  ["01", "Flex your code.", "Your own QR code, printed on the back."],
  ["02", "Get scanned.", "Likeminded people point a phone at you."],
  ["03", "Get a drop", "They drop a single link into your bag. One per person."],
];

/**
 * The D.A.T poster: the drifting moiré, the pitch and the three steps, with DROP A and TRACK
 * fitted to its edges. It comes in (see browse.module.css) once Browse marks the page .shown.
 */
export function Poster({ onLatestDrops, onGetShirt }: { onLatestDrops: () => void; onGetShirt: () => void }) {
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
        padding: "20px clamp(16px,3vw,32px) clamp(16px,3vw,28px)",
        gap: 20,
        minWidth: 0,
      }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
          <span style={{ ...monoCaps, fontSize: 10, background: "var(--paper)", padding: "3px 8px" }}>© A Diggers Delights project</span>
          <div className={styles.reveal} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <span className={styles.stackedOnly}>
              <Button variant="outline" size="md" iconRight="↓" onClick={onLatestDrops} style={{ background: "var(--paper)" }}>
                Latest drops
              </Button>
            </span>
            <Button variant="primary" size="md" iconRight="→" onClick={onGetShirt}>
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
  );
}
