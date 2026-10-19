import type { CSSProperties } from "react";
import { blink, easeSnap, enter, lerp, prog } from "../anim";
import { Tap } from "../components/Stage";
import { Texture } from "../components/Texture";
import { BAG, DROP, WEARER } from "../data";
import { FAMILY, useFit } from "../theme";
import { Button, Caret, monoCaps, padNumber } from "./kit";

const wordmark: CSSProperties = { fontFamily: "var(--font-display)", fontSize: 16, lineHeight: 0.85 };

/**
 * The scan's first screen (app/[slug]/BagApp.tsx, DropForm, phone layout): who you
 * scanned, their theme, and the link field. Over `f`: the theme comes in, the page
 * scrolls to the field, the link is pasted.
 */
export function DropFormScreen({ f }: { f: number }) {
  const handleSize = useFit([WEARER.handle], FAMILY.tall, 400, 76);
  const words = WEARER.theme.split(" ");
  const scroll = lerp(0, 150, prog(f, 26, 18, easeSnap));
  const mark = prog(f, 40, 12, easeSnap);
  const focus = f >= 56;
  const pasted = f >= 72;
  const reading = f >= 76;
  const bd = focus ? "var(--magenta)" : "var(--ink)";
  const count = BAG.length - 1;
  return (
    <div style={{ translate: `0 ${-scroll}px` }}>
      <section style={{ position: "relative", height: 360, overflow: "hidden", borderBottom: "var(--border-w-heavy) solid var(--ink)" }}>
        <Texture name="6" color="var(--magenta)" />
        <div style={{ ...wordmark, position: "absolute", left: 16, top: 16 }}>
          DROP A
          <br />
          TRACK
        </div>
        <div style={{ position: "absolute", right: 16, top: 16, fontFamily: "var(--font-display)", fontSize: 52, lineHeight: 0.8, color: "transparent", WebkitTextStroke: "2px var(--ink)" }}>
          #{padNumber(WEARER.number)}
        </div>
        <div style={{ position: "absolute", left: 16, right: 16, bottom: 14, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
          <span style={{ ...monoCaps, background: "var(--paper)", padding: "3px 6px" }}>You scanned</span>
          <div style={{ alignSelf: "stretch", display: "flex", overflow: "hidden" }}>
            <span
              style={{
                display: "inline-block",
                whiteSpace: "nowrap",
                fontFamily: "var(--font-display-tall)",
                fontSize: handleSize,
                lineHeight: 0.82,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
              }}
            >
              {WEARER.handle}
            </span>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 34, lineHeight: 0.82, background: "var(--ink)", color: "var(--paper)", padding: "6px 8px 4px" }}>
            {"’"}S BAG
          </div>
        </div>
      </section>

      <section style={{ padding: "20px 16px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", background: "var(--ink)", color: "var(--paper)" }}>
          <div
            style={{
              ...monoCaps,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              padding: "8px 12px",
              borderBottom: "1px solid var(--gray-400)",
            }}
          >
            <span>Theme</span>
            <span style={{ color: "var(--gray-400)" }}>Set by {WEARER.handle}</span>
          </div>
          <p style={{ margin: 0, padding: "14px 12px 16px", fontWeight: 800, fontSize: 22, lineHeight: 1.15 }}>
            {words.map((w, i) => (
              <span key={i} style={{ display: "inline-block", marginRight: "0.25em", ...enter(f, 4 + i * 2, [0, 8], 8) }}>
                {w}
              </span>
            ))}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h2)",
              lineHeight: "var(--lh-crush)",
              letterSpacing: "var(--tracking-display)",
              textTransform: "uppercase",
            }}
          >
            Drop a track
          </div>
          <div style={{ position: "relative", display: "flex", border: "var(--border-w) solid " + bd }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0 14px",
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                borderRight: "var(--border-w) solid " + bd,
                background: focus ? "var(--magenta)" : "transparent",
              }}
            >
              URL
            </span>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                height: "var(--control-h-lg)",
                padding: "0 16px",
                display: "flex",
                alignItems: "center",
                fontFamily: "var(--font-mono)",
                fontSize: 16,
                letterSpacing: "var(--tracking-mono)",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {pasted ? (
                // The end of the link, as the field shows it once pasted.
                <span style={{ direction: "rtl", overflow: "hidden", textOverflow: "ellipsis" }}>{DROP.url}</span>
              ) : (
                <>
                  {focus && <Caret on={blink(f - 56)} />}
                  <span style={{ color: "var(--gray-400)" }}>https://</span>
                </>
              )}
            </div>
            <Button variant="primary" size="lg" iconRight="→" disabled={reading} style={{ border: 0, borderLeft: "var(--border-w) solid " + bd }}>
              {reading ? "Reading…" : "Next"}
            </Button>
            {f >= 60 && f < 72 && (
              // The phone's paste menu.
              <div style={{ position: "absolute", left: 96, top: -50, scale: String(lerp(0.8, 1, prog(f, 60, 4))), transformOrigin: "30px 44px" }}>
                <div style={{ background: "#1f1f1f", color: "#fff", borderRadius: 9, padding: "9px 16px", fontSize: 15, fontWeight: 500 }}>Paste</div>
                <div style={{ width: 0, height: 0, margin: "0 0 0 24px", borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: "8px solid #1f1f1f" }} />
              </div>
            )}
            <Tap x={128} y={-30} at={68} frame={f} size={0.5} />
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "var(--tracking-mono)", color: reading ? "var(--ink)" : "var(--text-secondary)", textTransform: reading ? "uppercase" : "none" }}>
            {reading ? "Reading the link…" : "Stick to the theme, or don’t. Bandcamp, SoundCloud or YouTube."}
          </div>
        </div>

        <p style={{ margin: 0, fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>
          {count} tracks in the bag.{" "}
          <span
            style={{
              backgroundImage: "linear-gradient(var(--magenta), var(--magenta))",
              backgroundRepeat: "no-repeat",
              backgroundSize: `${mark * 100}% 100%`,
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
            }}
          >
            You get one drop {"—"} make it count.
          </span>
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderTop: "var(--rule)", paddingTop: 16 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>Just looking?</span>
          <Button variant="outline" iconRight="→">
            Skip
          </Button>
        </div>
      </section>
    </div>
  );
}
