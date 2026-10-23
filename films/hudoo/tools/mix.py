"""The soundtrack: narration + a quiet piano that steps aside when the voice speaks + light effects on their actions.

usage: python3 tools/mix.py   → public/audio/mix.wav (48 kHz stereo, −16 LUFS, peak ≤ −2 dBTP), audio/mix-report.json
Effects are cued in audio/sfx/bN.json (one file per batch of shots) as {shot, at: word text or seconds into the shot, sfx, gain}; the shot timing is the
same rule as src/film/engine.tsx (one shot per line, the cut 0.22 s at most before the voice). No samples: all synthesised.
"""
import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))

from timeline import FPS, LINES, SHOTS, T, TOTAL, WORDS, norm, root  # noqa: E402,F401
from synth import SFX, SR, Bus, hz, layer, master, piano, read_mono, write_stereo  # noqa: E402,F401


def cue_time(c):
    s = next(x for x in T if x['id'] == c['shot'])
    at = c.get('at', 0)
    if isinstance(at, str):
        m = [w for w in s['words'] if norm(at) in norm(w['word'])]
        base = (m[min(c.get('nth', 0), len(m) - 1)]['end' if c.get('end') else 'start']) if m else s['speech'][0]
        return base + c.get('offset', 0)
    return s['from'] + at


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
raw = root / 'audio/mix-raw.wav'
write_stereo(raw, L, R)
out = root / 'public/audio/mix.wav'
out.parent.mkdir(parents=True, exist_ok=True)
lufs, tp = master(raw, out, -16.0, -2.0)
raw.unlink()
(root / 'audio/mix-report.json').write_text(json.dumps({'lufs': lufs, 'truePeak': tp, 'seconds': TOTAL, 'cues': placed}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(f'mix.wav {lufs:.1f} LUFS, peak {tp:.1f} dBTP, {len(placed)} effects, {TOTAL:.2f} s')
