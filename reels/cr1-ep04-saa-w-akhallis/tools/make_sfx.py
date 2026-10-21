"""Synthesised sound effects this reel needs beyond the series set (no samples, no licences):
alarm (two-tone beeps), scribble (marker on paper), step (soft footstep), crumple (paper),
chime (one soft bell partial stack, not music), thud (cardboard set down). Seeded, so rebuilds match.

usage: python3 tools/make_sfx.py   → public/sfx/{alarm,scribble,step,crumple,chime,thud}.wav (48 kHz mono)
"""
import wave
from pathlib import Path

import numpy as np

SR = 48000
out = Path(__file__).resolve().parent.parent / 'public/sfx'
rng = np.random.default_rng(3)


def env(n, a, r):
    e = np.ones(n)
    a, r = int(a * SR), int(r * SR)
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


t = lambda d: np.arange(int(d * SR)) / SR

# alarm: three pairs of short square-ish beeps, 1.4 s
beep = lambda f0: np.tanh(3 * np.sin(2 * np.pi * f0 * t(0.09))) * env(int(0.09 * SR), 0.004, 0.02)
gap = np.zeros(int(0.06 * SR))
pair = np.concatenate([beep(1900), gap, beep(1900), np.zeros(int(0.26 * SR))])
save('alarm', band(np.tile(pair, 3), 300, 6000), 0.6)

# scribble: three strokes of filtered noise with a rubbing tremolo
strokes = []
for d in (0.22, 0.18, 0.26):
    n = int(d * SR)
    trem = 0.6 + 0.4 * np.sin(2 * np.pi * 23 * t(d))
    strokes += [band(rng.standard_normal(n), 1800, 7000) * trem * env(n, 0.02, 0.05), np.zeros(int(0.04 * SR))]
save('scribble', np.concatenate(strokes), 0.5)

# step: a low thump and a short scuff
n = int(0.16 * SR)
thump = np.sin(2 * np.pi * 90 * t(0.16) * (1 - 0.4 * t(0.16) / 0.16)) * np.exp(-t(0.16) * 38)
scuff = band(rng.standard_normal(n), 900, 4000) * np.exp(-t(0.16) * 60) * 0.35
save('step', thump + scuff, 0.6)

# crumple: dense crackle bursts
n = int(0.45 * SR)
x = band(rng.standard_normal(n), 1200, 9000) * (rng.random(n) < 0.08) * 1.0
x += band(rng.standard_normal(n), 2000, 8000) * 0.15
save('crumple', x * env(n, 0.01, 0.12), 0.55)

# chime: a soft struck partial stack (inharmonic bell ratios), 0.9 s decay
d = 0.9
c = sum(a * np.sin(2 * np.pi * 1320 * r * t(d)) * np.exp(-t(d) * k) for a, r, k in ((1, 1, 5), (0.5, 2.76, 8), (0.25, 5.4, 12)))
save('chime', c * env(int(d * SR), 0.003, 0.2), 0.45)

# thud: cardboard set down
n = int(0.22 * SR)
x = np.sin(2 * np.pi * 120 * t(0.22)) * np.exp(-t(0.22) * 28) + band(rng.standard_normal(n), 200, 2500) * np.exp(-t(0.22) * 45) * 0.5
save('thud', x, 0.6)
print('ok', sorted(p.name for p in out.glob('*.wav')))

# EP04 — doorbell: two soft struck tones (ding-dong), 1.1 s
def tone(f0, d, k):
    tt = t(d)
    return sum(a * np.sin(2 * np.pi * f0 * r * tt) * np.exp(-tt * k * r) for a, r in ((1, 1), (0.35, 2.0), (0.15, 3.01)))
dong = np.concatenate([tone(880, 0.5, 4), np.zeros(int(0.05 * SR))])
bell = np.concatenate([dong, tone(698, 0.6, 3.5)])
save('doorbell', bell * env(len(bell), 0.003, 0.15), 0.5)

# screw boing: a short spring twang with a falling pitch
d = 0.45
ph = 2 * np.pi * np.cumsum(420 * (1 - 0.45 * t(d) / d) * (1 + 0.08 * np.sin(2 * np.pi * 28 * t(d)))) / SR
save('boing', np.sin(ph) * np.exp(-t(d) * 7) * env(int(d * SR), 0.002, 0.05), 0.5)

# camera shutter: two clicks
c1 = band(rng.standard_normal(int(0.03 * SR)), 1500, 9000) * np.exp(-t(0.03) * 120)
save('shutter', np.concatenate([c1, np.zeros(int(0.07 * SR)), c1 * 0.7]), 0.55)
print('ep04 sfx ok')
