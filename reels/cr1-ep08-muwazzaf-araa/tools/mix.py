"""EP08's soundtrack: the voice, line by line at its place on the timeline, and light effects on visible actions. No music.

usage: python3 tools/mix.py          → public/audio/mix.wav (48 kHz stereo, −16 LUFS, true peak ≤ −4.5 dBTP), audio/mix-report.json
Lines come from audio/lines/NNN.wav (cut from the recordings by tools/voice.py) at the times in timing/lines.json;
without them (no recording yet) the mix is the effects alone, mastered quieter (−20 LUFS) for the silent preview.
Effects are cued in src/cues.ts (the picture's own frames) and exported to timing/cues.json by tools/cues.ts.
"""
import json
import sys
from pathlib import Path

import numpy as np

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root.parent.parent / 'films/hudoo/tools'))
from synth import SFX, SR, Bus, band, click, env, layer, master, noise, read_mono, thud, tt, write_stereo  # noqa: E402

cues = json.loads((root / 'timing/cues.json').read_text(encoding='utf-8'))
lines = json.loads((root / 'timing/lines.json').read_text(encoding='utf-8'))
TOTAL = cues['frames'] / cues['fps']
n = int(TOTAL * SR)

# effects this episode needs beyond the film's set
LOCAL = {
    'beep': lambda: np.sin(2 * np.pi * 620 * tt(0.22)) * env(int(0.22 * SR), 0.005, 0.08) * 0.5,  # the neutral rating
    'buzzlet': lambda: SFX['buzz']()[: int(0.3 * SR)] * 0.8,  # a single short angry buzz
    'thunk': lambda: layer(thud(0.3, 140, 60), (0.0, band(noise(0.3), 300, 2500) * np.exp(-tt(0.3) * 14) * 0.5)),  # the chute
    'tick': lambda: click(1300, 0.03) * 0.9,
    'spin': lambda: np.concatenate([np.concatenate([click(1500 + 30 * i, 0.02) * 0.7, np.zeros(int(max(0.02, 0.09 - i * 0.004) * SR))]) for i in range(18)]),
    'flip': lambda: layer(SFX['swish']() * 0.7, (0.08, click(1700, 0.04))),
    'vibrate': lambda: np.concatenate([np.sin(2 * np.pi * 150 * tt(0.35)) * (0.6 + 0.4 * np.sin(2 * np.pi * 32 * tt(0.35))) * env(int(0.35 * SR), 0.01, 0.05), np.zeros(int(0.18 * SR))] * 2) * 0.7,
    'clink': lambda: layer(click(3200, 0.05), (0.0, thud(0.15, 300, 200) * 0.4)),
    'muffled': lambda: band(SFX['buzz'](), 80, 400) * 0.6,  # the box buzzing under the mug
}
fx = Bus(TOTAL)
missing = set()
for c in cues['cues']:
    make = LOCAL.get(c['sfx']) or SFX.get(c['sfx'])
    if not make:
        missing.add(c['sfx'])
        continue
    fx.add(c['t'], make(), c['gain'], c['pan'])
if missing:
    raise SystemExit(f'unknown effects: {sorted(missing)}')

voice = np.zeros(n)
lines_dir = root / 'audio/lines'
recorded = lines.get('source') == 'recording' and lines_dir.exists()
if recorded:
    for L in lines['lines']:
        x = read_mono(lines_dir / f"{L['id']:03d}.wav")
        a = int(L['start'] * SR)
        voice[a:a + len(x)] += x[: max(0, n - a)]

L = voice + fx.L[:n]
R = voice + fx.R[:n]
raw = root / 'audio/mix-raw.wav'
raw.parent.mkdir(parents=True, exist_ok=True)
write_stereo(raw, L, R)
out = root / 'public/audio/mix.wav'
out.parent.mkdir(parents=True, exist_ok=True)
target = -16.0 if recorded else -20.0
lufs, tp = master(raw, out, target, -4.5)
raw.unlink()
(root / 'audio/mix-report.json').write_text(json.dumps({'voice': 'recording' if recorded else 'none (effects only)', 'lufs': lufs, 'truePeak': tp, 'seconds': round(TOTAL, 3), 'effects': len(cues['cues'])}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(f"mix.wav: voice {'yes' if recorded else 'no'}, {lufs:.1f} LUFS, true peak {tp:.1f} dBTP, {len(cues['cues'])} effects, {TOTAL:.2f} s")
