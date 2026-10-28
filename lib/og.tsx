import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { parse } from "opentype.js";
import type { CSSProperties, ReactNode } from "react";
import { padCount, padNumber } from "./format";

/**
 * The share images (og:image), drawn by next/og's SVG renderer (satori + resvg). Flexbox only:
 * no grid, no writing-mode, no CSS custom properties, so the design system's values are spelled
 * out here.
 */
export const size = { width: 1200, height: 630 };
const W = size.width;
const H = size.height;

const ink = "#000000";
const paper = "#ffffff";
const gray600 = "#4a4a4a";
const gray400 = "#8a8a8a";
const magenta = "#fd02ff";

const display = "Shapiro Super Extd";
const mono: CSSProperties = { fontFamily: "IBM Plex Mono", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" };

const file = (path: string) => readFile(join(process.cwd(), path));

const FONTS = [
  ["Shapiro Super Extd", "Shapiro-95-Super-Extd.otf", 900],
  ["Shapiro Super Wide", "Shapiro-95-Super-Wide.otf", 900],
  ["Shapiro Heavy", "Shapiro-85-Super-Heavy.otf", 800],
  ["Archivo", "Archivo-Medium.ttf", 500],
  ["Archivo", "Archivo-ExtraBold.ttf", 800],
  ["IBM Plex Mono", "IBMPlexMono-Medium.ttf", 500],
] as const;
let fonts: Promise<{ name: string; data: Buffer; weight: 500 | 800 | 900 }[]> | undefined;
const loadFonts = () =>
  (fonts ??= Promise.all(FONTS.map(async ([name, path, weight]) => ({ name, data: await file(`app/fonts/${path}`), weight }))));

let extd: Promise<ReturnType<typeof parse>> | undefined;
const loadExtd = () =>
  (extd ??= file("app/fonts/Shapiro-95-Super-Extd.otf").then((b) => parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength))));

/** Shapiro's caps are .714em tall; at line-height 1 their tops sit .086em under the line box's. */
const CAP = 0.714;
const CAP_TOP = 0.086;

interface Fit {
  text: string;
  size: number;
  /** The first letter's left side bearing, in px: pulled out so the ink starts at the box's edge. */
  bearing: number;
}

/** A word's ink in Shapiro Super Extd at −0.02em tracking, in em: its width, and where it starts. */
interface Ink {
  text: string;
  ink: number;
  left: number;
}

/** Measured from the glyph outlines, as FitText does in the browser. */
async function measure(texts: string[]): Promise<Ink[]> {
  const font = await loadExtd();
  return texts.map((text) => {
    const bb = font.getPath(text, 0, 0, 1, { kerning: true, letterSpacing: -0.02 } as object).getBoundingBox();
    return { text, ink: bb.x2 - bb.x1, left: bb.x1 };
  });
}

/** Edge to edge (DS README): the word sized so its ink is exactly `width` wide. */
const fitWidth = ({ text, ink, left }: Ink, width: number): Fit => ({ text, size: width / ink, bearing: (left * width) / ink });

export const kiss = async (text: string, width: number) => fitWidth((await measure([text]))[0], width);

/**
 * A kissed word: its box is the ink's, cap top to baseline. Outlined (`stroke` px), the stroke's
 * outer edge kisses instead: fit it to the box less one stroke.
 */
function Kiss({ fit, stroke = 0, color = ink, style }: { fit: Fit; stroke?: number; color?: string; style?: CSSProperties }) {
  return (
    <div style={{ display: "flex", flexShrink: 0, height: CAP * fit.size + stroke, ...style }}>
      <span
        style={{
          fontFamily: display,
          fontSize: fit.size,
          lineHeight: 1,
          letterSpacing: -0.02 * fit.size,
          whiteSpace: "nowrap",
          marginTop: -CAP_TOP * fit.size + stroke / 2,
          marginLeft: -fit.bearing + stroke / 2,
          ...(stroke ? outline(fit.size, stroke, color) : {}),
        }}
      >
        {fit.text}
      </span>
    </div>
  );
}

let textures: Promise<string[]> | undefined;
/** Moiré A and B: black lines on white, as JPEGs (satori reads no WebP; built by scripts/build-textures.sh). */
const loadTextures = () =>
  (textures ??= Promise.all(["a", "b"].map(async (n) => `data:image/jpeg;base64,${(await file(`assets/og/ripples-${n}.jpg`)).toString("base64")}`)));

/**
 * A moiré ground, `w`×`h`: black lines on paper, or with `tint` the lines take the colour and the
 * paper stays white (.tex-lines). resvg drops blend modes, so the tint is laid under paper cut
 * through by the texture (a luminance mask: white keeps the paper, the lines let the tint show).
 */
function Moire({ src, w, h, tint }: { src: string; w: number; h: number; tint?: string }) {
  const box = { position: "absolute", left: 0, top: 0, width: w, height: h } as const;
  return tint ? (
    <div style={{ ...box, display: "flex", background: tint }}>
      <div style={{ ...box, background: paper, maskImage: `url(${src})`, maskSize: "cover", maskPosition: "center" }} />
    </div>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element -- satori draws <img>, not next/image
    <img src={src} width={w} height={h} style={{ ...box, objectFit: "cover" }} alt="" />
  );
}

const render = async (node: ReactNode) => new ImageResponse(<>{node}</>, { ...size, fonts: await loadFonts() });

const plural = (n: number, one: string) => `${padCount(n)} ${n === 1 ? one : `${one}s`}`;

/** Outlined display type. Satori skips transparent text, stroke and all: the fill is all but transparent. */
function outline(fontSize: number, stroke: number, color = ink): CSSProperties {
  return { fontFamily: display, fontSize, lineHeight: 0.8, color: "rgba(0,0,0,0.001)", WebkitTextStroke: `${stroke}px ${color}` };
}

/* ——— Home · / ——— */

const STEPS = [
  ["01", "Flex your code.", "Your own QR code, printed on the back."],
  ["02", "Get scanned.", "Likeminded people point a phone at you."],
  ["03", "Get a drop.", "One link into your bag. One per person."],
];

export async function homeImage() {
  const [[moireA], dropA, track] = await Promise.all([loadTextures(), kiss("DROP A", 1100), kiss("TRACK", H)]);
  const trackThick = CAP * track.size;
  return render(
    <div style={{ width: W, height: H, display: "flex", position: "relative", color: ink, fontFamily: "Archivo" }}>
      <Moire src={moireA} w={W} h={H} tint={magenta} />

      <span style={{ position: "absolute", left: 24, top: 24, background: paper, padding: "4px 10px", fontSize: 13, ...mono }}>
        © A Diggers Delights project
      </span>

      <span style={{ position: "absolute", right: 116, top: 22, ...outline(96, 2) }}>D.A.T</span>

      <div
        style={{ position: "absolute", left: 24, top: 68, width: 600, background: paper, border: `2px solid ${ink}`, display: "flex", flexDirection: "column" }}
      >
        <p style={{ margin: 0, padding: "14px 16px", fontSize: 24, fontWeight: 800, lineHeight: 1.15 }}>
          A participatory project for music lovers, ever changing, ever evolving.
        </p>
        <div style={{ display: "flex", borderTop: `2px solid ${ink}` }}>
          {STEPS.map(([n, title, detail], i) => (
            <div
              key={n}
              style={{
                flex: 1,
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 5,
                borderRight: `1px solid ${i < STEPS.length - 1 ? ink : "transparent"}`, // satori chokes on an undefined value
              }}
            >
              <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={outline(22, 1.2)}>{n}</span>
                <span style={{ fontWeight: 800, fontSize: 15 }}>{title}</span>
              </span>
              <span style={{ fontWeight: 500, fontSize: 13, lineHeight: 1.3, color: gray600 }}>{detail}</span>
            </div>
          ))}
        </div>
      </div>

      <Kiss fit={dropA} style={{ position: "absolute", left: 0, bottom: 0, width: 1100 }} />

      {/* TRACK reads bottom to top along the right edge: laid out flat, then turned about its centre. */}
      <Kiss
        fit={track}
        style={{
          position: "absolute",
          width: H,
          left: W - trackThick / 2 - H / 2,
          top: H / 2 - trackThick / 2,
          transform: "rotate(-90deg)",
        }}
      />
    </div>,
  );
}

/* ——— All bags · /bags ——— */

/** Outlined numbers' stroke, and the rule between a bag's number and its name. */
const STROKE = 2;
const RULE = 2;

/**
 * "D.A.T CLUB" kissing the top and both sides, then one column per open bag, by shirt number: the
 * handle stands on end and fills the column's height, its cap height is the column's width, and
 * the outlined number on top fills that width. Bags start over until the width is full (the last
 * column cropped); `live`, the bag with the latest drop, is magenta the first time round.
 */
export async function allBagsImage({ bags, live }: { bags: { number: number; handle: string }[]; live: number | null }) {
  const words = bags.flatMap((b) => [`#${padNumber(b.number)}`, b.handle.toUpperCase()]);
  const [[, moireB], [title, ...inks]] = await Promise.all([loadTextures(), measure(["D.A.T CLUB", ...words])]);
  const titleFit = fitWidth(title, W);
  const below = Math.round(CAP * titleFit.size + 16);
  const h = H - below - 4; // under the 4px rule

  const columns = [];
  for (let i = 0, used = 0; used < W && bags.length; i++) {
    const [num, name] = inks.slice((i % bags.length) * 2, (i % bags.length) * 2 + 2);
    // name length = h − RULE − number height, number height = CAP × its size + STROKE, its ink = column width − STROKE
    const size = (h - RULE - STROKE + (CAP * STROKE) / num.ink) / (name.ink + (CAP * CAP) / num.ink);
    const w = CAP * size;
    const length = name.ink * size;
    columns.push({ w, length, live: bags[i % bags.length].number === live && i < bags.length, num: fitWidth(num, w - STROKE), name: fitWidth(name, length) });
    used += w + 2;
  }

  return render(
    <div style={{ width: W, height: H, display: "flex", position: "relative", background: paper, color: ink }}>
      <Kiss fit={titleFit} style={{ position: "absolute", left: 0, top: 0, width: W }} />
      <div
        style={{ position: "absolute", left: 0, top: below, width: W, height: H - below, borderTop: `4px solid ${ink}`, background: ink, display: "flex", gap: 2, overflow: "hidden" }}
      >
        {columns.map((c, i) => (
          <div key={i} style={{ width: c.w, height: h, flexShrink: 0, position: "relative", display: "flex", flexDirection: "column", background: paper }}>
            {c.live && <Moire src={moireB} w={c.w} h={h} tint={magenta} />}
            <Kiss fit={c.num} stroke={STROKE} style={{ width: c.w }} />
            <div style={{ height: RULE, flexShrink: 0, background: ink }} />
            {/* The handle reads bottom to top: laid out flat, then turned about its centre. */}
            <div style={{ flexGrow: 1, position: "relative", display: "flex" }}>
              <Kiss
                fit={c.name}
                style={{ position: "absolute", width: c.length, left: c.w / 2 - c.length / 2, top: c.length / 2 - c.w / 2, transform: "rotate(-90deg)" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>,
  );
}

/* ——— Bag · /bags/[handle] ——— */

/** The cover wall grows with the bag: one cover fills it, a few stand tall, many become a mosaic. */
export const wallGrid = (n: number): [number, number] =>
  n <= 1 ? [1, 1] : n <= 3 ? [n, 1] : n <= 4 ? [2, 2] : n <= 6 ? [3, 2] : n <= 8 ? [4, 2] : n <= 15 ? [5, 3] : n <= 24 ? [8, 3] : n <= 40 ? [8, 5] : [12, 5];

/** An artwork as a data URI, or null when it can't be had in a format satori reads (its cell gets moiré). */
async function artwork(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const type = res.headers.get("content-type")?.split(";")[0] ?? "";
    if (!res.ok || !/^image\/(jpeg|png|gif)$/.test(type)) return null;
    return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  } catch {
    return null;
  }
}

export interface BagShare {
  number: number;
  handle: string;
  /** "06.2026" */
  since: string;
  /** Every drop's artwork, newest first. */
  covers: (string | null)[];
}

export async function bagImage({ number, handle, since, covers }: BagShare) {
  const n = covers.length;
  const [cols, rows] = wallGrid(n);
  const cellW = W / cols;
  const cellH = H / rows;
  const [moire, name, arts] = await Promise.all([loadTextures(), kiss(handle.toUpperCase(), 584), Promise.all(covers.slice(0, cols * rows).map(artwork))]);
  return render(
    <div style={{ width: W, height: H, display: "flex", position: "relative", background: ink, fontFamily: "Archivo" }}>
      {n === 0 ? (
        <Moire src={moire[0]} w={W} h={H} tint={gray400} />
      ) : (
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, display: "flex", flexWrap: "wrap" }}>
          {Array.from({ length: cols * rows }, (_, i) => (
            <div key={i} style={{ width: cellW, height: cellH, position: "relative", display: "flex", background: ink }}>
              {i < n &&
                (arts[i] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- satori draws <img>
                  <img src={arts[i]!} width={cellW} height={cellH} style={{ objectFit: "cover", filter: "grayscale(1) contrast(1.1)" }} alt="" />
                ) : (
                  <Moire src={moire[i % 2]} w={cellW} h={cellH} />
                ))}
            </div>
          ))}
        </div>
      )}

      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: 640,
            background: ink,
            color: paper,
            border: `4px solid ${paper}`,
            boxShadow: `6px 6px 0 ${magenta}`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: "22px 24px 26px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: gray400, ...mono }}>
              <span>drop-a-track · bag #{padNumber(number)}</span>
              <span>Since {since}</span>
            </div>
            <Kiss fit={name} style={{ width: 584 }} />
            <span style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>
              {n === 0 ? "Nothing in the bag yet. Be the first." : `${plural(n, "track")}, dropped by people who scanned the shirt.`}
            </span>
          </div>
          <div
            style={{ height: 60, padding: "0 24px", background: magenta, color: ink, display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "Shapiro Heavy", fontSize: 22, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              {n > 0 && (
                <svg width="16" height="18" viewBox="0 0 16 18">
                  <path d="M0 0 L16 9 L0 18 Z" fill={ink} />
                </svg>
              )}
              {n === 0 ? "Be the first" : "Play the bag"}
            </span>
            <span style={{ fontSize: 14, ...mono }}>One drop per person</span>
          </div>
        </div>
      </div>
    </div>,
  );
}
