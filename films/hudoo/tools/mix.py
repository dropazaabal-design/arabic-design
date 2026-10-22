"""The soundtrack: narration + a quiet piano that steps aside when the voice speaks + light effects on their actions.

usage: python3 tools/mix.py   → public/audio/mix.wav (48 kHz stereo, −16 LUFS, peak ≤ −2 dBTP), audio/mix-report.json
Effects are cued in audio/sfx/bN.json (one file per batch of shots) as {shot, at: word text or seconds into the shot, sfx, gain}; the shot timing is the
same rule as src/film/engine.tsx (one shot per line, the cut 0.22 s at most before the voice). No samples: all synthesised.
"""
import json
import re
import subprocess
import wave
from pathlib import Path

import sys

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))

from timeline import FPS, LINES, SHOTS, SR, T, TOTAL, WORDS, norm, root  # noqa: E402,F401

rng = np.random.default_rng(4)



def cue_time(c):
    s = next(x for x in T if x['id'] == c['shot'])
    at = c.get('at', 0)
    if isinstance(at, str):
        m = [w for w in s['words'] if norm(at) in norm(w['word'])]
        base = (m[min(c.get('nth', 0), len(m) - 1)]['end' if c.get('end') else 'start']) if m else s['speech'][0]
        return base + c.get('offset', 0)
    return s['from'] + at


# ——— synthesis ———
def tt(d): return np.arange(int(d * SR)) / SR


def env(n, a, r):
    e = np.ones(n)
    a = max(1, int(a * SR)); e[:a] = np.linspace(0, 1, a)
    r = min(n, max(1, int(r * SR))); e[-r:] *= np.linspace(1, 0, r) ** 2
    return e


def band(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X * (1 / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4)), len(x))


def noise(d): return rng.standard_normal(int(d * SR))


def piano(f, d=3.0, vel=1.0):
    x = tt(d)
    y = sum(a * np.sin(2 * np.pi * f * m * x * (1 + 0.0004 * m * m)) * np.exp(-x * (1.6 + 1.1 * m)) for m, a in [(1, 1), (2, 0.42), (3, 0.18), (4, 0.08), (5, 0.04)])
    hammer = band(noise(0.02), 1500, 6000) * np.exp(-tt(0.02) * 250) * 0.15
    y[:len(hammer)] += hammer
    return y * env(len(x), 0.006, 0.4) * vel


def hz(n):
    m = re.match(r'([A-G])(#|b)?(\d)', n)
    k = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}[m[1]] + {'#': 1, 'b': -1, None: 0}[m[2]] + 12 * (int(m[3]) + 1)
    return 440 * 2 ** ((k - 69) / 12)


def thud(d=0.4, f0=90, f1=45):
    x = tt(d)
    return np.sin(2 * np.pi * np.cumsum(f1 + (f0 - f1) * np.exp(-x * 25)) / SR) * np.exp(-x * 10) + 0.4 * band(noise(d), 80, 900) * np.exp(-x * 25)


def click(f=2400, d=0.025): x = tt(d); return np.sin(2 * np.pi * f * x) * np.exp(-x * 220)


def layer(base, *rest):
    """Sum signals, each (offset seconds, signal) after the base."""
    n = max([len(base)] + [int(o * SR) + len(x) for o, x in rest])
    y = np.zeros(n); y[:len(base)] += base
    for o, x in rest:
        s = int(o * SR); y[s:s + len(x)] += x
    return y


SFX = {
    'buzz': lambda: np.concatenate([np.sin(2 * np.pi * 160 * tt(0.28)) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 26 * tt(0.28)))) * env(int(0.28 * SR), 0.01, 0.05), np.zeros(int(0.12 * SR))] * 2) * 0.6,
    'ding': lambda: layer(piano(hz('E6'), 1.2, 0.8), (0.0, piano(hz('B6'), 1.0, 0.4))),
    'door': lambda: layer(thud(0.5, 110, 50) * 1.2, (0.03, click(1800, 0.04))),
    'latch': lambda: layer(click(1700, 0.05), (0.05, click(2600, 0.03) * 0.6)),
    'knock': lambda: np.concatenate([np.concatenate([thud(0.12, 220, 120) * 0.9, np.zeros(int(0.14 * SR))]) for _ in range(3)]),
    'tap': lambda: thud(0.12, 260, 140) * 0.6,
    'bang': lambda: layer(thud(0.6, 120, 40) * 1.4, (0.0, band(noise(0.5), 2000, 7000) * np.exp(-tt(0.5) * 9) * 0.5)),
    'type': lambda: np.concatenate([np.concatenate([click(3000 + 600 * rng.random(), 0.02) * (0.5 + 0.5 * rng.random()), np.zeros(int((0.05 + 0.07 * rng.random()) * SR))]) for _ in range(14)]),
    'erase': lambda: np.concatenate([np.concatenate([click(2200, 0.02) * 0.6, np.zeros(int(0.045 * SR))]) for _ in range(18)]),
    'pen': lambda: band(noise(1.2), 2500, 7000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 3.2 * tt(1.2)))) * env(int(1.2 * SR), 0.05, 0.2) * 0.25,
    'page': lambda: band(noise(0.35), 1200, 6000) * np.sin(np.linspace(0, np.pi, int(0.35 * SR))) * 0.5,
    'whoosh': lambda: band(noise(0.5), 400, 3500) * np.sin(np.linspace(0, np.pi, int(0.5 * SR))) ** 2 * 0.5,
    'rewind': lambda: band(noise(0.6), 600, 5000) * np.linspace(0, 1, int(0.6 * SR)) ** 2 * 0.5,
    'pop': lambda: np.sin(2 * np.pi * np.cumsum(500 + 600 * tt(0.08) / 0.08) / SR) * np.exp(-tt(0.08) * 40) * 0.6,
    'stamp': lambda: layer(thud(0.25, 160, 70), (0.0, click(1500, 0.04) * 0.6)),
    'boil': lambda: layer(band(noise(3), 100, 1200) * 0.08, *[(t, np.sin(2 * np.pi * (300 + 500 * rng.random()) * tt(0.05)) * np.exp(-tt(0.05) * 60) * 0.25) for t in rng.uniform(0, 2.9, 40)]),
    'wind': lambda: band(noise(3), 200, 1500) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.4 * tt(3))) * env(int(3 * SR), 0.6, 1.0) * 0.5,
    'water': lambda: band(noise(4), 150, 2500) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.25 * tt(4))) * env(int(4 * SR), 1.0, 1.5) * 0.3,
    'wave': lambda: band(noise(4), 120, 2200) * np.sin(np.linspace(0, np.pi, int(4 * SR))) ** 1.5 * 0.6,
    'breath_in': lambda: band(noise(1.6), 500, 3000) * np.sin(np.linspace(0, np.pi, int(1.6 * SR))) ** 2 * 0.22,
    'breath_out': lambda: band(noise(2.2), 300, 2000) * np.sin(np.linspace(0, np.pi, int(2.2 * SR))) ** 2 * 0.22,
    'heart': lambda: np.concatenate([np.concatenate([thud(0.18, 70, 45), np.zeros(int(0.12 * SR)), thud(0.16, 65, 45) * 0.7, np.zeros(int(0.3 * SR))]) for _ in range(3)]) * 0.9,
    'steps': lambda: np.concatenate([np.concatenate([band(noise(0.09), 100, 1200) * np.exp(-tt(0.09) * 40), np.zeros(int(0.38 * SR))]) for _ in range(6)]) * 0.6,
    'chair': lambda: layer(band(noise(0.5), 300, 1500) * np.sin(np.linspace(0, np.pi, int(0.5 * SR))) * 0.4, (0.0, thud(0.2, 100, 60) * 0.4)),
    'chime': lambda: layer(piano(hz('D6'), 1.6, 0.5), (0.09, piano(hz('F#6'), 1.6, 0.4)), (0.18, piano(hz('A6'), 1.6, 0.3))),
    'click': lambda: click(2000, 0.03),
    'swish': lambda: band(noise(0.25), 1000, 6000) * np.sin(np.linspace(0, np.pi, int(0.25 * SR))) ** 2 * 0.5,
    'rumble': lambda: band(noise(2.5), 30, 200) * np.exp(-tt(2.5) * 1.2) * 1.0,
    'laugh': lambda: np.concatenate([np.concatenate([band(noise(0.11), 400, 2200) * np.sin(np.linspace(0, np.pi, int(0.11 * SR))) * 0.5, np.zeros(int(0.07 * SR))]) for _ in range(5)]),
}


class Bus:
    def __init__(self, d):
        self.L = np.zeros(int((d + 4) * SR)); self.R = np.zeros_like(self.L)

    def add(self, t, sig, gain=1.0, pan=0.0):
        s = int(round(t * SR))
        if s < 0 or s >= len(self.L): return
        sig = np.asarray(sig, dtype=float)[:len(self.L) - s] * gain
        self.L[s:s + len(sig)] += sig * np.cos((pan + 1) * np.pi / 4)
        self.R[s:s + len(sig)] += sig * np.sin((pan + 1) * np.pi / 4)


def read_mono(p):
    w = wave.open(str(p)); x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float64) / 32768
    if w.getnchannels() == 2: x = x.reshape(-1, 2).mean(1)
    assert w.getframerate() == SR
    return x


voice = read_mono(root / 'audio/narration.wav')
n = int(TOTAL * SR)
voice = np.pad(voice, (0, max(0, n - len(voice))))[:n]

# ——— music: a soft piano, one gentle progression per chapter, stepping aside under the voice ———
music = Bus(TOTAL)
PROG = {  # chapter → chords (low, mid, high); calm tonal colour per chapter, no drums, no melody fighting the voice
    1: [('D3', 'A3', 'F#4'), ('B2', 'F#3', 'D4'), ('G2', 'D3', 'B3'), ('A2', 'E3', 'C#4')],
    2: [('B2', 'F#3', 'D4'), ('G2', 'D3', 'B3'), ('E3', 'B3', 'G4'), ('F#2', 'C#3', 'A3')],
    3: [('E3', 'B3', 'G4'), ('C3', 'G3', 'E4'), ('A2', 'E3', 'C4'), ('B2', 'F#3', 'D#4')],
    4: [('G2', 'D3', 'B3'), ('E3', 'B3', 'G4'), ('C3', 'G3', 'E4'), ('D3', 'A3', 'F#4')],
    5: [('A2', 'E3', 'C4'), ('F2', 'C3', 'A3'), ('D3', 'A3', 'F4'), ('E3', 'B3', 'G#4')],
    6: [('C3', 'G3', 'E4'), ('A2', 'E3', 'C4'), ('F2', 'C3', 'A3'), ('G2', 'D3', 'B3')],
    7: [('D3', 'A3', 'F4'), ('B2', 'F3', 'D4'), ('G2', 'D3', 'Bb3'), ('A2', 'E3', 'C#4')],
    8: [('F2', 'C3', 'A3'), ('D3', 'A3', 'F4'), ('Bb2', 'F3', 'D4'), ('C3', 'G3', 'E4')],
    9: [('G2', 'D3', 'B3'), ('D3', 'A3', 'F#4'), ('E3', 'B3', 'G4'), ('C3', 'G3', 'E4')],
    10: [('A2', 'E3', 'C#4'), ('F#2', 'C#3', 'A3'), ('D3', 'A3', 'F#4'), ('E3', 'B3', 'G#4')],
    11: [('E3', 'B3', 'G#4'), ('C#3', 'G#3', 'E4'), ('A2', 'E3', 'C#4'), ('B2', 'F#3', 'D#4')],
    12: [('D3', 'A3', 'F#4'), ('G2', 'D3', 'B3'), ('B2', 'F#3', 'D4'), ('A2', 'E3', 'C#4')],
}
bar = 60 / 64 * 4  # 64 bpm, four beats a chord
for ch in range(1, 13):
    cl = [l for l in LINES['lines'] if l['chapter'] == ch]
    a, b = cl[0]['start'] - (0.4 if ch > 1 else 0), cl[-1]['end'] + cl[-1]['pauseAfter']
    t, k = a, 0
    while t < b - 0.5:
        lo, mid, hi = PROG[ch][k % 4]
        music.add(t, piano(hz(lo), 4.0, 0.55), 1.0, -0.2)
        music.add(t + 0.02, piano(hz(mid), 3.6, 0.4), 1.0, 0.1)
        music.add(t + bar * 0.5, piano(hz(hi), 3.0, 0.32), 1.0, 0.25)
        if k % 2 == 1:
            music.add(t + bar * 0.75, piano(hz(mid) * 2, 2.4, 0.18), 1.0, -0.3)
        t += bar; k += 1
# duck: follow the voice envelope (40 ms attack, 600 ms release)
hop = 480
env_v = np.array([np.sqrt((voice[i:i + hop] ** 2).mean()) for i in range(0, n, hop)])
active = (env_v > 0.01).astype(float)
sm = np.zeros_like(active); g = 0.0
for i, a in enumerate(active):
    g = g + (a - g) * (0.5 if a > g else 0.016)
    sm[i] = g
duck = np.repeat(1 - 0.55 * sm, hop)[:n]
mL, mR = music.L[:n] * duck, music.R[:n] * duck

# ——— effects ———
fx = Bus(TOTAL)
cues = [c for p in sorted((root / 'audio/sfx').glob('*.json')) for c in json.loads(p.read_text(encoding='utf-8'))]  # one file per batch
placed = []
for c in cues:
    t = cue_time(c)
    fx.add(t, SFX[c['sfx']](), c.get('gain', 0.5), c.get('pan', 0.0))
    placed.append({'shot': c['shot'], 'sfx': c['sfx'], 't': round(t, 3)})

# ——— sum, normalise, master ———
L = voice * 1.0 + mL * 0.22 + fx.L[:n]
R = voice * 1.0 + mR * 0.22 + fx.R[:n]
st = np.stack([L, R], 1)
st /= np.abs(st).max() * 1.05
raw = root / 'audio/mix-raw.wav'
with wave.open(str(raw), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype('<i2').tobytes())


def loud(p):
    o = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(p), '-af', 'ebur128=peak=true:framelog=quiet', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', o)[-1]), float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', o)[-1])


out = root / 'public/audio/mix.wav'
out.parent.mkdir(parents=True, exist_ok=True)
gain = round(-16 - loud(raw)[0], 2)
lim = 10 ** (-2.0 / 20)
for _ in range(4):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-af', f'volume={gain}dB,aresample=192000,alimiter=limit={lim:.4f}:level=false:attack=1:release=80,aresample=48000', '-ar', '48000', '-ac', '2', str(out)], check=True)
    lufs, tp = loud(out)
    if abs(lufs + 16) < 0.2: break
    gain = round(gain - 16 - lufs, 2)
raw.unlink()
(root / 'audio/mix-report.json').write_text(json.dumps({'lufs': lufs, 'truePeak': tp, 'seconds': TOTAL, 'cues': placed}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(f'mix.wav {lufs:.1f} LUFS, peak {tp:.1f} dBTP, {len(placed)} effects, {TOTAL:.2f} s')
