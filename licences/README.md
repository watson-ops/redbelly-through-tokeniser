# Licence Register

Every font, voice and brand asset in the deliverables that was not made for this project is listed here, with the licence that allows its use and the proof stored in this folder. Nothing in the film is stock footage, stock photography, stock music or a stock voice.

## Third party assets

| Asset | Type | Used for | Licence | Commercial use | Proof in this folder |
|-------|------|----------|---------|----------------|----------------------|
| Readex Pro | Typeface | All on screen text, captions, script document | SIL Open Font License 1.1 | Allowed, including embedding | [`OFL-ReadexPro.txt`](OFL-ReadexPro.txt) |
| JetBrains Mono | Typeface | Wallet addresses and live status labels | SIL Open Font License 1.1 | Allowed, including embedding | [`OFL-JetBrainsMono.txt`](OFL-JetBrainsMono.txt) |
| Kokoro 82M, voice `af_heart` | Text to speech model | Voiceover | Apache License 2.0 | Allowed | [`Apache-2.0-Kokoro.txt`](Apache-2.0-Kokoro.txt), [`kokoro-voice-provenance.md`](kokoro-voice-provenance.md) |
| Redbelly Network logos | Brand assets | Redbelly layer and end card | Supplied in the official Redbelly brand kit for use under its brand guidelines | Supplied by the brand owner for brand use | [`redbelly-brand-assets.md`](redbelly-brand-assets.md) |

## Made for this project

These are original to this repository, so no third party licence applies. Their full source is included.

| Asset | Source |
|-------|--------|
| Music bed and transition sounds | Synthesised from sine waves and filtered noise by [`tools/build_music.py`](../tools/build_music.py) |
| Icons, token, illustrations | Hand written SVG paths in [`animation/scenes.js`](../animation/scenes.js) |
| Project logo (`web/logo-light.svg`, `web/logo-dark.svg`, `web/mark.svg`) | Token mark drawn for this project. Wordmark outlined from Readex Pro, which the SIL Open Font License 1.1 allows. Built by [`tools/build_logo.py`](../tools/build_logo.py) |
| Animation | HTML, CSS and JavaScript in [`animation/`](../animation/) |
| Script and captions | [`script/`](../script/) and [`tools/build_subtitles.py`](../tools/build_subtitles.py) |

## Not used

- No Tokeniser logo file. The supplied brand kits do not include one, so the name is set in Readex Pro.
- No stock footage, stock photography, stock music or stock voice.
- No third party animation library. Easing and motion are written in [`animation/scenes.js`](../animation/scenes.js).

## Software used to build (not shipped in the video)

Open source tools used to produce the files. None of them place restrictions on the rendered output.

| Tool | Role |
|------|------|
| Chromium through Playwright | Renders the animation frames and the PDF |
| FFmpeg | Encoding, loudness measurement and normalisation |
| Python with NumPy, SciPy, SoundFile, python-docx | Audio synthesis, mixing, captions, DOCX |
| PyTorch, kokoro, misaki, spaCy | Running the Kokoro voice model locally |
