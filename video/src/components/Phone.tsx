import type { ReactNode } from "react";

/** The bezel, the body's height and its corner radius, as shares of the width. */
export const BEZEL = 0.035;
const HEIGHT = 2.167;
const RADIUS = 0.14;

/**
 * A phone, front on, its screen `children(screen)` draws in. `round` 0 squares the
 * corners and drops the camera island: a phone zoomed until its screen is the frame.
 */
export function Phone({
  x,
  y,
  width,
  rotate = 0,
  round = 1,
  children,
}: {
  x: number;
  y: number;
  width: number;
  rotate?: number;
  round?: number;
  children: (screen: { w: number; h: number }) => ReactNode;
}) {
  const b = width * BEZEL;
  const h = width * HEIGHT;
  const r = width * RADIUS * round;
  const screen = { w: width - 2 * b, h: h - 2 * b };
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height: h,
        padding: b,
        borderRadius: r,
        background: "#0d0d0d",
        boxShadow: `0 0 0 ${width * 0.004}px #3a3a3a, 0 40px 120px rgba(0,0,0,.5)`,
        rotate: `${rotate}deg`,
      }}
    >
      <div style={{ position: "relative", width: screen.w, height: screen.h, borderRadius: Math.max(0, r - b), overflow: "hidden", background: "var(--paper)" }}>
        {children(screen)}
        <div
          style={{
            position: "absolute",
            top: width * 0.03,
            left: "50%",
            width: width * 0.27,
            height: width * 0.075,
            marginLeft: -width * 0.135,
            borderRadius: 999,
            background: "#000",
            opacity: round,
          }}
        />
      </div>
    </div>
  );
}

/** The app is drawn at phone width, in CSS pixels as in the app; this scales it to `width`. */
export const UI_W = 432;

export function Ui({ width, height, children }: { width: number; height: number; children: ReactNode }) {
  const s = width / UI_W;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: UI_W,
        height: height / s,
        overflow: "hidden",
        transform: `scale(${s})`,
        transformOrigin: "0 0",
        display: "flex",
        flexDirection: "column",
        background: "var(--paper)",
        color: "var(--ink)",
        fontFamily: "var(--font-body)",
      }}
    >
      {children}
    </div>
  );
}
