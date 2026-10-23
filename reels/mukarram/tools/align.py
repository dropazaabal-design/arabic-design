"""ElevenLabs full take → line files, a MEASURED 30 fps timeline, an SRT, word times, a mouth envelope.

usage: python3 tools/align.py audio/take-A.wav audio/take-A.words.json

Adapted from reels/save-advice/tools/align.py. Differences for this reel: 30 fps; word times come from
ElevenLabs Scribe (the take's own transcript, 91/91 words matched) instead of Whisper; the public
folder is assets/ (voice lines go to assets/audio/voice/); the SRT is a side file (no burned captions);
and a per-frame speech envelope is written for the mouth rigs.

The take is never sped up, slowed or pitched. Lines are found by aligning the locked script to the
heard words, then every boundary is moved onto a real pause in the recording. Each line is cut at the
middles of the pauses around it into assets/audio/voice/<id>.wav, all with one shared gain.

The reel length is measured, not chosen: lead + speech + the scene-change beats in BEATS + the
closing hold. Nothing is padded to reach a number; a total outside 45–55 s is reported so the script,
not the speed, is fixed.
"""
import json
import re
import subprocess
import sys
import wave
from difflib import SequenceMatcher
from pathlib import Path

import numpy as np

root = Path(__file__).resolve().parent.parent
take, words_file = sys.argv[1], sys.argv[2]
LEAD, HOLD, FPS = 0.12, 1.3, 30   # the hook is a picture from frame 0; the voice follows almost at once
TARGET_LUFS = -16.0               # voice alone; effects sit well under it
# Visual holds where the story needs them (seconds of picture without speech), not to reach a length:
BEATS = {
    'turn': 0.35,     # after «ولا يقرأ اللافتات»: the narrator turns before «طيب… وأنت؟»
    'park': 0.25,
    'cleaner': 0.55,  # the litterer walks off; the bag lies alone a moment before the cleaner arrives
    'spit': 0.3,
    'reverse': 0.45,  # the flag gag lands before the monkey scene
    'pocket': 0.3,
    'close': 0.45,
}
DEFAULT_BEAT = 0.3
HARAKAT = re.compile('[ً-ْٰـ]')


def norm(w):
    w = HARAKAT.sub('', w)
    w = re.sub('[إأآٱ]', 'ا', w).replace('ة', 'ه').replace('ى', 'ي')
    return re.sub(r'[^\w]', '', w)


script = json.loads((root / 'script.json').read_text(encoding='utf-8'))
segs = script['segments']
ids = [s['id'] for s in segs]
scene_of = {s['id']: s['sceneId'] for s in segs}
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
cut = {i: (max(0.0, seg_t[i][0] - 0.1) if k == 0 else mid[i], min(dur_take, seg_t[i][1] + 0.35) if k == len(ids) - 1 else mid[ids[k + 1]]) for k, i in enumerate(ids)}

speech = seg_t[ids[-1]][1] - seg_t[ids[0]][0]
changes = [i for i in ids[1:] if scene_of[i] != scene_of[ids[ids.index(i) - 1]]]
extra = {i: BEATS.get(scene_of[i], DEFAULT_BEAT) for i in changes}
TOTAL = round(LEAD + speech + sum(extra.values()) + HOLD, 3)
if not 45 <= TOTAL <= 55:
    print(f'warning: measured reel {TOTAL:.1f} s is outside 45–55 s; fix the script, not the speed', file=sys.stderr)

# Loudness: one gain for all kept speech.
sel = '+'.join(f'between(t,{a:.3f},{b:.3f})' for a, b in cut.values())
probe = subprocess.run(['ffmpeg', '-hide_banner', '-i', take, '-af', f"aselect='{sel}',ebur128=framelog=quiet", '-f', 'null', '-'], capture_output=True, text=True).stderr
gain = round(TARGET_LUFS - float(re.findall(r'I:\s+(-?[\d.]+) LUFS', probe)[-1]), 2)

vdir = root / 'assets/audio/voice'
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
    place[i]['cut'] = (a, b)

segments = [{'id': i, 'sceneId': scene_of[i], 'start': place[i]['speechStart'], 'duration': round(place[i]['speechEnd'] - place[i]['speechStart'], 3),
             'fileStart': place[i]['fileStart'], 'file': f'audio/voice/{i}.wav', 'measured': True} for i in ids]
scenes = []
order = list(dict.fromkeys(scene_of[i] for i in ids))
for k, n in enumerate(order):
    first = next(s for s in segments if s['sceneId'] == n)
    if k == 0:
        start = 0.0
    else:
        prev = [s for s in segments if s['sceneId'] == order[k - 1]][-1]
        start = round((prev['start'] + prev['duration'] + first['start']) / 2, 3)
    last_seg = [s for s in segments if s['sceneId'] == n][-1]
    scenes.append({'sceneId': n, 'start': start, 'speechStart': first['start'], 'speechEnd': round(last_seg['start'] + last_seg['duration'], 3)})
for k, sc in enumerate(scenes):
    sc['end'] = scenes[k + 1]['start'] if k + 1 < len(scenes) else TOTAL
    sc['seconds'] = round(sc['end'] - sc['start'], 3)

timeline = {'fps': FPS, 'width': 1080, 'height': 1920, 'totalSeconds': TOTAL, 'durationInFrames': round(TOTAL * FPS), 'measured': True,
            'source': Path(take).name, 'gainDb': gain, 'speechSeconds': round(speech, 3), 'addedBeats': {k: round(v, 3) for k, v in extra.items()},
            'segments': segments, 'scenes': scenes}
(root / 'timeline.json').write_text(json.dumps(timeline, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# SRT side file (for the platforms' own caption tracks; nothing is burned into the picture).
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


def srt_time(x):
    ms = round(x * 1000)
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


(root / 'output').mkdir(exist_ok=True)
(root / 'output/captions.ar.srt').write_text(''.join(f"{k + 1}\n{srt_time(c['start'])} --> {srt_time(c['end'])}\n{c['text']}\n\n" for k, c in enumerate(merged)), encoding='utf-8')

# Every script word at its spoken time on the timeline, so picture beats can land on words.
words = [{'seg': x['seg'], 'w': x['w'], 'start': round(heard[x['h']]['s'] + place[x['seg']]['shift'], 3), 'end': round(heard[x['h']]['e'] + place[x['seg']]['shift'], 3)} for x in sw if 'h' in x]
(root / 'src/video/words.json').write_text(json.dumps(words, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(root / 'audio/alignment.json').write_text(json.dumps([{'seg': x['seg'], 'script': x['w'], 'heard': heard[x['h']]['w'] if 'h' in x else None,
                                                        'match': 'h' in x and hn[x['h']] == x['n']} for x in sw], ensure_ascii=False, indent=1) + '\n', encoding='utf-8')

# Mouth envelope: RMS of the placed voice lines, one value per video frame, 0..1 (95th percentile = 1).
n = round(TOTAL * FPS)
sr = 48000
track = np.zeros(int(TOTAL * sr) + sr)
for s in segments:
    with wave.open(str(root / 'assets' / s['file'])) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    a = int(s['fileStart'] * sr)
    track[a:a + len(x)] += x
hop = sr // FPS
rms = np.array([np.sqrt(np.mean(track[k * hop:(k + 1) * hop] ** 2)) for k in range(n)])
db = 20 * np.log10(rms + 1e-9)
env = np.clip((db + 50) / 30, 0, 1)            # −50 dBFS → 0, −20 dBFS → 1
env = np.round(env / max(np.percentile(env, 95), 1e-6), 3).clip(0, 1)
(root / 'src/video/envelope.json').write_text(json.dumps(env.tolist()) + '\n', encoding='utf-8')

print(json.dumps({'speech': round(speech, 2), 'total': TOTAL, 'frames': n, 'gainDb': gain, 'captions': len(merged),
                  'scenes': [[s['sceneId'], s['start'], s['seconds']] for s in scenes],
                  'unmatched': [x['w'] + '→' + (heard[x['h']]['w'] if 'h' in x else '∅') for x in sw if not ('h' in x and hn[x['h']] == x['n'])]}, ensure_ascii=False))
