"""This reel's own effects (numpy synthesis, seeded): a room tone with a soft warm pad under the whole scene, the
paper plane's flight, the bird's chirp. Everything else comes from reels/mukarram (assets/sfx).
usage: python3 tools/sfx.py → assets/sfx/{room,flight,chirp}.wav (same approach as reels/blind-obedience/tools/sfx.py)"""
import wave
from pathlib import Path
import numpy as np

SR = 48000
OUT = Path(__file__).resolve().parent.parent / 'assets/sfx'
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(11)


def lowpass(x, a):
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc); y[i] = acc
    return y


def save(name, x, peak):
    x = x / np.max(np.abs(x)) * peak
    with wave.open(str(OUT / f'{name}.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
    print(name, f'{len(x) / SR:.2f}s')


# room: brown-ish noise + a quiet A-major pad that swells a little at the end (the room warming up), 14 s
tt = np.arange(int(SR * 14.0)) / SR
noise = lowpass(rng.standard_normal(len(tt)), 0.02)
pad = sum(np.sin(2 * np.pi * f * tt + k) * a for k, (f, a) in enumerate(((110, 1), (164.8, 0.7), (220, 0.5), (277.2, 0.35))))
pad *= 0.55 + 0.45 * np.clip((tt - 11.0) / 1.5, 0, 1)
room = noise / np.max(np.abs(noise)) * 0.5 + pad / np.max(np.abs(pad)) * 0.5
room *= np.clip(tt / 0.3, 0, 1) * np.clip((14.0 - tt) / 0.8, 0, 1)
save('room', room, 0.25)

# flight: band-limited air that swells and fades over 3.1 s, with a slow flutter (the plane's glide)
tf = np.arange(int(SR * 3.1)) / SR
air = lowpass(rng.standard_normal(len(tf)), 0.12) - lowpass(rng.standard_normal(len(tf)), 0.01)
env = np.sin(np.pi * np.clip(tf / 3.1, 0, 1)) ** 1.5 * (0.8 + 0.2 * np.sin(2 * np.pi * 3.2 * tf))
save('flight', air * env, 0.5)

# chirp: two quick rising whistles
tc = np.arange(int(SR * 0.42)) / SR
def tweet(t0, d):
    m = (tc >= t0) & (tc < t0 + d); u = (tc[m] - t0) / d
    y = np.zeros_like(tc); f = 2600 + 1700 * u
    y[m] = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * u) ** 2
    return y
save('chirp', tweet(0.0, 0.12) + tweet(0.2, 0.16), 0.6)
