#!/usr/bin/env bash
# Dev-time asset pipeline for the character-sheet hero stage.
# Output PNG/JPG are COMMITTED; this script is never run at extension runtime.
#
# Character: recovered by DIFFERENCE MATTING two pixel-aligned shots of the same
#   sprite sheet on two known solid backgrounds (green + magenta). This yields
#   true per-pixel alpha including the translucent staff orb — a flat chroma key
#   cannot. See difference-matte.py. Frame 1 (top-left of the 3x3 idle sheet) is
#   extracted, trimmed, downscaled, and written as an 8-bit palette PNG (small,
#   alpha preserved) -> hero.png.
# Background (BG_MC.jpg): downscale + recompress -> hero-bg.jpg.
#
# Requires ImageMagick (`magick`) + python3 with Pillow/numpy.
set -euo pipefail

DL="${1:-$HOME/Downloads}"
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$(cd "$HERE/.." && pwd)/assets/sprites"

# Two-background sprite sheets (same sprite, bg color differs) + their bg hexes.
SHEET_GREEN="$DL/RgjG2.jpg";   GREEN_HEX="13be1a"
SHEET_MAGENTA="$DL/CdEA5.jpg"; MAGENTA_HEX="ca2dbc"
BG_SRC="$DL/Quest-System-Dashboard/BG_MC.jpg"

mkdir -p "$OUT"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

echo "Difference matte -> $TMP/matte.png"
python3 "$HERE/difference-matte.py" \
  "$SHEET_GREEN" "$GREEN_HEX" "$SHEET_MAGENTA" "$MAGENTA_HEX" "$TMP/matte.png"

echo "Idle animation strip -> $OUT/hero-idle.png"
python3 "$HERE/make-hero-frames.py" "$TMP/matte.png" "$TMP/idle.png"
magick "$TMP/idle.png" -colors 128 -strip PNG8:"$OUT/hero-idle.png"

echo "Static character (frame 1 fallback) -> $OUT/hero.png"
# Inset 16px past the grid divider lines (they survive matting), then trim to bbox.
magick "$TMP/matte.png" -crop 309x309+16+16 +repage -trim +repage \
  -resize x256 -colors 255 -strip PNG8:"$OUT/hero.png"

echo "Background -> $OUT/hero-bg.jpg"
magick "$BG_SRC" -resize 640x -strip -quality 82 "$OUT/hero-bg.jpg"

echo "--- results ---"
for f in hero-idle.png hero.png hero-bg.jpg; do
  printf "%-14s %s  %s bytes\n" "$f" \
    "$(magick identify -format '%wx%h' "$OUT/$f")" \
    "$(wc -c < "$OUT/$f" | tr -d ' ')"
done
echo "char corner alpha (want 0): $(magick "$OUT/hero.png" -format '%[pixel:p{0,0}]' info:)"
