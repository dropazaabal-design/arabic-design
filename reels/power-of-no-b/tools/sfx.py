"""Original effects for this reel (numpy synthesis, seeded). Everything else is imported from reels/mukarram,
reels/doublethink and reels/boiling-frog (assets/sfx). usage: python3 tools/sfx.py → assets/sfx/{buzz,whomp}.wav
(same approach as reels/doublethink/tools/sfx.py)"""
import wave
from pathlib import Path
import numpy as np

SR = 48000
OUT = Path(__file__).resolve().parent.parent / 'assets/sfx'
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(6)
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
    k = int(SR * 0.004)
    x[:k] *= np.linspace(0, 1, k); x[-k:] *= np.linspace(1, 0, k)
    with wave.open(str(OUT / f'{name}.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
    print(name, f'{len(x) / SR:.2f}s')


# buzz: a phone vibrating in a coat pocket — two short bursts of a rough 170 Hz motor, muffled
x = np.zeros(int(SR * 0.95))
for s0 in (0.0, 0.5):
    tt = t(0.38)
    motor = np.sign(np.sin(2 * np.pi * 170 * tt)) * 0.6 + np.sin(2 * np.pi * 340 * tt) * 0.4
    env = np.clip(tt / 0.02, 0, 1) * np.clip((0.38 - tt) / 0.04, 0, 1)
    k = int(s0 * SR)
    x[k:k + len(tt)] += lowpass(motor * env, 0.25)
save('buzz', x, 0.55)

# whomp: the imagination falling in — a low swell that drops in pitch, with a soft sub hit
tt = t(1.2)
f0 = 110 - 60 * tt / tt[-1]
swell = np.sin(2 * np.pi * np.cumsum(f0) / SR) * np.clip(tt / 0.5, 0, 1) ** 2 * np.clip((1.2 - tt) / 0.5, 0, 1)
air = lowpass(rng.standard_normal(len(tt)), 0.03) * np.clip(tt / 0.6, 0, 1) * np.clip((1.2 - tt) / 0.4, 0, 1)
save('whomp', swell + air * 0.6, 0.6)
