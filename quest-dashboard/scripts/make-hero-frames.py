#!/usr/bin/env python3
"""Slice a matted 3x3 idle sheet into a registered horizontal animation strip.

Insets each cell past the grid divider lines (which survive matting because they
are neither background color), alpha-trims to the character, scales to a fixed
cell height, and bottom-centers every frame on a uniform square cell so the
sprite does not jitter. Output: a (N*CELL x CELL) RGBA strip for a steps(N) anim.

Usage: make-hero-frames.py matte.png out_strip.png [cols rows cell inset]
"""
import sys
import numpy as np
from PIL import Image

matte_path, out = sys.argv[1:3]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 3
rows = int(sys.argv[4]) if len(sys.argv) > 4 else 3
CELL = int(sys.argv[5]) if len(sys.argv) > 5 else 256
INSET = int(sys.argv[6]) if len(sys.argv) > 6 else 16  # px, kills divider lines
PAD = 6           # transparent gap above feet / around char
TARGET_H = CELL - 2 * PAD

img = Image.open(matte_path).convert("RGBA")
W, H = img.size
cw, ch = W / cols, H / rows

frames = []
for r in range(rows):
    for c in range(cols):
        x0 = int(round(c * cw)) + INSET
        x1 = int(round((c + 1) * cw)) - INSET
        y0 = int(round(r * ch)) + INSET
        y1 = int(round((r + 1) * ch)) - INSET
        cell = img.crop((x0, y0, x1, y1))
        a = np.asarray(cell)[:, :, 3]
        ys, xs = np.where(a > 40)              # solid-enough char pixels
        if len(xs) == 0:
            continue
        bbox = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
        frames.append(cell.crop(bbox))

strip = Image.new("RGBA", (CELL * len(frames), CELL), (0, 0, 0, 0))
for i, f in enumerate(frames):
    scale = TARGET_H / f.height
    fw = max(1, round(f.width * scale))
    f = f.resize((fw, TARGET_H), Image.LANCZOS)
    x = i * CELL + (CELL - fw) // 2          # horizontally centered
    y = CELL - PAD - TARGET_H                # bottom-aligned (feet baseline)
    strip.alpha_composite(f, (x, y))

strip.save(out)
print(f"frames={len(frames)} cell={CELL} strip={strip.size}")
