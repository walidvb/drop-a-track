import type { CSSProperties } from "react";
import { Img, staticFile } from "remotion";

// Someone seen from behind, drawn on a 1000 × 1300 grid.
const HEIGHT = 1.3;
const TEE =
  "M400 342 C440 368 560 368 600 342 L772 382 C832 402 862 452 882 522 L930 690 L792 730 L767 640 L776 1300 L224 1300 L233 640 L208 730 L70 690 L118 522 C138 452 168 402 228 382 Z";
const ARMS = ["M792 700 L930 668 L958 900 L944 1300 L826 1300 L818 960 Z", "M208 700 L70 668 L42 900 L56 1300 L174 1300 L182 960 Z"];
const NECK = "M452 280 L548 280 L560 352 L440 352 Z";

// The print on the back: the D.A.T poster (public/shirt-print.webp, 842 × 1190), 400 wide on the grid.
const PRINT = { x: 300, y: 430, w: 400, src: { w: 842, h: 1190 } };
const PRINT_SCALE = PRINT.w / PRINT.src.w;
// The poster's QR code, in the image's pixels.
const PRINT_QR = { x: 486, y: 992, size: 178 };

/** The centre of the shirt's print, and of the QR code in it, as shares of the person's width. */
export const PRINT_CENTER = { x: (PRINT.x + PRINT.w / 2) / 1000, y: (PRINT.y + (PRINT.src.h * PRINT_SCALE) / 2) / 1000 };
export const QR_CENTER = {
  x: (PRINT.x + (PRINT_QR.x + PRINT_QR.size / 2) * PRINT_SCALE) / 1000,
  y: (PRINT.y + (PRINT_QR.y + PRINT_QR.size / 2) * PRINT_SCALE) / 1000,
};
export const QR_SIZE = (PRINT_QR.size * PRINT_SCALE) / 1000;

/**
 * A person from behind: head, arms, a tee. With `print`, the shirt: the poster
 * printed on its back, QR code and all.
 */
export function Person({
  width,
  tee = "#000000",
  body = "#000000",
  outline,
  print = false,
  style,
}: {
  width: number;
  tee?: string;
  body?: string;
  /** A stroke round the tee, for light backgrounds. */
  outline?: string;
  print?: boolean;
  style?: CSSProperties;
}) {
  const s = width / 1000;
  return (
    <div style={{ position: "absolute", width, height: width * HEIGHT, ...style }}>
      <svg viewBox="0 0 1000 1300" width={width} height={width * HEIGHT} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <g style={{ fill: body }}>
          {ARMS.map((d) => (
            <path key={d} d={d} />
          ))}
          <path d={NECK} />
          <ellipse cx={500} cy={196} rx={108} ry={128} />
          <ellipse cx={392} cy={212} rx={16} ry={30} />
          <ellipse cx={608} cy={212} rx={16} ry={30} />
        </g>
        <path d={TEE} style={{ fill: tee, stroke: outline, strokeWidth: outline ? 8 : 0, strokeLinejoin: "round" }} />
      </svg>
      {print && <Img src={staticFile("shirt-print.webp")} style={{ position: "absolute", left: PRINT.x * s, top: PRINT.y * s, width: PRINT.w * s }} />}
    </div>
  );
}
