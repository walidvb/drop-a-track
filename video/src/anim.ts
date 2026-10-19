import { Easing, interpolate } from "remotion";

export const FPS = 30;
/** One beat at 120 BPM. Every scene lasts whole beats, so a 120 BPM track lines up with the cuts. */
export const BEAT = 15;
/** Milliseconds to frames, for timings lifted from the app's CSS. */
export const ms = (n: number) => Math.round((n / 1000) * FPS);

// The design system's curves (styles/tokens/effects.css), the drop success screen's stamp, and CSS ease-out.
export const easeOut = Easing.bezier(0.2, 0.8, 0.2, 1);
export const easeSnap = Easing.bezier(0.7, 0, 0.2, 1);
export const easeStamp = Easing.bezier(0.5, 0, 0.8, 0.4);
export const cssEaseOut = Easing.bezier(0, 0, 0.58, 1);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0 → 1 over `dur` frames from `start`. */
export const prog = (frame: number, start: number, dur: number, easing: (t: number) => number = easeOut) =>
  interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** A CSS keyframe animation: `stops` at offsets 0..1 over `dur` frames, each segment eased as CSS does. */
export function keyframes(frame: number, start: number, dur: number, stops: [number, number][], easing: (t: number) => number = easeOut) {
  const t = (frame - start) / dur;
  if (t <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [o, v] = stops[i];
    const [po, pv] = stops[i - 1];
    if (t <= o) return lerp(pv, v, easing((t - po) / (o - po)));
  }
  return stops[stops.length - 1][1];
}

/** The app's way in: fade and slide from `from` (px). */
export const enter = (frame: number, start: number, from: [number, number] = [0, 10], dur = ms(560), easing = easeOut) => {
  const t = prog(frame, start, dur, easing);
  return { opacity: t, translate: `${from[0] * (1 - t)}px ${from[1] * (1 - t)}px` };
};

/** 0 on every beat, 1 halfway between: heads nodding along. */
export const bounce = (frame: number, phase = 0) => Math.abs(Math.sin((Math.PI * (frame + phase)) / BEAT));

/** A caret's blink: on for half a second, off for half. */
export const blink = (frame: number) => Math.floor(frame / 15) % 2 === 0;
