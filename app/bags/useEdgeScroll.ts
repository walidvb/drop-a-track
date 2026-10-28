"use client";

import { useEffect, useRef, type PointerEvent } from "react";

/** Widest edge zone, and the fastest it scrolls (px a second, right at the edge). */
const ZONE = 120;
const SPEED = 360;

/**
 * Handlers for a row that scrolls sideways: with the mouse near either end, it glides that way,
 * slowly at the zone's inner side and faster towards the edge (eased). Mouse only (touch swipes),
 * and not with reduced motion. One instance serves every row: only one is ever under the pointer.
 */
export function useEdgeScroll() {
  const edge = useRef<{ el: HTMLElement; speed: number; pos: number } | null>(null);
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const tick = (last: number) => (now: number) => {
    const e = edge.current;
    if (!e) {
      frame.current = 0;
      return;
    }
    // Kept as a float: scrollLeft rounds, which would stall a slow glide.
    e.pos = Math.max(0, Math.min(e.el.scrollWidth - e.el.clientWidth, e.pos + (e.speed * SPEED * (now - last)) / 1000));
    e.el.scrollLeft = e.pos;
    frame.current = requestAnimationFrame(tick(now));
  };

  return {
    onPointerMove: (ev: PointerEvent<HTMLElement>) => {
      if (ev.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const el = ev.currentTarget;
      const r = el.getBoundingClientRect();
      const zone = Math.min(ZONE, r.width / 5);
      const x = ev.clientX - r.left;
      const depth = x < zone ? -(1 - x / zone) : x > r.width - zone ? 1 - (r.width - x) / zone : 0;
      if (!depth) {
        edge.current = null;
        return;
      }
      const speed = Math.sign(depth) * depth * depth;
      // Entering a zone: start from where the row is now (it may have been scrolled by hand).
      edge.current = edge.current?.el === el ? { ...edge.current, speed } : { el, speed, pos: el.scrollLeft };
      if (!frame.current) frame.current = requestAnimationFrame(tick(performance.now()));
    },
    onPointerLeave: () => {
      edge.current = null;
    },
  };
}
