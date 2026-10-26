"""Build captions from the script timeline.

Caption text is the script text, split only at punctuation and wrapped to at
most two lines of 42 characters. Timings come from the word timestamps in the
voiceover, so captions change on the spoken word.

Reads  script/timeline.json
Writes subtitles/captions.json             caption list used for the burned in overlays
       subtitles/tokenisation-explainer.srt
       subtitles/tokenisation-explainer.vtt
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAX_LINE = 42
MAX_CAPTION = 2 * MAX_LINE
TAIL = 0.3          # keep a caption up briefly after its last word
GAP = 0.04          # minimum gap between captions


def norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())


def word_times(line):
    """Map each space separated word in the script text to its spoken time."""
    tokens = [w for w in line["words"] if norm(w["word"])]
    words = line["text"].split()
    out, j = [], 0
    for w in words:
        target = norm(w)
        acc, start, end = "", None, None
        while j < len(tokens) and len(acc) < len(target):
            if start is None:
                start = tokens[j]["start"]
            acc += norm(tokens[j]["word"])
            end = tokens[j]["end"]
            j += 1
        if acc != target:
            raise SystemExit(f"{line['id']}: cannot align word {w!r} with voiceover tokens")
        out.append((w, start, end))
    return out


def fits(text):
    if len(text) <= MAX_LINE:
        return True
    words = text.split()
    return any(max(len(" ".join(words[:i])), len(" ".join(words[i:]))) <= MAX_LINE for i in range(1, len(words)))


def split_chunks(words):
    text = " ".join(w for w, _, _ in words)
    if fits(text):
        return [words]
    best = None
    for i, (w, _, _) in enumerate(words[:-1]):
        if w[-1] in ".,:":
            left = " ".join(x for x, _, _ in words[: i + 1])
            score = abs(len(left) - len(text) / 2)
            if best is None or score < best[0]:
                best = (score, i)
    if best is None:
        raise SystemExit(f"no punctuation to split long caption: {text}")
    i = best[1]
    return split_chunks(words[: i + 1]) + split_chunks(words[i + 1:])


def wrap(text):
    if len(text) <= MAX_LINE:
        return [text]
    words = text.split()
    best = None
    for i in range(1, len(words)):
        a, b = " ".join(words[:i]), " ".join(words[i:])
        score = max(len(a), len(b))
        if best is None or score < best[0]:
            best = (score, [a, b])
    if best[0] > MAX_LINE:
        raise SystemExit(f"caption too long for two lines: {text}")
    return best[1]


def stamp(t, sep):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}{sep}{ms:03d}"


def main():
    timeline = json.loads((ROOT / "script" / "timeline.json").read_text())
    caps = []
    for line in timeline["lines"]:
        chunks = split_chunks(word_times(line))
        for k, chunk in enumerate(chunks):
            text = " ".join(w for w, _, _ in chunk)
            start = line["start"] if k == 0 else chunk[0][1]
            end = line["end"] if k == len(chunks) - 1 else chunk[-1][2]
            caps.append({"line": line["id"], "text": text, "lines": wrap(text), "start": start, "end": end + TAIL})

    for i, c in enumerate(caps):
        c["id"] = f"C{i + 1:02d}"
        if i + 1 < len(caps):
            c["end"] = min(c["end"], caps[i + 1]["start"] - GAP)
        c["start"], c["end"] = round(c["start"], 3), round(c["end"], 3)

    # The captions must reproduce the script exactly, line by line.
    for line in timeline["lines"]:
        joined = " ".join(c["text"] for c in caps if c["line"] == line["id"])
        assert joined == line["text"], (joined, line["text"])

    out = ROOT / "subtitles"
    out.mkdir(exist_ok=True)
    (out / "captions.json").write_text(json.dumps({"captions": caps}, indent=2) + "\n")
    srt = [f"{i + 1}\n{stamp(c['start'], ',')} --> {stamp(c['end'], ',')}\n" + "\n".join(c["lines"]) + "\n" for i, c in enumerate(caps)]
    (out / "tokenisation-explainer.srt").write_text("\n".join(srt))
    vtt = ["WEBVTT\n"] + [f"{stamp(c['start'], '.')} --> {stamp(c['end'], '.')}\n" + "\n".join(c["lines"]) + "\n" for c in caps]
    (out / "tokenisation-explainer.vtt").write_text("\n".join(vtt))
    print(f"{len(caps)} captions written")


if __name__ == "__main__":
    main()
