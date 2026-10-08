"""PROVISIONAL timing, only until the full recording exists.

usage: python3 tools/provisional.py SAMPLE_WORDS.json

The opening lines (s01–s03) take their real word times from the approved-or-
pending opening sample; every later line is ESTIMATED from its word count at the
sample's measured pace plus pauses at punctuation. Everything this writes is
marked provisional: it lets scenes be built and previewed, it is not sync.
After the full take, tools/align.py replaces timeline.json and
src/words.json with measured times, and the scenes follow automatically
because they key on words, not on frame numbers.
"""
import json
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
FPS = 60
LEAD = 0.5            # silence before the first word
GAP = 0.0             # the sample's pace already includes the pauses between lines
SCENE_BEAT = 1.0      # a visual hold where the scene changes (creative direction: Hold 0.6–1.5 s)
BEATS = {'sc04': 1.5}  # longer hold after «مبدأ التباين» is named
END_HOLD = 4.0        # closing question + signature
PAUSE = {}            # likewise: punctuation pauses are inside the measured pace

script = json.loads((root / 'script.json').read_text(encoding='utf-8'))
segs = script['segments']
heard = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
# pace measured on the sample: words per second of speech (pauses excluded by estimate below)
sample_words = [w for s in segs[:3] for w in s['text'].split()]
sample_speech = heard[-1]['e'] - heard[0]['s']
wps = len(sample_words) / sample_speech

def norm(w):
    return re.sub(r'[^\w]', '', re.sub('[ً-ْـ]', '', w))

words, segments, t = [], [], LEAD
prev_scene = None
for i, seg in enumerate(segs):
    if prev_scene is not None:
        t += BEATS.get(seg['sceneId'], SCENE_BEAT) if seg['sceneId'] != prev_scene else GAP
    tokens = seg['text'].split()
    if i < 3:   # measured on the sample, shifted to the lead
        hs = [h for h in heard]
        # map sample words in order onto s01–s03 tokens
        offset = sum(len(s['text'].split()) for s in segs[:i])
        mapped = hs[offset:offset + len(tokens)] if len(hs) >= offset + len(tokens) else None
    else:
        mapped = None
    start = t
    for k, tok in enumerate(tokens):
        if mapped:
            ws, we = LEAD + mapped[k]['s'] - heard[0]['s'], LEAD + mapped[k]['e'] - heard[0]['s']
        else:
            ws = t
            we = ws + 1 / wps
        words.append({'seg': seg['id'], 'w': tok, 'start': round(ws, 3), 'end': round(we, 3), 'provisional': not mapped})
        t = we
        if not mapped:
            t += sum(PAUSE.get(ch, 0) for ch in tok if ch in PAUSE)
    if mapped:
        t = words[-1]['end']
    segments.append({'id': seg['id'], 'sceneId': seg['sceneId'], 'start': round(start if not mapped else words[-len(tokens)]['start'], 3),
                     'duration': round(words[-1]['end'] - (start if not mapped else words[-len(tokens)]['start']), 3), 'provisional': not mapped})
    prev_scene = seg['sceneId']
total = t + END_HOLD
scenes = []
for sc in [s['sceneId'] for s in script['scenes']]:
    first = next(s for s in segments if s['sceneId'] == sc)
    last = [s for s in segments if s['sceneId'] == sc][-1]
    scenes.append({'sceneId': sc, 'speechStart': first['start'], 'speechEnd': round(last['start'] + last['duration'], 3)})
for k, sc in enumerate(scenes):
    sc['start'] = 0.0 if k == 0 else round((scenes[k - 1]['speechEnd'] + sc['speechStart']) / 2, 3)
for k, sc in enumerate(scenes):
    sc['end'] = scenes[k + 1]['start'] if k + 1 < len(scenes) else round(total, 3)
timeline = {'sampleAudio': {'file': 'audio/sample-opening.mp3', 'at': LEAD, 'note': 'preview only: the opening sample under s01–s03'}, 'provisional': True, 'note': 'estimated except s01–s03 (from the opening sample); replace with tools/align.py after the full take',
            'fps': FPS, 'width': 1920, 'height': 1080, 'totalSeconds': round(total, 3), 'durationInFrames': round(total * FPS),
            'paceWordsPerSecond': round(wps, 3), 'segments': segments, 'scenes': scenes}
(root / 'timeline.json').write_text(json.dumps(timeline, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(root / 'src/words.json').write_text(json.dumps(words, ensure_ascii=False, indent=0) + '\n', encoding='utf-8')
print(json.dumps({'totalSeconds': round(total, 1), 'wps': round(wps, 2), 'scenes': [[s['sceneId'], s['start'], s['end']] for s in scenes]}, ensure_ascii=False))
