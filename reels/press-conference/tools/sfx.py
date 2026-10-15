"""This reel's own effects (numpy synthesis, seeded): the workshop's room tone, a robot footstep on the bench, a small
servo whir, a microphone's static crackle, a muffled murmur for the loudspeakers (noise shaped like a crowd, no
words), a screw's metal tink. No music (a voice-and-effects mix). Accents (click, tick, creak, snap, scrape, page,
slide, clack, casters, rub, marker, pneumatic, hall, hum) are imported from other reels instead.
usage: python3 tools/sfx.py → assets/sfx/*.wav   (same approach as reels/cr1-adab-al-majlis/tools/sfx.py)"""
import wave
from pathlib import Path

import numpy as np

SR = 48000
OUT = Path(__file__).resolve().parent.parent / 'assets/sfx'
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(11)
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


# room: a quiet workshop at night: soft air, a faint low hum from the lamp, slow drift; 30 s, under the whole reel
t = T(30)
air = lp(rng.standard_normal(len(t)), 0.03) * (0.85 + 0.15 * np.sin(2 * np.pi * 0.05 * t))
hum = 0.12 * np.sin(2 * np.pi * 100 * t) + 0.05 * np.sin(2 * np.pi * 200 * t)
save('room', fade(air + hum * 0.4, 0.5, 0.5), 0.3)

# step: a small metal foot on the bench (a dull tap and a tiny ring), 0.14 s
t = T(0.14)
tap = np.sin(2 * np.pi * 180 * t) * np.exp(-t * 60) + 0.35 * np.sin(2 * np.pi * 1450 * t) * np.exp(-t * 90)
save('step', fade(tap + 0.2 * lp(rng.standard_normal(len(t)), 0.4) * np.exp(-t * 80), 0.001, 0.04), 0.5)

# servo: a short motor whir rising in pitch, 0.35 s
t = T(0.35)
f = 420 + 260 * t / 0.35
servo = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 37 * t))
save('servo', fade(servo * np.sin(np.pi * t / 0.35) ** 0.7, 0.01, 0.06), 0.35)

# crackle: a dying microphone: bursts of static, 0.7 s
t = T(0.7)
burst = (rng.random(len(t)) < 0.004).astype(float)
cr = np.convolve(burst, np.exp(-np.arange(400) / 60), 'same') * rng.standard_normal(len(t))
cr += 0.25 * lp(rng.standard_normal(len(t)), 0.5) * (t < 0.35)
save('crackle', fade(cr, 0.005, 0.1), 0.5)

# murmur: loudspeakers' noise, crowd-shaped (band noise with syllable-rate wobble), no words, 4 s
t = T(4)
band = lp(rng.standard_normal(len(t)), 0.18) - lp(rng.standard_normal(len(t)), 0.02)
wob = 0.55 + 0.45 * np.abs(np.sin(2 * np.pi * 3.1 * t + 2 * np.sin(2 * np.pi * 0.7 * t)))
save('murmur', fade(band * wob, 0.3, 0.6), 0.4)

# tink: a screw hitting metal, then a softer second bounce, 0.5 s
t = T(0.5)
ring = lambda at, a: a * (t >= at) * np.sin(2 * np.pi * 3100 * (t - at)) * np.exp(-np.maximum(t - at, 0) * 30)
save('tink', fade(ring(0, 1) + ring(0.18, 0.4) + ring(0.3, 0.15), 0.001, 0.05), 0.45)
