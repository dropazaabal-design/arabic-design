"""Build the Arabic subtitle file from the locked script's own words (with their punctuation) and the
measured word times in src/words.json (episode time = the rendered video's time).

usage: python3 tools/srt.py [OUT=render/captions.ar.srt]   (also writes src/captions.json, burned into the video)

Cues break at the script's punctuation. A phrase ending in a colon stays with what it introduces.
Short neighbouring phrases of the same line are joined while the cue stays within MAX characters and
MAX_DUR seconds, but not across a sentence end unless one side is very short. A phrase longer than
MAX_SINGLE is split at the word boundary nearest its middle that does not leave a particle dangling.
Commas, colons and full stops at the very end of a cue are dropped (as subtitles usually do); question
marks, ellipses and quotation marks stay.
"""
import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
out = Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'render/captions.ar.srt'
words = json.loads((root / 'src/words.json').read_text(encoding='utf-8'))
MAX, MAX_SINGLE, MAX_DUR, MIN_DUR, TAIL, SHORT = 34, 34, 3.8, 0.9, 0.3, 10   # short lines for a vertical reel
BREAK = ('،', ':', '؛', '.', '؟', '…', '!')
STOP = {'في', 'من', 'على', 'إلى', 'عن', 'أن', 'ما', 'بين', 'لا', 'و', 'ثم', 'قد', 'لم'}


def ends_phrase(w):
    return w.rstrip('»').endswith(BREAK)


def ends(ws, marks):
    return ws[-1]['w'].rstrip('»').endswith(marks)


def text(ws):
    t = ' '.join(x['w'] for x in ws)
    while t and t[-1] in '،:؛.' :
        t = t[:-1]
    return t


segs = {}
for x in words:
    segs.setdefault(x['seg'], []).append(x)

cues = []
for seg in sorted(segs, key=lambda s: int(s[1:])):
    ws = segs[seg]
    phrases, cur = [], []
    for x in ws:
        cur.append(x)
        if ends_phrase(x['w']):
            phrases.append(cur)
            cur = []
    if cur:
        phrases.append(cur)
    # a phrase ending in a colon stays with what it introduces
    units = []
    for p in phrases:
        if units and ends(units[-1], ':') and len(text(units[-1] + p)) <= MAX_SINGLE:
            units[-1] = units[-1] + p
        else:
            units.append(p)
    # split any unit that is too long on its own, never right after a particle
    split = []
    for p in units:
        if len(text(p)) <= MAX_SINGLE:
            split.append(p)
            continue
        half = len(text(p)) / 2
        ok = [i for i in range(1, len(p)) if p[i - 1]['w'].strip('«»') not in STOP]
        best = min(ok, key=lambda i: abs(len(text(p[:i])) - half))
        split += [p[:best], p[best:]]
    # join short neighbours within the same line; not across a sentence end unless one side is short
    joined = []
    for p in split:
        if joined:
            prev = joined[-1]
            cand = prev + p
            fits = len(text(cand)) <= MAX and cand[-1]['end'] - cand[0]['start'] <= MAX_DUR
            sentence = ends(prev, ('.', '؟', '!'))
            short = min(len(text(prev)), len(text(p))) < SHORT
            if fits and (not sentence or short):
                joined[-1] = cand
                continue
        joined.append(p)
    cues += [(p[0]['start'], p[-1]['end'], text(p)) for p in joined]

# timing: hold each cue a little after its last word, never into the next cue
timed = []
for i, (a, b, t) in enumerate(cues):
    nxt = cues[i + 1][0] if i + 1 < len(cues) else b + 2
    end = min(nxt, max(b + TAIL, a + MIN_DUR))
    timed.append((a, end, t))


def ts(s):
    ms = round(s * 1000)
    return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


(root / 'src/captions.json').write_text(json.dumps([{'start': round(a, 3), 'end': round(b, 3), 'text': t} for a, b, t in timed], ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
out.write_text(''.join(f'{i}\n{ts(a)} --> {ts(b)}\n{t}\n\n' for i, (a, b, t) in enumerate(timed, 1)), encoding='utf-8')
print(f'{out.relative_to(root)}: {len(timed)} cues, {timed[0][0]:.2f}–{timed[-1][1]:.2f} s, longest {max(len(t) for *_, t in timed)} chars')
