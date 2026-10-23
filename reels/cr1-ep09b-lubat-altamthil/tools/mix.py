"""The ad's sound: the voice (ElevenLabs, one WAV per line at its time on the clock) and light effects on visible
actions. No music.

usage: python3 tools/mix.py → public/audio/mix.wav (48 kHz stereo, −16 LUFS, true peak ≤ −4.5 dBTP), audio/mix-report.json
Cues come from timing/cues.json (tools/cues.ts, from the scenes' own frames); effects are synthesised
(films/hudoo/tools/synth.py), nothing is sampled.
"""
import json
import sys
from pathlib import Path

import numpy as np

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root.parent.parent / 'films/hudoo/tools'))
from synth import SFX, SR, Bus, master, read_mono, write_stereo  # noqa: E402

FPS = 60
clock = json.loads((root / 'timing/lines.json').read_text(encoding='utf-8'))
TOTAL = clock['frames'] / FPS
CUES = json.loads((root / 'timing/cues.json').read_text(encoding='utf-8'))

n = int(round(TOTAL * SR))
voice = np.zeros(n)
for L in clock['lines']:
    x = read_mono(root / f"audio/lines/{L['id']:03d}.wav")
    a = int(round(L['start'] * SR))
    voice[a:a + len(x)] += x[: max(0, n - a)]

fx = Bus(TOTAL)
for c in CUES:
    fx.add(c['frame'] / FPS, SFX[c['sfx']](), c['gain'], c['pan'])

# effects step back under the voice (a smoothed envelope, 40 % down), so speech stays first
hop = 480
env = np.array([np.sqrt((voice[i:i + hop] ** 2).mean()) for i in range(0, n, hop)])
g, sm = 0.0, []
for a in (env > 0.01).astype(float):
    g += (a - g) * (0.3 if a > g else 0.05)
    sm.append(g)
duck = np.repeat(1 - 0.4 * np.array(sm), hop)[:n]

L_, R_ = voice + fx.L[:n] * duck, voice + fx.R[:n] * duck
raw = root / 'audio/mix-raw.wav'
write_stereo(raw, L_, R_)
out = root / 'public/audio/mix.wav'
out.parent.mkdir(parents=True, exist_ok=True)
lufs, tp = master(raw, out, -16.0, -4.5)
raw.unlink()
(root / 'audio/mix-report.json').write_text(json.dumps({'voice': 'ElevenLabs dlGxemPxFMTY7iXagmOj', 'music': None, 'lufs': lufs, 'truePeak': tp, 'seconds': round(TOTAL, 3), 'effects': len(CUES)}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(f'mix.wav {lufs:.1f} LUFS, true peak {tp:.1f} dBTP, {len(CUES)} effects, {TOTAL:.2f} s')
