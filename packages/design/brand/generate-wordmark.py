#!/usr/bin/env python3
"""
Generates the XOholy wordmark as outlined SVG paths.

WHY OUTLINE RATHER THAN SET LIVE TEXT
-------------------------------------
A logo must not depend on a webfont loading. Live text falls back to another face when
Inter is slow, blocked or unavailable — email clients, PDF exports, some in-app browsers
— and the wordmark is exactly where that is least acceptable. Outlined paths render
identically everywhere with no font dependency.

Outlining is also the required first step toward the brief's endgame: the XO is meant to
become proprietary rather than permanently off-the-shelf Inter. These paths are the
geometry a designer edits. Inter is where the mark begins, not where it stays.

SPECIFICATION
-------------
    XO      Inter Black 900,  tracking -5%   (spec: -4% to -6%; X and O nearly touching)
    holy    Inter Light 300,  tracking -2%,  lowercase

One family, so the contrast is weight alone — which is what makes the mark work. Shaping
runs through HarfBuzz, so kerning is the font's own rather than an approximation.

USAGE
    pip install fonttools uharfbuzz
    python3 packages/design/brand/generate-wordmark.py

Writes xoholy-wordmark.svg, xo-mark.svg, xo-icon.svg and xo-icon-gold.svg beside itself.
"""

from __future__ import annotations

import pathlib
import re
import urllib.request

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

HERE = pathlib.Path(__file__).parent
CACHE = HERE / ".fonts"

GOOGLE_CSS = "https://fonts.googleapis.com/css2?family=Inter:wght@300;900&display=swap"
# A desktop UA makes Google Fonts serve TTF rather than woff2, which fontTools reads
# directly without a brotli round-trip.
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}

XO_TRACKING = -0.05   # em
HOLY_TRACKING = -0.02  # em

# Cap height is normalised to 100 units so the wordmark drops straight into the existing
# brand geometry without anything downstream needing to rescale.
CAP_TARGET = 100.0


def fetch_fonts() -> dict[int, pathlib.Path]:
    CACHE.mkdir(exist_ok=True)
    paths = {w: CACHE / f"Inter-{w}.ttf" for w in (300, 900)}
    if all(p.exists() for p in paths.values()):
        return paths

    css = urllib.request.urlopen(urllib.request.Request(GOOGLE_CSS, headers=UA)).read().decode()
    for weight, url in re.findall(
        r"font-weight:\s*(\d+);.*?src:\s*url\((https://[^)]+\.ttf)\)", css, re.S
    ):
        urllib.request.urlretrieve(url, paths[int(weight)])
        print(f"  fetched Inter {weight}")
    return paths


def shape(text: str, font_path: pathlib.Path):
    """Shape with HarfBuzz so kerning and any substitutions are the font's own."""
    font = hb.Font(hb.Face(hb.Blob.from_file_path(str(font_path))))
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf)
    return list(zip(buf.glyph_infos, buf.glyph_positions))


def draw_run(
    text: str,
    font_path: pathlib.Path,
    tracking_em: float,
    start_x: float,
    scale: float,
    baseline: float,
) -> tuple[list[str], float, tuple[float, float]]:
    """
    Draw one styled run directly into output coordinates.

    The whole transform happens inside the pen: scale by `scale`, flip Y (fonts are Y-up
    from the baseline, SVG is Y-down), and land the baseline at `baseline`. Emitting final
    coordinates avoids any post-hoc rewriting of path data.

    Returns (path data, pen x after the run, (min y, max y)) in output units.
    """
    tt = TTFont(font_path)
    upm = tt["head"].unitsPerEm
    glyph_set = tt.getGlyphSet()
    order = tt.getGlyphOrder()

    tracking_units = tracking_em * upm
    pen_x = start_x / scale  # advance in font units; converted by the transform
    paths: list[str] = []
    y_min, y_max = float("inf"), float("-inf")

    for info, pos in shape(text, font_path):
        # 2dp is well below a pixel at any size the mark is used, and keeps the
        # emitted path data readable for whoever customises the XO later.
        svg_pen = SVGPathPen(glyph_set, ntos=lambda v: f"{v:.2f}")
        transform = (
            scale,                                   # xx
            0,                                       # xy
            0,                                       # yx
            -scale,                                  # yy — flips into SVG's Y-down space
            (pen_x + pos.x_offset) * scale,          # dx
            baseline,                                # dy
        )
        glyph = glyph_set[order[info.codepoint]]
        glyph.draw(TransformPen(svg_pen, transform))

        # Measure what was actually drawn. Typographic ascender/descender metrics carry
        # line-gap padding well beyond the ink, and using them for the viewBox leaves dead
        # space that silently shrinks the mark at any given render width.
        bounds = BoundsPen(glyph_set)
        glyph.draw(TransformPen(bounds, transform))
        if bounds.bounds:
            _, gy0, _, gy1 = bounds.bounds
            y_min, y_max = min(y_min, gy0), max(y_max, gy1)

        if data := svg_pen.getCommands():
            paths.append(data)

        pen_x += pos.x_advance + tracking_units

    return paths, pen_x * scale, (y_min, y_max)


HEADER = """<!--
    XO     Inter Black 900, tracking -5%
    holy   Inter Light 300, tracking -2%

    Outlined rather than set as live text, so the mark never depends on a webfont
    loading and the XO has editable geometry for the custom proprietary version.
    Generated by generate-wordmark.py — do not edit path data by hand.
  -->"""


def build() -> None:
    print("Building XOholy wordmark from Inter…")
    fonts = fetch_fonts()

    tt = TTFont(fonts[900])
    scale = CAP_TARGET / tt["OS/2"].sCapHeight
    baseline = CAP_TARGET  # cap height then occupies y = 0..100

    # "XOholy" is one word: `holy` continues straight from the O, no inserted space.
    xo, after_xo, xo_y = draw_run("XO", fonts[900], XO_TRACKING, 0.0, scale, baseline)
    holy, total_w, holy_y = draw_run("holy", fonts[300], HOLY_TRACKING, after_xo, scale, baseline)

    # Tight to the ink: the O's overshoot above cap height, and the y's descender below
    # the baseline. Padding is then a deliberate clear-space choice rather than an
    # accident of the font's vertical metrics.
    top = min(xo_y[0], holy_y[0])
    bottom = max(xo_y[1], holy_y[1])
    pad = 6.0

    vb = f"{-pad:.1f} {top - pad:.1f} {total_w + pad * 2:.1f} {bottom - top + pad * 2:.1f}"
    xo_svg = "\n    ".join(f'<path d="{d}" />' for d in xo)
    holy_svg = "\n    ".join(f'<path d="{d}" />' for d in holy)

    (HERE / "xoholy-wordmark.svg").write_text(
        f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="XOholy" fill="currentColor">
  <title>XOholy</title>
  {HEADER}
  <g data-part="xo">
    {xo_svg}
  </g>
  <g data-part="holy">
    {holy_svg}
  </g>
</svg>
"""
    )
    print("  wrote xoholy-wordmark.svg")

    write_mark(xo, after_xo, xo_y, pad)
    write_ts(xo, holy, vb, after_xo, xo_y, pad)


def write_mark(xo: list[str], width: float, y_bounds: tuple[float, float], pad: float) -> None:
    top, bottom = y_bounds
    vb = f"{-pad:.1f} {top - pad:.1f} {width + pad * 2:.1f} {bottom - top + pad * 2:.1f}"
    body = "\n  ".join(f'<path d="{d}" />' for d in xo)

    (HERE / "xo-mark.svg").write_text(
        f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="XOholy" fill="currentColor">
  <title>XOholy</title>
  <!--
    The standalone XO. The brief's endgame is that this reads as XOholy without the word
    "holy", the way a major platform's icon needs no wordmark. Identical outlines to the
    lockup, so the two cannot drift.
  -->
  {body}
</svg>
"""
    )
    print("  wrote xo-mark.svg")

    # App icons — XO centred on a 1024 artboard, inside the Android adaptive-icon safe zone.
    box, target_w = 1024, 470.0
    icon_scale = target_w / width
    tx = (box - width * icon_scale) / 2
    ty = (box - (bottom - top) * icon_scale) / 2 - top * icon_scale
    icon_body = "\n    ".join(f'<path d="{d}" />' for d in xo)

    for name, fill in (("xo-icon.svg", "#F4F0E8"), ("xo-icon-gold.svg", "#A58B54")):
        # The gold variant uses the brand value, correct on near-black at 5.81:1. Never
        # substitute the light-surface gold here — see packages/design/src/color.ts.
        (HERE / name).write_text(
            f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {box} {box}" role="img" aria-label="XOholy">
  <title>XOholy</title>
  <!--
    App icon: XO only. No cross, no dove, no Bible — iconic rather than explanatory, so it
    sits on a home screen beside TikTok and Spotify without announcing itself as a
    religious app. Generated by generate-wordmark.py.
  -->
  <rect width="{box}" height="{box}" fill="#11110F" />
  <g transform="translate({tx:.2f} {ty:.2f}) scale({icon_scale:.4f})" fill="{fill}">
    {icon_body}
  </g>
</svg>
"""
        )
        print(f"  wrote {name}")


def write_ts(
    xo: list[str],
    holy: list[str],
    wordmark_vb: str,
    mark_w: float,
    mark_y: tuple[float, float],
    pad: float,
) -> None:
    """
    Emit the outlines as a TypeScript module.

    The React component renders from here rather than from a copy of the path data, so
    the site and the SVG files cannot drift after a regeneration.
    """
    top, bottom = mark_y
    mark_vb = f"{-pad:.1f} {top - pad:.1f} {mark_w + pad * 2:.1f} {bottom - top + pad * 2:.1f}"
    fmt = lambda paths: "\n  " + ",\n  ".join(f'"{d}"' for d in paths) + ",\n"

    (HERE.parent / "src" / "wordmark-paths.ts").write_text(
        f"""/**
 * XOholy wordmark outlines. GENERATED — do not edit.
 *
 * Run `python3 packages/design/brand/generate-wordmark.py` to regenerate.
 *
 *   XO    Inter Black 900, tracking -5%
 *   holy  Inter Light 300, tracking -2%
 *
 * Outlined so the mark never depends on a webfont loading, and so the XO carries
 * editable geometry for the custom proprietary version the brief calls for.
 */

/** Cap height occupies y = 0..100 in this coordinate space. */
export const WORDMARK_VIEWBOX = "{wordmark_vb}";
export const MARK_VIEWBOX = "{mark_vb}";

export const XO_PATHS = [{fmt(xo)}] as const;

export const HOLY_PATHS = [{fmt(holy)}] as const;
"""
    )
    print("  wrote src/wordmark-paths.ts")


if __name__ == "__main__":
    build()
