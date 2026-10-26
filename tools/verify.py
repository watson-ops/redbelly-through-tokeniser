"""Verify the deliverables against the brief and write docs/qa-report.md.

  python tools/verify.py            all offline checks
  python tools/verify.py --online   also re-read every source page and match each quote

Exits non-zero if any check fails.
"""

import argparse
import json
import re
import subprocess
import sys
import zipfile
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
DELIV = ROOT / "deliverables"
NAME = "tokenisation-explainer"
SCRIPT = json.loads((ROOT / "script" / "script.json").read_text())
SOURCES = json.loads((ROOT / "script" / "sources.json").read_text())["sources"]
TIMELINE = json.loads((ROOT / "script" / "timeline.json").read_text())
CAPTIONS = json.loads((ROOT / "subtitles" / "captions.json").read_text())["captions"]

BANNED_DASHES = re.compile("[\u2013\u2014]")
EMOJI = re.compile("[\U0001F300-\U0001FAFF\u2600-\u27BF]")
HYPE = re.compile(r"\b(elevate|seamless(ly)?|unleash|revolutioni[sz]e|game.?changer|moon|to the moon|skyrocket)\b", re.I)
MONEY = re.compile(r"(\$|\bA\$|\bUS\$|\bprice[sd]?\b|\breturns?\b|\byields?\b|\bprofits?\b|\bgains?\b|\bAPY\b|\bguarantee[sd]?\b|"
                   r"\bbuy now\b|\binvest now\b|\bROI\b|\bupside\b|\bprofitable\b|\bearn\b|\binterest rate\b|\d+\s?%)", re.I)
CREDIT = re.compile(r"(watson|made by|created by|produced by|animated by|voiced by|directed by|@[a-z0-9_]{2,}|github\.com/)", re.I)

results = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print(("PASS " if ok else "FAIL ") + name + (f": {detail}" if detail else ""))


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)],
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def loudness(path):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"],
                         capture_output=True, text=True, check=True).stderr
    summary = err[err.rindex("Summary:"):]
    i = float(re.search(r"I:\s+(-?[\d.]+) LUFS", summary).group(1))
    tp = float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", summary).group(1))
    return i, tp


def docx_text(path):
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf8") + z.read("docProps/core.xml").decode("utf8")
    return re.sub(r"<[^>]+>", " ", xml)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--online", action="store_true")
    a = ap.parse_args()

    # 1. Deliverables exist
    files = {
        "video, captions burned in": DELIV / f"{NAME}-1080p-captions.mp4",
        "video, clean": DELIV / f"{NAME}-1080p-clean.mp4",
        "subtitles SRT": DELIV / f"{NAME}.srt",
        "subtitles VTT": DELIV / f"{NAME}.vtt",
        "script PDF": DELIV / f"{NAME}-script.pdf",
        "script DOCX": DELIV / f"{NAME}-script.docx",
        "licence register": ROOT / "licences" / "README.md",
        "Readex Pro licence": ROOT / "licences" / "OFL-ReadexPro.txt",
        "JetBrains Mono licence": ROOT / "licences" / "OFL-JetBrainsMono.txt",
        "Kokoro licence": ROOT / "licences" / "Apache-2.0-Kokoro.txt",
    }
    for label, f in files.items():
        check(f"deliverable present: {label}", f.exists() and f.stat().st_size > 0, f.relative_to(ROOT).as_posix())

    # 2. Video specs
    for label in ("video, captions burned in", "video, clean"):
        f = files[label]
        if not f.exists():
            continue
        info = probe(f)
        v = next(s for s in info["streams"] if s["codec_type"] == "video")
        au = next(s for s in info["streams"] if s["codec_type"] == "audio")
        num, den = map(int, v["r_frame_rate"].split("/"))
        fps = num / den
        dur = float(info["format"]["duration"])
        check(f"{label}: MP4, H.264", info["format"]["format_name"].startswith("mov,mp4") and v["codec_name"] == "h264", v["codec_name"])
        check(f"{label}: 16:9 at 1080p or higher", v["width"] * 9 == v["height"] * 16 and v["height"] >= 1080, f"{v['width']} x {v['height']}")
        check(f"{label}: 24 fps or higher", fps >= 24, f"{fps:.2f} fps")
        check(f"{label}: runtime 60 to 90 s", 60 <= dur <= 90, f"{dur:.2f} s")
        check(f"{label}: matches timeline", abs(dur - TIMELINE["duration"]) < 0.1, f"timeline {TIMELINE['duration']:.2f} s")
        check(f"{label}: AAC stereo 48 kHz", au["codec_name"] == "aac" and au["channels"] == 2 and au["sample_rate"] == "48000")
        i, tp = loudness(f)
        check(f"{label}: loudness about -16 LUFS", -17.0 <= i <= -15.0, f"{i:.1f} LUFS")
        check(f"{label}: true peak below -1 dBTP", tp <= -1.0, f"{tp:.1f} dBTP")

    # 3. Captions match the script word for word, and read comfortably
    spoken = [l for s in SCRIPT["scenes"] for l in s["lines"]]
    for l in spoken:
        joined = " ".join(c["text"] for c in CAPTIONS if c["line"] == l["id"])
        tl = next(x for x in TIMELINE["lines"] if x["id"] == l["id"])
        if joined != l["text"] or tl["text"] != l["text"]:
            check(f"captions match script line {l['id']}", False, joined)
    check("captions and timeline match the script word for word", all(r[1] for r in results if r[0].startswith("captions match script line")),
          f"{len(spoken)} lines, {len(CAPTIONS)} captions")
    check("captions: at most two lines of 42 characters", all(len(c["lines"]) <= 2 and all(len(x) <= 42 for x in c["lines"]) for c in CAPTIONS))
    check("captions: no overlaps", all(CAPTIONS[i]["end"] <= CAPTIONS[i + 1]["start"] for i in range(len(CAPTIONS) - 1)))
    short = [c["id"] for c in CAPTIONS if c["end"] - c["start"] < 1.2]
    check("captions: each on screen for at least 1.2 s", not short, ", ".join(short))
    srt = (DELIV / f"{NAME}.srt").read_text() if (DELIV / f"{NAME}.srt").exists() else ""
    check("SRT holds every caption", srt.count(" --> ") == len(CAPTIONS), f"{srt.count(' --> ')} cues")

    # 4. Every spoken claim carries verbatim evidence from a supplied source
    bad = []
    for l in spoken:
        if not l.get("evidence"):
            bad.append(f"{l['id']} has no evidence")
        for e in l.get("evidence", []):
            if e["source"] not in SOURCES or e["quote"] not in SOURCES[e["source"]]["quotes"]:
                bad.append(f"{l['id']} quote not in {e['source']}")
    for s in SCRIPT["scenes"]:
        for label, ids in s.get("onscreen_sources", {}).items():
            if label not in s["onscreen"]:
                bad.append(f"{s['id']} sourced label not on screen: {label}")
            bad += [f"{s['id']} unknown source {i}" for i in ids if i not in SOURCES]
    check("every voiceover line and factual label is sourced", not bad, "; ".join(bad))
    allowed = ("tokeniser.com", "redbelly.network")
    check("sources are the supplied resources only", all(any(d in s["url"] for d in allowed) for s in SOURCES.values()),
          f"{len(SOURCES)} pages, {sum(len(s['quotes']) for s in SOURCES.values())} quotes")

    # 5. On screen text in the animation equals the script's on screen text
    onscreen_file = ROOT / "build" / "onscreen.json"
    subprocess.run(["node", str(ROOT / "tools" / "render_frames.js"), "--text", str(onscreen_file)], check=True, capture_output=True)
    rendered = json.loads(onscreen_file.read_text())
    diffs = []
    for s in SCRIPT["scenes"]:
        got = {x for x in rendered["text"].get(s["id"], []) if not x.isdigit()}
        want = set(s["onscreen"])
        if got != want:
            diffs.append(f"{s['id']}: extra {sorted(got - want)} missing {sorted(want - got)}")
    chrome = {x for x in rendered["text"].get("chrome", []) if not x.isdigit()}
    if chrome != set(SCRIPT["persistent_onscreen"]["text"]):
        diffs.append(f"chrome: {sorted(chrome ^ set(SCRIPT['persistent_onscreen']['text']))}")
    check("video on screen text matches the script exactly", not diffs, "; ".join(diffs))
    check("every motion cue found its spoken word", not rendered["missingWords"], ", ".join(rendered["missingWords"]))

    # 6. Copy rules on everything a viewer or reviewer reads
    viewer = [l["text"] for l in spoken] + [x for s in SCRIPT["scenes"] for x in s["onscreen"]] + SCRIPT["persistent_onscreen"]["text"]
    viewer += [c["text"] for c in CAPTIONS]
    def visible(p):
        t = p.read_text()
        if p.suffix == ".html":
            t = re.sub(r"<style.*?</style>", " ", t, flags=re.S)
            t = re.sub(r"<[^>]+>", " ", t)
        return t

    docs = [(p.relative_to(ROOT).as_posix(), visible(p)) for p in [ROOT / "README.md", *sorted((ROOT / "docs").glob("*.md")),
                                                                  *sorted((ROOT / "licences").glob("*.md")), ROOT / "build" / "script.html"]
            if p.exists() and p.name != "qa-report.md"]
    if files["script DOCX"].exists():
        docs.append(("deliverables script DOCX", docx_text(files["script DOCX"])))
    check("no em or en dashes in film or documents", not any(BANNED_DASHES.search(t) for t in viewer)
          and not [n for n, t in docs if BANNED_DASHES.search(t)], ", ".join(n for n, t in docs if BANNED_DASHES.search(t)))
    check("no emoji in film or documents", not any(EMOJI.search(t) for t in viewer) and not [n for n, t in docs if EMOJI.search(t)])
    check("no hype words in the film", not [t for t in viewer if HYPE.search(t)], "; ".join(t for t in viewer if HYPE.search(t)))
    money = [t for t in viewer if MONEY.search(t)]
    check("no price, return or investment advice language in the film", not money, "; ".join(money))
    credit_viewer = [t for t in viewer if CREDIT.search(t)]
    credit_docs = [n for n, t in docs if n.startswith(("build/", "deliverables")) and CREDIT.search(t)]
    check("no personal credit inside the deliverables", not credit_viewer and not credit_docs, ", ".join(credit_viewer + credit_docs))

    # 7. Runtime budget
    words = sum(len(l["text"].split()) for l in spoken)
    check("voiceover pace is comfortable", words / (TIMELINE["duration"] / 60) <= 150, f"{words} words in {TIMELINE['duration']:.1f} s")

    # 8. Optional: live source check
    if a.online:
        out = ROOT / "build" / "source-check.json"
        r = subprocess.run(["node", str(ROOT / "tools" / "check_sources.js"), str(out)], capture_output=True, text=True)
        check("every quote is still on the live source page", r.returncode == 0, r.stdout.strip())

    write_report(a.online)
    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)} of {len(results)} checks passed")
    sys.exit(1 if failed else 0)


def write_report(online):
    now = datetime.now(ZoneInfo("America/Toronto")).strftime("%Y-%m-%d %H:%M %Z")
    lines = [
        "# QA Report",
        "",
        f"Generated by `tools/verify.py{' --online' if online else ''}` on {now}.",
        "",
        f"**{sum(r[1] for r in results)} of {len(results)} checks passed.**",
        "",
        "| Result | Check | Detail |",
        "|--------|-------|--------|",
    ]
    for name, ok, detail in results:
        lines.append(f"| {'Pass' if ok else 'FAIL'} | {name} | {detail.replace('|', '/')} |")
    (ROOT / "docs" / "qa-report.md").write_text("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
