"""Structure of what the generators return, next to the current pipeline's own source (runs here, no GPU).

For every SVG: element, path and group counts, named groups, top-level groups (a rig needs one per moving
part), colours, and colours in the banned yellow/orange/gold band. For every Lottie JSON: size, fps,
duration, layers, named layers, parented layers (a rig needs a parent chain), keyframed properties.
Numbers only: whether a drawing is good, or a motion believable, is judged on the contact sheets.

usage: python3 -I scripts/analyze.py RESULTS_DIR [MORE ...]  → metrics.json + a table on stdout
       python3 -I scripts/analyze.py --self-check
"""
import colorsys
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

HEX = re.compile(r'#[0-9a-fA-F]{6}\b')


def banned(hexes):
    out = []
    for h in hexes:
        r, g, b = (int(h[k:k + 2], 16) / 255 for k in (1, 3, 5))
        hh, l, s = colorsys.rgb_to_hls(r, g, b)
        if 20 <= hh * 360 <= 70 and s >= 0.25 and 0.2 <= l <= 0.85:
            out.append(h.upper())
    return out


def svg_stats(p):
    text = p.read_text(encoding='utf-8', errors='ignore')
    root = ET.fromstring(text)
    tag = lambda e: e.tag.split('}')[-1]
    els = list(root.iter())
    groups = [e for e in els if tag(e) == 'g']
    named = [g for g in groups if g.get('id') or g.get('data-part') or g.get('inkscape:label')]
    colours = sorted(set(h.upper() for h in HEX.findall(text)))
    return {'file': str(p), 'bytes': len(text.encode()), 'elements': len(els), 'paths': sum(tag(e) == 'path' for e in els),
            'groups': len(groups), 'namedGroups': len(named), 'topLevelGroups': sum(tag(e) == 'g' for e in root),
            'colours': len(colours), 'bannedColours': banned(colours)}


def lottie_stats(p):
    d = json.loads(p.read_text(encoding='utf-8'))
    layers = d.get('layers', [])
    def keyed(o):
        if isinstance(o, dict):
            return (1 if o.get('a') == 1 else 0) + sum(keyed(v) for v in o.values())
        if isinstance(o, list):
            return sum(keyed(v) for v in o)
        return 0
    text = json.dumps(d)
    return {'file': str(p), 'bytes': p.stat().st_size, 'fps': d.get('fr'), 'seconds': round((d.get('op', 0) - d.get('ip', 0)) / (d.get('fr') or 1), 2),
            'size': [d.get('w'), d.get('h')], 'layers': len(layers), 'namedLayers': sum(1 for l in layers if l.get('nm')),
            'parentedLayers': sum(1 for l in layers if 'parent' in l), 'animatedProperties': keyed(d),
            'bannedColours': banned(set(HEX.findall(text)))}


def scan(dirs):
    rows = []
    for d in dirs:
        for p in sorted(Path(d).rglob('*')):
            try:
                if p.suffix == '.svg':
                    rows.append({'kind': 'svg', **svg_stats(p)})
                elif p.suffix == '.json' and '"layers"' in p.read_text(encoding='utf-8', errors='ignore')[:200000]:
                    rows.append({'kind': 'lottie', **lottie_stats(p)})
            except Exception as e:  # a malformed output is a result too
                rows.append({'kind': p.suffix[1:], 'file': str(p), 'error': str(e)[:200]})
    return rows


if __name__ == '__main__':
    if sys.argv[1:] == ['--self-check']:
        base = svg_stats(Path(__file__).resolve().parents[3] / 'motion-core/art/characters/sultan.svg')
        assert base['topLevelGroups'] == 21 and base['namedGroups'] >= 21 and not base['bannedColours'], base
        assert banned(['#FFB000']) == ['#FFB000'] and banned(['#2E7BC5']) == []
        print('ok', base)
        sys.exit(0)
    rows = scan(sys.argv[1:])
    Path('metrics.json').write_text(json.dumps(rows, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    for r in rows:
        print(r['kind'], Path(r['file']).name, {k: v for k, v in r.items() if k not in ('kind', 'file')})
