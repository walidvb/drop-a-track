import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { easeSnap, keyframes, lerp, prog } from "../anim";
import { Person, QR_CENTER, QR_SIZE } from "../components/Person";
import { BEZEL, Phone, Ui } from "../components/Phone";
import { ClubLights, Crowd, Tap, Words } from "../components/Stage";
import { SITE } from "../data";
import { DropFormScreen } from "../ui/DropForm";
import { NIGHT_ZOOM } from "./Night";

const LEN = 105;
/** The scene starts where the night shot ends. */
const NIGHT = 105;

/** Four corner marks round `box`. */
function Brackets({ box, color, scale }: { box: { l: number; t: number; r: number; b: number }; color: string; scale: number }) {
  const arm = 64;
  const w = 8;
  const corners = [
    { left: box.l, top: box.t, borderTop: w, borderLeft: w },
    { left: box.r - arm, top: box.t, borderTop: w, borderRight: w },
    { left: box.l, top: box.b - arm, borderBottom: w, borderLeft: w },
    { left: box.r - arm, top: box.b - arm, borderBottom: w, borderRight: w },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, scale: String(scale), transformOrigin: `${(box.l + box.r) / 2}px ${(box.t + box.b) / 2}px` }}>
      {corners.map(({ left, top, ...borders }, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left,
            top,
            width: arm,
            height: arm,
            borderStyle: "solid",
            borderColor: color,
            borderWidth: `${borders.borderTop ?? 0}px ${borders.borderRight ?? 0}px ${borders.borderBottom ?? 0}px ${borders.borderLeft ?? 0}px`,
          }}
        />
      ))}
    </div>
  );
}

/** The camera: the shirt's back, handheld, coming into focus; the code found; its link offered. */
function Viewfinder({ f, screen }: { f: number; screen: { w: number; h: number } }) {
  const P = 300 / QR_SIZE;
  const qr = { x: screen.w / 2, y: screen.h * 0.44 };
  const jx = Math.sin(f / 4.7) * 6 + Math.sin(f / 2.3) * 2;
  const jy = Math.cos(f / 5.3) * 5;
  const blur = interpolate(f, [8, 22], [10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const half = (P * QR_SIZE) / 2 + 28;
  const lock = prog(f, 16, 14, easeSnap);
  const box = {
    l: lerp(48, qr.x - half, lock),
    r: lerp(screen.w - 48, qr.x + half, lock),
    t: lerp(200, qr.y - half, lock),
    b: lerp(screen.h - 280, qr.y + half, lock),
  };
  const locked = f >= 30;
  const flash = interpolate(f, [30, 35], [0.75, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pill = prog(f, 32, 8);
  const tapped = f >= 52;
  const sweep = box.t + (((f - 10) * 34) % Math.max(1, box.b - box.t));
  return (
    <AbsoluteFill style={{ background: "var(--ink)" }}>
      <AbsoluteFill style={{ filter: `blur(${blur}px)`, translate: `${jx}px ${jy}px` }}>
        <ClubLights frame={NIGHT + f} />
        <Person width={P} tee="var(--paper)" print style={{ left: qr.x - P * QR_CENTER.x, top: qr.y - P * QR_CENTER.y }} />
      </AbsoluteFill>
      <Brackets box={box} color={locked ? "var(--magenta)" : "var(--paper)"} scale={locked ? keyframes(f, 30, 6, [[0, 1.08], [1, 1]]) : 1} />
      {f >= 10 && !locked && <div style={{ position: "absolute", left: box.l + 12, width: box.r - box.l - 24, top: sweep, height: 5, background: "var(--magenta)", boxShadow: "0 0 24px var(--magenta)" }} />}
      {locked && <AbsoluteFill style={{ background: "var(--paper)", opacity: flash }} />}
      <div style={{ position: "absolute", left: 0, right: 0, top: screen.h - 250, display: "flex", justifyContent: "center", opacity: pill, translate: `0 ${40 * (1 - pill)}px` }}>
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "18px 30px",
            borderRadius: 999,
            border: "3px solid var(--ink)",
            background: tapped ? "var(--ink)" : "var(--paper)",
            color: tapped ? "var(--paper)" : "var(--ink)",
            fontFamily: "var(--font-mono)",
            fontSize: 28,
            letterSpacing: "var(--tracking-caps)",
            textTransform: "uppercase",
          }}
        >
          <span style={{ width: 16, height: 16, background: "var(--magenta)" }} />
          {SITE}
          <Tap x="50%" y="50%" at={50} frame={f} color="var(--magenta)" size={1.4} />
        </div>
      </div>
    </AbsoluteFill>
  );
}

/** A phone comes up and scans the shirt; the tap on its link opens the page, and the phone becomes the frame. */
export function Scan() {
  const f = useCurrentFrame();
  const rise = prog(f, 0, 14);
  const zoom = prog(f, 62, 30, easeSnap);
  const W0 = 640;
  const W1 = 1080 / (1 - 2 * BEZEL);
  const width = lerp(W0, W1, zoom);
  const x = lerp((1080 - W0) / 2, -W1 * BEZEL, zoom);
  const y = lerp(lerp(1920, 560, rise), -W1 * BEZEL, zoom);
  const rotate = (lerp(6, -2, rise) + Math.sin(f / 9) * 0.8) * (1 - zoom);
  return (
    <AbsoluteFill>
      <ClubLights frame={NIGHT + f} />
      <Crowd frame={NIGHT + f} zoom={lerp(NIGHT_ZOOM, NIGHT_ZOOM + 0.12, f / LEN)} dim={lerp(1, 0.55, rise)} />
      <Words lines={["Scan it."]} at={[15]} frame={f} top={150} out={62} />
      <Phone x={x} y={y} width={width} rotate={rotate} round={1 - zoom}>
        {(screen) =>
          f >= 58 ? (
            <Ui width={screen.w} height={screen.h}>
              <DropFormScreen f={0} />
            </Ui>
          ) : (
            <Viewfinder f={f} screen={screen} />
          )
        }
      </Phone>
    </AbsoluteFill>
  );
}
