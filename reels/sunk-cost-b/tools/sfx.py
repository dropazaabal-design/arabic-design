"""Reel B's own effects (numpy synthesis, seeded): the bus engine bed, the stop bell, desert wind, sea waves, the
space sweep around the globe. Others are imported: reels/sunk-cost-a (printer, splash, bubbles, ticks) and
reels/mukarram / reels/doublethink (pop, whoosh, pneu…), no copies.
usage: python3 tools/sfx.py → assets/sfx/*.wav"""
import wave
from pathlib import Path

import numpy as np

SR = 48000
OUT = Path(__file__).resolve().parent.parent / 'assets/sfx'
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(37)
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


# engine: diesel idle/drive — 32 Hz firing pulses through a low-pass, plus road rumble, 30 s (looped)
t = T(30)
fire = np.maximum(0, np.sin(2 * np.pi * 32 * t)) ** 6
eng = lp(fire + lp(rng.standard_normal(len(t)), 0.02) * 0.6, 0.15)
save('engine', fade(eng - np.mean(eng), 0.3, 0.3), 0.3)

# bell: the stop-request ding (two partials, decaying), 1.2 s
t = T(1.2)
save('bell', (np.sin(2 * np.pi * 1320 * t) + 0.5 * np.sin(2 * np.pi * 2640 * t)) * np.exp(-t * 4), 0.5)

# wind: desert gusts (band noise swelling), 6 s
t = T(6)
save('wind', fade(lp(rng.standard_normal(len(t)), 0.05) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.35 * t) ** 2), 0.5, 0.8), 0.4)

# waves: the sea under the ferry (slow surges of filtered noise), 5 s
t = T(5)
save('waves', fade(lp(rng.standard_normal(len(t)), 0.08) * (0.3 + 0.7 * np.sin(np.pi * ((t * 0.5) % 1)) ** 2), 0.4, 0.6), 0.45)

# sweep: the long way around the globe (a rising, then falling whoosh with a soft tone), 4.5 s
t = T(4.5)
f = 180 + 520 * np.sin(np.pi * t / 4.5)
tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3
air = lp(rng.standard_normal(len(t)), 0.1) * np.sin(np.pi * t / 4.5)
save('sweep', fade(tone + air, 0.2, 0.6), 0.45)
