"""storyboard.src.json (shots anchored on spoken words) → storyboard.json (seconds, for motion.py and the docs) and
storyboard.md (the shot table in Arabic). Same anchor rule as the reels' Scene.tsx: a shot starts `off` seconds from
the start of `word` in line `seg` (src/video/words.json), rounded to a frame.
usage: python3 reels/tools/storyboard.py reels/<slug>"""
import json
import re
import sys
from pathlib import Path

reel = Path(sys.argv[1]).resolve()
src = json.loads((reel / 'storyboard.src.json').read_text(encoding='utf-8'))
tl = json.loads((reel / 'timeline.json').read_text(encoding='utf-8'))
words = json.loads((reel / 'src/video/words.json').read_text(encoding='utf-8'))
fps = tl['fps']
clean = lambda x: re.sub(r'[ً-ْـ]', '', re.sub(r'[«»،.:؟…!؛]', '', x))


def at(a):
    if 'at' in a:
        t = a['at']
    else:
        hits = [w for w in words if w['seg'] == a['seg'] and clean(w['w']).startswith(clean(a['word']))]
        if not hits:
            sys.exit(f"no word {a['word']} in {a['seg']}")
        t = hits[a.get('n', 0)]['start'] + a.get('off', 0)
    return round(t * fps) / fps


shots = []
for i, s in enumerate(src['shots']):
    t0 = at(s['anchor'])
    shots.append({**{k: v for k, v in s.items() if k != 'anchor'}, 't0': round(t0, 3)})
for a, b in zip(shots, shots[1:]):
    a['t1'] = b['t0']
shots[-1]['t1'] = round(tl['durationInFrames'] / fps, 3)
(reel / 'storyboard.json').write_text(json.dumps({'title': src['title'], 'world': src['world'], 'shots': shots}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')

lens = [s['t1'] - s['t0'] for s in shots]
md = f"# Storyboard — «{src['title']}»\n\n{len(shots)} لقطة، {shots[-1]['t1']:.2f} ث ({tl['durationInFrames']} إطارًا، {fps} إطارًا/ث). "
md += f"كل لقطة تبدأ على كلمة منطوقة (`storyboard.src.json` ← `src/video/words.json`). أقصر لقطة {min(lens):.2f} ث، أطولها {max(lens):.2f} ث.\n\n{src['world']}\n\n"
for s in shots:
    md += f"## {s['id']} · {s['t0']:.2f}–{s['t1']:.2f} ث · {s['size']}\n\n| | |\n|---|---|\n"
    for k, label in (('audio', 'الصوت'), ('action', 'الفعل'), ('motive', 'الدافع'), ('camera', 'الكاميرا'), ('sound', 'المؤثرات'), ('layers', 'الطبقات')):
        if k in s:
            md += f"| {label} | {s[k]} |\n"
    md += '\n'
(reel / 'storyboard.md').write_text(md, encoding='utf-8')
print(json.dumps([(s['id'], s['t0']) for s in shots], ensure_ascii=False))
