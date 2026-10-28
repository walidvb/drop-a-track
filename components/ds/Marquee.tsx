"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import styles from "./marquee.module.css";

/**
 * One line of text, cut with "…" — unless it's `on` (its track is playing) or the nearest
 * `[data-marquee-host]` is under the pointer: then, if it doesn't fit, it scrolls back and forth
 * to show the rest.
 */
export function Marquee({
  children,
  on = false,
  className,
  style,
}: {
  children: string;
  on?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // How far the text runs past the box: how far to scroll it, at about 30px a second.
    const measure = () => {
      const over = el.scrollWidth - el.clientWidth;
      if (over > 1) {
        el.dataset.over = "";
        el.style.setProperty("--shift", `-${over}px`);
        el.style.setProperty("--dur", `${Math.max(4, over / 30 + 2)}s`);
      } else delete el.dataset.over;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [children]);
  return (
    <span ref={ref} className={`${styles.marquee} ${className ?? ""}`} data-on={on || undefined} style={style}>
      <span>{children}</span>
    </span>
  );
}
