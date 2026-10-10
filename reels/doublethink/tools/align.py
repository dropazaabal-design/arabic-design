"""ElevenLabs full take → line files, a MEASURED 30 fps timeline, an SRT, word times, a mouth envelope.

usage: python3 tools/align.py audio/take-A.wav audio/take-A.words.json

Copied from reels/boiling-frog/tools/align.py (itself from reels/mukarram). Differences for this reel:
word times come from an independent ElevenLabs Scribe pass on take A (101/101 words heard); a line
can be left out of script.json (script.json "cut") and its words are skipped, so every line is cut at
the pauses around ITS OWN words, not at the next kept line; beats are per line (SEG_BEATS), not per
scene change.

The take is never sped up, slowed or pitched. Lines are found by aligning the locked script to the
heard words, then every boundary is moved onto a real pause in the recording. Each line is cut at the
middles of the pauses around it into assets/audio/voice/<id>.wav, all with one shared gain.

The reel length is measured, not chosen: lead + speech (minus any cut line) + the acting beats in SEG_BEATS + the
closing hold. Nothing is padded to reach a number; a total outside 43–52 s is reported so the script,
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
LEAD, HOLD, FPS = 0.15, 1.9, 30   # the pull is on frame 0, «شدّ» 0.15 s later; the end holds on his face after the card goes back
TARGET_LUFS = -16.0               # voice alone; effects sit well under it
# Acting beats (seconds of picture without speech, added BEFORE the line) where the action needs them:
SEG_BEATS = {
    's02': 0.25,   # the comic silence after «ما انفتح»: he looks at his hand, rubs his shoulder
    's04': 0.2,    # after the bump: eyes go sign → handle → a doubtful smile
    's06': 0.15,
    's11': 0.6,    # the climax freezes, stretches, settles before the naming
    's13': 0.2,    # he walks back to the first door
    's15': 0.3,    # the third stamp lands before the question
}
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
dur_take = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', take], capture_output=True, text=True).stdout)

# Each line is cut in the middle of the pause right before its first word and right after its last word
# (a skipped line in between is simply never cut into a file). Speech edges snap to those pauses.
cut = {}
for i in ids:
    a, b = seg_t[i]
    before = [p for p in pauses if a - 0.6 <= p[1] <= a + 0.12]
    after = [p for p in pauses if b - 0.12 <= p[0] <= b + 0.6]
    if before:
        ps, pe = max(before, key=lambda p: p[1])
        a = min(a, pe - 0.03)
        ca = max((ps + pe) / 2, pe - 0.25)
    else:
        ca = max(0.0, a - 0.1)
    if after:
        ps, pe = min(after, key=lambda p: p[0])
        b = max(b, ps)
        cb = min((ps + pe) / 2, ps + 0.25)
    else:
        cb = min(dur_take, b + 0.12)
    seg_t[i] = (a, b)
    cut[i] = (max(0.0, ca), min(dur_take, cb))
for x, y in zip(ids, ids[1:]):
    if cut[x][1] > cut[y][0]:
        sys.exit(f'{x} and {y} overlap in the take ({cut[x]} / {cut[y]})')

# Placed back to back: each kept line follows the previous one with the pause the take itself left
# between them (the cut line's time is dropped), plus that line's acting beat.
extra = dict(SEG_BEATS)
skipped = {y: round(cut[y][0] - cut[x][1], 3) for x, y in zip(ids, ids[1:]) if cut[y][0] - cut[x][1] > 0.02}
speech = seg_t[ids[-1]][1] - seg_t[ids[0]][0] - sum(skipped.values())
TOTAL = round(LEAD + speech + sum(extra.values()) + HOLD, 3)
if not 45 <= TOTAL <= 56:
    print(f'warning: measured reel {TOTAL:.1f} s is outside 45–56 s; fix the script, not the speed', file=sys.stderr)

# Loudness: one gain for all kept speech.
sel = '+'.join(f'between(t,{a:.3f},{b:.3f})' for a, b in cut.values())
probe = subprocess.run(['ffmpeg', '-hide_banner', '-i', take, '-af', f"aselect='{sel}',ebur128=framelog=quiet", '-f', 'null', '-'], capture_output=True, text=True).stderr
gain = round(TARGET_LUFS - float(re.findall(r'I:\s+(-?[\d.]+) LUFS', probe)[-1]), 2)

vdir = root / 'assets/audio/voice'
vdir.mkdir(parents=True, exist_ok=True)
shift, place = LEAD - seg_t[ids[0]][0], {}
for i in ids:
    shift += extra.get(i, 0.0) - skipped.get(i, 0.0)
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
            'removedFromTake': skipped,
            'segments': segments, 'scenes': scenes}
(root / 'timeline.json').write_text(json.dumps(timeline, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# SRT side file (for the platforms' own caption tracks; nothing is burned into the picture). Phrases keep
# their inner punctuation; a phrase under 0.8 s joins the one before it (same sentence only); a phrase over
# 38 characters is split at the space nearest its middle, with times shared by word.
caps = []
for uid, u in enumerate(units):
    items = [x for x in sw if x['unit'] == uid and 'h' in x]
    if not items:
        continue
    sh = place[u['seg']]['shift']
    words_t = [(x['w'], heard[x['h']]['s'] + sh, heard[x['h']]['e'] + sh) for x in items]
    text = u['text']
    if len(text) > 38 and len(words_t) > 3:
        mid = len(text) / 2
        head = lambda j: ' '.join(w for w, _, _ in words_t[:j])
        ok = [j for j in range(1, len(words_t)) if head(j).count('«') == head(j).count('»')] or list(range(1, len(words_t)))   # never inside «…»
        best = min(ok, key=lambda j: abs(len(head(j)) - mid))
        parts = [words_t[:best], words_t[best:]]
    else:
        parts = [words_t]
    for part in parts:
        caps.append({'text': ' '.join(w for w, _, _ in part), 'seg': u['seg'], 'start': round(part[0][1], 3), 'end': round(part[-1][2], 3)})
merged = []
for c in caps:
    if merged and merged[-1]['seg'] == c['seg'] and not merged[-1]['text'].endswith(('.', '!', '؟', '!»')) and (merged[-1]['end'] - merged[-1]['start'] < 1.0 or c['end'] - c['start'] < 0.8) and len(merged[-1]['text']) + len(c['text']) < 46:
        merged[-1]['text'] += ' ' + c['text']
        merged[-1]['end'] = c['end']
    else:
        merged.append(dict(c))
for c in merged:
    c['text'] = c['text'].rstrip('،.:')
for a, b in zip(merged, merged[1:]):
    a['end'] = min(a['end'], b['start'])
# Reading time: a caption may stay up to 0.6 s into the silence after it (never into the next caption).
for k, c in enumerate(merged):
    nxt = merged[k + 1]['start'] - 0.05 if k + 1 < len(merged) else TOTAL
    c['end'] = round(max(c['end'], min(c['end'] + 0.6, nxt)), 3)


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

print(json.dumps({'speech': round(speech, 2), 'total': TOTAL, 'removed': skipped, 'frames': n, 'gainDb': gain, 'captions': len(merged),
                  'scenes': [[s['sceneId'], s['start'], s['seconds']] for s in scenes],
                  'unmatched': [x['w'] + '→' + (heard[x['h']]['w'] if 'h' in x else '∅') for x in sw if not ('h' in x and hn[x['h']] == x['n'])]}, ensure_ascii=False))
