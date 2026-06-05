#!/usr/bin/env python3
"""Convert an authored idle frame set (transparent PNGs) into clean rect-per-block
256x256 SVGs sharing ONE grid and ONE palette.

The authored frames are already feet-registered but painterly (anti-aliased, ~27k
colors) and not snapped to a pixel grid. Refinement = resample every frame on the
SAME fixed GxG grid over the full canvas (so cells line up frame-to-frame and the
sprite never jitters), quantize all frames against a SINGLE shared palette (so
colors don't flicker between frames), then emit one <rect> per opaque cell with
horizontal + vertical run merging to keep the rect count down. Transparent cells
are dropped. Output is CSP-safe static SVG (presentation attrs only, crispEdges).

Usage: idle-to-svg.py INDIR OUTDIR [--grid 64] [--colors 24] [--frames 8]
Writes frame_1.svg..frame_N.svg + idle-anim.svg (self-animating, steps(N)).
"""
import argparse
import gzip
import os

import numpy as np
from PIL import Image

CANVAS = 256
ALPHA_CELL = 0.5   # cell counts as opaque when mean alpha exceeds this


def sample_grid(rgb, alpha, g):
    """median RGB + mean alpha per cell on a fixed g x g grid over the full canvas."""
    step = CANVAS / g
    col = np.zeros((g, g, 3), np.uint8)
    cov = np.zeros((g, g), np.float32)
    for r in range(g):
        y0, y1 = int(round(r * step)), int(round((r + 1) * step))
        iy = max(1, (y1 - y0) // 4)
        for c in range(g):
            x0, x1 = int(round(c * step)), int(round((c + 1) * step))
            ix = max(1, (x1 - x0) // 4)
            a = alpha[y0 + iy:y1 - iy, x0 + ix:x1 - ix]
            p = rgb[y0 + iy:y1 - iy, x0 + ix:x1 - ix].reshape(-1, 3)
            if p.size == 0:
                a = alpha[y0:y1, x0:x1]; p = rgb[y0:y1, x0:x1].reshape(-1, 3)
            cov[r, c] = a.mean() if a.size else 0.0
            col[r, c] = np.median(p, axis=0).astype(np.uint8) if p.size else 0
    return col, cov


def kmeans(pts, k, iters=14):
    uniq = np.unique(pts, axis=0)
    if len(uniq) <= k:
        return uniq
    centers = uniq[np.linspace(0, len(uniq) - 1, k).astype(int)].astype(np.float32)
    for _ in range(iters):
        d = np.linalg.norm(pts[:, None] - centers[None], axis=2)
        lbl = d.argmin(1)
        new = np.array([pts[lbl == i].mean(0) if np.any(lbl == i) else centers[i]
                        for i in range(k)])
        if np.allclose(new, centers, atol=0.5):
            break
        centers = new
    return centers


def map_palette(col, cov, centers):
    pts = col.reshape(-1, 3).astype(np.float32)
    lbl = np.linalg.norm(pts[:, None] - centers[None], axis=2).argmin(1)
    out = centers[lbl].astype(np.uint8).reshape(col.shape)
    return out


def greedy_rects(colidx, opaque):
    """Maximal-ish rectangles: grow each run right (same color) then down."""
    g = colidx.shape[0]
    used = np.zeros((g, g), bool)
    rects = []
    for r in range(g):
        c = 0
        while c < g:
            if used[r, c] or not opaque[r, c]:
                c += 1
                continue
            v = colidx[r, c]
            w = 1
            while c + w < g and opaque[r, c + w] and not used[r, c + w] and colidx[r, c + w] == v:
                w += 1
            h = 1
            while r + h < g and all(opaque[r + h, c:c + w]) and not used[r + h, c:c + w].any() \
                    and np.all(colidx[r + h, c:c + w] == v):
                h += 1
            used[r:r + h, c:c + w] = True
            rects.append((c, r, w, h, int(v)))
            c += w
    return rects


def svg_frame(rects, palette, g, anim_group=False):
    px = CANVAS // g if CANVAS % g == 0 else None
    scale = CANVAS / g
    body = []
    for x, y, w, h, v in rects:
        hexc = "#%02x%02x%02x" % tuple(palette[v])
        X = x * scale; Y = y * scale; W = w * scale; H = h * scale
        fmt = lambda n: str(int(n)) if n == int(n) else f"{n:.2f}"
        body.append(f'<rect x="{fmt(X)}" y="{fmt(Y)}" width="{fmt(W)}" height="{fmt(H)}" fill="{hexc}"/>')
    return "".join(body)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("indir"); ap.add_argument("outdir")
    ap.add_argument("--grid", type=int, default=64)
    ap.add_argument("--colors", type=int, default=24)
    ap.add_argument("--frames", type=int, default=8)
    ap.add_argument("--fps", type=float, default=8.0)
    a = ap.parse_args()
    os.makedirs(a.outdir, exist_ok=True)
    g = a.grid

    cols, covs = [], []
    for i in range(1, a.frames + 1):
        im = np.asarray(Image.open(f"{a.indir}/{i}.png").convert("RGBA"))
        rgb = im[..., :3]; al = im[..., 3] / 255.0
        col, cov = sample_grid(rgb, al, g)
        cols.append(col); covs.append(cov)

    # Shared palette from all opaque cells across every frame.
    pool = np.concatenate([c[cv > ALPHA_CELL] for c, cv in zip(cols, covs)]).astype(np.float32)
    palette = kmeans(pool, a.colors).astype(np.uint8)

    total_rects = 0; total_raw = 0; frame_bodies = []
    for i, (col, cov) in enumerate(zip(cols, covs), 1):
        opaque = cov > ALPHA_CELL
        idx = np.linalg.norm(col.reshape(-1, 3)[:, None].astype(np.float32) - palette[None], axis=2)\
            .argmin(1).reshape(g, g)
        rects = greedy_rects(idx, opaque)
        total_rects += len(rects)
        body = svg_frame(rects, palette, g)
        frame_bodies.append(body)
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{CANVAS}" height="{CANVAS}" '
               f'viewBox="0 0 {CANVAS} {CANVAS}" shape-rendering="crispEdges">{body}</svg>')
        path = f"{a.outdir}/frame_{i}.svg"
        open(path, "w").write(svg)
        total_raw += len(svg)

    # Combined self-animating SVG: 8 frames laid out horizontally, stepped.
    dur = a.frames / a.fps
    groups = "".join(
        f'<g transform="translate({i*CANVAS},0)">{b}</g>' for i, b in enumerate(frame_bodies))
    W = a.frames * CANVAS
    anim = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{CANVAS}" height="{CANVAS}" '
            f'viewBox="0 0 {CANVAS} {CANVAS}" shape-rendering="crispEdges">'
            f'<style>.s{{animation:idle {dur}s steps({a.frames}) infinite}}'
            f'@keyframes idle{{to{{transform:translateX(-{W}px)}}}}'
            f'@media(prefers-reduced-motion:reduce){{.s{{animation:none}}}}</style>'
            f'<g class="s">{groups}</g></svg>')
    open(f"{a.outdir}/idle-anim.svg", "w").write(anim)

    gz = len(gzip.compress(anim.encode()))
    print(f"grid={g} colors={len(palette)} frames={a.frames}")
    print(f"per-frame avg rects={total_rects//a.frames}  total rects={total_rects}")
    print(f"idle-anim.svg raw={len(anim)}B gzip={gz}B")
    print(f"frames raw total={total_raw}B")


if __name__ == "__main__":
    main()
