"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";

let ctx: CanvasRenderingContext2D | null = null;

/**
 * Text sized so its ink kisses its parent's content box along one axis (the text's own line
 * direction), never below `min`. The cap is `max`, unless the layout sets a `--fit-max` custom
 * property (so it can change at a CSS breakpoint). Measures and sets the size directly — no
 * re-render.
 *
 * Edge to edge (design system): the size comes from the ink width, not the advance width, the
 * first letter's side bearing is pulled out with a negative inline-start margin, and `text-box`
 * trims the line box to cap height over the baseline, so the ink touches all four sides.
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
  /** Leave out for no cap. */
  max?: number;
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
      const cs = getComputedStyle(el);
      const cap = parseFloat(cs.getPropertyValue("--fit-max")) || max || Infinity;
      // Measure at a fixed size first: the text may be what sizes its box (TRACK's column).
      el.style.fontSize = "100px";
      const b = getComputedStyle(box);
      const avail =
        axis === "h"
          ? box.clientHeight - parseFloat(b.paddingTop) - parseFloat(b.paddingBottom)
          : box.clientWidth - parseFloat(b.paddingLeft) - parseFloat(b.paddingRight);

      // Ink metrics at 100px, so every value below reads as hundredths of an em.
      ctx ??= document.createElement("canvas").getContext("2d");
      if (!ctx) return;
      const text = cs.textTransform === "uppercase" ? children.toUpperCase() : children;
      const spacing = parseFloat(cs.letterSpacing) || 0;
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} 100px ${cs.fontFamily}`;
      const native = "letterSpacing" in ctx;
      if (native) ctx.letterSpacing = `${spacing}px`;
      const m = ctx.measureText(text);
      const ink = m.actualBoundingBoxLeft + m.actualBoundingBoxRight + (native ? 0 : spacing * ([...text].length - 1));
      const bearing = -m.actualBoundingBoxLeft;

      const fitted = avail > 0 && ink > 0 ? (100 * avail) / ink : cap;
      el.style.fontSize = Math.max(min, Math.min(cap, fitted)) + "px";
      el.style.marginInlineStart = `${-bearing / 100}em`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [axis, max, min, children]);
  return (
    // A block, so no parent line box (strut) adds space under the baseline.
    <span ref={ref} className={className} style={{ ...style, display: "block", fontSize: max, textBox: "trim-both cap alphabetic" }}>
      {children}
    </span>
  );
}
