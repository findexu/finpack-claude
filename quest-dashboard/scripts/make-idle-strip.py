#!/usr/bin/env python3
"""Slice a transparent N-col x M-row idle grid into a boot-registered strip.

The source carries true per-pixel alpha, but its frame grid is NOT pixel-perfect
(pitch is non-integer, e.g. 1254 / 4 = 313.5), so equal-cell slicing leaves a
systematic grid-pitch drift: the boot baseline steps up per ROW and the boot
center slides left per COLUMN -- the character appears to walk instead of breathe
in place.

Naive anchors fail: the alpha bbox and a bottom-slice-of-everything centroid get
pulled by the billowing CAPE. The boots, however, are a color-distinct mid-brown
at the very bottom, below the book/belt. We segment that brown in the bottom slice
of each frame and take its (centroid-x, lowest-y) as a clean per-frame anchor, then
rigidly TRANSLATE every frame so all boots land on one common anchor. Boots/staff
base stay locked; robe/hair/orb sway (the intended motion) survives because only a
translation is applied -- no scaling, no full-figure re-centering. The output cell
is auto-sized from the registered union so nothing clips. Frame order is row-major.

Usage: make-idle-strip.py grid.png out_strip.png [cols rows base]
Prints: frames=<n> cell=<W>x<H> strip=<W>x<H>  (cell dims feed the builder).
"""
import sys
import numpy as np
from PIL import Image

grid_path, out = sys.argv[1:3]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 4
rows = int(sys.argv[4]) if len(sys.argv) > 4 else 4
BASE = int(sys.argv[5]) if len(sys.argv) > 5 else 256  # per-cell working square
ALPHA = 40
PAD = 8
BOOT_FRAC = 0.15    # bottom fraction of the figure searched for boot-brown


def boot_anchor(cell):
    """(centroid_x, sole_y) of the mid-brown boots in the bottom BOOT_FRAC slice.

    Falls back to the alpha-bbox bottom-center if the brown mask is too sparse."""
    r, g, b, a = (cell[:, :, i].astype(int) for i in range(4))
    ys, xs = np.where(a > ALPHA)
    y0, y1 = int(ys.min()), int(ys.max())
    brown = (a > 150) & (r > g) & (g >= b) & (r > 70) & (r < 175) & (b < 95) & (r - b > 20) & (g > 40)
    brown[:int(y1 - BOOT_FRAC * (y1 - y0)), :] = False
    bys, bxs = np.where(brown)
    if len(bxs) < 200:                       # brown boots not found -> safe fallback
        return (int(xs.min()) + int(xs.max())) / 2, y1
    return float(bxs.mean()), int(bys.max())


img = Image.open(grid_path).convert("RGBA").resize((cols * BASE, rows * BASE), Image.LANCZOS)
arr = np.asarray(img)

# Slice + measure each frame's alpha bbox and boot anchor.
n = cols * rows
cells, bboxes, anchors = [], [], []
for fi in range(n):
    r, c = divmod(fi, cols)
    cell = arr[r * BASE:(r + 1) * BASE, c * BASE:(c + 1) * BASE]
    a = cell[:, :, 3]
    ys, xs = np.where(a > ALPHA)
    cells.append(cell)
    bboxes.append((int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())))
    anchors.append(boot_anchor(cell))

# Common anchor: mean boot-x; lowest boot baseline (downward shifts only -> no clip).
tx = sum(a[0] for a in anchors) / n
baseline = max(a[1] for a in anchors)
shifts = [(int(round(tx - acx)), int(round(baseline - asy))) for acx, asy in anchors]

# Auto-size the output cell from the registered union (so the staff never clips).
shifted = [(x0 + dx, y0 + dy, x1 + dx, y1 + dy)
           for (x0, y0, x1, y1), (dx, dy) in zip(bboxes, shifts)]
UX0, UY0 = min(b[0] for b in shifted), min(b[1] for b in shifted)
UX1, UY1 = max(b[2] for b in shifted), max(b[3] for b in shifted)
CW, CH = (UX1 - UX0) + 2 * PAD, (UY1 - UY0) + 2 * PAD
off_x, off_y = PAD - UX0, PAD - UY0

strip = Image.new("RGBA", (n * CW, CH), (0, 0, 0, 0))
for i, (cell, (dx, dy)) in enumerate(zip(cells, shifts)):
    out_cell = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    out_cell.alpha_composite(Image.fromarray(cell), (dx + off_x, dy + off_y))
    strip.alpha_composite(out_cell, (i * CW, 0))

strip.save(out)
print(f"frames={n} cell={CW}x{CH} strip={strip.size[0]}x{strip.size[1]}")
