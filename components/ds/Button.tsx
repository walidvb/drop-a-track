"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

const SIZES = {
  sm: { h: "var(--control-h-sm)", px: "14px", fs: "12px" },
  md: { h: "var(--control-h)", px: "20px", fs: "14px" },
  lg: { h: "var(--control-h-lg)", px: "28px", fs: "18px" },
};
const VARIANTS = {
  primary: { bg: "var(--ink)", fg: "var(--paper)", bd: "var(--ink)", hbg: "var(--paper)", hfg: "var(--ink)" },
  accent: { bg: "var(--magenta)", fg: "var(--ink)", bd: "var(--ink)", hbg: "var(--ink)", hfg: "var(--magenta)" },
  outline: { bg: "transparent", fg: "var(--ink)", bd: "var(--ink)", hbg: "var(--ink)", hfg: "var(--paper)" },
  inverse: { bg: "var(--paper)", fg: "var(--ink)", bd: "var(--paper)", hbg: "var(--ink)", hfg: "var(--paper)" },
  ghost: { bg: "transparent", fg: "currentColor", bd: "transparent", hbg: "transparent", hfg: "var(--magenta)" },
};

export interface ButtonProps {
  children?: ReactNode;
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  disabled?: boolean;
  fullWidth?: boolean;
  iconRight?: ReactNode;
  iconLeft?: ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  style?: CSSProperties;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = false,
  iconRight,
  iconLeft,
  type = "button",
  onClick,
  style,
}: ButtonProps) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const v = VARIANTS[variant];
  const s = SIZES[size];
  const on = hover && !disabled;
  const pressed = press && !disabled;
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setPress(false);
      }}
      onPointerDown={() => setPress(true)}
      onPointerUp={() => setPress(false)}
      style={{
        display: fullWidth ? "flex" : "inline-flex",
        width: fullWidth ? "100%" : undefined,
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        height: s.h,
        padding: "0 " + s.px,
        fontFamily: "var(--font-heavy)",
        fontSize: s.fs,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        lineHeight: 1,
        whiteSpace: "nowrap",
        background: pressed ? "var(--magenta)" : on ? v.hbg : v.bg,
        color: pressed ? "var(--ink)" : on ? v.hfg : v.fg,
        border:
          "var(--border-w) solid " +
          (variant === "ghost" ? "transparent" : on && variant === "inverse" ? "var(--paper)" : v.bd),
        borderRadius: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.35 : 1,
        transition: "background var(--dur-fast) var(--ease-snap),color var(--dur-fast) var(--ease-snap)",
        ...style,
      }}
    >
      {iconLeft ? <span aria-hidden>{iconLeft}</span> : null}
      {children}
      {iconRight ? <span aria-hidden>{iconRight}</span> : null}
    </button>
  );
}
