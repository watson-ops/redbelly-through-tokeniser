"""Mix voiceover, music bed and transition sounds, then loudness normalise.

The music ducks under every spoken line, using the line timings from the
timeline. The final mix is normalised with FFmpeg's two pass loudnorm to
-16 LUFS integrated with a -1.5 dBTP true peak ceiling, a common target for
web video.

Reads  audio/voiceover/voiceover.flac, audio/music/music_bed.flac,
       audio/music/sfx.flac, script/timeline.json
Writes audio/final_mix.flac   48 kHz stereo, normalised
"""

import json
import re
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
MUSIC_UNDER_VOICE_LU = 14.0   # music level below the voice before ducking
DUCK_DB = -7.0                # extra reduction while someone is speaking
SFX_OVER_MUSIC_DB = 3.0
TARGET = {"I": -16.0, "TP": -1.5, "LRA": 11.0}


def loudness(path):
    out = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128", "-f", "null", "-"],
        capture_output=True, text=True, check=True,
    ).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", out)[-1])


def speech_envelope(timeline, n):
    env = np.zeros(n)
    for line in timeline["lines"]:
        a = max(0, int((line["start"] - 0.15) * SR))
        b = min(n, int((line["end"] + 0.12) * SR))
        env[a:b] = 1.0
    # Smooth the edges so the music glides down and back up.
    k = int(0.25 * SR)
    kernel = np.hanning(2 * k + 1)
    kernel /= kernel.sum()
    return np.convolve(env, kernel, mode="same")


def main():
    timeline = json.loads((ROOT / "script" / "timeline.json").read_text())
    vo_path = ROOT / "audio" / "voiceover" / "voiceover.flac"
    music_path = ROOT / "audio" / "music" / "music_bed.flac"
    sfx_path = ROOT / "audio" / "music" / "sfx.flac"

    vo, _ = sf.read(vo_path, dtype="float64")
    music, _ = sf.read(music_path, dtype="float64")
    sfx, _ = sf.read(sfx_path, dtype="float64")
    n = int(round(timeline["duration"] * SR))

    def fit(x):
        x = x if x.ndim == 2 else np.stack([x, x], axis=1)
        out = np.zeros((n, 2))
        m = min(n, len(x))
        out[:m] = x[:m]
        return out

    vo, music, sfx = fit(vo), fit(music), fit(sfx)
    music_gain_db = (loudness(vo_path) - MUSIC_UNDER_VOICE_LU) - loudness(music_path)
    g_music = 10 ** (music_gain_db / 20)
    g_sfx = 10 ** ((music_gain_db + SFX_OVER_MUSIC_DB) / 20)
    duck = 10 ** (DUCK_DB * speech_envelope(timeline, n) / 20)

    mix = vo + music * g_music * duck[:, None] + sfx * g_sfx
    with tempfile.TemporaryDirectory() as tmp:
        raw = Path(tmp) / "raw.wav"
        sf.write(raw, mix.astype(np.float32), SR, subtype="FLOAT")
        spec = f"I={TARGET['I']}:TP={TARGET['TP']}:LRA={TARGET['LRA']}"
        first = subprocess.run(
            ["ffmpeg", "-hide_banner", "-nostats", "-i", str(raw), "-af", f"loudnorm={spec}:print_format=json", "-f", "null", "-"],
            capture_output=True, text=True, check=True,
        ).stderr
        m = json.loads(first[first.rindex("{"): first.rindex("}") + 1])
        second = (
            f"loudnorm={spec}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
            f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:"
            f"offset={m['target_offset']}:linear=true,aresample=48000"
        )
        out = ROOT / "audio" / "final_mix.flac"
        subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(raw), "-af", second,
             "-ar", "48000", "-ac", "2", "-sample_fmt", "s32", "-c:a", "flac", str(out)],
            check=True,
        )
    print(f"music gain {music_gain_db:.1f} dB, final mix {loudness(out):.1f} LUFS -> {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
