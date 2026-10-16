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


WALL, INK, SHIRT, PANTS, SKIN, BOX, SHOE, DAWN, NIGHT = '#E8EFF6', '#0E1626', '#5E6BC4', '#6E7F99', '#C98F7E', '#9FB2C8', '#12A39A', '#2B3C57', '#1B2840'
INNER, EDGE = 0.22, 0.78  # src/props.tsx POOL: the light pool around the actor, and the frame's dark edge
states = {
    'day': (WALL, 0.0),
    'dawn, behind him (pool centre)': (over(WALL, DAWN, INNER), 0.0),
    'dawn, frame edge': (over(WALL, DAWN, EDGE), 0.0),
    'night, behind him (pool centre)': (over(WALL, NIGHT, INNER), 0.0),
    'night, frame edge': (over(WALL, NIGHT, EDGE), 0.0),
}
out = {}
for name, (bg, wash) in states.items():
    lit = lambda c: over(c, DAWN, wash) if wash else c
    out[name] = {'background': bg, **{k: ratio(lit(c), bg) for k, c in
                 (('outline', INK), ('shirt', SHIRT), ('trousers', PANTS), ('skin', SKIN), ('shoe box', BOX))}}
out['text'] = {
    'title ink on page #F4F7FB': ratio(INK, '#F4F7FB'),
    'shoe-teal title #0B7D76 on page': ratio('#0B7D76', '#F4F7FB'),
    'caption white on its pill (#0E1626 at 0.78 over day wall)': ratio('#FFFFFF', over(WALL, INK, 0.78)),
    'caption white on its pill over the dark edge': ratio('#FFFFFF', over(states['dawn, frame edge'][0], INK, 0.78)),
    'shoe #12A39A on the room wall': ratio(SHOE, WALL),
}
out['note'] = 'WCAG 2 contrast ratios from source colours; the outline is what separates a shape, a fill ratio near 1 is not by itself a failure (see the colour report)'
(root / 'review/contrast.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(json.dumps(out, ensure_ascii=False, indent=1))
