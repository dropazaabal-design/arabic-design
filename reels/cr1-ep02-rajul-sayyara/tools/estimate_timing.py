"""Estimated word timing from the locked scripts, for the animatic before any voice exists.

Same schema as build_audio.py writes (src/data/{long,short}.json), with "audio": null and
"estimated": true. The model is measured on CR1 ep01's aligned voice (same voice, same model):
a word plus the gap after it lasts 0.065 + 0.086 s per letter, plus a pause after punctuation
(least squares on ep01's 434 aligned words: median error 0.07 s), and sections are separated
like ep01's mixes. Replaced wholesale by build_audio.py once takes exist.

usage: python3 tools/estimate_timing.py
"""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent
FPS = 60
PAUSE = {'.': 0.30, '،': 0.175, ':': 0.264, '؟': 0.416, '…': 0.345, '!': 0.30}
PROGRAMS = {
    'long': {'script': 'script-long.md', 'lead': 1.2, 'gap': 1.2, 'hold': 4.0},
    'short': {'script': 'script-short.md', 'lead': 0.35, 'gap': 0.45, 'hold': 2.6},
}


def sections(path):
    out, cur = {}, None
    for ln in (root / path).read_text(encoding='utf-8').splitlines():
        m = re.match(r'## (\w+)', ln)
        if m:
            cur = m.group(1)
            out[cur] = []
        elif cur and ln.strip() and not ln.startswith('>'):
            out[cur].append(ln.strip())
    return out


def word_seconds(w):
    letters = len(re.sub(r'[^ء-ي]', '', w))
    tail = w[-1] if w[-1] in PAUSE else ''
    return 0.065 + 0.0861 * letters + PAUSE.get(tail, 0.0)  # includes the gap to the next word


def build(prog):
    cfg = PROGRAMS[prog]
    t = cfg['lead']
    words, caps, segs = [], [], []
    for sid, lines in sections(cfg['script']).items():
        s0 = t
        i = 0
        for line in lines:
            c0 = t
            for w in line.split():
                d = word_seconds(w)
                words.append({'seg': sid, 'i': i, 'w': w, 'start': round(t, 3), 'end': round(t + d - 0.06, 3)})
                t += d
                i += 1
            caps.append({'seg': sid, 'text': line, 'start': round(c0, 3), 'end': round(t - 0.06, 3)})
        segs.append({'id': sid, 'start': round(s0, 3), 'end': round(t - 0.06, 3)})
        t += cfg['gap']
    total = round(t - cfg['gap'] + cfg['hold'], 3)
    data = {'fps': FPS, 'totalSeconds': total, 'durationInFrames': round(total * FPS), 'audio': None, 'estimated': True,
            'segments': segs, 'words': words, 'captions': caps}
    (root / f'src/data/{prog}.json').write_text(json.dumps(data, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    return total, len(words)


if __name__ == '__main__':
    for p in PROGRAMS:
        total, n = build(p)
        print(f'{p}: {n} words, {total:.1f} s estimated')
