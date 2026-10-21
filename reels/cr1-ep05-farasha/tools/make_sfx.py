"""Synthesised sound effects for «تأثير الفراشة» beyond the series set (no samples, no licences).
Seeded, so rebuilds match.

  typing   teleprinter clatter (the computer printing its rows), 2.4 s
  clunk    a heavy start button and the relay behind it
  hum      the machine running: mains hum and fan noise, 3 s (looped by placement)
  door     latch click and a short soft creak
  mug      ceramic mug set on a desk
  sip      a short sip
  flutter  butterfly wings: soft paired air puffs
  wind     a soft rising swirl for the storm
  chalk    chalk strokes on a board
  note_a / note_b / note_c   soft piano-like notes (struck partials, slow decay) for the two musical beats

usage: python3 tools/make_sfx.py   → public/sfx/*.wav (48 kHz mono)
"""
import wave
from pathlib import Path

import numpy as np

SR = 48000
out = Path(__file__).resolve().parent.parent / 'public/sfx'
rng = np.random.default_rng(5)
t = lambda d: np.arange(int(d * SR)) / SR


def env(n, a, r):
    e = np.ones(n)
    a, r = max(1, int(a * SR)), max(1, int(r * SR))
    e[:a] = np.linspace(0, 1, a)
    e[n - r:] *= np.linspace(1, 0, r)
    return e


def band(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))


def save(name, x, peak=0.7):
    x = x / (np.abs(x).max() + 1e-9) * peak
    with wave.open(str(out / f'{name}.wav'), 'wb') as w:
        w.setnchannels(1), w.setsampwidth(2), w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


def place(dst, src, at):
    i = int(at * SR)
    j = min(len(dst), i + len(src))
    dst[i:j] += src[:j - i]


# typing: key strikes at a teleprinter's steady rate (~10 a second, with small jitter) and a carriage bell-less return
d = 2.4
x = np.zeros(int(d * SR))
strike = lambda: band(rng.standard_normal(int(0.025 * SR)), 1500, 8000) * np.exp(-t(0.025) * 160) + \
    np.sin(2 * np.pi * 180 * t(0.025)) * np.exp(-t(0.025) * 90) * 0.6
k = 0.0
while k < d - 0.05:
    place(x, strike() * (0.7 + 0.3 * rng.random()), k)
    k += 0.095 + rng.normal(0, 0.008)
save('typing', x * env(len(x), 0.005, 0.05), 0.5)

# clunk: a heavy latching button and a relay click 80 ms later
n = int(0.3 * SR)
x = np.sin(2 * np.pi * 75 * t(0.3)) * np.exp(-t(0.3) * 30) + band(rng.standard_normal(n), 300, 3000) * np.exp(-t(0.3) * 70) * 0.6
place(x, band(rng.standard_normal(int(0.02 * SR)), 2000, 9000) * np.exp(-t(0.02) * 200) * 0.5, 0.08)
save('clunk', x, 0.65)

# hum: 60 Hz mains with harmonics and a breathy fan, 3 s, soft edges for overlap
d = 3.0
x = sum(a * np.sin(2 * np.pi * 60 * h * t(d)) for a, h in ((1, 1), (0.5, 2), (0.25, 3), (0.12, 5)))
x = x * 0.5 + band(rng.standard_normal(int(d * SR)), 200, 1800) * 0.35
save('hum', x * env(len(x), 0.4, 0.4), 0.4)

# door: latch, then a short creak (a slow pitch glide with rough amplitude)
latch = band(rng.standard_normal(int(0.04 * SR)), 1200, 7000) * np.exp(-t(0.04) * 120)
d = 0.55
ph = 2 * np.pi * np.cumsum(260 + 90 * t(d) / d) / SR
creak = np.sin(ph) * (0.5 + 0.5 * (rng.random(int(d * SR)) < 0.3)) * env(int(d * SR), 0.05, 0.2) * 0.35
save('door', np.concatenate([latch, np.zeros(int(0.05 * SR)), band(creak, 150, 3000)]), 0.5)

# mug: ceramic on wood — a short resonant knock
d = 0.35
x = sum(a * np.sin(2 * np.pi * f0 * t(d)) * np.exp(-t(d) * k) for a, f0, k in ((1, 1850, 22), (0.6, 2950, 30), (0.3, 4400, 40)))
x += band(rng.standard_normal(int(d * SR)), 200, 2000) * np.exp(-t(d) * 60) * 0.5
save('mug', x, 0.5)

# sip: a short airy slurp
d = 0.4
x = band(rng.standard_normal(int(d * SR)), 600, 3500) * np.sin(np.pi * t(d) / d) ** 2 * (0.6 + 0.4 * np.sin(2 * np.pi * 14 * t(d)))
save('sip', x, 0.35)

# flutter: four pairs of soft low air puffs
x = np.zeros(int(0.9 * SR))
for k in range(4):
    puff = band(rng.standard_normal(int(0.07 * SR)), 120, 900) * np.sin(np.pi * t(0.07) / 0.07)
    place(x, puff, 0.05 + k * 0.2)
    place(x, puff * 0.7, 0.12 + k * 0.2)
save('flutter', x, 0.45)

# wind: a swirl rising then easing, band moving up
d = 2.2
noise = rng.standard_normal(int(d * SR))
x = np.zeros_like(noise)
for k, (lo, hi) in enumerate(((150, 600), (250, 900), (400, 1400), (300, 1000))):
    seg = band(noise, lo, hi) * np.sin(np.pi * np.clip(t(d) / d * 4 - k + 0.5, 0, 1)) ** 2
    x += seg
save('wind', x * env(len(x), 0.3, 0.6) * (0.6 + 0.4 * np.sin(2 * np.pi * 1.3 * t(d))), 0.45)

# chalk: three dry strokes with a gritty tremolo
strokes = []
for d in (0.28, 0.2, 0.32):
    n = int(d * SR)
    strokes += [band(rng.standard_normal(n), 2500, 9000) * (0.5 + 0.5 * (rng.random(n) < 0.35)) * env(n, 0.02, 0.06), np.zeros(int(0.05 * SR))]
save('chalk', np.concatenate(strokes), 0.4)


# soft piano-like notes: hammer click + harmonic partials with stretched tuning and per-partial decay
def note(f0, d=2.6):
    tt = t(d)
    x = sum(a * np.sin(2 * np.pi * f0 * h * (1 + 0.0004 * h * h) * tt) * np.exp(-tt * (1.2 + 0.9 * h)) for a, h in ((1, 1), (0.45, 2), (0.22, 3), (0.1, 4), (0.05, 5)))
    x += band(rng.standard_normal(len(tt)), 2000, 6000) * np.exp(-tt * 300) * 0.05
    return x * env(len(tt), 0.004, 0.4)
save('note_a', note(392.0), 0.32)   # G4
save('note_b', note(329.6), 0.32)   # E4
save('note_c', note(261.6), 0.32)   # C4
print('ok', sorted(p.name for p in out.glob('*.wav')))
