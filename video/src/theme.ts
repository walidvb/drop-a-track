import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { loadFont } from "@remotion/fonts";
import { loadFont as loadArchivo } from "@remotion/google-fonts/Archivo";
import { loadFont as loadPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { fitText } from "@remotion/layout-utils";
// The app's design system, as is: colour, type and spacing tokens, and the .tex moiré masks.
import "../../styles/ds.css";
import "./global.css";
import shapiro from "../../app/fonts/Shapiro-95-Super.otf";
import shapiroWide from "../../app/fonts/Shapiro-95-Super-Wide.otf";
import shapiroExtd from "../../app/fonts/Shapiro-95-Super-Extd.otf";
import shapiroHeavy from "../../app/fonts/Shapiro-85-Super-Heavy.otf";

/** Family names, for measuring text. Styles use the --font-* variables, as in the app. */
export const FAMILY = {
  display: "Shapiro Super Extd",
  tall: "Shapiro Super",
  wide: "Shapiro Super Wide",
  heavy: "Shapiro Super Heavy",
};

const archivo = loadArchivo("normal", { weights: ["400", "500", "700", "800"], subsets: ["latin"] });
const plexMono = loadPlexMono("normal", { weights: ["400", "500", "700"], subsets: ["latin"] });
const fontsReady = Promise.all([
  loadFont({ family: FAMILY.tall, url: shapiro, weight: "900" }),
  loadFont({ family: FAMILY.wide, url: shapiroWide, weight: "900" }),
  loadFont({ family: FAMILY.display, url: shapiroExtd, weight: "900" }),
  loadFont({ family: FAMILY.heavy, url: shapiroHeavy, weight: "800" }),
  archivo.waitUntilDone(),
  plexMono.waitUntilDone(),
]);

/** Holds the frame until the fonts are in, and re-renders then: text can only be measured once they are. */
export function useFontsReady() {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("Loading fonts"));
  useEffect(() => {
    fontsReady.then(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) continueRender(handle);
  }, [ready, handle]);
  return ready;
}

/** The app's FitText: the size at which the widest of `texts` is exactly `width` wide, capped at `max`. */
export function useFit(texts: string[], family: string, width: number, max: number, letterSpacing = "-0.02em") {
  const ready = useFontsReady();
  if (!ready) return max;
  const sizes = texts.map((text) => fitText({ text, withinWidth: width, fontFamily: family, letterSpacing, textTransform: "uppercase" }).fontSize);
  return Math.min(max, ...sizes);
}
