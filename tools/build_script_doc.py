"""Build the script document for fact checking, as DOCX and as HTML for the PDF.

Everything in the document comes from script/script.json, script/sources.json
and script/timeline.json, so the document cannot drift from the video.

Writes deliverables/tokenisation-explainer-script.docx
       build/script.html   (rendered to PDF by tools/html_to_pdf.js)
"""

import base64
import html
import json
from pathlib import Path

from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = json.loads((ROOT / "script" / "script.json").read_text())
SOURCES = json.loads((ROOT / "script" / "sources.json").read_text())
TIMELINE = json.loads((ROOT / "script" / "timeline.json").read_text())
LINES = {l["id"]: l for l in TIMELINE["lines"]}
SCENES = {s["id"]: s for s in TIMELINE["scenes"]}

INK = RGBColor(0x34, 0x37, 0x40)
MUTED = RGBColor(0x5E, 0x62, 0x70)
TEAL = RGBColor(0x00, 0x9C, 0x9C)

STORY = (
    "One Australian wholesale fund, shown as an illustrative example, moves from a traditional unit register to "
    "compliant tokens on Redbelly Network, issued through Tokeniser. The film walks through the five steps Tokeniser "
    "documents in its own Knowledge Hub: legal review, setting the rules, verifying investors, issuing on Redbelly, and "
    "checked transfers. It closes on the idea that the fund, its strategy and its licence stay the same, while the "
    "infrastructure underneath changes."
)

PRODUCTION = [
    ("Voice", "Kokoro 82M text to speech model, voice af_heart, run locally. Licence: Apache License 2.0, which allows commercial use. Licence text in licences/."),
    ("Music and sound", "Original music bed and transition sounds generated in code for this project (tools/build_music.py). No third party audio."),
    ("Typefaces", "Readex Pro (Redbelly brand kit) and JetBrains Mono for wallet addresses. Both under the SIL Open Font License 1.1, which allows commercial use."),
    ("Logos", "Official Redbelly Network logo files from the Redbelly brand kit, used unmodified. The supplied kits contain no Tokeniser logo, so the name is set in Readex Pro."),
    ("Icons and illustration", "Drawn for this project as SVG in animation/scenes.js."),
    ("Stock assets", "None. No stock footage, photography, music or voice."),
    ("Loudness", "Integrated loudness -16 LUFS, true peak ceiling -1.5 dBTP."),
]


def tc(t):
    m, s = divmod(t, 60)
    return f"{int(m)}:{s:04.1f}"


def scene_rows():
    for sc in SCRIPT["scenes"]:
        s = SCENES[sc["id"]]
        vo = [LINES[l["id"]]["text"] for l in sc["lines"]]
        ids = []
        for l in sc["lines"]:
            ids += [x for x in l["sources"] if x not in ids]
        yield {
            "scene": f"{sc['id'][1:].lstrip('0')}. {sc['name']}",
            "time": f"{tc(s['start'])} to {tc(s['end'])}",
            "vo": vo,
            "onscreen": sc["onscreen"],
            "visual": sc["visual"],
            "sources": ids,
        }


def fact_rows():
    for sc in SCRIPT["scenes"]:
        for l in sc["lines"]:
            yield {
                "id": l["id"],
                "time": tc(LINES[l["id"]]["start"]),
                "claim": l["text"],
                "evidence": l["evidence"],
                "note": l.get("note", ""),
            }


def label_rows():
    for sc in SCRIPT["scenes"]:
        for label, ids in sc.get("onscreen_sources", {}).items():
            yield sc["id"], label, ids


META = [
    ("Example asset", SCRIPT["asset"]),
    ("Audience", SCRIPT["audience"]),
    ("Runtime", f"{TIMELINE['duration']:.1f} seconds"),
    ("Video", "16:9, 1920 x 1080, 30 fps, H.264 MP4. Subtitles burned in, plus SRT and VTT files."),
    ("Voiceover", f"{sum(len(l['text'].split()) for l in TIMELINE['lines'])} words, {len(TIMELINE['lines'])} lines"),
    ("Sources read", "26 October 2026, from the resources supplied with the brief"),
    ("Version", SCRIPT["version"]),
]


# ---------------------------------------------------------------- HTML / PDF
def build_html():
    font = base64.b64encode((ROOT / "brand" / "fonts" / "ReadexPro-Variable-latin.woff2").read_bytes()).decode()
    mono = base64.b64encode((ROOT / "brand" / "fonts" / "JetBrainsMono-Variable-latin.woff2").read_bytes()).decode()
    e = html.escape
    out = [f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{e(SCRIPT['title'])}: script</title>
<style>
@font-face {{ font-family: 'Readex Pro'; src: url(data:font/woff2;base64,{font}) format('woff2'); font-weight: 160 700; }}
@font-face {{ font-family: 'JetBrains Mono'; src: url(data:font/woff2;base64,{mono}) format('woff2'); font-weight: 100 800; }}
@page {{ size: A4 landscape; margin: 16mm 16mm 18mm; }}
* {{ box-sizing: border-box; }}
body {{ font-family: 'Readex Pro', system-ui, sans-serif; color: #343740; font-size: 10.5pt; line-height: 1.5; margin: 0; }}
h1 {{ font-size: 28pt; font-weight: 500; letter-spacing: -0.02em; margin: 0 0 4pt; }}
h2 {{ font-size: 15pt; font-weight: 500; margin: 22pt 0 8pt; padding-top: 8pt; border-top: 1px solid #e1e4e8; break-after: avoid; }}
h2.page {{ break-before: page; border-top: none; padding-top: 0; margin-top: 0; }}
h2 + p {{ break-after: avoid; }}
thead {{ display: table-header-group; }}
.sub {{ font-size: 13pt; color: #4b4f5d; margin-bottom: 14pt; }}
.kicker {{ font-size: 8.5pt; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #009c9c; margin-bottom: 6pt; }}
.band {{ height: 6pt; width: 64pt; background: #a2ffc8; border-radius: 3pt; margin: 10pt 0 14pt; }}
table {{ width: 100%; border-collapse: collapse; margin: 4pt 0 8pt; }}
th {{ text-align: left; font-weight: 600; font-size: 8.5pt; letter-spacing: 0.06em; text-transform: uppercase; color: #5e6270;
      border-bottom: 1.5px solid #343740; padding: 5pt 6pt; }}
td {{ vertical-align: top; border-bottom: 1px solid #e1e4e8; padding: 6pt; }}
tr {{ page-break-inside: avoid; }}
.meta td:first-child {{ width: 26%; color: #5e6270; }}
.vo p {{ margin: 0 0 4pt; }}
.chips span {{ display: inline-block; background: #eef0f2; border-radius: 3pt; padding: 0 5pt; margin: 0 3pt 3pt 0; font-size: 9pt; }}
.ids span, .id {{ font-family: 'JetBrains Mono', monospace; font-size: 8.5pt; background: #f2f2f2; border-radius: 3pt; padding: 0 4pt; margin-right: 3pt; white-space: nowrap; }}
blockquote {{ margin: 0 0 5pt; padding-left: 8pt; border-left: 3px solid #a2ffc8; color: #4b4f5d; }}
.note {{ color: #5e6270; font-size: 9.5pt; }}
.url {{ font-family: 'JetBrains Mono', monospace; font-size: 8.5pt; color: #4b4f5d; word-break: break-all; }}
.muted {{ color: #5e6270; }}
</style></head><body>
<div class="kicker">Script for fact check</div>
<h1>{e(SCRIPT['title'])}</h1>
<div class="sub">{e(SCRIPT['subtitle'])}</div>
<div class="band"></div>
<table class="meta">"""]
    for k, v in META:
        out.append(f"<tr><td>{e(k)}</td><td>{e(v)}</td></tr>")
    out.append(f"</table><h2>Story</h2><p>{e(STORY)}</p>")

    out.append("<h2 class='page'>Script</h2><p class='muted'>Timecodes are scene start and end in the final video. Every voiceover line also appears as a caption, word for word.</p>")
    out.append("<table><thead><tr><th style='width:11%'>Scene</th><th style='width:9%'>Time</th><th style='width:27%'>Voiceover</th>"
               "<th style='width:21%'>On screen text</th><th style='width:22%'>Visual</th><th style='width:10%'>Sources</th></tr></thead>")
    for r in scene_rows():
        out.append(
            f"<tr><td><b>{e(r['scene'])}</b></td><td>{e(r['time'])}</td>"
            f"<td class='vo'>{''.join(f'<p>{e(v)}</p>' for v in r['vo'])}</td>"
            f"<td class='chips'>{''.join(f'<span>{e(o)}</span>' for o in r['onscreen'])}</td>"
            f"<td>{e(r['visual'])}</td><td class='ids'>{''.join(f'<span>{e(i)}</span> ' for i in r['sources'])}</td></tr>")
    p = SCRIPT["persistent_onscreen"]
    out.append(f"</table><p class='note'>Also on screen: {e(p['note'])} Text: {e(', '.join(p['text']))}.</p>")

    out.append("<h2 class='page'>Fact check: voiceover</h2><p class='muted'>Each line, with the exact wording on the supplied page that supports it.</p>")
    out.append("<table><thead><tr><th style='width:6%'>Line</th><th style='width:6%'>Time</th><th style='width:26%'>Line as spoken</th>"
               "<th style='width:46%'>Supporting text, verbatim</th><th style='width:16%'>Note</th></tr></thead>")
    for r in fact_rows():
        ev = "".join(f"<blockquote>{e(x['quote'])}<br><span class='id'>{e(x['source'])}</span></blockquote>" for x in r["evidence"])
        out.append(f"<tr><td class='id'>{e(r['id'])}</td><td>{e(r['time'])}</td><td>{e(r['claim'])}</td><td>{ev}</td><td class='note'>{e(r['note'])}</td></tr>")
    out.append("</table>")

    out.append("<h2 class='page'>Fact check: on screen labels</h2><table><thead><tr><th style='width:10%'>Scene</th><th style='width:50%'>Label</th><th>Sources</th></tr></thead>")
    for sid, label, ids in label_rows():
        out.append(f"<tr><td class='id'>{e(sid)}</td><td>{e(label)}</td><td class='ids'>{''.join(f'<span>{e(i)}</span> ' for i in ids)}</td></tr>")
    out.append("</table><p class='note'>Other on screen text is interface labelling for the illustrative example: investor names, wallet addresses and headings.</p>")

    out.append("<h2 class='page'>Sources</h2><table><thead><tr><th style='width:10%'>ID</th><th style='width:40%'>Page</th><th>Address</th></tr></thead>")
    for sid, s in SOURCES["sources"].items():
        out.append(f"<tr><td class='id'>{e(sid)}</td><td>{e(s['title'])}</td><td class='url'>{e(s['url'])}</td></tr>")
    out.append(f"</table><p class='note'>All pages read on {e(SOURCES['accessed'])}.</p>")

    out.append("<h2>Left out on purpose</h2><p class='muted'>These appear in the resources but stay out of the film, to avoid price talk, return language or figures that differ between pages.</p><ul>")
    out += [f"<li>{e(x)}</li>" for x in SOURCES["excluded"]]
    out.append("</ul><h2>Production and licences</h2><table class='meta'>")
    out += [f"<tr><td>{e(k)}</td><td>{e(v)}</td></tr>" for k, v in PRODUCTION]
    out.append("</table></body></html>")
    path = ROOT / "build" / "script.html"
    path.parent.mkdir(exist_ok=True)
    path.write_text("\n".join(out))
    return path


# ---------------------------------------------------------------- DOCX
def shade(cell, hex_fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_fill)
    tc_pr.append(shd)


def para(container, text, size=10, bold=False, color=INK, italic=False, space_after=4):
    p = container.add_paragraph()
    r = p.add_run(text)
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.italic = italic
    r.font.color.rgb = color
    p.paragraph_format.space_after = Pt(space_after)
    return p


def table(doc, headers, widths):
    t = doc.add_table(rows=1, cols=len(headers))
    t.alignment = WD_TABLE_ALIGNMENT.LEFT
    t.style = "Table Grid"
    for i, h in enumerate(headers):
        c = t.rows[0].cells[i]
        c.text = ""
        para(c, h.upper(), size=8, bold=True, color=MUTED, space_after=0)
        shade(c, "F2F2F2")
        c.width = Cm(widths[i])
    return t


def row(t, values, widths):
    cells = t.add_row().cells
    for i, v in enumerate(values):
        cells[i].width = Cm(widths[i])
        cells[i].text = ""
        items = v if isinstance(v, list) else [v]
        for j, item in enumerate(items):
            if isinstance(item, tuple):
                para(cells[i], item[0], size=9, italic=True, color=MUTED, space_after=0)
                para(cells[i], item[1], size=8, bold=True, color=TEAL, space_after=4)
            elif j == 0:
                cells[i].paragraphs[0].add_run(item).font.size = Pt(9.5)
            else:
                para(cells[i], item, size=9.5, space_after=2)


def build_docx():
    doc = Document()
    sec = doc.sections[0]
    sec.orientation = WD_ORIENT.LANDSCAPE
    sec.page_width, sec.page_height = Cm(29.7), Cm(21.0)
    for side in ("left_margin", "right_margin", "top_margin", "bottom_margin"):
        setattr(sec, side, Cm(1.6))
    normal = doc.styles["Normal"]
    normal.font.name = "Readex Pro"
    normal.element.rPr.rFonts.set(qn("w:eastAsia"), "Readex Pro")
    normal.font.size = Pt(10)
    normal.font.color.rgb = INK
    doc.core_properties.title = SCRIPT["title"]
    doc.core_properties.author = ""
    doc.core_properties.last_modified_by = ""
    doc.core_properties.comments = ""

    para(doc, "SCRIPT FOR FACT CHECK", size=8, bold=True, color=TEAL)
    para(doc, SCRIPT["title"], size=26)
    para(doc, SCRIPT["subtitle"], size=13, color=MUTED, space_after=10)
    w = [7, 19.5]
    t = table(doc, ["Item", "Detail"], w)
    for k, v in META:
        row(t, [k, v], w)

    para(doc, "Story", size=15, space_after=4).paragraph_format.space_before = Pt(14)
    para(doc, STORY)

    para(doc, "Script", size=15, space_after=4).paragraph_format.space_before = Pt(14)
    para(doc, "Timecodes are scene start and end in the final video. Every voiceover line also appears as a caption, word for word.", size=9, color=MUTED)
    w = [2.8, 2.4, 7.2, 5.4, 6.0, 2.7]
    t = table(doc, ["Scene", "Time", "Voiceover", "On screen text", "Visual", "Sources"], w)
    for r in scene_rows():
        row(t, [r["scene"], r["time"], r["vo"], "; ".join(r["onscreen"]), r["visual"], ", ".join(r["sources"])], w)
    p = SCRIPT["persistent_onscreen"]
    para(doc, f"Also on screen: {p['note']} Text: {', '.join(p['text'])}.", size=9, color=MUTED)

    para(doc, "Fact check: voiceover", size=15, space_after=4).paragraph_format.space_before = Pt(14)
    para(doc, "Each line, with the exact wording on the supplied page that supports it.", size=9, color=MUTED)
    w = [1.5, 1.6, 7.0, 12.0, 4.4]
    t = table(doc, ["Line", "Time", "Line as spoken", "Supporting text, verbatim", "Note"], w)
    for r in fact_rows():
        row(t, [r["id"], r["time"], r["claim"], [(x["quote"], x["source"]) for x in r["evidence"]], r["note"]], w)

    para(doc, "Fact check: on screen labels", size=15, space_after=4).paragraph_format.space_before = Pt(14)
    w = [2.5, 14, 10]
    t = table(doc, ["Scene", "Label", "Sources"], w)
    for sid, label, ids in label_rows():
        row(t, [sid, label, ", ".join(ids)], w)
    para(doc, "Other on screen text is interface labelling for the illustrative example: investor names, wallet addresses and headings.", size=9, color=MUTED)

    para(doc, "Sources", size=15, space_after=4).paragraph_format.space_before = Pt(14)
    w = [2.5, 10, 14]
    t = table(doc, ["ID", "Page", "Address"], w)
    for sid, s in SOURCES["sources"].items():
        row(t, [sid, s["title"], s["url"]], w)
    para(doc, f"All pages read on {SOURCES['accessed']}.", size=9, color=MUTED)

    para(doc, "Left out on purpose", size=15, space_after=4).paragraph_format.space_before = Pt(14)
    for x in SOURCES["excluded"]:
        doc.add_paragraph(x, style="List Bullet")

    para(doc, "Production and licences", size=15, space_after=4).paragraph_format.space_before = Pt(14)
    w = [5, 21.5]
    t = table(doc, ["Item", "Detail"], w)
    for k, v in PRODUCTION:
        row(t, [k, v], w)

    out = ROOT / "deliverables" / "tokenisation-explainer-script.docx"
    out.parent.mkdir(exist_ok=True)
    doc.save(out)
    return out


# ---------------------------------------------------------------- Markdown
def build_markdown():
    md = [f"# {SCRIPT['title']}: Script", "",
          f"{SCRIPT['subtitle']}. Generated from `script/script.json` by `tools/build_script_doc.py`. "
          "The shared document for fact checking is `deliverables/tokenisation-explainer-script.pdf` (also `.docx`).", ""]
    md += [f"- **{k}:** {v}" for k, v in META]
    md += ["", "## Story", "", STORY, ""]
    for r, sc in zip(scene_rows(), SCRIPT["scenes"]):
        md += [f"## {r['scene']} ({r['time']})", "", "**Voiceover**", ""]
        for l in sc["lines"]:
            md.append(f"- `{l['id']}` {l['text']}  _Sources: {', '.join(l['sources'])}_")
        md += ["", f"**On screen:** {' / '.join(r['onscreen'])}", "", f"**Visual:** {r['visual']}", ""]
    p = SCRIPT["persistent_onscreen"]
    md += [f"_Also on screen: {p['note']}_", ""]
    (ROOT / "script" / "script.md").write_text("\n".join(md))

    src = ["# Source Register", "",
           f"Generated from `script/sources.json`. Every claim in the film traces to a quote below, read on {json.loads((ROOT / 'script' / 'sources.json').read_text())['accessed']}. "
           "`python tools/verify.py --online` re-reads each page and confirms every quote is still there, word for word.", ""]
    for sid, s in SOURCES["sources"].items():
        src += [f"## {sid}: {s['title']}", "", s["url"], ""]
        src += [f"> {q}\n" for q in s["quotes"]]
    src += ["## Left out on purpose", ""] + [f"- {x}" for x in SOURCES["excluded"]] + [""]
    (ROOT / "docs" / "sources.md").write_text("\n".join(src))
    return ROOT / "script" / "script.md"


if __name__ == "__main__":
    print("html:", build_html().relative_to(ROOT))
    print("docx:", build_docx().relative_to(ROOT))
    print("markdown:", build_markdown().relative_to(ROOT), "and docs/sources.md")
