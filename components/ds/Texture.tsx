"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { randomTexture } from "@/lib/textures";

/**
 * A moiré texture filling its positioned parent, in any colour: a different
 * one, at random, every time it mounts. Picked in the browser after hydration
 * (server and browser can't agree on a random number), so the server's HTML
 * leaves it blank. Place it before the content it sits behind.
 */
export function Texture({
  color,
  opacity,
  className,
  style,
}: {
  color?: string;
  opacity?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    ref.current?.style.setProperty("--tex-mask", `url(${randomTexture()})`);
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden
      className={className ? `tex ${className}` : "tex"}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        ...style,
        ["--tex-color" as string]: color,
        ["--tex-opacity" as string]: opacity,
      }}
    />
  );
}
