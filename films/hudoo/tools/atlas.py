"""The numbered storyboard atlas: one page per batch of 20 shots (preview, number, time, type, the spoken words, the
word cues), as HTML pages screenshotted with headless Chromium (so the Arabic is shaped by the browser), plus one PDF.
Needs manifest.json (tools/manifest.py) and previews/shots/*.png (tools/shots.mjs key).
usage: python3 tools/atlas.py → previews/atlas/atlas-b1..b8.png and previews/atlas/atlas.pdf
"""
import glob
import html
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parent.parent
out = root / 'previews/atlas'
out.mkdir(parents=True, exist_ok=True)
M = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
CHROME = (glob.glob('/opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell') or ['chromium'])[0]
FONTS = (root / 'public/fonts').as_uri()

CSS = f"""
@font-face {{ font-family: Tajawal; src: url({FONTS}/tajawal-800-arabic.woff2); font-weight: 800; }}
@font-face {{ font-family: Cairo; src: url({FONTS}/cairo-var-arabic.woff2); font-weight: 600 700; }}
* {{ box-sizing: border-box; margin: 0; }}
body {{ background: #F3F1EC; color: #2A2F3A; font-family: Cairo, sans-serif; direction: rtl; }}
.page {{ width: 1920px; padding: 36px 40px 30px; page-break-after: always; }}
h1 {{ font-family: Tajawal; font-size: 40px; font-weight: 800; }}
h2 {{ font-size: 22px; font-weight: 600; color: #5B6472; margin: 4px 0 22px; }}
.grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px 20px; }}
.card {{ background: #fff; border: 2px solid #2A2F3A; border-radius: 14px; overflow: hidden; }}
.card img {{ display: block; width: 100%; aspect-ratio: 16/9; border-bottom: 2px solid #2A2F3A; }}
.miss {{ width: 100%; aspect-ratio: 16/9; background: #E9C6C9; border-bottom: 2px solid #2A2F3A; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 700; }}
.meta {{ display: flex; gap: 10px; align-items: center; padding: 8px 12px 0; font-size: 17px; font-weight: 700; }}
.n {{ background: #3E8E7E; color: #fff; border-radius: 9px; padding: 0 10px 3px; font-size: 20px; direction: ltr; }}
.t {{ direction: ltr; color: #5B6472; font-weight: 600; }}
.k {{ margin-inline-start: auto; background: #DDE6F0; border-radius: 8px; padding: 0 8px 2px; font-size: 15px; }}
.x {{ padding: 4px 12px 2px; font-size: 18px; font-weight: 600; line-height: 1.5; height: 58px; overflow: hidden; }}
.c {{ padding: 0 12px 10px; font-size: 14px; color: #5B6472; height: 26px; overflow: hidden; white-space: nowrap; }}
"""


def mmss(s):
    return f'{int(s // 60)}:{s % 60:04.1f}'


def card(s):
    img = (root / s['preview']).as_uri() if s['preview'] else None
    pic = f'<img src="{img}">' if img else '<div class="miss">لم تُصيَّر بعد</div>'
    cues = ' · '.join(f"{html.escape(c['word'])} {mmss(c['time'])}" for c in s['wordCues'][:4])
    return (f'<div class="card">{pic}<div class="meta"><span class="n">{s["id"]}</span>'
            f'<span class="t">{mmss(s["time"][0])} – {mmss(s["time"][1])}</span><span class="k">{html.escape(s["plan"]["type"])}</span></div>'
            f'<div class="x">{html.escape(s["text"])}</div><div class="c">{cues}</div></div>')


def page(b):
    ss = [s for s in M['shots'] if (s['id'] - 1) // 20 + 1 == b]
    chapters = ' · '.join(dict.fromkeys(f"{s['chapter']}. {s['chapterTitle']}" for s in ss))
    return (f'<div class="page"><h1>الهدوء الحقيقي — اللقطات {ss[0]["id"]}–{ss[-1]["id"]}</h1>'
            f'<h2>{html.escape(chapters)}</h2><div class="grid">{"".join(card(s) for s in ss)}</div></div>')


def doc(body):
    return f'<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>{CSS}</style></head><body>{body}</body></html>'


def chrome(*args):
    subprocess.run([CHROME, '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', *args],
                   check=True, capture_output=True)


for b in range(1, 9):
    f = out / f'atlas-b{b}.html'
    f.write_text(doc(page(b)), encoding='utf-8')
    chrome(f'--screenshot={out / f"atlas-b{b}.png"}', '--window-size=1920,2200', '--virtual-time-budget=4000', f.as_uri())
    f.unlink()
f = out / 'atlas.html'
f.write_text(doc(''.join(page(b) for b in range(1, 9))).replace('<style>', '<style>@page { size: 1920px 2200px; margin: 0; } '), encoding='utf-8')
chrome(f'--print-to-pdf={out / "atlas.pdf"}', '--no-pdf-header-footer', '--virtual-time-budget=8000', f.as_uri())
f.unlink()
print('atlas: 8 pages + atlas.pdf in', out.relative_to(root))
