#!/usr/bin/env python3
"""Bake an idle COMPOSITION (patterns played in sequence) into one hero-idle strip.

The webview is CSP-locked: a pure-CSS steps() animation walks a single horizontal
strip, so a multi-pattern composition must be flattened into one strip with frames
duplicated per the sequence. This emits that strip plus the (steps, px-width, seconds)
the CSS needs.

Usage: build-idle-composition.py <frames_dir> [fps]
  frames_dir : holds 1.png..16.png, each a 256x256 RGBA idle frame
  fps        : playback rate (default 4)

Prints: frames=<n> strip=<W>x256 fps=<f> seconds=<s>  -> feed these into buildCharacterSheet.ts
"""
import os
import sys
from PIL import Image

CELL = 256

# 10 named idle patterns: each a 1-based frame sequence over frames 1..16.
PATTERNS = {
    1: [1, 2, 3, 4, 5, 7, 9, 10, 12, 13, 14, 15, 16],            # Calm Breathing
    2: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],  # Full Smooth
    3: [1, 2, 3, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16],            # Staff Glow Pulse
    4: [1, 2, 3, 4, 5, 7, 9, 10, 12, 13, 14, 15, 16],            # Robe Wind Sway
    5: [1, 2, 3, 4, 7, 9, 10, 13, 14, 15, 16],                   # Hair Bounce
    6: [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16],         # Magic Peak
    7: [1, 2, 3, 7, 10, 14, 15, 16],                             # Subtle Short
    8: [1, 2, 3, 4, 5, 7, 9, 10, 12, 13, 14, 15, 14, 15, 16],    # Slow Settling
    9: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],  # Magical Breathing
    10: [1, 1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 16], # Rest-to-Magic-to-Rest
}

# "Lively" composition: calm base with magical accents woven in.
COMPOSITION = [1, 1, 3, 1, 5, 1, 6, 10]

frames_dir = sys.argv[1]
fps = float(sys.argv[2]) if len(sys.argv) > 2 else 4.0
out = os.path.join(os.path.dirname(__file__), "..", "assets", "sprites", "hero-idle.png")

frames = {i: Image.open(os.path.join(frames_dir, f"{i}.png")).convert("RGBA") for i in range(1, 17)}
for i, im in frames.items():
    if im.size != (CELL, CELL):
        sys.exit(f"frame {i} is {im.size}, expected {CELL}x{CELL}")

seq = [fi for pat in COMPOSITION for fi in PATTERNS[pat]]
strip = Image.new("RGBA", (len(seq) * CELL, CELL), (0, 0, 0, 0))
for col, fi in enumerate(seq):
    strip.alpha_composite(frames[fi], (col * CELL, 0))
strip.save(os.path.abspath(out), optimize=True)

print(f"frames={len(seq)} strip={strip.size[0]}x{strip.size[1]} fps={fps:g} seconds={len(seq)/fps:g}")
print(f"-> CSS: animation: heroIdle {len(seq)/fps:g}s steps({len(seq)}); translateX(-{len(seq)*CELL}px)")
print(f"-> SVG: <image ... width=\"{len(seq)*CELL}\" height=\"{CELL}\" />")
