"""The shot timeline shared by the Python tools: the same rule as src/film/engine.tsx (one shot per line, line 86 split
in two; the cut lands at most 0.22 s before the voice)."""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent
SR, FPS = 48000, 60
LINES = json.loads((root / 'timing/lines.json').read_text(encoding='utf-8'))
WORDS = json.loads((root / 'timing/words.json').read_text(encoding='utf-8'))
SHOTS = json.loads((root / 'narrative/shotlist.json').read_text(encoding='utf-8'))
TOTAL = LINES['total']


def norm(s):
    s = re.sub(r'[^\u0621-\u064A0-9]', '', s)
    return s.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ة', 'ه').replace('ى', 'ي')


def timeline():
    out, prev_end = [], 0.0
    for k, s in enumerate(SHOTS):
        L = next(l for l in LINES['lines'] if l['id'] == s['line'])
        lw = [w for w in WORDS if w['line'] == s['line']]
        part = s['part']
        ws = lw[part[0]:part[1]] if part else lw
        sp0 = ws[0]['start'] if part and part[0] > 0 else L['start']
        sp1 = lw[part[1]]['start'] if part and part[1] is not None else L['end']
        lead = 0 if k == 0 else min(0.22, (sp0 - prev_end) * 0.6)
        out.append({'id': s['id'], 'from': 0 if k == 0 else round((sp0 - lead) * FPS) / FPS, 'words': ws, 'chapter': L['chapter'], 'speech': (sp0, sp1)})
        prev_end = sp1
    return out


T = timeline()
