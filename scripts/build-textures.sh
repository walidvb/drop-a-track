#!/usr/bin/env bash
# Moiré scans → colourable masks. Each assets/textures/*.png (dark lines on
# white) becomes public/textures/ripples-<n>.webp: black, with the lines as
# the opaque part (alpha = inverted grey). CSS paints any colour through it
# with `mask-image` — see the .tex rules in styles/tokens/effects.css.
# Needs ImageMagick 7 (`brew install imagemagick`).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/textures
for src in assets/textures/*.png assets/textures/*.jpg; do
  [ -e "$src" ] || continue
  # "raindrop-ripples-a3-landscape-10 1.png" → ripples-10; no suffix → ripples-a
  base="$(basename "${src%.*}")"
  base="${base% [0-9]}"
  suffix="${base#raindrop-ripples-a3-landscape}"
  suffix="${suffix#-}"
  name="ripples-${suffix:-a}"
  magick "$src" -colorspace Gray -negate -alpha copy -channel RGB -evaluate set 0 +channel \
    -quality 82 "public/textures/$name.webp"
  echo "$src → public/textures/$name.webp"
done
