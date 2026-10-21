"""Every character drawn on screen exists in the face that draws it (Arabic or Latin subset), so no
frame falls back to a system font; and each Arabic subset carries its shaping tables.
usage: python3 tools/fontcheck.py   (needs: pip install fonttools brotli)"""
import json, re, sys
from pathlib import Path
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parent.parent
text = ''
for f in ('Episode.tsx', 'Reel.tsx', 'text.tsx', 'art.tsx'):
    text += ''.join(re.findall(r"[؀-ۿ][^'\"<>{}\n]*", (root / 'src' / f).read_text(encoding='utf-8')))
for prog in ('long', 'short'):
    text += ''.join(c['text'] for c in json.loads((root / f'src/data/{prog}.json').read_text(encoding='utf-8'))['captions'])
text += '0123456789:؟،.«»…'
need = sorted({ch for ch in text if not ch.isspace()})
bad = {}
for face in ('tajawal-800', 'tajawal-700', 'cairo-var'):
    cmap = {}
    for sub in ('arabic', 'latin'):
        font = TTFont(root / f'public/fonts/{face}-{sub}.woff2')
        if sub == 'arabic':
            assert 'GSUB' in font and 'GPOS' in font, f'{face}-{sub} lacks shaping tables'
        cmap.update(font.getBestCmap())
    missing = [f'{ch} U+{ord(ch):04X}' for ch in need if ord(ch) not in cmap]
    if missing:
        bad[face] = missing
print(json.dumps({'distinctChars': len(need), 'missing': bad}, ensure_ascii=False))
sys.exit(1 if bad else 0)
