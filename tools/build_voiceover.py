"""Synthesise the voiceover from the script and build the master timeline.

Voice: Kokoro 82M (Apache 2.0), voice af_heart, run locally.

Reads  script/script.json
Writes audio/voiceover/Lxx.wav        one clean take per script line, 24 kHz mono
       audio/voiceover/voiceover.flac the full voice track, 48 kHz mono
       script/timeline.json           line, word and scene timings for every other step
       animation/timeline.js          the same timeline, loadable by the animation page
"""

import json
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parent.parent
TTS_SR = 24000
OUT_SR = 48000

LEAD_IN = 0.5       # silence before the first line
LINE_GAP = 0.27     # pause between lines inside a scene
SCENE_GAP = 0.72    # pause between scenes, where transitions happen
TAIL = 3.4          # end card hold after the last line
SCENE_LEAD = 0.55   # a scene starts this long before its first line


def trim(audio, threshold=0.004, pad=0.03):
    idx = np.where(np.abs(audio) > threshold)[0]
    if len(idx) == 0:
        return audio, 0.0
    a = max(0, idx[0] - int(pad * TTS_SR))
    b = min(len(audio), idx[-1] + int(pad * TTS_SR))
    return audio[a:b], a / TTS_SR


def synthesise(pipeline, text, voice, speed):
    chunks, words, offset = [], [], 0.0
    for result in pipeline(text, voice=voice, speed=speed):
        audio = result.audio.detach().cpu().numpy() if hasattr(result.audio, "detach") else np.asarray(result.audio)
        for tok in getattr(result, "tokens", None) or []:
            if tok.start_ts is None or tok.end_ts is None:
                continue
            words.append({"word": tok.text, "start": offset + tok.start_ts, "end": offset + tok.end_ts})
        chunks.append(audio)
        offset += len(audio) / TTS_SR
    return np.concatenate(chunks), words


def main():
    from kokoro import KPipeline

    script = json.loads((ROOT / "script" / "script.json").read_text())
    voice = script["voice"]["voice"]
    speed = script["voice"]["speed"]
    pipeline = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")

    out_dir = ROOT / "audio" / "voiceover"
    out_dir.mkdir(parents=True, exist_ok=True)

    lines, scenes, takes = [], [], []
    cursor = LEAD_IN
    for si, scene in enumerate(script["scenes"]):
        if si > 0:
            cursor += SCENE_GAP - LINE_GAP
        scene_start = 0.0 if si == 0 else cursor - SCENE_LEAD
        for li, line in enumerate(scene["lines"]):
            audio, words = synthesise(pipeline, line.get("tts", line["text"]), voice, speed)
            audio, cut = trim(audio)
            dur = len(audio) / TTS_SR
            sf.write(out_dir / f"{line['id']}.wav", audio.astype(np.float32), TTS_SR, subtype="PCM_16")
            words = [
                {"word": w["word"], "start": round(cursor + w["start"] - cut, 3), "end": round(cursor + w["end"] - cut, 3)}
                for w in words
            ]
            lines.append({
                "id": line["id"],
                "scene": scene["id"],
                "text": line["text"],
                "start": round(cursor, 3),
                "end": round(cursor + dur, 3),
                "words": words,
            })
            takes.append((cursor, audio))
            print(f"{line['id']}  {cursor:6.2f}s  {dur:5.2f}s  {line['text']}")
            cursor += dur + LINE_GAP
        # Optional extra hold so a scene's last visual beat can land before the cut.
        cursor += scene.get("hold_after", 0.0)
        scenes.append({"id": scene["id"], "name": scene["name"], "start": round(scene_start, 3)})

    duration = round(lines[-1]["end"] + TAIL, 3)
    for i, scene in enumerate(scenes):
        scene["end"] = scenes[i + 1]["start"] if i + 1 < len(scenes) else duration

    by_id = {l["id"]: l for l in lines}
    chimes = [
        {"time": round(by_id["L09"]["start"] - 0.2, 3), "note": 81, "label": "wallet verified"},
        {"time": round(by_id["L14"]["start"] + 1.0, 3), "note": 85, "label": "transfer settled"},
        {"time": round(by_id["L19"]["end"] + 0.4, 3), "note": 78, "label": "end card"},
    ]

    track = np.zeros(int(duration * OUT_SR) + OUT_SR)
    for start, audio in takes:
        up = resample_poly(audio, OUT_SR // TTS_SR, 1)
        s0 = int(start * OUT_SR)
        track[s0:s0 + len(up)] += up
    track = track[: int(duration * OUT_SR)]
    sf.write(out_dir / "voiceover.flac", track.astype(np.float32), OUT_SR, subtype="PCM_24")

    timeline = {
        "fps": 30,
        "width": 1920,
        "height": 1080,
        "duration": duration,
        "voice": {"engine": "Kokoro 82M", "voice": voice, "speed": speed},
        "scenes": scenes,
        "lines": lines,
        "chimes": chimes,
    }
    (ROOT / "script" / "timeline.json").write_text(json.dumps(timeline, indent=2) + "\n")
    # The animation reads the same timeline as a script tag, so it also works from file://.
    (ROOT / "animation" / "timeline.js").write_text(
        "// Generated by tools/build_voiceover.py. Do not edit by hand.\n"
        f"window.TIMELINE = {json.dumps(timeline)};\n"
    )
    words = sum(len(l["text"].split()) for l in lines)
    print(f"duration {duration:.2f}s, {words} words, {words / (duration / 60):.0f} wpm overall")


if __name__ == "__main__":
    main()
