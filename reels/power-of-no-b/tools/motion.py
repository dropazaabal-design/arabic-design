"""Unintended stillness check: how much the picture really moves, shot by shot, beyond the line boil.

usage: python3 tools/motion.py output/final_reel.mp4 [OUT.json]
The doodle boil re-seeds 8×/s and rotates through three patterns, so frame t and frame t+12 (0.4 s) share the
same boil pattern: the difference between them is motion (character, props, camera), not boil. For each shot
it reports the share of 0.4 s steps with visible motion and the longest run without it (measurement only).
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

root = Path(__file__).resolve().parent.parent
video = sys.argv[1]
out = Path(sys.argv[2]) if len(sys.argv) > 2 else root / 'output/qa-motion.json'
W, H, STEP, THRESH = 135, 240, 12, 1.2   # downscaled gray; 0.4 s step; mean |Δ| (0–255) that counts as visible motion

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', video, '-vf', f'scale={W}:{H},format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
frames = np.frombuffer(raw, dtype=np.uint8).reshape(-1, H, W).astype(np.float32)
n = len(frames)
diff = np.array([np.abs(frames[i + STEP] - frames[i]).mean() for i in range(n - STEP)])

shots = json.loads(subprocess.run(['node', str(root / 'tools/storyboard.mjs'), '--frames'], capture_output=True, text=True).stdout)
res = []
for sid, t0, _, t1 in shots:
    d = diff[t0:max(t0 + 1, min(t1 + 1, n - STEP) - STEP)]
    moving = d > THRESH
    run = best = 0
    for m in moving:
        run = 0 if m else run + 1
        best = max(best, run)
    res.append({'shot': sid, 'from_s': round(t0 / 30, 2), 'to_s': round((t1 + 1) / 30, 2), 'movingShare': round(float(moving.mean()) if len(moving) else 0, 2),
                'longestStillSeconds': round(best / 30, 2), 'meanDelta': round(float(d.mean()) if len(d) else 0, 2)})
summary = {'file': video, 'frames': n, 'stepFrames': STEP, 'threshold': THRESH, 'shots': res,
           'longestStillAnywhere': max(r['longestStillSeconds'] for r in res),
           'note': 'measurement only: a long still run is a place to look at, not a verdict (the closing face hold is meant to be still)'}
out.write_text(json.dumps(summary, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
for r in res:
    print(f"{r['shot']}  {r['from_s']:6.2f}–{r['to_s']:6.2f}  moving {r['movingShare']:.2f}  longest still {r['longestStillSeconds']:.2f}s  meanΔ {r['meanDelta']}")
