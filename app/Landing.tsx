"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { Button } from "@/components/ds/Button";
import { Texture } from "@/components/ds/Texture";
import styles from "./landing.module.css";

/** Text sized to fill its parent along one axis. Measures and sets the size directly — no re-render. */
function FitText({ axis, max, style, children }: { axis: "h" | "w"; max: number; style: CSSProperties; children: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const box = el?.parentElement;
    if (!el || !box) return;
    const fit = () => {
      el.style.fontSize = "100px";
      const avail = axis === "h" ? box.clientHeight : box.clientWidth;
      const size = axis === "h" ? el.scrollHeight : el.scrollWidth;
      if (avail && size) el.style.fontSize = Math.min(max, Math.floor((100 * avail) / size)) + "px";
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [axis, max]);
  return (
    <div ref={ref} style={{ ...style, fontSize: max }}>
      {children}
    </div>
  );
}

const STEPS = [
  ["01", "Wear the shirt.", "Your own QR code, printed on the back."],
  ["02", "Get scanned.", "Someone at the party points a phone at you."],
  ["03", "Receive one track.", "They drop a single link into your bag. One each, for good."],
];

const mono: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  letterSpacing: "var(--tracking-caps)",
  textTransform: "uppercase",
};

/** The one-screen poster (the #001 shirt): TRACK fits the height on the right, DROP A the width at the bottom. */
export function Landing() {
  return (
    <main
      style={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) auto",
        background: "var(--paper)",
      }}
    >
      <Texture className={styles.drift} style={{ inset: "-10%" }} />
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
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
            <span style={{ ...mono, background: "var(--ink)", color: "var(--paper)", padding: "4px 8px" }}>drop-a-track</span>
            <span style={{ ...mono, fontSize: 10, background: "var(--paper)", padding: "3px 8px" }}>© A Diggers Delights project</span>
          </div>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(48px,7vw,96px)",
              lineHeight: 0.8,
              color: "transparent",
              WebkitTextStroke: "2px var(--ink)",
            }}
          >
            #001
          </span>
        </header>
        <div style={{ flex: 1 }} />
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            background: "var(--paper)",
            border: "var(--rule)",
            maxWidth: 900,
          }}
        >
          {STEPS.map(([n, title, detail], i) => (
            <div key={n} style={{ padding: "14px 16px", borderLeft: i ? "var(--rule)" : 0, display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 32, lineHeight: 0.8, color: "transparent", WebkitTextStroke: "1.5px var(--ink)" }}>
                {n}
              </span>
              <span style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.15 }}>{title}</span>
              <span style={{ fontWeight: 500, fontSize: 14, lineHeight: 1.3, color: "var(--text-secondary)" }}>{detail}</span>
            </div>
          ))}
        </section>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", justifyContent: "space-between" }}>
          <p
            style={{
              margin: 0,
              maxWidth: 440,
              fontWeight: 800,
              fontSize: "clamp(16px,1.5vw,19px)",
              lineHeight: 1.2,
              background: "var(--paper)",
              padding: "8px 10px",
            }}
          >
            A participatory project for music lovers, ever changing, ever evolving. Out of the algorithm, into the hands of the people you meet.
          </p>
          <Button
            variant="primary"
            size="lg"
            iconRight="→"
            onClick={() => {
              location.href = "mailto:hello@walidvb.com?subject=I%20want%20a%20shirt";
            }}
          >
            Get a shirt
          </Button>
        </div>
        <div style={{ overflow: "hidden" }}>
          <FitText
            axis="w"
            max={260}
            style={{
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
      <div style={{ position: "relative", height: "100vh", minHeight: 520, display: "flex", alignItems: "flex-end" }}>
        <FitText
          axis="h"
          max={400}
          style={{
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
