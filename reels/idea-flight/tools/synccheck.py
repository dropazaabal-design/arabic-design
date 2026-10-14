"""Find every narration line inside the final mix by cross-correlation and compare with timeline.json.
usage: python3 tools/synccheck.py output/final_reel.mp4   (measurement only)"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np
root = Path(__file__).resolve().parent.parent
tl = json.loads((root / 'timeline.json').read_text(encoding='utf-8'))
SR = 8000
mix = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', sys.argv[1], '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout, dtype=np.int16).astype(float)
res = []
for s in tl['segments']:
    v = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', str(root / 'assets' / s['file']), '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout, dtype=np.int16).astype(float)
    a = int((s['fileStart'] - 0.5) * SR); a = max(0, a)
    win = mix[a:a + len(v) + SR]
    c = np.correlate(win, v, 'valid')
    k = int(np.argmax(c))
    res.append({'id': s['id'], 'planned': s['fileStart'], 'found': round((a + k) / SR, 3), 'offsetMs': round(((a + k) / SR - s['fileStart']) * 1000, 1)})
print(json.dumps({'lines': len(res), 'maxAbsOffsetMs': max(abs(r['offsetMs']) for r in res), 'detail': res}, ensure_ascii=False))
