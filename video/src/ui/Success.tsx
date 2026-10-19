import { cssEaseOut, easeStamp, keyframes, lerp, ms, prog } from "../anim";
import { Texture } from "../components/Texture";
import { BAG, DROP, WEARER } from "../data";
import { Button, Cover, fmtTime, monoCaps, padNumber } from "./kit";

/** app/[slug]/success.module.css's "rise", 400ms ease-out from `delay` ms. */
const rise = (f: number, delay: number) => {
  const t = prog(f, ms(delay), ms(400), cssEaseOut);
  return { opacity: t, translate: `0 ${24 * (1 - t)}px` };
};

/**
 * Right after DROP! (app/[slug]/DropSuccess.tsx, phone layout), with its "Stamp"
 * choreography: the number stamps, the screen shakes, DROPPED. slams in, the rest rises.
 */
export function SuccessScreen({ f }: { f: number }) {
  const position = BAG.length;
  const num = padNumber(position);
  const before = position - 1;

  // The number: stamped at 350ms, then ticking every 2.4s from 1.4s.
  const stampAt = ms(350);
  const stampDur = ms(380);
  const tick = f >= ms(1400) ? (f - ms(1400)) % ms(2400) : -1;
  const numScale =
    tick >= 0 ? keyframes(tick, 0, ms(2400), [[0, 1], [0.08, 1.08], [0.16, 1], [1, 1]]) : keyframes(f, stampAt, stampDur, [[0, 2.6], [0.6, 0.9], [1, 1]], easeStamp);
  const numRotate =
    tick >= 0 ? keyframes(tick, 0, ms(2400), [[0, -5], [0.08, -2], [0.16, -5], [1, -5]]) : keyframes(f, stampAt, stampDur, [[0, -14], [0.6, -5], [1, -5]], easeStamp);
  const numOpacity = keyframes(f, stampAt, stampDur, [[0, 0], [0.6, 1], [1, 1]], easeStamp);

  const shake = (stops: [number, number][]) => keyframes(f, ms(700), ms(320), stops, cssEaseOut);
  const shakeX = shake([[0, 0], [0.2, -7], [0.4, 6], [0.6, -4], [0.8, 2], [1, 0]]);
  const shakeY = shake([[0, 0], [0.2, 4], [0.4, -4], [0.6, 2], [0.8, -1], [1, 0]]);

  const slam = (stops: [number, number][]) => keyframes(f, ms(750), ms(320), stops, easeStamp);
  const drift = prog(f, ms(1000), ms(8000), (t) => t);
  const dotOn = f < ms(1000) || Math.floor((f - ms(1000)) / ms(1000)) % 2 === 0;

  return (
    <main
      style={{
        position: "relative",
        flex: 1,
        background: "var(--ink)",
        color: "var(--paper)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        translate: `${shakeX}px ${shakeY}px`,
      }}
    >
      <Texture name="15" color="var(--paper)" opacity={0.35} style={{ inset: -60, translate: `${lerp(-40, 40, drift)}px ${lerp(-24, 24, drift)}px` }} />
      <div style={{ position: "relative", flex: 1, width: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ ...monoCaps, padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, background: "var(--magenta)", opacity: dotOn ? 1 : 0 }} />
            In the bag
          </span>
          <span>{WEARER.handle}</span>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
          <div style={{ position: "relative", ...rise(f, 100) }}>
            <div style={{ border: "2px solid var(--paper)", boxShadow: "var(--shadow-hard-accent)" }}>
              <Cover track={DROP} size={232} />
            </div>
            <div
              style={{
                position: "absolute",
                right: "-0.72em",
                bottom: "-0.43em",
                fontFamily: "var(--font-display)",
                fontSize: 56,
                lineHeight: 0.8,
                whiteSpace: "nowrap",
                letterSpacing: "-0.02em",
                color: "transparent",
                WebkitTextStroke: "2px var(--paper)",
                opacity: numOpacity,
                transform: `scale(${numScale}) rotate(${numRotate}deg)`,
              }}
            >
              #{num}
            </div>
          </div>
        </div>

        <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontWeight: "normal",
              fontSize: 42,
              lineHeight: 0.84,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              color: "var(--magenta)",
              transformOrigin: "left center",
              scale: String(slam([[0, 1.9], [0.7, 0.96], [1, 1]])),
              opacity: slam([[0, 0], [0.7, 1], [1, 1]]),
            }}
          >
            Dropped.
          </h1>
          <p style={{ margin: 0, fontWeight: 500, fontSize: 16, lineHeight: 1.35, ...rise(f, 1000) }}>
            {before} people dropped before you. You{"’"}re #{num} in {WEARER.handle}
            {"’"}s bag.
          </p>
          <div
            style={{
              borderTop: "2px solid var(--paper)",
              borderBottom: "1px solid var(--gray-600)",
              padding: "12px 0",
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) auto",
              gap: "4px 16px",
              alignItems: "baseline",
              ...rise(f, 1100),
            }}
          >
            <div style={{ fontFamily: "var(--font-display-wide)", fontSize: 16, lineHeight: 1.05, textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {DROP.title}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtTime(DROP.duration)}</div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "var(--gray-400)" }}>{DROP.artist}</div>
            <div style={{ ...monoCaps, color: "var(--gray-400)" }}>{DROP.source}</div>
          </div>
        </div>

        <div style={{ padding: "20px 24px 28px", ...rise(f, 1200) }}>
          <Button variant="inverse" size="lg" fullWidth iconRight="→">
            Open the bag
          </Button>
        </div>
      </div>
    </main>
  );
}

