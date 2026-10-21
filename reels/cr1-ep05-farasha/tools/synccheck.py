"""Sync by cross-correlation, not by silence onsets (effects mask most onsets in this reel).

The timeline (src/data/short.json) is built from public/audio/short-mix.wav, and every animation beat is
keyed to a frame of that timeline. So if the MP4's audio lines up with that mix at every voice line, the
voice and the picture line up too. For each line, a 1.5 s window of the export starting just before the
line is cross-correlated with the mix; the lag must be within one frame (16.7 ms).

usage: python3 tools/synccheck.py EXPORT.mp4   → review/sync.json
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

root = Path(__file__).resolve().parent.parent
SR = 48000
pcm = lambda p: np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', str(p), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout, dtype=np.float32)
exp, mix = pcm(sys.argv[1]), pcm(root / 'public/audio/short-mix.wav')
data = json.loads((root / 'src/data/short.json').read_text(encoding='utf-8'))
out, worst = [], 0.0
for s in data['segments']:
    a = int((s['start'] - 0.2) * SR)
    win, ref = exp[a:a + int(1.5 * SR)], mix[a - int(0.1 * SR):a + int(1.6 * SR)]
    c = np.correlate(ref, win, mode='valid')
    lag_ms = (int(np.argmax(c)) - int(0.1 * SR)) / SR * 1000
    out.append({'seg': s['id'], 'start': s['start'], 'lagMs': round(lag_ms, 2)})
    worst = max(worst, abs(lag_ms))
res = {'method': 'cross-correlation of the export against the timeline mix, per voice line', 'lines': out, 'maxAbsLagMs': round(worst, 2),
       'withinOneFrame': worst <= 1000 / 60, 'exportSeconds': round(len(exp) / SR, 3), 'timelineSeconds': data['totalSeconds']}
(root / 'review/sync.json').write_text(json.dumps(res, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(json.dumps({k: v for k, v in res.items() if k != 'lines'}))
