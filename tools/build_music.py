"""Generate the original music bed and transition sounds for the explainer.

Everything here is synthesised from sine waves and filtered noise, so the
music is an original work made for this project and needs no licence.

Reads  script/timeline.json   (duration and scene cue times)
Writes audio/music/music_bed.flac     48 kHz stereo pad and pulse
       audio/music/sfx.flac           48 kHz stereo transition sounds
"""

import json
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
BPM = 84
BEAT = 60 / BPM
BAR = 4 * BEAT
RNG = np.random.default_rng(20261026)

# Dmaj9, Bm9, Gmaj9, A6sus2. Two bars each. MIDI note numbers.
CHORDS = [
    [50, 57, 61, 64, 66, 69],
    [47, 54, 57, 61, 62, 66],
    [43, 50, 54, 57, 62, 66],
    [45, 52, 57, 59, 64, 66],
]
ARP = [
    [62, 66, 69, 73, 76, 73, 69, 66],
    [59, 62, 66, 69, 73, 69, 66, 62],
    [55, 59, 62, 66, 69, 66, 62, 59],
    [57, 61, 64, 66, 69, 66, 64, 61],
]


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def lowpass(x, cutoff, order=2):
    return sosfilt(butter(order, cutoff, btype="low", fs=SR, output="sos"), x)


def highpass(x, cutoff, order=2):
    return sosfilt(butter(order, cutoff, btype="high", fs=SR, output="sos"), x)


def soft_tone(freq, n, detune_cents=(-5, 0, 5)):
    """A warm, slightly chorused tone made from a few sine partials."""
    t = np.arange(n) / SR
    out = np.zeros(n)
    for c in detune_cents:
        f = freq * 2 ** (c / 1200)
        phase = RNG.uniform(0, 2 * np.pi)
        for k, amp in ((1, 1.0), (2, 0.35), (3, 0.12), (4, 0.05)):
            out += amp * np.sin(2 * np.pi * f * k * t + phase * k)
    return out / len(detune_cents)


def envelope(n, attack, release):
    env = np.ones(n)
    a, r = int(attack * SR), int(release * SR)
    env[:a] = np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    env[n - r:] *= np.cos(np.linspace(0, np.pi / 2, r)) ** 2
    return env


def pad_layer(total):
    left, right = np.zeros(total), np.zeros(total)
    seg = 2 * BAR
    overlap = 1.6
    start, i = 0.0, 0
    while start < total / SR:
        notes = CHORDS[i % len(CHORDS)]
        n = int((seg + overlap) * SR)
        s0 = int(start * SR)
        n = min(n, total - s0)
        if n <= 0:
            break
        chord = np.zeros(n)
        for j, m in enumerate(notes):
            chord += soft_tone(hz(m), n) * (0.9 if j == 0 else 0.55)
        chord *= envelope(n, 1.4, min(1.6, n / SR / 2))
        pan = 0.5 + 0.12 * np.sin(i * 1.7)
        left[s0:s0 + n] += chord * (1 - pan)
        right[s0:s0 + n] += chord * pan
        start += seg
        i += 1
    return lowpass(left, 1800), lowpass(right, 1800)


def sub_layer(total):
    out = np.zeros(total)
    seg = 2 * BAR
    start, i = 0.0, 0
    while start < total / SR:
        s0 = int(start * SR)
        n = min(int((seg + 0.8) * SR), total - s0)
        if n <= 0:
            break
        root = CHORDS[i % len(CHORDS)][0] - 12
        t = np.arange(n) / SR
        out[s0:s0 + n] += np.sin(2 * np.pi * hz(root) * t) * envelope(n, 0.8, min(1.2, n / SR / 2))
        start += seg
        i += 1
    return out


def pulse_layer(total, on, off):
    """Soft eighth note arpeggio. Plays between `on` and `off` seconds."""
    left, right = np.zeros(total), np.zeros(total)
    step = BEAT / 2
    k = 0
    t0 = 0.0
    while t0 < total / SR:
        bar_index = int(t0 // (2 * BAR))
        note = ARP[bar_index % len(ARP)][k % 8]
        s0 = int(t0 * SR)
        n = min(int(0.9 * SR), total - s0)
        if on <= t0 <= off and n > 0:
            t = np.arange(n) / SR
            tone = np.sin(2 * np.pi * hz(note) * t) + 0.25 * np.sin(2 * np.pi * hz(note) * 2 * t)
            tone *= np.exp(-t * 6.5) * (1 - np.exp(-t * 400))
            accent = 1.0 if k % 4 == 0 else 0.7
            pan = 0.35 if k % 2 == 0 else 0.65
            left[s0:s0 + n] += tone * accent * (1 - pan)
            right[s0:s0 + n] += tone * accent * pan
        t0 += step
        k += 1
    # Fade the pulse in and out so it never starts or stops abruptly.
    ramp = np.ones(total)
    t = np.arange(total) / SR
    ramp *= np.clip((t - on) / 2.0, 0, 1)
    ramp *= np.clip((off - t) / 2.5, 0, 1)
    return lowpass(left * ramp, 3200), lowpass(right * ramp, 3200)


def whoosh(n):
    """Filtered noise swell for scene transitions."""
    noise = RNG.standard_normal(n)
    t = np.linspace(0, 1, n)
    shaped = highpass(lowpass(noise, 2400), 300)
    env = np.sin(np.pi * t) ** 3
    return shaped * env


def chime(n, freq):
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2.01 * t)
    return tone * np.exp(-t * 3.2) * (1 - np.exp(-t * 300))


def main():
    timeline = json.loads((ROOT / "script" / "timeline.json").read_text())
    duration = timeline["duration"]
    total = int(duration * SR)

    pl, pr = pad_layer(total)
    sub = sub_layer(total)
    first_step = timeline["scenes"][2]["start"]
    close = timeline["scenes"][-1]["start"]
    ql, qr = pulse_layer(total, first_step - 1.0, close + 1.0)

    left = 0.42 * pl + 0.18 * sub + 0.10 * ql
    right = 0.42 * pr + 0.18 * sub + 0.10 * qr

    t = np.arange(total) / SR
    fade = np.clip(t / 2.0, 0, 1) * np.clip((duration - t) / 3.0, 0, 1)
    bed = np.stack([left * fade, right * fade], axis=1)
    bed /= np.max(np.abs(bed)) + 1e-9
    bed *= 0.5

    sfx = np.zeros((total, 2))
    for i, scene in enumerate(timeline["scenes"][1:], start=1):
        n = int(0.9 * SR)
        s0 = max(0, int((scene["start"] - 0.45) * SR))
        w = whoosh(n) * 0.18
        sfx[s0:s0 + n, 0] += w[: len(sfx[s0:s0 + n])]
        sfx[s0:s0 + n, 1] += w[: len(sfx[s0:s0 + n])]
    for cue in timeline.get("chimes", []):
        n = int(1.4 * SR)
        s0 = int(cue["time"] * SR)
        c = chime(n, hz(cue.get("note", 81))) * 0.10
        seg = sfx[s0:s0 + n]
        seg[:, 0] += c[: len(seg)]
        seg[:, 1] += c[: len(seg)]

    out = ROOT / "audio" / "music"
    out.mkdir(parents=True, exist_ok=True)
    sf.write(out / "music_bed.flac", bed.astype(np.float32), SR, subtype="PCM_24")
    sf.write(out / "sfx.flac", sfx.astype(np.float32), SR, subtype="PCM_24")
    print(f"music bed {duration:.2f}s written")


if __name__ == "__main__":
    main()
