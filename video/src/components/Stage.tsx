import { AbsoluteFill } from "remotion";
import { BEAT, bounce, easeStamp, enter, keyframes, prog } from "../anim";
import { FAMILY, useFit } from "../theme";
import { Person, PRINT_CENTER } from "./Person";
import { Texture } from "./Texture";

/** The club: two magenta moirés turning against each other, flaring on every beat. */
export function ClubLights({ frame }: { frame: number }) {
  const flare = 0.5 + 0.45 * Math.exp(-(frame % BEAT) / 4);
  return (
    <AbsoluteFill style={{ background: "var(--ink)", overflow: "hidden" }}>
      <Texture name="a" color="var(--magenta)" opacity={flare} style={{ inset: "-30% -70%", rotate: `${frame * 0.12}deg` }} />
      <Texture name="4" color="var(--magenta)" opacity={0.3} style={{ inset: "-30% -70%", rotate: `${-frame * 0.08}deg` }} />
    </AbsoluteFill>
  );
}

// The queue: backlit silhouettes, back row first, and the shirt in front.
const QUEUE = [
  { x: -90, y: 760, w: 400, phase: 3 },
  { x: 190, y: 720, w: 380, phase: 9 },
  { x: 480, y: 740, w: 400, phase: 1 },
  { x: 760, y: 700, w: 420, phase: 12 },
  { x: -300, y: 960, w: 660, phase: 6 },
  { x: 720, y: 930, w: 680, phase: 4 },
];
const HERO = { x: 130, y: 900, w: 820 };
/** The print on the shirt in front, in frame coordinates: what the camera pushes in on. */
const HERO_PRINT = { x: HERO.x + PRINT_CENTER.x * HERO.w, y: HERO.y + PRINT_CENTER.y * HERO.w };

export function Crowd({ frame, zoom = 1, dim = 1 }: { frame: number; zoom?: number; dim?: number }) {
  return (
    <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `${HERO_PRINT.x}px ${HERO_PRINT.y}px`, filter: dim < 1 ? `brightness(${dim})` : undefined }}>
      {QUEUE.map((p, i) => (
        <Person key={i} width={p.w} style={{ left: p.x, top: p.y - bounce(frame, p.phase) * 10 }} />
      ))}
      <Person
        width={HERO.w}
        tee="var(--paper)"
        print
        style={{ left: HERO.x, top: HERO.y - bounce(frame, 7) * 6, filter: "drop-shadow(0 0 40px rgba(253,2,255,.55))" }}
      />
    </AbsoluteFill>
  );
}

/** Mono caps chips in the corner, as on the poster: where and when. */
export function Chips({ items, frame, inverse = false }: { items: string[]; frame: number; inverse?: boolean }) {
  return (
    <div style={{ position: "absolute", left: 64, top: 96, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
      {items.map((text, i) => (
        <span
          key={text}
          style={{
            ...enter(frame, 2 + i * 4, [0, 16]),
            fontFamily: "var(--font-mono)",
            fontSize: 30,
            letterSpacing: "var(--tracking-caps)",
            textTransform: "uppercase",
            padding: "8px 16px",
            background: inverse ? "var(--ink)" : "var(--paper)",
            color: inverse ? "var(--paper)" : "var(--ink)",
          }}
        >
          {text}
        </span>
      ))}
    </div>
  );
}

/** Big words in the poster's type, one line slammed in per beat (`at`, in frames). */
export function Words({
  lines,
  at,
  frame,
  top,
  color = "var(--paper)",
  max = 220,
  out,
}: {
  lines: string[];
  at: number[];
  frame: number;
  /** Where it sits in the frame; without, it's laid out where it's placed. */
  top?: number;
  color?: string;
  max?: number;
  /** When they leave, if they do. */
  out?: number;
}) {
  const size = useFit(lines, FAMILY.display, 952, max);
  const gone = out === undefined ? 0 : prog(frame, out, 6);
  return (
    <div style={{ ...(top === undefined ? {} : { position: "absolute", left: 64, top }), display: "flex", flexDirection: "column", gap: size * 0.08, opacity: 1 - gone }}>
      {lines.map((line, i) => {
        const k = (stops: [number, number][]) => keyframes(frame, at[i], 8, stops, easeStamp);
        return (
          <span
            key={line}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: size,
              lineHeight: 0.82,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              color,
              transformOrigin: "left center",
              scale: String(k([[0, 1.9], [0.7, 0.96], [1, 1]])),
              opacity: k([[0, 0], [0.7, 1], [1, 1]]),
            }}
          >
            {line}
          </span>
        );
      })}
    </div>
  );
}

/** A finger's tap at (x, y): a dot, then a ring spreading out. */
export function Tap({ x, y, at, frame, color = "var(--ink)", size = 1 }: { x: number | string; y: number | string; at: number; frame: number; color?: string; size?: number }) {
  const t = prog(frame, at, 10);
  if (frame < at || t >= 1) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, pointerEvents: "none", zIndex: 5 }}>
      <div
        style={{
          position: "absolute",
          width: 90 * size * (0.3 + 0.7 * t),
          height: 90 * size * (0.3 + 0.7 * t),
          translate: "-50% -50%",
          borderRadius: "50%",
          border: `${3 * size}px solid ${color}`,
          background: frame - at < 4 ? color : "transparent",
          opacity: 0.7 * (1 - t),
        }}
      />
    </div>
  );
}
