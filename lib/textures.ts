/** The moiré masks in public/textures (built by scripts/build-textures.sh; textures.test.ts keeps this list in step). */
export const TEXTURES = ["a", "b", "3", "4", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18"].map(
  (n) => `/textures/ripples-${n}.webp`,
);

export const randomTexture = () => TEXTURES[Math.floor(Math.random() * TEXTURES.length)];
