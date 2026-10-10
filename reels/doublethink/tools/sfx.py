"""Original effects for this reel (numpy synthesis, seeded). Everything else is imported from
reels/mukarram/assets/sfx. usage: python3 tools/sfx.py
→ assets/sfx/{clack,stamp,rattle,pneu,rip,rub,casters,marker,slide,flap}.wav (same approach as reels/boiling-frog/tools/sfx.py)"""
import wave
from pathlib import Path
import numpy as np

SR = 48000
OUT = Path(__file__).resolve().parent.parent / 'assets/sfx'
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(4)
t = lambda d: np.arange(int(SR * d)) / SR


def lowpass(x, a):
    y = np.zeros_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc)
        y[i] = acc
    return y


def save(name, x, peak=0.6):
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    k = int(SR * 0.003)
    x[:k] *= np.linspace(0, 1, k); x[-k:] *= np.linspace(1, 0, k)
    with wave.open(str(OUT / f'{name}.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
    print(name, f'{len(x) / SR:.2f}s')


# clack: a deadbolt hitting its strike — a sharp metallic click plus a short low knock
tt = t(0.22)
click = (np.sin(2 * np.pi * 2900 * tt) + 0.6 * np.sin(2 * np.pi * 4300 * tt)) * np.exp(-tt * 90)
knock = np.sin(2 * np.pi * 180 * tt) * np.exp(-tt * 30)
save('clack', click * 0.8 + knock + rng.standard_normal(len(tt)) * np.exp(-tt * 200) * 0.5, 0.7)

# stamp: rubber stamp on paper — a padded low thump with a papery slap on top
tt = t(0.25)
thump = np.sin(2 * np.pi * (95 + 60 * np.exp(-tt * 40)) * tt) * np.exp(-tt * 22)
slap = lowpass(rng.standard_normal(len(tt)), 0.35) * np.exp(-tt * 70)
save('stamp', thump * 1.0 + slap * 0.9, 0.7)

# rattle: a door shaking in its frame — a few quick knocks with metal ring
x = np.zeros(int(SR * 0.42))
for i, s0 in enumerate([0.0, 0.07, 0.13, 0.2, 0.26, 0.31]):
    tt = t(0.08)
    burst = (np.sin(2 * np.pi * (210 + 25 * i) * tt) * 0.7 + np.sin(2 * np.pi * 1700 * tt) * 0.25) * np.exp(-tt * 55)
    k = int(s0 * SR)
    x[k:k + len(tt)] += burst * (1 - i * 0.08)
save('rattle', x, 0.55)

# pneu: a pneumatic-post capsule — air hiss rising, then a hollow pop
tt = t(0.36)
hiss = lowpass(rng.standard_normal(len(tt)), 0.25) * np.clip(tt / 0.25, 0, 1) ** 2 * (tt < 0.27)
pop = np.zeros_like(tt)
k = int(0.26 * SR)
tp = tt[:len(tt) - k]
pop[k:] = np.sin(2 * np.pi * (520 - 260 * tp / tp[-1]) * tp) * np.exp(-tp * 28)
save('pneu', hiss * 0.5 + pop, 0.6)

# rip: a sheet torn off a pad — crackly band noise with a falling envelope
tt = t(0.3)
n = rng.standard_normal(len(tt))
crackle = n * (rng.random(len(tt)) < 0.35)
save('rip', lowpass(crackle, 0.6) * np.exp(-tt * 9) * (0.6 + 0.4 * np.sin(2 * np.pi * 37 * tt)), 0.55)

# rub: an eraser on paper — soft rhythmic scrubbing
tt = t(0.7)
save('rub', lowpass(rng.standard_normal(len(tt)), 0.18) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 5.5 * tt))) * np.exp(-tt * 0.8), 0.45)

# casters: office-chair wheels rolling on a hard floor
tt = t(1.1)
rumble = lowpass(rng.standard_normal(len(tt)), 0.05) * (0.7 + 0.3 * np.sin(2 * np.pi * 9 * tt))
clicks = (rng.random(len(tt)) < 0.0015) * rng.standard_normal(len(tt)) * 3
env = np.clip(tt / 0.1, 0, 1) * np.clip((1.1 - tt) / 0.25, 0, 1)
save('casters', (rumble + lowpass(clicks, 0.4)) * env, 0.45)

# marker: felt marker squeaks on a whiteboard (two strokes)
x = np.zeros(int(SR * 0.9))
for s0, d, f0 in ((0.0, 0.38, 1900), (0.45, 0.4, 2200)):
    tt = t(d)
    sq = np.sin(2 * np.pi * np.cumsum(f0 + 260 * np.sin(2 * np.pi * 7 * tt)) / SR) * np.clip(np.sin(np.pi * tt / tt[-1]), 0, 1) ** 0.6
    k = int(s0 * SR)
    x[k:k + len(tt)] += sq * 0.4 + lowpass(rng.standard_normal(len(tt)), 0.4) * 0.15
save('marker', x, 0.35)

# slide: paper pushed along the floor and under a door
tt = t(0.5)
save('slide', lowpass(rng.standard_normal(len(tt)), 0.3) * np.sin(np.pi * tt / tt[-1]) * (1 - tt / tt[-1] * 0.5), 0.4)

# flap: the hatch shutter sliding up (a short wooden-metal scrape)
tt = t(0.16)
save('flap', lowpass(rng.standard_normal(len(tt)), 0.5) * np.exp(-tt * 18) + np.sin(2 * np.pi * 640 * tt) * np.exp(-tt * 40) * 0.4, 0.45)
