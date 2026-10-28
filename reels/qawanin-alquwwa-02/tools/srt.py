"""Arabic subtitles from the word times: python3 tools/srt.py → export/qawanin-alquwwa-02.ar.srt
Lines break at punctuation or after 8 words; times are the film's (chunk start + word time)."""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent
T = json.loads((root / 'src/timing.json').read_text(encoding='utf-8'))
fmt = lambda s: f'{int(s // 3600):02d}:{int(s % 3600 // 60):02d}:{int(s % 60):02d},{int(round(s % 1 * 1000)) % 1000:03d}'
cues = []
for c in T['chunks']:
    words = [w for w in json.loads((root / f"timing/{c['id']}.words.json").read_text(encoding='utf-8'))['words']
             if w['type'] == 'word' and not w['text'].startswith('[')]
    line = []
    for w in words:
        line.append(w)
        if len(line) >= 8 or re.search(r'[.،,!?؟…:]$', w['text']) and len(line) >= 3:
            cues.append((c['start'] + line[0]['start'], c['start'] + line[-1]['end'] + 0.15, ' '.join(x['text'] for x in line)))
            line = []
    if line:
        cues.append((c['start'] + line[0]['start'], c['start'] + line[-1]['end'] + 0.15, ' '.join(x['text'] for x in line)))
cues = [(a, min(b, cues[i + 1][0] - 0.02) if i + 1 < len(cues) else b, s) for i, (a, b, s) in enumerate(cues)]
out = root / 'export/qawanin-alquwwa-02.ar.srt'
out.parent.mkdir(exist_ok=True)
out.write_text(''.join(f'{i}\n{fmt(a)} --> {fmt(b)}\n‫{t}‬\n\n' for i, (a, b, t) in enumerate(cues, 1)), encoding='utf-8')
print(f'{len(cues)} cues → {out}')
