# Production Plan and Notes

## 1. The example asset

**An illustrative Australian wholesale fund, structured as a unit trust.** Investors hold units, recorded on a unit register. The fund is not named and is labelled "Illustrative example" on screen throughout.

Why this asset:

- Tokeniser's own home page leads with funds: "Give your Australian fund a global edge".
- Tokeniser's Knowledge Hub publishes the process step by step in "How to tokenise a fund in Australia" and "How does Tokeniser work?". The film follows those pages, so the fact check can follow them too.
- Unit trusts and the wholesale investor test are both named in the supplied resources, so nothing about the asset has to be invented.

## 2. Story

One idea runs through the film: **same fund, same strategy, same licence, new infrastructure.** The asset does not change. How ownership is recorded, checked and moved does.

| # | Scene | Approx. time | What the viewer learns |
|---|-------|--------------|------------------------|
| 1 | The fund | 0:00 | A wholesale fund, investors holding units, a unit register. The question. |
| 2 | Today | 0:07 | Separate systems, manual checks, settlement in days. |
| 3 | Step 1: Legal review | 0:13 | Trust deed review. Existing AFSL covers it. No separate tokenisation licence. |
| 4 | Step 2: Set the rules | 0:23 | Eligibility, foreign ownership limit, lock-up period, set on Tokeniser and written into the token. |
| 5 | Step 3: Verify investors | 0:33 | Identity, AML screening, investor classification. Unverified wallets cannot receive tokens. |
| 6 | Step 4: Issue on Redbelly | 0:43 | Tokens issued on Redbelly Network into verified wallets. Register live from the first token. |
| 7 | Step 5: Transfers | 0:51 | Rule check before the network. A rejected transfer and a settled one. |
| 8 | The Redbelly layer | 1:00 | What sits underneath: six facts from the supplied pages. |
| 9 | Close | 1:18 | Same fund, now compliant tokens. End card. |

The exact script, with timecodes, on screen text, visuals and sources, is in [`script/script.md`](../script/script.md) and the PDF in `deliverables/`.

## 3. Writing rules applied

- Plain words for a viewer with no crypto background. The voiceover spells out what the screen abbreviates: "licence" for AFSL, "anti-money laundering screening" for AML. "On chain" is the one technical phrase, and the visuals carry its meaning.
- Every Redbelly or Tokeniser claim is a close paraphrase of a quote from the supplied pages. Where a line simplifies, the script document says how.
- No numbers that could read as price, value, return or performance. No market sizes, fees, savings or throughput figures.
- DAO voice rules: plain hyphens only, no em or en dashes, no emoji, no filler verbs, short sentences.

## 4. Voice

| Item | Choice |
|------|--------|
| Engine | Kokoro 82M, open weight text to speech, Apache License 2.0 |
| Voice | `af_heart`, the model's highest graded voice |
| Speed | 1.1, which lands at about 137 words per minute overall including pauses |
| Pronunciation | Inline phoneme overrides for "Redbelly" and "Tokeniser", so the brand names are said the same way every time |
| Timing | Each line is generated, trimmed and placed with set pauses: 0.27 s inside a scene, 0.72 s between scenes, an extra 0.8 s hold after the transfer step |

Kokoro returns a timestamp for every word. The animation uses those timestamps as cues, so a rule switches on as it is named and a fact card appears as it is spoken.

## 5. Music and sound

- An original bed generated in code: a soft four chord pad (D major 9, B minor 9, G major 9, A6 sus2) at 84 BPM, a low sine bass and a quiet eighth note arpeggio during the five steps.
- Transition swells made from filtered noise, and three soft chimes: wallet verified, transfer settled, end card.
- The music ducks 7 dB under every spoken line. The final mix is normalised to -16 LUFS integrated with a -1.5 dBTP ceiling.

## 6. Visual approach

- Tokeniser themed: light surfaces with a faint dot grid, white cards with 1 px borders, deep slate bands, mint for verified and settled states.
- The Redbelly layer switches to Redbelly navy with the official negative logo, so the two layers of the stack read as two brands.
- Readex Pro for all text. JetBrains Mono only for wallet addresses and the live status label.
- A five step tracker at the top keeps the viewer oriented through the process.
- Motion is eased fades, slides, draws and toggles. Scenes clear before the next one builds. No bounces, particles or hype effects.
- Captions sit in a fixed band at the bottom, on a navy plate, at most two lines of 42 characters.

## 7. Pipeline

```
script/script.json + script/sources.json
   |
   |-- tools/build_voiceover.py  -> audio/voiceover/, script/timeline.json, animation/timeline.js
   |-- tools/build_music.py      -> audio/music/
   |-- tools/build_subtitles.py  -> subtitles/ (JSON, SRT, VTT)
   |-- tools/render_frames.js    -> PNG frames at 1920 x 1080, 30 fps, plus caption overlays
   |-- tools/mix_audio.py        -> audio/final_mix.flac
   |-- tools/encode_video.py     -> deliverables/*.mp4, .srt, .vtt
   |-- tools/build_script_doc.py -> deliverables/*-script.docx, build/script.html
   |-- tools/html_to_pdf.js      -> deliverables/*-script.pdf
   `-- tools/verify.py           -> docs/qa-report.md
```

`tools/build_all.sh` runs the whole chain.

## 8. Verification

`tools/verify.py` fails the build if any of these is untrue:

- All deliverables and licence files exist.
- Both videos are H.264 MP4, 16:9, at least 1080p and 24 fps, 60 to 90 seconds long, and match the timeline.
- Audio is AAC stereo 48 kHz, about -16 LUFS, true peak below -1 dBTP.
- Captions and timeline reproduce every script line word for word, with at most two lines of 42 characters, no overlaps and at least 1.2 seconds on screen.
- Every spoken line has verbatim evidence from a supplied page, and every factual label names a known source.
- The text rendered in the animation equals the on screen text listed in the script, scene by scene.
- Every motion cue found its spoken word in the voiceover timestamps.
- No em or en dashes, emoji, hype words, price or return language, or personal credit.

With `--online` it also re-reads every source page and confirms each quote is still there.

## 9. Known limits

- The supplied brand kits include no Tokeniser logo file, so the name is set in type. The end card takes the official logo with no other change if one is supplied.
- The voice is synthetic. It was chosen for licence certainty and reproducibility. A recorded human read can replace `audio/voiceover/` and the pipeline will re-time everything from the new takes.
- Knowledge Hub step 4 says compliant transfers settle on Redbelly in seconds. The same page notes that placeholder and omnibus wallets follow the traditional settlement sequence. The film uses the step 4 wording. The script document flags this for the fact checkers.
