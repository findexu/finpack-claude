#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
from typing import Callable

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "sprites"

SCALE = 4
BADGE_CELL = 32
PHASE_CELL = 32
EMPTY_CELL = 64

TRANSPARENT = (0, 0, 0, 0)
GOLD = (245, 196, 81, 255)
GOLD_DARK = (130, 82, 24, 255)
GOLD_HI = (255, 228, 139, 255)
TEAL = (79, 217, 194, 255)
TEAL_DARK = (18, 94, 96, 255)
BLUE = (111, 192, 255, 255)
PURPLE = (176, 125, 255, 255)
IRON = (126, 126, 136, 255)
IRON_DARK = (54, 56, 66, 255)
INK = (16, 18, 29, 255)
PAPER = (214, 197, 160, 255)
GREEN = (95, 214, 163, 255)
ORANGE = (234, 126, 68, 255)


def px(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], fill: tuple[int, int, int, int]) -> None:
    draw.rectangle(tuple(v * SCALE for v in xy), fill=fill)


def line(
    draw: ImageDraw.ImageDraw,
    xy: list[tuple[int, int]],
    fill: tuple[int, int, int, int],
    width: int = 1,
) -> None:
    draw.line([(x * SCALE, y * SCALE) for x, y in xy], fill=fill, width=width * SCALE)


def poly(draw: ImageDraw.ImageDraw, xy: list[tuple[int, int]], fill: tuple[int, int, int, int]) -> None:
    draw.polygon([(x * SCALE, y * SCALE) for x, y in xy], fill=fill)


def rect(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], outline: tuple[int, int, int, int], width: int = 1) -> None:
    draw.rectangle(tuple(v * SCALE for v in xy), outline=outline, width=width * SCALE)


def ellipse(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], fill: tuple[int, int, int, int]) -> None:
    draw.ellipse(tuple(v * SCALE for v in xy), fill=fill)


def medallion(draw: ImageDraw.ImageDraw, state: str) -> None:
    if state == "gold":
        a, b, c = GOLD, GOLD_DARK, GOLD_HI
    elif state == "teal":
        a, b, c = TEAL, TEAL_DARK, (162, 255, 238, 255)
    else:
        a, b, c = IRON, IRON_DARK, (185, 185, 194, 255)
    poly(draw, [(16, 2), (23, 5), (28, 12), (28, 20), (23, 27), (16, 30), (9, 27), (4, 20), (4, 12), (9, 5)], b)
    poly(draw, [(16, 4), (22, 7), (26, 13), (26, 19), (22, 25), (16, 28), (10, 25), (6, 19), (6, 13), (10, 7)], a)
    poly(draw, [(16, 7), (20, 9), (23, 14), (23, 18), (20, 23), (16, 25), (12, 23), (9, 18), (9, 14), (12, 9)], INK)
    rect(draw, (7, 7, 25, 25), b, 1)
    line(draw, [(10, 7), (16, 4), (22, 7)], c, 1)


def sword(draw: ImageDraw.ImageDraw) -> None:
    line(draw, [(21, 7), (11, 17)], GOLD_HI, 2)
    line(draw, [(22, 6), (12, 16)], GOLD, 1)
    line(draw, [(10, 18), (7, 21)], GOLD_DARK, 2)
    line(draw, [(8, 15), (14, 21)], IRON, 2)


def scroll(draw: ImageDraw.ImageDraw) -> None:
    px(draw, (10, 9, 22, 22), PAPER)
    rect(draw, (10, 9, 22, 22), GOLD_DARK, 1)
    line(draw, [(13, 13), (19, 13)], INK, 1)
    line(draw, [(13, 17), (18, 17)], INK, 1)
    ellipse(draw, (8, 8, 13, 13), GOLD)
    ellipse(draw, (19, 18, 24, 23), GOLD)


def crossed(draw: ImageDraw.ImageDraw) -> None:
    line(draw, [(9, 8), (23, 22)], IRON, 2)
    line(draw, [(23, 8), (9, 22)], IRON, 2)
    line(draw, [(8, 24), (12, 20)], GOLD_DARK, 2)
    line(draw, [(24, 24), (20, 20)], GOLD_DARK, 2)


def trophy(draw: ImageDraw.ImageDraw) -> None:
    px(draw, (12, 9, 20, 18), GOLD)
    rect(draw, (11, 8, 21, 18), GOLD_DARK, 1)
    line(draw, [(10, 10), (7, 10), (8, 15), (12, 15)], GOLD, 1)
    line(draw, [(22, 10), (25, 10), (24, 15), (20, 15)], GOLD, 1)
    px(draw, (15, 18, 17, 23), GOLD_DARK)
    px(draw, (11, 23, 21, 25), GOLD)


def eye(draw: ImageDraw.ImageDraw) -> None:
    poly(draw, [(7, 16), (12, 11), (20, 11), (25, 16), (20, 21), (12, 21)], BLUE)
    ellipse(draw, (12, 12, 20, 20), INK)
    ellipse(draw, (15, 15, 17, 17), TEAL)


def skull(draw: ImageDraw.ImageDraw) -> None:
    ellipse(draw, (10, 8, 22, 21), IRON)
    px(draw, (12, 14, 14, 16), INK)
    px(draw, (18, 14, 20, 16), INK)
    px(draw, (15, 18, 17, 20), INK)
    px(draw, (12, 21, 20, 24), IRON_DARK)


def clasp(draw: ImageDraw.ImageDraw) -> None:
    line(draw, [(7, 15), (13, 21), (16, 18)], GOLD, 3)
    line(draw, [(25, 15), (19, 21), (16, 18)], TEAL, 3)
    px(draw, (14, 17, 18, 21), GOLD_HI)


def book(draw: ImageDraw.ImageDraw) -> None:
    px(draw, (8, 9, 16, 23), PAPER)
    px(draw, (16, 9, 24, 23), (178, 154, 120, 255))
    rect(draw, (8, 9, 24, 23), GOLD_DARK, 1)
    line(draw, [(16, 10), (16, 23)], INK, 1)
    line(draw, [(11, 13), (14, 13)], INK, 1)
    line(draw, [(19, 13), (22, 13)], INK, 1)


def rocket(draw: ImageDraw.ImageDraw) -> None:
    poly(draw, [(17, 6), (23, 9), (20, 18), (13, 21), (11, 14)], IRON)
    ellipse(draw, (16, 10, 20, 14), BLUE)
    poly(draw, [(12, 18), (8, 23), (15, 20)], ORANGE)


def lotus(draw: ImageDraw.ImageDraw) -> None:
    poly(draw, [(16, 8), (19, 17), (16, 24), (13, 17)], PURPLE)
    poly(draw, [(10, 13), (15, 19), (12, 24), (7, 18)], BLUE)
    poly(draw, [(22, 13), (17, 19), (20, 24), (25, 18)], BLUE)


def flame(draw: ImageDraw.ImageDraw) -> None:
    poly(draw, [(16, 6), (22, 15), (20, 24), (12, 25), (9, 17), (13, 13)], ORANGE)
    poly(draw, [(16, 12), (19, 18), (16, 23), (13, 19)], GOLD_HI)


def sparkle(draw: ImageDraw.ImageDraw) -> None:
    poly(draw, [(16, 5), (19, 13), (27, 16), (19, 19), (16, 27), (13, 19), (5, 16), (13, 13)], GOLD)
    poly(draw, [(16, 11), (18, 15), (21, 16), (18, 17), (16, 21), (14, 17), (11, 16), (14, 15)], GOLD_HI)


def folder(draw: ImageDraw.ImageDraw) -> None:
    px(draw, (7, 11, 25, 23), GOLD)
    px(draw, (9, 8, 16, 11), GOLD_HI)
    rect(draw, (7, 11, 25, 23), GOLD_DARK, 1)
    line(draw, [(9, 16), (23, 16)], GOLD_DARK, 1)


def star(draw: ImageDraw.ImageDraw) -> None:
    poly(draw, [(16, 5), (19, 13), (27, 13), (21, 18), (23, 26), (16, 21), (9, 26), (11, 18), (5, 13), (13, 13)], GOLD)


def diamond(draw: ImageDraw.ImageDraw) -> None:
    poly(draw, [(16, 6), (25, 14), (16, 26), (7, 14)], TEAL)
    poly(draw, [(16, 6), (20, 14), (16, 26), (12, 14)], (180, 255, 245, 255))
    rect(draw, (8, 13, 24, 15), TEAL_DARK, 1)


BADGE_ICONS: list[Callable[[ImageDraw.ImageDraw], None]] = [
    sword,
    scroll,
    crossed,
    trophy,
    eye,
    skull,
    clasp,
    book,
    rocket,
    lotus,
    flame,
    sparkle,
    folder,
    star,
    diamond,
]


def badge_sheet() -> Image.Image:
    img = Image.new("RGBA", (BADGE_CELL * len(BADGE_ICONS) * SCALE, BADGE_CELL * SCALE), TRANSPARENT)
    for i, icon in enumerate(BADGE_ICONS):
        tile = Image.new("RGBA", (BADGE_CELL * SCALE, BADGE_CELL * SCALE), TRANSPARENT)
        draw = ImageDraw.Draw(tile)
        medallion(draw, "gold" if i in {0, 1, 13, 14} else "teal" if i in {4, 6, 11} else "iron")
        icon(draw)
        img.alpha_composite(tile, (i * BADGE_CELL * SCALE, 0))
    return img


def phase_icon(draw: ImageDraw.ImageDraw, index: int) -> None:
    if index == 0:
        flame(draw)
    elif index == 1:
        # Paw-like expedition marker, abstracted as trail stones.
        ellipse(draw, (11, 14, 21, 24), GREEN)
        ellipse(draw, (8, 9, 12, 13), GREEN)
        ellipse(draw, (14, 7, 18, 12), GREEN)
        ellipse(draw, (20, 9, 24, 13), GREEN)
    elif index == 2:
        line(draw, [(10, 7), (10, 25)], IRON, 2)
        poly(draw, [(11, 8), (25, 12), (11, 17)], BLUE)
        line(draw, [(13, 18), (22, 21)], GOLD_DARK, 1)
    elif index == 3:
        scroll(draw)
        line(draw, [(21, 19), (25, 23)], GOLD, 2)
    else:
        ellipse(draw, (8, 8, 24, 24), IRON)
        px(draw, (15, 20, 17, 23), INK)
        line(draw, [(13, 13), (16, 10), (19, 13), (16, 17)], INK, 2)


def phase_sheet() -> Image.Image:
    img = Image.new("RGBA", (PHASE_CELL * 5 * SCALE, PHASE_CELL * SCALE), TRANSPARENT)
    for i in range(5):
        tile = Image.new("RGBA", (PHASE_CELL * SCALE, PHASE_CELL * SCALE), TRANSPARENT)
        draw = ImageDraw.Draw(tile)
        phase_icon(draw, i)
        img.alpha_composite(tile, (i * PHASE_CELL * SCALE, 0))
    return img


def empty_sheet() -> Image.Image:
    img = Image.new("RGBA", (EMPTY_CELL * 3 * SCALE, EMPTY_CELL * SCALE), TRANSPARENT)
    for i in range(3):
        tile = Image.new("RGBA", (EMPTY_CELL * SCALE, EMPTY_CELL * SCALE), TRANSPARENT)
        draw = ImageDraw.Draw(tile)
        if i == 0:
            ellipse(draw, (22, 13, 42, 34), IRON_DARK)
            px(draw, (26, 21, 29, 24), IRON)
            px(draw, (35, 21, 38, 24), IRON)
            px(draw, (28, 34, 36, 50), IRON_DARK)
            line(draw, [(24, 38), (16, 46)], IRON_DARK, 3)
            line(draw, [(40, 38), (48, 46)], IRON_DARK, 3)
            ellipse(draw, (18, 50, 46, 58), (34, 37, 50, 180))
        elif i == 1:
            medallion(draw, "iron")
            poly(draw, [(32, 14), (48, 44), (16, 44)], IRON)
            poly(draw, [(32, 24), (40, 40), (24, 40)], INK)
            px(draw, (30, 34, 34, 38), GOLD)
        else:
            px(draw, (18, 18, 46, 38), IRON_DARK)
            rect(draw, (18, 18, 46, 38), IRON, 1)
            px(draw, (24, 23, 28, 27), IRON)
            px(draw, (36, 23, 40, 27), IRON)
            line(draw, [(27, 34), (37, 34)], IRON, 1)
            line(draw, [(12, 14), (8, 10)], IRON_DARK, 2)
            line(draw, [(52, 14), (56, 10)], IRON_DARK, 2)
            line(draw, [(13, 45), (8, 50)], IRON_DARK, 2)
            line(draw, [(51, 45), (56, 50)], IRON_DARK, 2)
        img.alpha_composite(tile, (i * EMPTY_CELL * SCALE, 0))
    return img


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    badge_sheet().save(OUT / "badge-sheet-v2.png")
    phase_sheet().save(OUT / "phase-icons-v2.png")
    empty_sheet().save(OUT / "empty-states-v2.png")


if __name__ == "__main__":
    main()
