"use client";

import { useEffect, type CSSProperties, type ReactNode } from "react";
import { Texture } from "./ds/Texture";

/**
 * A full-screen ink overlay holding one paper card, centred while it fits and scrolling when
 * it doesn't. Closes on the backdrop and on Escape; the card brings its own ✕ (autoFocus it).
 * `texture` lays the paper moiré over the backdrop.
 */
export function Modal({
  onClose,
  labelledBy,
  maxWidth = 460,
  texture = false,
  cardStyle,
  children,
}: {
  onClose: () => void;
  /** Id of the card's heading. */
  labelledBy: string;
  maxWidth?: number;
  texture?: boolean;
  cardStyle?: CSSProperties;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "var(--ink)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: 16,
        overflowY: "auto",
      }}
    >
      {texture && <Texture color="var(--paper)" opacity={0.35} style={{ position: "fixed" }} />}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth,
          margin: "auto",
          background: "var(--paper)",
          color: "var(--ink)",
          border: "var(--rule)",
          boxShadow: "var(--shadow-hard-accent)",
          ...cardStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}
