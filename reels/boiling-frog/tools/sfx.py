"""Original effects for this reel (numpy synthesis, seeded). Everything else is imported from
reels/mukarram/assets/sfx. usage: python3 tools/sfx.py  → assets/sfx/{ribbit,thwip,gulp,tap}.wav"""
import wave
from pathlib import Path
import numpy as np

SR = 48000
OUT = Path(__file__).resolve().parent.parent / 'assets/sfx'
rng = np.random.default_rng(11)
t = lambda d: np.arange(int(SR * d)) / SR


def save(name, x, peak=0.6):
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    k = int(SR * 0.004)
    x[:k] *= np.linspace(0, 1, k); x[-k:] *= np.linspace(1, 0, k)
    with wave.open(str(OUT / f'{name}.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
    print(name, f'{len(x) / SR:.2f}s')


# ribbit: two short croaks (buzzy low tone with fast amplitude pulses)
x = np.zeros(len(t(0.42)))
for start, f0 in ((0.0, 190), (0.2, 230)):
    tt = t(0.16)
    ph = np.cumsum(f0 + 30 * np.sin(2 * np.pi * 6 * tt)) / SR
    tone = (2 * (ph % 1) - 1) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 38 * tt)))
    k = int(start * SR)
    x[k:k + len(tt)] += tone * np.sin(np.pi * tt / tt[-1])
save('ribbit', x, 0.5)
# thwip: the tongue (fast rising chirp)
tt = t(0.13)
x = np.sin(2 * np.pi * np.cumsum(300 + 1400 * (tt / tt[-1]) ** 2) / SR) * np.exp(-tt * 18)
save('thwip', x, 0.5)
# gulp: a falling bubble
tt = t(0.18)
x = np.sin(2 * np.pi * np.cumsum(320 - 200 * tt / tt[-1]) / SR) * np.sin(np.pi * tt / tt[-1]) ** 2
save('gulp', x, 0.55)
# tap: a knuckle on glass
tt = t(0.12)
x = np.sin(2 * np.pi * 2600 * tt) * np.exp(-tt * 70) + rng.standard_normal(len(tt)) * np.exp(-tt * 120) * 0.4
save('tap', x, 0.5)
