"""export/ep08.ar.srt from timing/lines.json: the same text and times as the captions burned into the picture
(src/Episode.tsx shows each line from 3 frames before it starts to 10 frames after it ends)."""
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
d = json.loads((root / 'timing/lines.json').read_text(encoding='utf-8'))
FPS = 60


def ts(sec):
    ms = max(0, round(sec * 1000))
    return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


out = []
for n, L in enumerate(d['lines'], 1):
    a, b = (round(L['start'] * FPS) - 3) / FPS, (round(L['end'] * FPS) + 10) / FPS
    out.append(f"{n}\n{ts(a)} --> {ts(b)}\n{L['text']}\n")
path = root / 'export/ep08.ar.srt'
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text('\n'.join(out), encoding='utf-8')
print(f'{path.name}: {len(out)} cues ({d["source"]})')
