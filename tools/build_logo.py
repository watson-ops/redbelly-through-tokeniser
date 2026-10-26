"""Build the project logo as self contained SVG files with transparent backgrounds.

The wordmark is set in Readex Pro Medium, shaped with HarfBuzz (so kerning is
applied) and converted to outlines, so the logo renders the same everywhere
without the font installed.

Writes web/logo-light.svg   for dark backgrounds (white text, mint accent)
       web/logo-dark.svg    for light backgrounds (ink text, teal accent)
       web/mark.svg         the token mark alone, also used as the favicon
"""

from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent
FONT = ROOT / "brand" / "fonts" / "ReadexPro-Variable-latin.woff2"
OUT = ROOT / "web"
WEIGHT = 500
TEXT = [("From Fund to ", "base"), ("Token", "accent")]

INK, MINT, TEAL, WHITE = "#343740", "#A2FFC8", "#009C9C", "#FFFFFF"

# The mark: the token used throughout the film, on a 48 unit grid.
MARK = (
    '<circle cx="24" cy="24" r="22" fill="{mint}"/>'
    '<circle cx="24" cy="24" r="12.5" fill="none" stroke="{ink}" stroke-width="3"/>'
    '<rect x="19.5" y="19.5" width="9" height="9" rx="1" fill="{ink}" transform="rotate(45 24 24)"/>'
)


def static_font():
    font = TTFont(str(FONT))
    font = instantiateVariableFont(font, {"wght": WEIGHT})
    font.flavor = None  # HarfBuzz needs plain TrueType, not WOFF2
    tmp = OUT / ".readex-500.ttf"
    font.save(str(tmp))
    return tmp


def shape_runs(ttf_path, size):
    blob = hb.Blob.from_file_path(str(ttf_path))
    face = hb.Face(blob)
    hbfont = hb.Font(face)
    font = TTFont(str(ttf_path))
    upem = font["head"].unitsPerEm
    glyphs = font.getGlyphSet()
    order = font.getGlyphOrder()
    scale = size / upem
    x = 0.0
    runs = []
    for text, role in TEXT:
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(hbfont, buf, {"kern": True, "liga": True})
        d = []
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            name = order[info.codepoint]
            pen = SVGPathPen(glyphs)
            # Flip the y axis: font units point up, SVG points down.
            tpen = TransformPen(pen, (scale, 0, 0, -scale, x + pos.x_offset * scale, -pos.y_offset * scale))
            glyphs[name].draw(tpen)
            if pen.getCommands():
                d.append(pen.getCommands())
            x += pos.x_advance * scale
        runs.append((" ".join(d), role))
    ascent = font["hhea"].ascent * scale
    return runs, x, ascent


def lockup(text_color, accent_color, ttf):
    size = 30.0
    runs, width, _ = shape_runs(ttf, size)
    gap = 14
    mark_size = 40
    text_x = mark_size + gap
    baseline = 30.5  # visually centres cap height against the 40 unit mark
    total_w = round(text_x + width + 1)
    paths = "".join(
        f'<path d="{d}" fill="{text_color if role == "base" else accent_color}"/>' for d, role in runs
    )
    mark = MARK.format(mint=MINT, ink=INK)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total_w} {mark_size}" width="{total_w}" height="{mark_size}" '
        f'role="img" aria-label="From Fund to Token">'
        f'<title>From Fund to Token</title>'
        f'<g transform="scale({mark_size / 48})">{mark}</g>'
        f'<g transform="translate({text_x} {baseline})">{paths}</g>'
        f"</svg>\n"
    )


def main():
    OUT.mkdir(exist_ok=True)
    ttf = static_font()
    try:
        (OUT / "logo-light.svg").write_text(lockup(WHITE, MINT, ttf))
        (OUT / "logo-dark.svg").write_text(lockup(INK, TEAL, ttf))
        (OUT / "mark.svg").write_text(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" role="img" aria-label="From Fund to Token">'
            + MARK.format(mint=MINT, ink=INK) + "</svg>\n"
        )
    finally:
        ttf.unlink(missing_ok=True)
    print("web/logo-light.svg, web/logo-dark.svg, web/mark.svg written")


if __name__ == "__main__":
    main()
