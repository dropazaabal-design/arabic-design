"""Unintended stillness check (reels/blind-obedience/tools/motion.py, fps-aware): how much the picture really moves,
beat by beat (storyboard.json, seconds), beyond the line boil.

usage: python3 tools/motion.py output/final_reel.mp4 [OUT.json]
Compares frame i with frame i + 0.4 s (downscaled gray); a mean |Δ| above THRESH counts as visible motion. Reports,
per beat, the share of steps with motion and the longest run without it (measurement only).
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

root = Path(__file__).resolve().parent.parent
video = sys.argv[1]
out = Path(sys.argv[2]) if len(sys.argv) > 2 else root / 'output/qa-motion.json'
fps = json.loads((root / 'timeline.json').read_text())['fps']
W, H, THRESH = 135, 240, 1.2
STEP = round(0.4 * fps)

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', video, '-vf', f'scale={W}:{H},format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
frames = np.frombuffer(raw, dtype=np.uint8).reshape(-1, H, W).astype(np.float32)
n = len(frames)
diff = np.array([np.abs(frames[i + STEP] - frames[i]).mean() for i in range(n - STEP)])

res = []
for s in json.loads((root / 'storyboard.json').read_text(encoding='utf-8'))['shots']:
    t0, t1 = round(s['t0'] * fps), round(s['t1'] * fps)
    d = diff[t0:max(t0 + 1, min(t1, n - STEP))]
    moving = d > THRESH
    run = best = 0
    for m in moving:
        run = 0 if m else run + 1
        best = max(best, run)
    res.append({'shot': s['id'], 'from_s': s['t0'], 'to_s': s['t1'], 'movingShare': round(float(moving.mean()) if len(moving) else 0, 2),
                'longestStillSeconds': round(best / fps, 2), 'meanDelta': round(float(d.mean()) if len(d) else 0, 2)})
summary = {'file': video, 'fps': fps, 'frames': n, 'stepFrames': STEP, 'threshold': THRESH, 'shots': res,
           'longestStillAnywhere': max(r['longestStillSeconds'] for r in res), 'note': 'measurement only'}
out.write_text(json.dumps(summary, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
for r in res:
    print(f"{r['shot']}  {r['from_s']:6.2f}–{r['to_s']:6.2f}  moving {r['movingShare']:.2f}  longest still {r['longestStillSeconds']:.2f}s  meanΔ {r['meanDelta']}")
