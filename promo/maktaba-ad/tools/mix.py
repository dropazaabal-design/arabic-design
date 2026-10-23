"""The ad's soundtrack: the voice (ElevenLabs, line by line), a quiet piano that steps aside under it, and light effects on visible actions.

usage: python3 tools/mix.py → public/audio/mix.wav (48 kHz stereo, −16 LUFS, true peak ≤ −4.5 dBTP), audio/mix-report.json
Effects are cued on spoken words (line, word) like the picture (src/timing.ts), so sound and action land together.
Synthesis comes from films/hudoo/tools/synth.py: nothing is sampled.
"""
import json
import sys
from pathlib import Path

import numpy as np

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root.parent.parent / 'films/hudoo/tools'))
from synth import SFX, SR, Bus, hz, master, piano, read_mono, write_stereo  # noqa: E402

FPS = 60
W = {(x['line'], x['i']): x for x in json.loads((root / 'timing/words.json').read_text(encoding='utf-8'))}
LINES = json.loads((root / 'timing/lines.json').read_text(encoding='utf-8'))['lines']
END = LINES[-1]['end'] + 2.0  # the picture holds the call to action 2 s (src/timing.ts TOTAL)
TOTAL = round(round(END * FPS) / FPS, 4)


def at(line, i, d=0.0, end=False):
    return W[(line, i)]['end' if end else 'start'] + d


# (time, effect, gain, pan); the picture's matching action is noted beside each
CUES = [
    (0.25, 'swish', 0.22, 0.0),                       # the saved feed starts scrolling
    (at(1, 6, 0.23), 'chime', 0.30, 0.0),             # the library opens in the phone
    (at(2, 3, -0.15), 'whoosh', 0.35, 0.0),           # the 50 maps spread out of the phone
    (at(2, 6), 'pop', 0.30, 0.0),                     # «50 قاعدة · 50 خريطة»
    *[(at(3, 0, -0.08 + k * 0.133), 'pop', 0.16, (-0.6, 0.6)[k % 2]) for k in range(7)],  # notes pile up
    (at(4, 1, 0.0), 'tap', 0.45, 0.0),                # the index row is tapped
    (at(4, 2, -0.1), 'whoosh', 0.30, 0.0),            # the map lifts out of the phone
    (at(4, 6), 'click', 0.35, 0.3),                   # urgent quarter
    (at(4, 7), 'click', 0.35, -0.3),                  # important quarter
    (at(5, 0, -0.1), 'page', 0.45, 0.0),              # the template lands on the desk
    *[(at(5, 1, k * 0.15 + 0.2), 'pop', 0.18, (0.4, -0.4)[k % 2]) for k in range(4)],  # tasks placed
    (at(5, 6, 0.07), 'pen', 0.5, 0.2),                # the next step circled
    *[(at(6, wi, -0.05), 'swish', 0.25, -0.3) for wi in (2, 3, 4, 6)],  # one map per area
    (at(7, 3, 0.1), 'page', 0.30, -0.2),              # a page turned
    (at(7, 5), 'ding', 0.18, 0.5),                    # the map lights up on the phone
    (at(8, 2), 'click', 0.30, -0.4),                  # on the phone
    (at(8, 4, 0.2), 'page', 0.35, 0.4),               # printed templates
    (at(8, 4, 0.45), 'page', 0.28, 0.5),
    (at(8, 5, 0.47), 'chime', 0.22, -0.3),            # download complete
    (at(8, 7, -0.1), 'pop', 0.30, 0.0),               # the price
    (at(9, 0, -0.3), 'whoosh', 0.25, 0.0),            # the end card
    (at(9, 6), 'chime', 0.30, 0.0),                   # the address
]

n = int(TOTAL * SR)
if json.loads((root / 'timing/lines.json').read_text(encoding='utf-8')).get('source') == 'recording':
    # the ElevenLabs voice: one WAV per line (cut by reels/cr1-ep08-muwazzaf-araa/tools/voice.py), each at its time
    voice = np.zeros(n)
    for L in LINES:
        x = read_mono(root / f"audio/lines/{L['id']:03d}.wav")
        a = int(L['start'] * SR)
        voice[a:a + len(x)] += x[: max(0, n - a)]
else:
    voice = read_mono(root / 'audio/narration.wav')
    voice = np.pad(voice, (0, max(0, n - len(voice))))[:n]

# piano: four soft chords that loop (Dmaj9 – Bm7 – Gmaj7 – A6), 80 bpm, a held bass and a light upper motif
music = Bus(TOTAL)
bar = 60 / 80 * 4
CHORDS = [('D3', 'F#4', 'A4', 'E5'), ('B2', 'D4', 'F#4', 'A4'), ('G2', 'B3', 'D4', 'F#4'), ('A2', 'C#4', 'E4', 'F#4')]
t, k = 0.0, 0
while t < TOTAL - 1.5:
    low, *up = CHORDS[k % 4]
    music.add(t, piano(hz(low), bar * 1.1, 0.55), 0.55, 0.0)
    for j, note in enumerate(up):
        music.add(t + j * 0.04, piano(hz(note), bar, 0.42), 0.35, (-0.35, 0.0, 0.35)[j % 3])
    for b in (1, 2.5, 3):
        music.add(t + b * bar / 4, piano(hz(up[(k + int(b)) % 3]) * 2, 1.2, 0.3), 0.14, 0.4)
    t += bar
    k += 1
# a closing D chord under the held call to action, so the end resolves instead of going quiet
for j, note in enumerate(('D3', 'A3', 'F#4', 'D5')):
    music.add(TOTAL - 2.6 + j * 0.05, piano(hz(note), 2.8, 0.5), (1.0, 0.7, 0.6, 0.4)[j], (-0.3, 0.0, 0.3, 0.0)[j])
fade = np.minimum(1, np.minimum(np.arange(len(music.L)) / (0.6 * SR), np.maximum(0, (TOTAL * SR - np.arange(len(music.L))) / (0.7 * SR))))
music.L *= fade
music.R *= fade

# duck the music under the voice (smoothed envelope, 55 % down)
hop = 480
env_v = np.array([np.sqrt((voice[i:i + hop] ** 2).mean()) for i in range(0, n, hop)])
active = (env_v > 0.01).astype(float)
sm = np.zeros_like(active)
g = 0.0
for i, a in enumerate(active):
    g += (a - g) * (0.25 if a > g else 0.04)
    sm[i] = g
duck = np.repeat(1 - 0.55 * sm, hop)[:n]

fx = Bus(TOTAL)
for (tt, name, gain, pan) in CUES:
    fx.add(tt, SFX[name](), gain, pan)

L = voice + music.L[:n] * duck * 0.2 + fx.L[:n]
R = voice + music.R[:n] * duck * 0.2 + fx.R[:n]
raw = root / 'audio/mix-raw.wav'
write_stereo(raw, L, R)
out = root / 'public/audio/mix.wav'
out.parent.mkdir(parents=True, exist_ok=True)
lufs, tp = master(raw, out, -16.0, -4.5)
raw.unlink()
(root / 'audio/mix-report.json').write_text(json.dumps({'lufs': lufs, 'truePeak': tp, 'seconds': TOTAL, 'cues': [{'t': round(c[0], 3), 'sfx': c[1], 'gain': c[2]} for c in CUES]}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(f'mix.wav {lufs:.1f} LUFS, true peak {tp:.1f} dBTP, {len(CUES)} effects, {TOTAL:.2f} s')
