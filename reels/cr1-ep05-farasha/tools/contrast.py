"""Contrast of what must read in each light state of the reel, from the source colours (sRGB relative
luminance, WCAG ratio), the same method as the colour research report: the outline, the shirt, the
trousers and the shoe box against the background they stand on, in the day room, and at dawn and night
(a pool of light around him, darkest at the frame's edge), and the text colours on their own grounds. Source colours only: not a measurement of the compressed video.

usage: python3 tools/contrast.py → review/contrast.json
"""
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
hexrgb = lambda h: [int(h[k:k + 2], 16) / 255 for k in (1, 3, 5)]
tohex = lambda c: '#' + ''.join(f'{round(v * 255):02X}' for v in c)
over = lambda base, top, a: tohex([b + (t - b) * a for b, t in zip(hexrgb(base), hexrgb(top))])


def lum(h):
    return sum(w * (v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for w, v in zip((0.2126, 0.7152, 0.0722), hexrgb(h)))


def ratio(a, b):
    x, y = sorted((lum(a), lum(b)), reverse=True)
    return round((x + 0.05) / (y + 0.05), 2)


# EP04: Naser in the living room; evening is a dusk pool (src/props.tsx Room: 0.12 at the work area, 0.7 at the edge, × dusk)
WALL, INK, SHIRT, PANTS, SKIN, BOX, SHOE, DAWN, NIGHT = '#E9E8F2', '#0E1626', '#8E3B52', '#4B5A78', '#D29A86', '#F7F8FB', '#2E7BC5', '#2E3554', '#2E3554'
INNER, EDGE = 0.12, 0.70
states = {
    'day': (WALL, 0.0),
    'evening (dusk 0.85), behind him': (over(WALL, DAWN, INNER * 0.85), 0.0),
    'evening (dusk 0.85), frame edge': (over(WALL, DAWN, EDGE * 0.85), 0.0),
    'night (dusk 1), behind him': (over(WALL, NIGHT, INNER), 0.0),
    'night (dusk 1), frame edge': (over(WALL, NIGHT, EDGE), 0.0),
}
out = {}
for name, (bg, wash) in states.items():
    lit = lambda c: over(c, DAWN, wash) if wash else c
    out[name] = {'background': bg, **{k: ratio(lit(c), bg) for k, c in
                 (('outline', INK), ('shirt', SHIRT), ('trousers', PANTS), ('skin', SKIN), ('white panel', BOX))}}
out['text'] = {
    'title ink on page #F3F4F8': ratio(INK, '#F3F4F8'),
    'clock-blue title #1E5C99 on its card': ratio('#1E5C99', '#F7F8FB'),
    'caption white on its pill (#0E1626 at 0.78 over the day wall)': ratio('#FFFFFF', over(WALL, INK, 0.78)),
    'caption white on its pill over the dark edge': ratio('#FFFFFF', over(states['night (dusk 1), frame edge'][0], INK, 0.78)),
    'clock rim #2E7BC5 on the wall': ratio(SHOE, WALL),
}
out['note'] = 'WCAG 2 contrast ratios from source colours; the outline is what separates a shape, a fill ratio near 1 is not by itself a failure (see the colour report)'
(root / 'review/contrast.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(json.dumps(out, ensure_ascii=False, indent=1))
