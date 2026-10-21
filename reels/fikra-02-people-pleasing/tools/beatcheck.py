"""Check that every wordAt('sNN', 'prefix'[, n]) in src/ resolves in src/words.json
(same matching as src/time.ts: punctuation and marks stripped, prefix match)."""
import json, re, sys
from pathlib import Path
root = Path(__file__).resolve().parent.parent
words = json.loads((root / 'src/words.json').read_text(encoding='utf-8'))
clean = lambda x: re.sub('[ً-ْـ]', '', re.sub('[«»،.:؟…!؛]', '', x))
bad = 0
for f in sorted((root / 'src').rglob('*.tsx')):
    for m in re.finditer(r"wordAt\('(s\d+)',\s*'([^']+)'(?:,\s*(\d+))?\)", f.read_text(encoding='utf-8')):
        seg, w, n = m.group(1), m.group(2), int(m.group(3) or 0)
        hits = [x for x in words if x['seg'] == seg and clean(x['w']).startswith(clean(w))]
        if len(hits) <= n:
            bad += 1
            line = [x['w'] for x in words if x['seg'] == seg]
            print(f"{f.relative_to(root)}: wordAt('{seg}', '{w}') not spoken — line: {' '.join(line)}")
print('ok' if not bad else f'{bad} missing')
sys.exit(1 if bad else 0)
