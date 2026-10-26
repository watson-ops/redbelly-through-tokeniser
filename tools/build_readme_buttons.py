"""Build the README link buttons and file chips as self contained SVG files.

GitHub strips styles from README markup, so links are drawn as images. Labels
are set in Readex Pro, shaped with HarfBuzz and converted to outlines, so the
buttons look the same on every device and in light and dark mode.

Writes web/buttons/*.svg
"""

from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent
FONT = ROOT / "brand" / "fonts" / "ReadexPro-Variable-latin.woff2"
OUT = ROOT / "web" / "buttons"

INK, MINT, TEAL, WHITE, LINE = "#343740", "#A2FFC8", "#009C9C", "#FFFFFF", "#D6DAE0"

# 24 unit icons, drawn for this project (same family as the film's icons).
ICONS = {
    "play": ('<path d="M8 5.5v13l10.5-6.5z"/>', "fill"),
    "doc": ('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>', "stroke"),
    "grid": ('<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/>'
             '<rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>', "stroke"),
    "list": ('<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.6" cy="6.5" r="1.1"/><circle cx="4.6" cy="12" r="1.1"/><circle cx="4.6" cy="17.5" r="1.1"/>', "stroke"),
    "check": ('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>', "stroke"),
    "shield": ('<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>', "stroke"),
    "down": ('<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>', "stroke"),
}

STYLES = {
    # fill, border, text, icon
    "primary": (MINT, None, INK, INK),
    "dark": (INK, None, WHITE, MINT),
    "light": (WHITE, LINE, INK, TEAL),
    "chip": (INK, None, WHITE, MINT),
}

BUTTONS = [
    ("watch-the-film", "Watch the film", "play", "primary", 48),
    ("read-the-script", "Read the script", "doc", "dark", 48),
    ("deliverables", "Deliverables", "grid", "light", 40),
    ("sources", "Sources", "list", "light", 40),
    ("qa-report", "QA report", "check", "light", 40),
    ("licences", "Licences", "shield", "light", 40),
]
CHIPS = ["PDF", "DOCX", "MP4", "SRT", "VTT"]


def static_font(weight):
    font = instantiateVariableFont(TTFont(str(FONT)), {"wght": weight})
    font.flavor = None
    tmp = OUT / f".readex-{weight}.ttf"
    font.save(str(tmp))
    return tmp


class Shaper:
    def __init__(self, ttf):
        self.hbfont = hb.Font(hb.Face(hb.Blob.from_file_path(str(ttf))))
        self.font = TTFont(str(ttf))
        self.glyphs = self.font.getGlyphSet()
        self.order = self.font.getGlyphOrder()
        self.upem = self.font["head"].unitsPerEm

    def outline(self, text, size, letter_spacing=0.0):
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(self.hbfont, buf, {"kern": True, "liga": True})
        scale = size / self.upem
        x, parts = 0.0, []
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            pen = SVGPathPen(self.glyphs)
            self.glyphs[self.order[info.codepoint]].draw(TransformPen(pen, (scale, 0, 0, -scale, x, 0)))
            if pen.getCommands():
                parts.append(pen.getCommands())
            x += pos.x_advance * scale + letter_spacing
        cap = self.font["OS/2"].sCapHeight * scale
        return " ".join(parts), x - letter_spacing, cap


def icon_svg(name, x, y, size, color):
    body, mode = ICONS[name]
    paint = f'fill="{color}"' if mode == "fill" else f'fill="none" stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
    return f'<g transform="translate({x:.2f} {y:.2f}) scale({size / 24:.4f})" {paint}>{body}</g>'


def button(shaper, label, icon, style, height):
    fill, border, text_color, icon_color = STYLES[style]
    size = 17 if height >= 48 else 15.5
    pad = 22 if height >= 48 else 18
    icon_size = 20 if height >= 48 else 18
    gap = 10
    d, text_w, cap = shaper.outline(label, size)
    width = round(pad + icon_size + gap + text_w + pad)
    base = (height + cap) / 2
    stroke = f' stroke="{border}" stroke-width="1"' if border else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="{label}">'
        f"<title>{label}</title>"
        f'<rect x="0.5" y="0.5" width="{width - 1}" height="{height - 1}" rx="8"{stroke} fill="{fill}"/>'
        + icon_svg(icon, pad, (height - icon_size) / 2, icon_size, icon_color)
        + f'<path transform="translate({pad + icon_size + gap:.2f} {base:.2f})" d="{d}" fill="{text_color}"/>'
        "</svg>\n"
    )


def chip(shaper, label):
    fill, _, text_color, icon_color = STYLES["chip"]
    height, size, pad, icon_size, gap = 28, 12.5, 10, 14, 6
    d, text_w, cap = shaper.outline(label, size, letter_spacing=0.6)
    width = round(pad + icon_size + gap + text_w + pad)
    base = (height + cap) / 2
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="{label}">'
        f"<title>{label}</title>"
        f'<rect width="{width}" height="{height}" rx="6" fill="{fill}"/>'
        + icon_svg("down", pad, (height - icon_size) / 2, icon_size, icon_color)
        + f'<path transform="translate({pad + icon_size + gap:.2f} {base:.2f})" d="{d}" fill="{text_color}"/>'
        "</svg>\n"
    )


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    regular, bold = static_font(500), static_font(600)
    try:
        medium, strong = Shaper(regular), Shaper(bold)
        for slug, label, icon, style, height in BUTTONS:
            (OUT / f"{slug}.svg").write_text(button(medium, label, icon, style, height))
        for label in CHIPS:
            (OUT / f"file-{label.lower()}.svg").write_text(chip(strong, label))
    finally:
        regular.unlink(missing_ok=True)
        bold.unlink(missing_ok=True)
    print(f"{len(BUTTONS)} buttons and {len(CHIPS)} file chips written to web/buttons/")


if __name__ == "__main__":
    main()
