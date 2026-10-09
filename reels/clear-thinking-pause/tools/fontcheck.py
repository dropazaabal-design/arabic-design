"""Every character drawn on screen must exist in the font that draws it (Arabic or Latin subset),
so no frame falls back to a system font. Also checks the Arabic shaping tables are present.
usage: python tools/fontcheck.py   (needs: pip install fonttools brotli)"""
import json, re, sys
from pathlib import Path
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parent.parent
copy = re.findall(r"'([^']*[؀-ۿ@][^']*)'", (root / 'src/copy.ts').read_text(encoding='utf-8'))
caps = [c['text'] for c in json.loads((root / 'src/captions.json').read_text(encoding='utf-8'))]
uses = {'cairo-900': copy, 'cairo-800': copy, 'tajawal-700': copy + caps, 'tajawal-500': ['@kitabwbs']}
bad = {}
for face, strings in uses.items():
    cmap = {}
    for sub in ('arabic', 'latin'):
        f = TTFont(root / f'public/fonts/{face}-{sub}.woff2')
        assert 'GSUB' in f, f'{face}-{sub} has no GSUB'
        cmap.update(f.getBestCmap())
    missing = sorted({ch for s in strings for ch in s if ch != ' ' and ord(ch) not in cmap})
    if missing:
        bad[face] = [f'{ch} U+{ord(ch):04X}' for ch in missing]
chars = sorted({ch for s in copy + caps for ch in s})
print(json.dumps({'distinctChars': len(chars), 'missing': bad}, ensure_ascii=False))
sys.exit(1 if bad else 0)
