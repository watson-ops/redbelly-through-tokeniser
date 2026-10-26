"""Encode the rendered frames and final mix into the deliverable MP4 files.

  python tools/encode_video.py --frames <dir> --captions <dir>

Writes deliverables/tokenisation-explainer-1080p-captions.mp4  subtitles burned in
       deliverables/tokenisation-explainer-1080p-clean.mp4     no subtitles, pair with the .srt
       deliverables/tokenisation-explainer.srt / .vtt          copied from subtitles/

Both masters are H.264 High profile, 1920 x 1080, 30 fps, yuv420p, with AAC
audio at 48 kHz, and fast start enabled for web playback.
"""

import argparse
import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "deliverables"
NAME = "tokenisation-explainer"
VIDEO = ["-c:v", "libx264", "-preset", "slow", "-crf", "16", "-profile:v", "high", "-pix_fmt", "yuv420p",
         "-r", "30", "-g", "60", "-bf", "2", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709"]
AUDIO = ["-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-ac", "2"]
META = ["-movflags", "+faststart", "-metadata", "title=From Fund to Token"]


def run(cmd):
    print(" ".join(str(c) for c in cmd[:6]), "...")
    subprocess.run([str(c) for c in cmd], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", required=True)
    ap.add_argument("--captions", required=True)
    a = ap.parse_args()

    timeline = json.loads((ROOT / "script" / "timeline.json").read_text())
    caps = json.loads((ROOT / "subtitles" / "captions.json").read_text())["captions"]
    fps = timeline["fps"]
    duration = timeline["duration"]
    mix = ROOT / "audio" / "final_mix.flac"
    frames = Path(a.frames) / "frame_%05d.png"
    OUT.mkdir(exist_ok=True)

    clean = OUT / f"{NAME}-1080p-clean.mp4"
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-framerate", fps, "-i", frames, "-i", mix,
         "-map", "0:v", "-map", "1:a", *VIDEO, *AUDIO, *META, "-t", f"{duration:.3f}", clean])

    # Burn captions by overlaying each caption image for exactly its time window.
    inputs, chain, last = [], [], "0:v"
    for i, c in enumerate(caps):
        inputs += ["-i", Path(a.captions) / f"{c['id']}.png"]
        tag = f"v{i}"
        chain.append(f"[{last}][{i + 1}:v]overlay=0:0:enable='between(t,{c['start']:.3f},{c['end']:.3f})'[{tag}]")
        last = tag
    filt = ";".join(chain)
    captioned = OUT / f"{NAME}-1080p-captions.mp4"
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-framerate", fps, "-i", frames, *inputs,
         "-i", mix, "-filter_complex", filt, "-map", f"[{last}]", "-map", f"{len(caps) + 1}:a",
         *VIDEO, *AUDIO, *META, "-t", f"{duration:.3f}", captioned])

    for ext in ("srt", "vtt"):
        shutil.copy(ROOT / "subtitles" / f"{NAME}.{ext}", OUT / f"{NAME}.{ext}")
    print(f"written: {clean.name}, {captioned.name}, {NAME}.srt, {NAME}.vtt")


if __name__ == "__main__":
    main()
