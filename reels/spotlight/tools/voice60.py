"""ElevenLabs take → line files, a 60 fps timeline of exactly TOTAL seconds, captions.

usage: python3 tools/voice60.py TAKE.wav WORDS.json [--total 90] [--lead 0.4] [--hold 3.2]

The take is never sped up, slowed or pitched. Lines are found by aligning the
locked script to Whisper's word timings, then every boundary is moved onto a
real pause in the recording. Each line is cut at the middles of the pauses
around it (so its natural breath stays with it) into public/voice/<id>.wav,
all with one shared gain to -16 LUFS.

The natural length (lead + speech + closing hold) is compared with TOTAL:
  • shorter → the difference is added as silent beats at scene changes
    (more where the picture changes most), never inside a sentence;
  • longer  → the script exits with an error: shorten the text and regenerate
    the affected lines instead of speeding the voice up.

Writes src/timeline.json (seconds; fps and frame count for Remotion),
src/captions.json and audio/alignment.json.
"""
import json
import re
import subprocess
import sys
from difflib import SequenceMatcher
from pathlib import Path

root = Path(__file__).resolve().parent.parent
take, words_file = sys.argv[1], sys.argv[2]
arg = lambda k, d: float(sys.argv[sys.argv.index(k) + 1]) if k in sys.argv else d
TOTAL, LEAD, HOLD, FPS = arg('--total', 90.0), arg('--lead', 0.4), arg('--hold', 3.2), 60
HARAKAT = re.compile('[ً-ْٰـ]')


def norm(w):
    w = HARAKAT.sub('', w)
    w = re.sub('[إأآٱ]', 'ا', w).replace('ة', 'ه').replace('ى', 'ي')
    return re.sub(r'[^\w]', '', w)


script = json.loads((root / 'script.json').read_text(encoding='utf-8'))
segs = script['segments']
ids = [s['id'] for s in segs]
scene_of = {s['id']: s['scene'] for s in segs}
heard = json.loads(Path(words_file).read_text(encoding='utf-8'))

sw, units = [], []
for s in segs:
    for p in [p for p in re.split(r'(?<=[،…:؟.!])\s+', s['text']) if p.strip()]:
        uid = len(units)
        units.append({'seg': s['id'], 'text': p.strip()})
        for w in p.split():
            sw.append({'seg': s['id'], 'unit': uid, 'w': w, 'n': norm(w)})
hn = [norm(h['w']) for h in heard]
for tag, i1, i2, j1, j2 in SequenceMatcher(None, [x['n'] for x in sw], hn, autojunk=False).get_opcodes():
    if tag == 'equal' or (tag == 'replace' and i2 - i1 == j2 - j1):
        for k in range(i2 - i1):
            sw[i1 + k]['h'] = j1 + k
    elif tag == 'replace':
        for k in range(i2 - i1):
            sw[i1 + k]['h'] = j1 + min(j2 - j1 - 1, round(k * (j2 - j1) / (i2 - i1)))


def span(items):
    hs = [x['h'] for x in items if 'h' in x]
    return (heard[min(hs)]['s'], heard[max(hs)]['e']) if hs else None


seg_t = {i: span([x for x in sw if x['seg'] == i]) for i in ids}
if any(v is None for v in seg_t.values()):
    sys.exit(f'no heard words for {[k for k, v in seg_t.items() if v is None]}')

log = subprocess.run(['ffmpeg', '-hide_banner', '-i', take, '-af', 'silencedetect=n=-40dB:d=0.1', '-f', 'null', '-'], capture_output=True, text=True).stderr
pauses = list(zip([float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)], [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]))
mid = {}
for a, b in zip(ids, ids[1:]):
    bound = seg_t[b][0]
    near = [p for p in pauses if bound - 0.9 <= (p[0] + p[1]) / 2 <= bound + 0.4]
    if near:
        ps, pe = min(near, key=lambda p: abs((p[0] + p[1]) / 2 - bound))
        seg_t[a] = (seg_t[a][0], ps)
        seg_t[b] = (pe - 0.03, seg_t[b][1])
        mid[b] = (ps + pe) / 2
    else:
        mid[b] = (seg_t[a][1] + seg_t[b][0]) / 2
dur_take = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', take], capture_output=True, text=True).stdout)
cut = {i: (max(0.0, seg_t[i][0] - 0.25) if k == 0 else mid[i], min(dur_take, seg_t[i][1] + 0.35) if k == len(ids) - 1 else mid[ids[k + 1]]) for k, i in enumerate(ids)}

speech = seg_t[ids[-1]][1] - seg_t[ids[0]][0]
natural = LEAD + speech + HOLD
slack = round(TOTAL - natural, 3)
if slack < 0:
    sys.exit(f'too long by {-slack:.2f} s: shorten the script and regenerate the affected lines (no speed-up)')

# Silent beats at scene changes, weighted by how much the picture has to do there.
WEIGHT = {2: 1.0, 3: 1.2, 4: 1.4, 5: 1.0, 6: 1.2, 7: 1.0, 8: 1.4}
changes = [i for i in ids[1:] if scene_of[i] != scene_of[ids[ids.index(i) - 1]]]
wsum = sum(WEIGHT.get(scene_of[i], 1.0) for i in changes) or 1
extra = {i: slack * WEIGHT.get(scene_of[i], 1.0) / wsum for i in changes}

# Loudness: one gain for all kept speech.
sel = '+'.join(f'between(t,{a:.3f},{b:.3f})' for a, b in cut.values())
probe = subprocess.run(['ffmpeg', '-hide_banner', '-i', take, '-af', f"aselect='{sel}',ebur128=framelog=quiet", '-f', 'null', '-'], capture_output=True, text=True).stderr
gain = round(-16 - float(re.findall(r'I:\s+(-?[\d.]+) LUFS', probe)[-1]), 2)

vdir = root / 'public/voice'
vdir.mkdir(parents=True, exist_ok=True)
shift, place = LEAD - seg_t[ids[0]][0], {}
for i in ids:
    shift += extra.get(i, 0.0)
    a, b = cut[i]
    place[i] = {'fileStart': round(a + shift, 3), 'speechStart': round(seg_t[i][0] + shift, 3), 'speechEnd': round(seg_t[i][1] + shift, 3)}
    d = b - a
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', take, '-af',
                    f'atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,volume={gain}dB,alimiter=limit=0.84:level=false,afade=t=in:d=0.02,afade=t=out:st={d - 0.03:.3f}:d=0.03',
                    '-ar', '48000', '-ac', '1', str(vdir / f'{i}.wav')], check=True)
    place[i]['shift'] = shift

segments = [{'id': i, 'scene': scene_of[i], 'start': place[i]['speechStart'], 'duration': round(place[i]['speechEnd'] - place[i]['speechStart'], 3),
             'fileStart': place[i]['fileStart'], 'file': f'voice/{i}.wav', 'measured': True} for i in ids]
scenes = []
for n in sorted(set(scene_of.values())):
    first = next(s for s in segments if s['scene'] == n)
    if n == segments[0]['scene']:
        start = 0.0
    else:
        prev = [s for s in segments if s['scene'] < n][-1]
        start = round((prev['start'] + prev['duration'] + first['start']) / 2, 3)
    scenes.append({'n': n, 'start': start})
for k, sc in enumerate(scenes):
    sc['end'] = scenes[k + 1]['start'] if k + 1 < len(scenes) else TOTAL
    sc['seconds'] = round(sc['end'] - sc['start'], 3)

timeline = {'fps': FPS, 'width': 1920, 'height': 1080, 'totalSeconds': TOTAL, 'durationInFrames': round(TOTAL * FPS), 'measured': True,
            'source': Path(take).name, 'gainDb': gain, 'naturalSeconds': round(natural, 3), 'addedBeats': {k: round(v, 3) for k, v in extra.items()},
            'segments': segments, 'scenes': scenes}
(root / 'src/timeline.json').write_text(json.dumps(timeline, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

caps = []
for uid, u in enumerate(units):
    sp = span([x for x in sw if x['unit'] == uid])
    if sp:
        sh = place[u['seg']]['shift']
        caps.append({'text': u['text'].rstrip('،.:'), 'seg': u['seg'], 'start': round(max(sp[0], seg_t[u['seg']][0]) + sh, 3), 'end': round(min(sp[1], seg_t[u['seg']][1]) + sh, 3)})
merged = []
for c in caps:
    if merged and merged[-1]['seg'] == c['seg'] and merged[-1]['end'] - merged[-1]['start'] < 1.0:
        merged[-1]['text'] += ' ' + c['text']
        merged[-1]['end'] = c['end']
    else:
        merged.append(dict(c))
for a, b in zip(merged, merged[1:]):
    a['end'] = min(a['end'], b['start'])
(root / 'src/captions.json').write_text(json.dumps(merged, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
# Every script word at its spoken time on the timeline, so picture beats can land on words.
words = [{'seg': x['seg'], 'w': x['w'], 'start': round(heard[x['h']]['s'] + place[x['seg']]['shift'], 3), 'end': round(heard[x['h']]['e'] + place[x['seg']]['shift'], 3)} for x in sw if 'h' in x]
(root / 'src/words.json').write_text(json.dumps(words, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(root / 'audio').mkdir(exist_ok=True)
(root / 'audio/alignment.json').write_text(json.dumps([{'seg': x['seg'], 'script': x['w'], 'heard': heard[x['h']]['w'] if 'h' in x else None,
                                                        'match': 'h' in x and hn[x['h']] == x['n']} for x in sw], ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(json.dumps({'speech': round(speech, 2), 'natural': round(natural, 2), 'slack': slack, 'gainDb': gain, 'captions': len(merged),
                  'scenes': [[s['n'], s['start'], s['seconds']] for s in scenes],
                  'unmatched': [x['w'] + '→' + (heard[x['h']]['w'] if 'h' in x else '∅') for x in sw if not ('h' in x and hn[x['h']] == x['n'])]}, ensure_ascii=False))
