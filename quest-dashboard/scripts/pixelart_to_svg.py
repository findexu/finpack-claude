#!/usr/bin/env python3
"""Analyze a blurry pixel-art raster, detect its native grid, and re-emit it as
solid-color SVG <rect> tiles.

Pipeline:
  1. Load image, drop alpha onto a detected flat background.
  2. Find the content bounding box (non-background region).
  3. Detect cell pitch (grid size) via FFT on the edge-energy profile.
  4. Sample each cell's dominant/median color.
  5. Quantize to a small palette and emit one <rect> per cell, merging
     horizontal runs of identical color into a single rect.

Usage:
  python3 pixelart_to_svg.py INPUT.png OUTPUT.svg [--grid N] [--colors K] [--px N]
"""

import argparse
import sys
from collections import Counter

import numpy as np
from PIL import Image


def load_rgb(path):
    """Return (rgb uint8, alpha float 0..1). Transparency kept as a mask so
    transparent cells can be dropped instead of color-matched."""
    img = Image.open(path).convert("RGBA")
    arr = np.asarray(img).astype(np.float32)
    rgb = arr[..., :3].astype(np.uint8)
    alpha = arr[..., 3] / 255.0
    return rgb, alpha


def guess_background(rgb):
    """Most common color among the four corner patches."""
    h, w = rgb.shape[:2]
    s = max(4, min(h, w) // 20)
    patches = np.concatenate([
        rgb[:s, :s].reshape(-1, 3),
        rgb[:s, -s:].reshape(-1, 3),
        rgb[-s:, :s].reshape(-1, 3),
        rgb[-s:, -s:].reshape(-1, 3),
    ])
    counts = Counter(map(tuple, patches))
    return np.array(counts.most_common(1)[0][0], np.uint8)


def content_mask(rgb, alpha, bg, tol=28):
    """Boolean foreground mask. Uses alpha when the image has transparency,
    else falls back to a color-distance test against the background guess."""
    if alpha.min() < 0.5:
        return alpha > 0.5
    dist = np.linalg.norm(rgb.astype(np.int32) - bg.astype(np.int32), axis=-1)
    return dist > tol


def content_bbox(mask):
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return 0, 0, mask.shape[1], mask.shape[0]
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def detect_pitch(gray):
    """Estimate pixel-art cell pitch from edge-energy periodicity via FFT.

    Returns the most likely pitch in source pixels. Searches a sane range and
    picks the frequency with peak spectral power in both axes combined.
    """
    gx = np.abs(np.diff(gray, axis=1)).sum(axis=0)
    gy = np.abs(np.diff(gray, axis=0)).sum(axis=1)

    def best_period(sig):
        sig = sig - sig.mean()
        n = len(sig)
        spec = np.abs(np.fft.rfft(sig * np.hanning(n))) ** 2
        freqs = np.fft.rfftfreq(n)
        scores = {}
        # Candidate cell counts spanning the content axis.
        for k in range(8, 129):
            f = k / n
            idx = int(round(f * n))
            if 1 <= idx < len(spec):
                scores[k] = spec[idx]
        if not scores:
            return None
        best_k = max(scores, key=scores.get)
        return n / best_k

    px = best_period(gx)
    py = best_period(gy)
    cands = [p for p in (px, py) if p]
    return float(np.mean(cands)) if cands else 16.0


def sample_cells(rgb, alpha, x0, y0, x1, y1, cols, rows):
    """Median color + mean alpha of each grid cell."""
    cw = (x1 - x0) / cols
    ch = (y1 - y0) / rows
    grid = np.empty((rows, cols, 3), np.uint8)
    acov = np.zeros((rows, cols), np.float32)
    for r in range(rows):
        cy0 = int(round(y0 + r * ch))
        cy1 = int(round(y0 + (r + 1) * ch))
        for c in range(cols):
            cx0 = int(round(x0 + c * cw))
            cx1 = int(round(x0 + (c + 1) * cw))
            # Inset to avoid bleeding from neighboring cells (blur halos).
            iy0 = cy0 + max(1, (cy1 - cy0) // 4)
            iy1 = cy1 - max(1, (cy1 - cy0) // 4)
            ix0 = cx0 + max(1, (cx1 - cx0) // 4)
            ix1 = cx1 - max(1, (cx1 - cx0) // 4)
            ya, yb = max(cy0, iy0), max(cy1, iy1 + 1)
            xa, xb = max(cx0, ix0), max(cx1, ix1 + 1)
            patch = rgb[ya:yb, xa:xb].reshape(-1, 3)
            apatch = alpha[ya:yb, xa:xb]
            if patch.size == 0:
                patch = rgb[cy0:cy1, cx0:cx1].reshape(-1, 3)
                apatch = alpha[cy0:cy1, cx0:cx1]
            grid[r, c] = np.median(patch, axis=0).astype(np.uint8)
            acov[r, c] = apatch.mean() if apatch.size else 0.0
    return grid, acov


def quantize(grid, k):
    """K-means color quantization (numpy-only, few iterations)."""
    pts = grid.reshape(-1, 3).astype(np.float32)
    uniq = np.unique(pts, axis=0)
    if len(uniq) <= k:
        return grid
    # Init centers from spread-out unique colors.
    rng = np.linspace(0, len(uniq) - 1, k).astype(int)
    centers = uniq[rng].copy()
    for _ in range(12):
        d = np.linalg.norm(pts[:, None, :] - centers[None, :, :], axis=2)
        lbl = d.argmin(axis=1)
        new = np.array([pts[lbl == i].mean(axis=0) if np.any(lbl == i)
                        else centers[i] for i in range(k)])
        if np.allclose(new, centers, atol=0.5):
            centers = new
            break
        centers = new
    d = np.linalg.norm(pts[:, None, :] - centers[None, :, :], axis=2)
    lbl = d.argmin(axis=1)
    out = centers[lbl].reshape(grid.shape).astype(np.uint8)
    return out


def to_svg(grid, acov, bg, px, drop_bg=True, bg_tol=24, alpha_thresh=0.5):
    rows, cols = grid.shape[:2]
    w, h = cols * px, rows * px
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        f'viewBox="0 0 {w} {h}" shape-rendering="crispEdges">'
    ]

    def is_empty(r, c):
        if acov[r, c] < alpha_thresh:
            return True
        col = grid[r, c].astype(int)
        return drop_bg and np.linalg.norm(col - bg.astype(int)) <= bg_tol

    for r in range(rows):
        c = 0
        while c < cols:
            if is_empty(r, c):
                c += 1
                continue
            col = tuple(int(v) for v in grid[r, c])
            run = c + 1
            while (run < cols and not is_empty(r, run)
                   and tuple(int(v) for v in grid[r, run]) == col):
                run += 1
            hexc = "#%02x%02x%02x" % col
            parts.append(
                f'<rect x="{c*px}" y="{r*px}" width="{(run-c)*px}" '
                f'height="{px}" fill="{hexc}"/>'
            )
            c = run
    parts.append("</svg>")
    return "\n".join(parts)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("output")
    ap.add_argument("--grid", type=int, default=0, help="force NxN cell count")
    ap.add_argument("--pitch", type=float, default=0.0,
                    help="source px per cell (overrides --grid; non-square ok)")
    ap.add_argument("--colors", type=int, default=16, help="palette size (0=off)")
    ap.add_argument("--px", type=int, default=16, help="output px per cell")
    ap.add_argument("--keep-bg", action="store_true", help="emit background rects")
    args = ap.parse_args()

    rgb, alpha = load_rgb(args.input)
    bg = guess_background(rgb)
    mask = content_mask(rgb, alpha, bg)
    x0, y0, x1, y1 = content_bbox(mask)
    # With real transparency the alpha mask defines foreground; color-based bg
    # drop would wrongly delete dark outline pixels (bg often reads as black).
    has_alpha = alpha.min() < 0.5

    if args.pitch > 0:
        cols = max(1, int(round((x1 - x0) / args.pitch)))
        rows = max(1, int(round((y1 - y0) / args.pitch)))
    elif args.grid > 0:
        cols = rows = args.grid
    else:
        pitch = detect_pitch(rgb[y0:y1, x0:x1].mean(axis=2))
        cols = max(1, int(round((x1 - x0) / pitch)))
        rows = max(1, int(round((y1 - y0) / pitch)))

    print(f"bbox=({x0},{y0})-({x1},{y1}) size={x1-x0}x{y1-y0} "
          f"grid={cols}x{rows} bg=#%02x%02x%02x" % tuple(bg), file=sys.stderr)

    grid, acov = sample_cells(rgb, alpha, x0, y0, x1, y1, cols, rows)
    if args.colors > 0:
        grid = quantize(grid, args.colors)

    drop_bg = (not args.keep_bg) and not has_alpha
    svg = to_svg(grid, acov, bg, args.px, drop_bg=drop_bg)
    with open(args.output, "w") as f:
        f.write(svg)
    print(f"wrote {args.output} ({cols}x{rows} cells, {args.px}px each)",
          file=sys.stderr)


if __name__ == "__main__":
    main()
