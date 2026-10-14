"""Original effect for this reel (numpy synthesis, seeded): the shock generator's hum.
Everything else is imported from reels/mukarram, reels/doublethink and reels/boiling-frog (assets/sfx).
usage: python3 tools/sfx.py → assets/sfx/hum.wav (same approach as reels/power-of-no-b/tools/sfx.py)"""
import wave
from pathlib import Path
import numpy as np

SR = 48000
OUT = Path(__file__).resolve().parent.parent / 'assets/sfx'
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(9)
tt = np.arange(int(SR * 3.0)) / SR

# hum: mains hum of an old instrument panel — 60 Hz and its harmonics, a slow beat, a little hiss; soft edges
x = sum(np.sin(2 * np.pi * 60 * k * tt) / k for k in (1, 2, 3, 5)) * (0.85 + 0.15 * np.sin(2 * np.pi * 0.7 * tt))
x += rng.standard_normal(len(tt)) * 0.03
env = np.clip(tt / 0.4, 0, 1) * np.clip((3.0 - tt) / 0.6, 0, 1)
x = x * env
x = x / np.max(np.abs(x)) * 0.5
with wave.open(str(OUT / 'hum.wav'), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x * 32767).astype(np.int16).tobytes())
print('hum', f'{len(x) / SR:.2f}s')
