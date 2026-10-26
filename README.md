# From Fund to Token

An 88 second animated explainer that shows, step by step and in plain language, how a regulated fund becomes a compliant token on Redbelly Network through Tokeniser.

The example is an illustrative Australian wholesale fund (a unit trust). The film follows the five steps Tokeniser documents in its own Knowledge Hub, and every claim it makes about Redbelly or Tokeniser is backed by a verbatim quote from the resources supplied with the brief.

Made for the Redbelly DAO Community Task Board. Intended for Tokeniser marketing, the DAO website and the Start Here hub.

## Deliverables

| # | Deliverable | File |
|---|-------------|------|
| 1 | Script, as a shared document | [`deliverables/tokenisation-explainer-script.pdf`](deliverables/tokenisation-explainer-script.pdf) and [`.docx`](deliverables/tokenisation-explainer-script.docx) |
| 2 | Final video, subtitles burned in | [`deliverables/tokenisation-explainer-1080p-captions.mp4`](deliverables/tokenisation-explainer-1080p-captions.mp4) |
| 2 | Final video, clean, with separate subtitles | [`deliverables/tokenisation-explainer-1080p-clean.mp4`](deliverables/tokenisation-explainer-1080p-clean.mp4), [`.srt`](deliverables/tokenisation-explainer.srt), [`.vtt`](deliverables/tokenisation-explainer.vtt) |
| 3 | Project files | This repository: [`animation/`](animation/), [`audio/`](audio/), [`script/`](script/), [`tools/`](tools/), [`brand/`](brand/) |
| 4 | Licence proof | [`licences/`](licences/README.md) |

**Video:** 16:9, 1920 x 1080, 30 fps, H.264 High profile MP4, AAC 48 kHz stereo, 88.2 seconds, loudness -16 LUFS with a -1.5 dBTP ceiling.

## The story

| Time | Scene | What the viewer learns |
|------|-------|------------------------|
| 0:00 | The fund | A wholesale fund in Australia. Investors hold units on a register. How does it become a token on Redbelly? |
| 0:07 | Today | Registers sit across separate systems, checks are manual, settlement takes days. |
| 0:13 | Step 1: Legal review | The trust deed is checked for on chain ownership. The existing licence covers it. No separate tokenisation licence. |
| 0:23 | Step 2: Set the rules | On Tokeniser, the manager sets who can invest, foreign ownership limits and lock-up periods. The rules are written into the token. |
| 0:33 | Step 3: Verify investors | Identity, anti-money laundering screening and investor classification first. No tokens until then. |
| 0:43 | Step 4: Issue on Redbelly | Tokens are issued on Redbelly Network into verified wallets. The register is live from the first token. |
| 0:51 | Step 5: Transfers | Every transfer is checked against the rules first. Break a rule and it is rejected. Pass and it settles in seconds. |
| 1:00 | The Redbelly layer | Public digital token infrastructure, identity verified at protocol level, final transactions, formally verified consensus, Project Acacia. |
| 1:18 | Close | Same fund, same strategy, same licence. Now its units are compliant tokens on Redbelly, through Tokeniser. |

Full script with timecodes, on screen text and visuals: [`script/script.md`](script/script.md).

## How accuracy is enforced

1. [`script/sources.json`](script/sources.json) holds 43 verbatim quotes from 13 pages of the supplied resources, read on 26 October 2026.
2. [`script/script.json`](script/script.json) is the single source of truth. Every voiceover line carries the exact quotes that support it, and every factual on screen label names its sources.
3. The voiceover, captions, animation cues and script document are all generated from that file, so the video cannot drift from the script.
4. [`tools/verify.py`](tools/verify.py) checks the whole chain and writes [`docs/qa-report.md`](docs/qa-report.md). With `--online` it re-reads every source page and confirms each quote is still there, word for word.

Things the resources mention but the film leaves out on purpose (prices, market sizes, cost savings, throughput figures that differ between pages, liquidity promises) are listed in [`docs/sources.md`](docs/sources.md).

## Repository layout

```
animation/     Scene builder (scenes.js), styles, page, generated timeline.js
audio/
  voiceover/   One take per script line, plus the full voice track
  music/       Original music bed and transition sounds
  final_mix.flac  Mixed and loudness normalised soundtrack
brand/         Design tokens, Readex Pro and JetBrains Mono, official Redbelly logos
deliverables/  The files to submit
docs/          Brief and checklist, production plan, brand application, sources, QA report
licences/      Licence register, licence texts, provenance notes
script/        script.json, sources.json, timeline.json, readable script.md
subtitles/     Captions as JSON, SRT and VTT
tools/         Build, render, mix, encode, document and verification scripts
```

## Rebuild from source

Requirements: Python 3.10 to 3.12, Node.js 18 or later with Playwright and Chromium, FFmpeg.

```bash
python3.12 -m venv .venv
.venv/bin/pip install torch --index-url https://download.pytorch.org/whl/cpu
.venv/bin/pip install -r requirements.txt
.venv/bin/pip install --no-deps https://huggingface.co/spacy/en_core_web_sm/resolve/main/en_core_web_sm-any-py3-none-any.whl
npm install playwright && npx playwright install chromium

PYTHON=.venv/bin/python tools/build_all.sh            # full rebuild, then verification
PYTHON=.venv/bin/python tools/build_all.sh --online   # also re-check every quote against the live pages
```

To preview the animation without rendering, open `animation/index.html` in a browser. Add `#play` to the address to play it in real time, or `#t=45` to jump to a moment.

Each step can also run on its own:

| Step | Command | Output |
|------|---------|--------|
| Voiceover and timeline | `python tools/build_voiceover.py` | `audio/voiceover/`, `script/timeline.json`, `animation/timeline.js` |
| Music | `python tools/build_music.py` | `audio/music/` |
| Captions | `python tools/build_subtitles.py` | `subtitles/` |
| Frames | `node tools/render_frames.js --out build/frames --captions build/captions` | PNG frames and caption overlays |
| Mix | `python tools/mix_audio.py` | `audio/final_mix.flac` |
| Encode | `python tools/encode_video.py --frames build/frames --captions build/captions` | `deliverables/*.mp4`, `.srt`, `.vtt` |
| Script document | `python tools/build_script_doc.py` then `node tools/html_to_pdf.js build/script.html deliverables/tokenisation-explainer-script.pdf` | PDF, DOCX, `script/script.md`, `docs/sources.md` |
| Verify | `python tools/verify.py [--online]` | `docs/qa-report.md` |

## Brand

The look follows Tokeniser's own site: light surfaces, deep slate bands, a mint accent. Type is Readex Pro from the Redbelly brand kit, with JetBrains Mono for wallet addresses only. Redbelly red appears only on the Redbelly Network layer and logo. Copy follows the DAO Task Board voice rules. Details: [`docs/brand-application.md`](docs/brand-application.md).

## Licences

Every font and the voice model allow commercial use. The music and all illustration were made for this project. No stock media is used anywhere. Register and licence texts: [`licences/`](licences/README.md).
