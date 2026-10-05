"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";

/**
 * Text sized to fill its parent's content box along one axis, never below `min`. The cap is
 * `max`, unless the layout sets a `--fit-max` custom property (so it can change at a CSS
 * breakpoint). Measures and sets the size directly — no re-render.
 */
export function FitText({
  axis = "w",
  max,
  min = 0,
  className,
  style,
  children,
}: {
  axis?: "h" | "w";
  max: number;
  min?: number;
  className?: string;
  style?: CSSProperties;
  children: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const box = el?.parentElement;
    if (!el || !box) return;
    const fit = () => {
      const cap = parseFloat(getComputedStyle(el).getPropertyValue("--fit-max")) || max;
      // Measure at a fixed size first: the text may be what sizes its box (TRACK's column).
      el.style.fontSize = "100px";
      const b = getComputedStyle(box);
      const avail =
        axis === "h"
          ? box.clientHeight - parseFloat(b.paddingTop) - parseFloat(b.paddingBottom)
          : box.clientWidth - parseFloat(b.paddingLeft) - parseFloat(b.paddingRight);
      const size = axis === "h" ? el.scrollHeight : el.scrollWidth;
      const fitted = avail > 0 && size ? Math.floor(((100 * avail) / size) * 0.98) : cap;
      el.style.fontSize = Math.max(min, Math.min(cap, fitted)) + "px";
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [axis, max, min, children]);
  return (
    <span ref={ref} className={className} style={{ ...style, fontSize: max }}>
      {children}
    </span>
  );
}
