import type { CSSProperties } from "react";
import { Img } from "remotion";
import t4 from "../../../public/textures/ripples-4.webp";
import t6 from "../../../public/textures/ripples-6.webp";
import t7 from "../../../public/textures/ripples-7.webp";
import t8 from "../../../public/textures/ripples-8.webp";
import t9 from "../../../public/textures/ripples-9.webp";
import t10 from "../../../public/textures/ripples-10.webp";
import t14 from "../../../public/textures/ripples-14.webp";
import t15 from "../../../public/textures/ripples-15.webp";
import t17 from "../../../public/textures/ripples-17.webp";
import t18 from "../../../public/textures/ripples-18.webp";
import ta from "../../../public/textures/ripples-a.webp";
import tb from "../../../public/textures/ripples-b.webp";

/** The app's moiré masks (public/textures), by name: picked per shot here, not at random. */
const TEXTURES = { "4": t4, "6": t6, "7": t7, "8": t8, "9": t9, "10": t10, "14": t14, "15": t15, "17": t17, "18": t18, a: ta, b: tb };
export type TextureName = keyof typeof TEXTURES;

/** The app's <Texture>: a moiré filling its positioned parent, in any colour (the .tex class from styles/ds.css). */
export function Texture({ name, color, opacity, style }: { name: TextureName; color?: string; opacity?: number; style?: CSSProperties }) {
  return (
    <div
      aria-hidden
      className="tex"
      style={
        {
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          ...style,
          "--tex-color": color,
          "--tex-opacity": opacity,
          "--tex-mask": `url(${TEXTURES[name]})`,
        } as CSSProperties
      }
    />
  );
}

/** The masks are CSS, which a render doesn't wait for: loading them as images first makes it. */
export function Preload() {
  return (
    <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>
      {Object.values(TEXTURES).map((src) => (
        <Img key={src} src={src} />
      ))}
    </div>
  );
}
