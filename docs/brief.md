# Brief and Acceptance Checklist

## The task

Make a 60 to 90 second animated explainer showing how a regulated real world asset is tokenised on Redbelly through Tokeniser.

Tokenisation is Redbelly's core story, and most people outside the industry still cannot picture what it means in practice. This explainer takes one regulated asset and shows, step by step and in plain language, how it becomes a compliant token on Redbelly through Tokeniser.

**Used in:** Tokeniser marketing, the DAO website, the Start Here hub.

**How it is checked:** reviewers assess every submission first. Scripts of shortlisted entries go to the Redbelly team for a factual check. Anything flagged comes back as a revision.

## Scope, and how this submission covers it

| Scope item | This submission |
|------------|-----------------|
| One realistic regulated asset | An illustrative Australian wholesale fund, structured as a unit trust. Tokeniser's own guide covers this fund type step by step. |
| Short script, real world asset to token, only facts from the supplied resources | 19 voiceover lines, 202 words. Each line carries verbatim supporting quotes in `script/script.json`. |
| Clean, corporate animation at home next to Tokeniser's site | Tokeniser's light and slate palette, Readex Pro, line icons, eased motion only. |
| Voiceover, on screen text, or both | Both, plus captions that match the voiceover word for word. |
| Script as a shared document | PDF and DOCX in `deliverables/`. |

## Required deliverables

| # | Deliverable | Spec | Delivered |
|---|-------------|------|-----------|
| 1 | Script | Google Doc, Word file or PDF | `tokenisation-explainer-script.pdf` and `.docx` |
| 2 | Final video | 60 to 90 s, 16:9, 1080p or higher, 24 fps or higher, MP4 or MOV, subtitles burned in or as a separate file | 88.2 s, 1920 x 1080, 30 fps, H.264 MP4. One master with burned in captions, one clean master with `.srt` and `.vtt` |
| 3 | Project files | From whatever tools were used | The whole repository: animation source, audio pipeline, script data, render and encode tools |
| 4 | Licence proof | Music, voice, stock footage or fonts not self made | `licences/`: OFL texts for both fonts, Apache 2.0 text and provenance for the voice model, brand kit record for the Redbelly logos |

## Quality benchmarks

| Benchmark | How it is met |
|-----------|---------------|
| Someone with no crypto background understands how the asset becomes a token after one watch | One fund, five numbered steps, a step tracker on screen, plain words, captions on every line, no jargon left unexplained on screen |
| Every claim about Redbelly and Tokeniser matches the script and the supplied resources | Video, captions and script document are generated from one script file. Every spoken line and factual label is tied to a verbatim quote. `tools/verify.py` checks both links |
| Tokeniser themed, corporate tone | Palette read from tokeniser.com, Redbelly type and logos from the brand kit, DAO voice rules for copy |
| Clean render, smooth motion, clear and balanced audio | Frame exact render at 1920 x 1080, 30 fps. Music ducks under speech. Mix at -16 LUFS, -1.5 dBTP ceiling |

## Failure criteria

| Failure condition | Status |
|-------------------|--------|
| No script, or a video that differs from its script | Clear. Script PDF and DOCX included. Captions and on screen text are checked against the script automatically |
| Any wrong or unsupported claim about Redbelly or Tokeniser | Clear. All quotes verified against the supplied pages. Nuances are noted for the fact checkers in the script document |
| Price talk, investment advice or promises of returns | Clear. No prices, figures or return language. An automated check scans all film text |
| Cartoon, meme or hype styling | Clear. Flat corporate design, no characters, no hype words |
| Any asset without a commercial use licence | Clear. Fonts OFL 1.1, voice model Apache 2.0, music and graphics original, logos from the official kit |
| Personal credit inside the deliverable | Clear. No names, handles, signatures, watermarks or "made by" lines in the video, captions or script document |

## Scoring criteria

| # | Criterion | Where to look |
|---|-----------|---------------|
| 1 | Deliverable completeness | `deliverables/`, `licences/`, this repository |
| 2 | Quality benchmarks met | Table above, `docs/production-plan.md` |
| 3 | Technical accuracy | Script document fact check section, `docs/sources.md` |
| 4 | Documentation quality | `README.md`, `docs/`, `licences/` |
| 5 | Test coverage and verification | `tools/verify.py`, `docs/qa-report.md` |
| 6 | Failure criteria | Table above, `docs/qa-report.md` |
| 7 | Overall standard | The film |

## Supplied resources

- Tokeniser website (product, technology, why tokenise, knowledge hub): https://tokeniser.com
- Redbelly asset tokenisation: https://redbelly.network/asset-tokenisation
- Redbelly Network website: https://redbelly.network
- Redbelly brand kit (logos, Readex Pro, colours): https://redbelly.network/brand
- Task Board brand kit (colours, type, logo rules and voice): https://taskboard.redbellydao.network/brand
