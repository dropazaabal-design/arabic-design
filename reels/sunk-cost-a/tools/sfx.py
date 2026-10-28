"""Reel A's own effects (numpy synthesis, seeded): the hall (projector whirr + low room hum), the ticket printer,
a splash and bubbles, fast clock ticks, the dinosaur's silly tune, the night street (crickets + distant traffic).
Library effects (pop, whoosh, crinkle, thud…) are imported from reels/mukarram and reels/doublethink instead.
usage: python3 tools/sfx.py → assets/sfx/*.wav   (same approach as reels/idea-flight/tools/sfx.py)"""
import wave
from pathlib import Path

import numpy as np

SR = 48000
OUT = Path(__file__).resolve().parent.parent / 'assets/sfx'
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(21)
T = lambda s: np.arange(int(SR * s)) / SR


def lp(x, a):
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc); y[i] = acc
    return y


def fade(x, a=0.05, b=0.2):
    n = len(x); e = np.ones(n)
    e[:int(a * SR)] = np.linspace(0, 1, int(a * SR)); e[n - int(b * SR):] = np.linspace(1, 0, int(b * SR))
    return x * e


def save(name, x, peak):
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    with wave.open(str(OUT / f'{name}.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
    print(name, f'{len(x) / SR:.2f}s')


# hall: projector whirr (24 Hz flutter on band noise) + 50 Hz hum, 30 s (looped by the reel)
t = T(30)
whirr = lp(rng.standard_normal(len(t)), 0.08) * (0.6 + 0.4 * np.sin(2 * np.pi * 24 * t) ** 2)
hum = np.sin(2 * np.pi * 50 * t) * 0.5 + np.sin(2 * np.pi * 100 * t) * 0.2
save('hall', fade(whirr / np.max(np.abs(whirr)) + hum * 0.6, 0.3, 0.3), 0.3)

# printer: a dot-matrix burst (fast clicks under a buzz), 0.6 s
t = T(0.6)
clicks = (np.sin(2 * np.pi * 38 * t) > 0.6).astype(float) * rng.standard_normal(len(t))
save('printer', fade(clicks * 0.8 + np.sign(np.sin(2 * np.pi * 220 * t)) * 0.15, 0.01, 0.08), 0.6)

# splash: noise burst falling in pitch, then bubbles: short rising sine blips
t = T(0.9)
spl = lp(rng.standard_normal(len(t)), 0.35) * np.exp(-t * 7)
save('splash', fade(spl, 0.005, 0.2), 0.7)
t = T(1.6); bub = np.zeros(len(t))
for k in range(9):
    t0 = 0.08 + k * 0.16 + rng.uniform(0, 0.05); m = (t >= t0) & (t < t0 + 0.06); u = (t[m] - t0) / 0.06
    bub[m] += np.sin(2 * np.pi * np.cumsum(500 + 900 * u) / SR) * np.sin(np.pi * u)
save('bubbles', bub, 0.5)

# ticks: a clock running fast (accelerating ticks), 4.5 s
t = T(4.5); tk = np.zeros(len(t)); s, gap = 0.05, 0.5
while s < 4.4:
    i = int(s * SR); n = int(0.012 * SR); tk[i:i + n] += np.sin(2 * np.pi * 2800 * T(0.012)[:len(tk[i:i + n])]) * np.exp(-np.arange(len(tk[i:i + n])) / 120)
    s += gap; gap = max(0.07, gap * 0.86)
save('ticks', tk, 0.6)

# song: the dinosaur's tune — a square-ish melody, cheap and sincere, 3 s
notes = [392, 440, 494, 440, 392, 330, 392, 523]
t = T(3.0); song = np.zeros(len(t))
for k, f in enumerate(notes):
    m = (t >= k * 0.36) & (t < k * 0.36 + 0.32); u = t[m] - k * 0.36
    song[m] += (np.sign(np.sin(2 * np.pi * f * u)) * 0.5 + np.sin(2 * np.pi * f * 2 * u) * 0.3) * np.exp(-u * 3)
save('song', fade(lp(song, 0.4), 0.01, 0.2), 0.45)

# night: crickets (gated 4.4 kHz chirps) over distant traffic rumble, 14 s
t = T(14)
gate = (np.sin(2 * np.pi * 3.1 * t) > 0.55) * (np.sin(2 * np.pi * 45 * t) > 0)
crick = np.sin(2 * np.pi * 4400 * t) * gate * 0.25
rumble = lp(rng.standard_normal(len(t)), 0.01)
save('night', fade(crick + rumble / np.max(np.abs(rumble)) * 0.5, 0.4, 0.6), 0.3)
