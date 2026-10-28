"""This reel's own effects (numpy synthesis, seeded): a quiet room tone, one soft footstep on a carpet, a cloth rustle
for sitting down / standing up. No music (the brief). Accents (tick, thud, page, slide) are imported from
reels/mukarram and reels/doublethink instead.
usage: python3 tools/sfx.py → assets/sfx/*.wav   (same approach as reels/sunk-cost-a/tools/sfx.py)"""
import wave
from pathlib import Path

import numpy as np

SR = 48000
OUT = Path(__file__).resolve().parent.parent / 'assets/sfx'
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(7)
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


# room: a quiet, warm room tone (brown-ish noise, slow drift), 30 s; laid under the whole reel so no pause is dead air
t = T(30)
room = lp(rng.standard_normal(len(t)), 0.02) * (0.85 + 0.15 * np.sin(2 * np.pi * 0.07 * t))
save('room', fade(room, 0.5, 0.5), 0.3)

# step: a soft footstep on a rug (low thump + short scuff), 0.25 s
t = T(0.25)
thump = np.sin(2 * np.pi * 70 * t) * np.exp(-t * 38)
scuff = lp(rng.standard_normal(len(t)), 0.25) * np.exp(-((t - 0.05) / 0.035) ** 2)
save('step', fade(thump + 0.6 * scuff, 0.002, 0.08), 0.5)

# rustle: cloth when sitting down or standing up (band-limited noise swell), 0.6 s
t = T(0.6)
n = lp(rng.standard_normal(len(t)), 0.35) - lp(rng.standard_normal(len(t)), 0.03)
save('rustle', fade(n * np.sin(np.pi * t / 0.6) ** 1.5, 0.01, 0.1), 0.5)
