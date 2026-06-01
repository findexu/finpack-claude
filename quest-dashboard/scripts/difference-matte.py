#!/usr/bin/env python3
"""Difference matting: recover true RGBA (incl. translucency) from two shots of
the SAME sprite on two known solid backgrounds.

    O = a*F + (1-a)*B   for each background B
    two bgs -> (1-a) = mean_c (O1 - O2)/(B1 - B2);  F = (O1 - (1-a)*B1)/a

Usage: difference-matte.py img_b1 b1_hex img_b2 b2_hex out.png
  hex like 13be1a (green) / ca2dbc (magenta). Images must be pixel-aligned.
"""
import sys
import numpy as np
from PIL import Image


def hex_rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i : i + 2], 16) for i in (0, 2, 4)], dtype=np.float64)


def main():
    p1, h1, p2, h2, out = sys.argv[1:6]
    b1, b2 = hex_rgb(h1), hex_rgb(h2)
    o1 = np.asarray(Image.open(p1).convert("RGB"), dtype=np.float64)
    o2 = np.asarray(Image.open(p2).convert("RGB"), dtype=np.float64)
    if o1.shape != o2.shape:
        sys.exit(f"shape mismatch {o1.shape} vs {o2.shape}")

    db = b1 - b2  # per-channel bg delta (all large -> well conditioned)
    inv = (o1 - o2) / db  # (1-a) estimate per channel
    one_minus_a = np.clip(inv.mean(axis=2), 0.0, 1.0)
    a = 1.0 - one_minus_a

    # Unpremultiply to recover foreground color; guard near-transparent pixels.
    a3 = a[..., None]
    safe = np.maximum(a3, 1e-3)
    f = (o1 - one_minus_a[..., None] * b1) / safe
    f = np.where(a3 < 4e-3, 0.0, f)
    f = np.clip(f, 0, 255)

    rgba = np.dstack([f, a * 255.0]).round().astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(out)
    print(f"wrote {out}  alpha: min {a.min():.2f} max {a.max():.2f} "
          f"mean {a.mean():.2f}  translucent px (0.05<a<0.95): "
          f"{int(((a > 0.05) & (a < 0.95)).sum())}")


if __name__ == "__main__":
    main()
