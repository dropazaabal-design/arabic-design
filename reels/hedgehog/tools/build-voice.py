"""The ElevenLabs narration → the reel's voice track, timeline and captions.

usage: python3 tools/build-voice.py TAKE.wav WORDS.json [--lead 0.25] [--tail 1.6]

TAKE.wav is the chosen full take (48 kHz mono); WORDS.json its Whisper word
timings (start/end per word). The script words are aligned to the heard words,
so each line and each caption unit gets the times the voice actually took.
The recording is not sped up, slowed or pitched: it is trimmed to the speech
(plus a short lead and tail) and given one static gain to -16 LUFS.

Writes public/voice/narration.wav, src/timeline.json, src/captions.json and
audio/alignment.json (every script word with its heard word and time, so
weak spots can be checked by ear).
"""
import json
import re
import subprocess
import sys
from difflib import SequenceMatcher
from pathlib import Path

root = Path(__file__).resolve().parent.parent
take, words_file = sys.argv[1], sys.argv[2]
LEAD = float(sys.argv[sys.argv.index('--lead') + 1]) if '--lead' in sys.argv else 0.25
TAIL = float(sys.argv[sys.argv.index('--tail') + 1]) if '--tail' in sys.argv else 1.6
FPS = 30

HARAKAT = re.compile('[ً-ْٰـ]')


def norm(w):
    w = HARAKAT.sub('', w)
    w = re.sub('[إأآٱ]', 'ا', w).replace('ة', 'ه').replace('ى', 'ي')
    return re.sub(r'[^\w]', '', w)


script = json.loads((root / 'script.json').read_text(encoding='utf-8'))
segs = script['segments']
heard = json.loads(Path(words_file).read_text(encoding='utf-8'))

# Script words, each tagged with its line and caption unit. A unit ends at «،» «…» «:» «؟» «.».
sw = []
units = []
for s in segs:
    parts = [p for p in re.split(r'(?<=[،…:؟.!])\s+', s['text']) if p.strip()]
    for p in parts:
        uid = len(units)
        units.append({'seg': s['id'], 'text': p.strip()})
        for w in p.split():
            sw.append({'seg': s['id'], 'unit': uid, 'w': w, 'n': norm(w)})

hn = [norm(h['w']) for h in heard]
sm = SequenceMatcher(None, [x['n'] for x in sw], hn, autojunk=False)
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == 'equal' or (tag == 'replace' and i2 - i1 == j2 - j1):
        for k in range(i2 - i1):
            sw[i1 + k]['h'] = j1 + k
    elif tag == 'replace':
        # uneven: spread the heard span over the script words
        for k in range(i2 - i1):
            sw[i1 + k]['h'] = j1 + min(j2 - j1 - 1, round(k * (j2 - j1) / (i2 - i1)))

def span(items):
    hs = [x['h'] for x in items if 'h' in x]
    if not hs:
        return None
    return heard[min(hs)]['s'], heard[max(hs)]['e']

seg_t = {s['id']: span([x for x in sw if x['seg'] == s['id']]) for s in segs}
missing = [k for k, v in seg_t.items() if v is None]
if missing:
    sys.exit(f'no heard words for {missing}')

# Whisper stretches a word's end into the pause after it; clip each line's end
# to the next line's start so lines never overlap.
ids = [s['id'] for s in segs]
for a, b in zip(ids, ids[1:]):
    if seg_t[a][1] > seg_t[b][0]:
        seg_t[a] = (seg_t[a][0], seg_t[b][0] - 0.02)

t0 = max(0.0, seg_t[ids[0]][0] - LEAD)
t1 = seg_t[ids[-1]][1] + 0.35
out_wav = root / 'public/voice/narration.wav'
out_wav.parent.mkdir(parents=True, exist_ok=True)
probe = subprocess.run(['ffmpeg', '-hide_banner', '-i', take, '-af', f'atrim={t0}:{t1},ebur128=framelog=quiet', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
lufs = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', probe)[-1])
gain = round(-16 - lufs, 2)
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', take, '-af',
                f'atrim={t0}:{t1},asetpts=PTS-STARTPTS,volume={gain}dB,alimiter=limit=0.84:level=false,afade=t=out:st={t1 - t0 - 0.05:.3f}:d=0.05',
                '-ar', '48000', '-ac', '1', str(out_wav)], check=True)

# Refine every line boundary on a real pause in the recording: Whisper's word
# ends run into the silence after them. The pause nearest to Whisper's boundary
# (within -0.8/+0.4 s) becomes the boundary: the line ends where it begins, the
# next line starts where it ends.
sil_log = subprocess.run(['ffmpeg', '-hide_banner', '-i', take, '-af', 'silencedetect=n=-40dB:d=0.1', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', sil_log)]
ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', sil_log)]
pauses = list(zip(starts, ends))
cuts = {}
for a, b in zip(ids, ids[1:]):
    bound = seg_t[b][0]
    near = [p for p in pauses if bound - 0.8 <= (p[0] + p[1]) / 2 <= bound + 0.4]
    if near:
        ps, pe = min(near, key=lambda p: abs((p[0] + p[1]) / 2 - bound))
        seg_t[a] = (seg_t[a][0], ps)
        seg_t[b] = (pe - 0.03, seg_t[b][1])
        cuts[b] = (ps + pe) / 2

rel = lambda t: round(t - t0, 3)
segments = [{'id': s['id'], 'scene': s['scene'], 'start': rel(seg_t[s['id']][0]),
             'duration': round(seg_t[s['id']][1] - seg_t[s['id']][0], 3), 'measured': True, 'file': 'voice/narration.wav'}
            for s in segs]
total = round(t1 - t0 + TAIL, 3)
scene_ids = sorted({s['scene'] for s in segments})
scenes = []
for n in scene_ids:
    first = next(s for s in segments if s['scene'] == n)
    if n == scene_ids[0]:
        start = 0.0
    elif first['id'] in cuts:
        start = rel(cuts[first['id']])
    else:
        prev = [s for s in segments if s['scene'] < n][-1]
        pe = prev['start'] + prev['duration']
        start = round(min(first['start'] - 0.12, (pe + first['start']) / 2), 3)
    scenes.append({'n': n, 'start': start})
for i, sc in enumerate(scenes):
    sc['end'] = scenes[i + 1]['start'] if i + 1 < len(scenes) else total
    sc['seconds'] = round(sc['end'] - sc['start'], 3)

timeline = {'fps': FPS, 'width': 1080, 'height': 1920, 'totalSeconds': total, 'durationInFrames': round(total * FPS),
            'measured': True, 'source': Path(take).name, 'trim': [round(t0, 3), round(t1, 3)], 'gainDb': gain,
            'segments': segments, 'scenes': scenes}
(root / 'src/timeline.json').write_text(json.dumps(timeline, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

caps = []
for uid, u in enumerate(units):
    sp = span([x for x in sw if x['unit'] == uid])
    if sp:
        caps.append({'text': u['text'].rstrip('،.:'), 'seg': u['seg'], 'start': rel(sp[0]), 'end': rel(sp[1])})
# A unit shorter than 1 s is merged into the next unit of the same line, so
# every caption stays up long enough to read.
merged = []
for c in caps:
    if merged and merged[-1]['seg'] == c['seg'] and merged[-1]['end'] - merged[-1]['start'] < 1.0:
        merged[-1]['text'] += ' ' + c['text']
        merged[-1]['end'] = c['end']
    else:
        merged.append(dict(c))
caps = merged
for a, b in zip(caps, caps[1:]):
    a['end'] = min(a['end'], b['start'])
(root / 'src/captions.json').write_text(json.dumps(caps, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

align = [{'seg': x['seg'], 'script': x['w'], 'heard': heard[x['h']]['w'] if 'h' in x else None,
          't': rel(heard[x['h']]['s']) if 'h' in x else None, 'match': ('h' in x and hn[x['h']] == x['n'])} for x in sw]
(root / 'audio').mkdir(exist_ok=True)
(root / 'audio/alignment.json').write_text(json.dumps(align, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
weak = [a['script'] + '→' + str(a['heard']) for a in align if not a['match']]
print(json.dumps({'totalSeconds': total, 'trim': [round(t0, 2), round(t1, 2)], 'gainDb': gain, 'captions': len(caps),
                  'scenes': [[s['n'], s['start'], s['seconds']] for s in scenes], 'unmatched': weak}, ensure_ascii=False))
