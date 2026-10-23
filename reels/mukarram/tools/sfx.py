"""Original sound effects for the reel, synthesised with numpy (no samples, no third-party material).
The rest of the library (whoosh, thud, pop, click, chime, tick, snap, scrape, scribble, pageflip) is the
FFmpeg-synthesised set from reels/crab-mentality, copied into assets/sfx.

usage: python3 tools/sfx.py        (seeded: the same files every time) → assets/sfx/*.wav
"""
import wave
from pathlib import Path

import numpy as np

SR = 48000
OUT = Path(__file__).resolve().parent.parent / 'assets/sfx'
rng = np.random.default_rng(7)


def t(d):
    return np.arange(int(SR * d)) / SR


def lp(x, a):
    """one-pole low-pass, a in (0,1): smaller = darker"""
    y = np.zeros_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc)
        y[i] = acc
    return y


def hp(x, a):
    return x - lp(x, a)


def env(n, attack=0.005, release=0.1, hold=0.0):
    e = np.ones(n)
    a, r, h = int(SR * attack), int(SR * release), int(SR * hold)
    if a:
        e[:a] = np.linspace(0, 1, a)
    tail = n - a - h
    if tail > 0:
        e[a + h:] = np.exp(-np.linspace(0, 6, tail)) if release else 1
    return e


def save(name, x, peak=0.7):
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    fade = int(SR * 0.004)
    x[:fade] *= np.linspace(0, 1, fade)
    x[-fade:] *= np.linspace(1, 0, fade)
    with wave.open(str(OUT / f'{name}.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
    print(name, f'{len(x) / SR:.2f}s')


# splat: a wet low thump with a short noisy smear
n = len(t(0.32))
x = lp(rng.standard_normal(n), 0.12) * env(n, 0.002, 0.25) * 1.4 + np.sin(2 * np.pi * 85 * t(0.32)) * env(n, 0.001, 0.18)
save('splat', x, 0.75)

# chomp: two crunchy bites
n = len(t(0.3))
x = np.zeros(n)
for start in (0.0, 0.11):
    k = int(start * SR)
    b = hp(lp(rng.standard_normal(int(0.06 * SR)), 0.5), 0.08) * env(int(0.06 * SR), 0.002, 0.05)
    x[k:k + len(b)] += b
save('chomp', x, 0.6)

# flutter: wing beats (filtered noise, amplitude-modulated at 13 Hz), 1.4 s
d = 1.4
n = len(t(d))
am = (0.5 + 0.5 * np.sin(2 * np.pi * 13 * t(d))) ** 3
x = hp(lp(rng.standard_normal(n), 0.25), 0.02) * am * np.minimum(1, t(d) / 0.15) * np.minimum(1, (d - t(d)) / 0.3)
save('flutter', x, 0.5)

# creak: a slow wooden creak (sawtooth, gliding pitch with jitter)
d = 0.45
tt = t(d)
f0 = 150 - 50 * tt / d + 8 * np.sin(2 * np.pi * 7 * tt)
ph = np.cumsum(f0) / SR
saw = 2 * (ph % 1) - 1
x = hp(lp(saw, 0.35), 0.05) * (0.6 + 0.4 * np.sin(2 * np.pi * 23 * tt)) * env(len(tt), 0.03, 0.2, 0.15)
save('creak', x, 0.5)

# boing: a spring (pitch wobble decaying)
d = 0.5
tt = t(d)
f0 = 260 + 120 * np.exp(-tt * 6) * np.sin(2 * np.pi * 9 * tt)
x = np.sin(2 * np.pi * np.cumsum(f0) / SR) * env(len(tt), 0.004, 0.45)
save('boing', x, 0.55)

# spit: a soft short "pt" (kept discreet)
n = len(t(0.12))
x = hp(rng.standard_normal(n), 0.3) * env(n, 0.001, 0.06) * 0.7
x[:int(0.004 * SR)] += np.hanning(int(0.004 * SR)) * 0.8
save('spit', x, 0.45)

# breeze: a soft swell of dark noise
d = 0.9
n = len(t(d))
x = lp(rng.standard_normal(n), 0.03) * np.sin(np.pi * t(d) / d) ** 2
save('breeze', x, 0.45)

# crinkle: a bag being folded (random small crackles)
d = 0.45
n = len(t(d))
x = np.zeros(n)
for _ in range(38):
    k = int(rng.uniform(0, d - 0.02) * SR)
    m = int(rng.uniform(0.003, 0.012) * SR)
    x[k:k + m] += hp(rng.standard_normal(m), 0.4) * rng.uniform(0.3, 1)
save('crinkle', x, 0.5)

# whistle: a falling slide whistle (the bag drops)
d = 0.45
tt = t(d)
f0 = 1500 - 1000 * (tt / d) ** 0.8
x = np.sin(2 * np.pi * np.cumsum(f0) / SR) * env(len(tt), 0.01, 0.12, 0.3)
save('whistle', x, 0.35)
