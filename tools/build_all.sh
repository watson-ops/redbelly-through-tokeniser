#!/usr/bin/env bash
# Rebuild every deliverable from source, in order.
#
#   PYTHON=/path/to/venv/bin/python tools/build_all.sh
#
# Needs: Python 3.10 to 3.12 with the packages in requirements.txt, Node.js 18+
# with Playwright and Chromium, and FFmpeg on PATH.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PY="${PYTHON:-python3}"
FRAMES="$ROOT/build/frames"
CAPS="$ROOT/build/captions"
cd "$ROOT"

echo "1/8 voiceover and timeline"
"$PY" tools/build_voiceover.py
echo "2/8 music and sound"
"$PY" tools/build_music.py
echo "3/8 captions"
"$PY" tools/build_subtitles.py
echo "4/8 frames and caption overlays"
rm -rf "$FRAMES" "$CAPS"
node tools/render_frames.js --out "$FRAMES" --captions "$CAPS" --workers "${WORKERS:-4}"
echo "5/8 audio mix"
"$PY" tools/mix_audio.py
echo "6/8 video encode"
"$PY" tools/encode_video.py --frames "$FRAMES" --captions "$CAPS"
echo "7/8 script document"
"$PY" tools/build_script_doc.py
node tools/html_to_pdf.js build/script.html deliverables/tokenisation-explainer-script.pdf
echo "8/8 verification"
"$PY" tools/verify.py "$@"
