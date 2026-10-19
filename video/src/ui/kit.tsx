import type { CSSProperties, ReactNode } from "react";
import { Texture } from "../components/Texture";
import type { Track } from "../data";

// The bits of components/ds the screens need, drawn rather than interactive.

export const monoCaps: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  letterSpacing: "var(--tracking-caps)",
  textTransform: "uppercase",
};
export const ellipsis: CSSProperties = { maxWidth: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
export const outlined = (width: number, color = "var(--ink)"): CSSProperties => ({ color: "transparent", WebkitTextStroke: `${width}px ${color}` });

export const padNumber = (n: number) => String(n).padStart(3, "0");
export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const CODE = { Bandcamp: "BC", SoundCloud: "SC", YouTube: "YT" };
export const sourceCode = (source: Track["source"]) => CODE[source];

const SIZES = {
  sm: { h: "var(--control-h-sm)", px: "14px", fs: "12px" },
  md: { h: "var(--control-h)", px: "20px", fs: "14px" },
  lg: { h: "var(--control-h-lg)", px: "28px", fs: "18px" },
};
const VARIANTS = {
  primary: { bg: "var(--ink)", fg: "var(--paper)", bd: "var(--ink)" },
  accent: { bg: "var(--magenta)", fg: "var(--ink)", bd: "var(--ink)" },
  outline: { bg: "transparent", fg: "var(--ink)", bd: "var(--ink)" },
  inverse: { bg: "var(--paper)", fg: "var(--ink)", bd: "var(--paper)" },
  ghost: { bg: "transparent", fg: "currentColor", bd: "transparent" },
};

/** The app's Button. `pressed` shows it held down: inverted, as the app's hover. */
export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  pressed = false,
  fullWidth = false,
  iconRight,
  iconLeft,
  style,
}: {
  children?: ReactNode;
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  disabled?: boolean;
  pressed?: boolean;
  fullWidth?: boolean;
  iconRight?: ReactNode;
  iconLeft?: ReactNode;
  style?: CSSProperties;
}) {
  const v = VARIANTS[variant];
  const s = SIZES[size];
  return (
    <div
      style={{
        display: fullWidth ? "flex" : "inline-flex",
        width: fullWidth ? "100%" : undefined,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        height: s.h,
        padding: "0 " + s.px,
        fontFamily: "var(--font-heavy)",
        fontSize: s.fs,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        lineHeight: 1,
        whiteSpace: "nowrap",
        background: pressed ? "var(--ink)" : v.bg,
        color: pressed ? (variant === "accent" ? "var(--magenta)" : "var(--paper)") : v.fg,
        border: "var(--border-w) solid " + v.bd,
        opacity: disabled ? 0.35 : 1,
        flexShrink: 0,
        ...style,
      }}
    >
      {iconLeft ? <span>{iconLeft}</span> : null}
      {children}
      {iconRight ? <span>{iconRight}</span> : null}
    </div>
  );
}

/** The app's artwork fallback: no cover art in the video, so every track gets the moiré and its source. */
export function Cover({ track, size }: { track: Track; size: number }) {
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0, overflow: "hidden", background: "var(--ink)" }}>
      <Texture name={track.cover} color="var(--paper)" opacity={0.45} />
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-display-wide)",
          fontSize: Math.round(size * 0.3),
          color: "var(--paper)",
          lineHeight: 1,
        }}
      >
        {sourceCode(track.source)}
      </span>
    </div>
  );
}

/** A text cursor. */
export const Caret = ({ on, color = "var(--ink)", height = 20 }: { on: boolean; color?: string; height?: number }) => (
  <span style={{ display: "inline-block", width: 2, height, marginLeft: 1, background: color, verticalAlign: "middle", opacity: on ? 1 : 0 }} />
);
