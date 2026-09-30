import { Archivo, IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";

// Shapiro does all display work (licensed for web). Archivo and IBM Plex Mono
// are the design system's stand-ins for body and mono.
const shapiro = localFont({ src: "./fonts/Shapiro-95-Super.otf", weight: "900", variable: "--ff-shapiro", display: "swap" });
const shapiroWide = localFont({ src: "./fonts/Shapiro-95-Super-Wide.otf", weight: "900", variable: "--ff-shapiro-wide", display: "swap" });
const shapiroExtd = localFont({ src: "./fonts/Shapiro-95-Super-Extd.otf", weight: "900", variable: "--ff-shapiro-extd", display: "swap" });
const shapiroHeavy = localFont({ src: "./fonts/Shapiro-85-Super-Heavy.otf", weight: "800", variable: "--ff-shapiro-heavy", display: "swap" });
const shapiroAir = localFont({ src: "./fonts/Shapiro-97-Air-Extd.otf", weight: "900", variable: "--ff-shapiro-air", display: "swap", preload: false });
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--ff-archivo", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--ff-plex-mono", display: "swap" });

export const fontVariables = [shapiro, shapiroWide, shapiroExtd, shapiroHeavy, shapiroAir, archivo, plexMono]
  .map((f) => f.variable)
  .join(" ");
