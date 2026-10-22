"""Shot frames for previews and the manifest: timing/shots.json = [{id, from, to, key, review: [3 frames]}].

The cut rule is the one in src/film/engine.tsx (see tools/mix.py timeline()). `key` is the frame each shot's PNG preview
is taken from: 65% of the way through the spoken part, after the main word-cued action has landed.
usage: python3 tools/shots.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from timeline import FPS, LINES, T, root  # noqa: E402

out = []
for k, s in enumerate(T):
    a = round(s['from'] * FPS)
    b = round(T[k + 1]['from'] * FPS) if k + 1 < len(T) else LINES['frames']
    sp0, sp1 = (round(x * FPS) for x in s['speech'])
    key = min(b - 2, round(sp0 + (sp1 - sp0) * 0.65))
    out.append({'id': s['id'], 'from': a, 'to': b, 'key': key, 'review': [a + 6, round((a + b) / 2), b - 3]})
(root / 'timing/shots.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
print(len(out), 'shots')
