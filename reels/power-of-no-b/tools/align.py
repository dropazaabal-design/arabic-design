"""Two ElevenLabs takes → line files, a MEASURED 30 fps timeline, an SRT, word times, mouth envelopes.

usage: python3 tools/align.py

Adapted from reels/doublethink/tools/align.py (itself from reels/boiling-frog and reels/mukarram). What is new
here: the reel is a dialogue, so there are two takes (script.json "takes": N = narrator + the worker's lines in
the voice of the earlier Baseera reels, C = the colleague in a second voice). Each line belongs to one take
("take") and one speaker on screen ("role": N narrator off screen, W worker, C colleague).

Word times come from an independent ElevenLabs Scribe pass on each chosen take. Lines are found by aligning the
locked script to the heard words of their own take; each line is cut out of its take at the pause around it
(or, where the take ran two lines together, at the quietest 10 ms between their words). The takes are never
sped up, slowed or pitched. Lines are then laid back to back in script order: two lines that were neighbours
in the same take keep the take's own pause; a change of speaker gets TURN seconds; SEG_BEATS adds picture
without speech BEFORE a line where the action needs it. Each take gets one gain to −16 LUFS for its kept speech.

The reel length is measured, not chosen: lead + speech + turns + beats + hold. A total outside 88–92 s is
reported so the beats or the script are fixed, never the speed.
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
LEAD, HOLD, FPS, SR = 0.25, 1.6, 30, 48000
TURN = 0.32                       # a change of speaker (or a jump inside a take) gets this pause
TARGET_LUFS = -16.0
# Acting beats (seconds of picture without speech, added BEFORE the line):
SEG_BEATS = {
    's02': 0.35,   # the cup has just landed on his fingers
    's04': 0.6,   # the second colleague crosses with the bag
    's05': 0.15,
    's06': 0.6,   # the third colleague brings the plant
    's07': 0.15,
    's08': 0.7,    # the pile sways, he finds his balance
    's09': 0.9,    # everyone gone; he looks at the far door — then the buzz
    's10': 0.7,    # he reads «وصلتُ», tries to free a finger
    's11': 0.75,   # the cup slides, he dives with his chin
    's12': 0.75,   # the plant tips at the lens; he straightens
    's13': 0.7,    # the door clicks on the coat tail
    's14': 0.35,
    's15': 0.6,    # he holds the handover list, swallows; the colleague walks in
    's16': 0.4,
    's17': 1.1,   # back in reality, same angle; he breathes
    's18': 1.5,    # the comic silence: the cup trembles
    's19': 0.5,
    's20': 0.5,
    's21': 0.6,
    's22': 0.5,    # he shakes out his free hands
    's23': 0.6,
    's24': 0.25,
    's25': 0.45,
    's26': 0.9,    # he walks lightly to the door for the first time
    's27': 0.45,   # he looks at the cup, at his watch
    's28': 0.35,
    's29': 1.1,    # he points at the lid in his coat pocket; they laugh
    's30': 0.1,
}
HARAKAT = re.compile('[ً-ْٰـ]')


def norm(w):
    w = HARAKAT.sub('', w)
    w = re.sub('[إأآٱ]', 'ا', w).replace('ة', 'ه').replace('ى', 'ي')
    return re.sub(r'[^\w]', '', w)


def run(*a):
    return subprocess.run(a, capture_output=True, text=True)


script = json.loads((root / 'script.json').read_text(encoding='utf-8'))
segs = script['segments']
ids = [s['id'] for s in segs]
seg = {s['id']: s for s in segs}

# ---- per take: align its lines to its heard words, then cut ----
sw, units, heard, seg_t, cut, pcm = [], [], {}, {}, {}, {}
for tk, info in script['takes'].items():
    words = json.loads((root / info['words']).read_text(encoding='utf-8'))
    heard[tk] = words
    mine = [s for s in segs if s['take'] == tk]
    tw = []
    for s in mine:
        for p in [p for p in re.split(r'(?<=[،…:؟.!])\s+', s['text']) if p.strip()]:
            uid = len(units)
            units.append({'seg': s['id'], 'text': p.strip()})
            for w in p.split():
                tw.append({'seg': s['id'], 'take': tk, 'unit': uid, 'w': w, 'n': norm(w)})
    hn = [norm(h['w']) for h in words]
    for tag, i1, i2, j1, j2 in SequenceMatcher(None, [x['n'] for x in tw], hn, autojunk=False).get_opcodes():
        if tag == 'equal' or (tag == 'replace' and i2 - i1 == j2 - j1):
            for k in range(i2 - i1):
                tw[i1 + k]['h'] = j1 + k
        elif tag == 'replace':
            for k in range(i2 - i1):
                tw[i1 + k]['h'] = j1 + min(j2 - j1 - 1, round(k * (j2 - j1) / (i2 - i1)))
    sw += tw
    for s in mine:
        hs = [x['h'] for x in tw if x['seg'] == s['id'] and 'h' in x]
        if not hs:
            sys.exit(f"no heard words for {s['id']}")
        seg_t[s['id']] = (words[min(hs)]['s'], words[max(hs)]['e'])

    path = str(root / info['file'])
    log = run('ffmpeg', '-hide_banner', '-i', path, '-af', 'silencedetect=n=-40dB:d=0.1', '-f', 'null', '-').stderr
    pauses = list(zip([float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)], [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]))
    with wave.open(path) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    pcm[tk] = x
    dur = len(x) / SR

    def quietest(lo, hi):
        hop = SR // 100
        a, b = int(lo * SR), max(int(lo * SR) + hop, int(hi * SR))
        e = [np.sqrt(np.mean(x[k:k + hop] ** 2)) for k in range(a, b - hop + 1, hop // 2)]
        return (a + int(np.argmin(e)) * (hop // 2) + hop // 2) / SR

    order = [s['id'] for s in mine]
    shared = {}   # a cut at the quietest point between two run-together lines is shared by both
    for k, i in enumerate(order):
        a, b = seg_t[i]
        lo = seg_t[order[k - 1]][1] if k else 0.0
        hi = seg_t[order[k + 1]][0] if k + 1 < len(order) else dur
        before = [p for p in pauses if lo - 0.12 <= p[0] and p[1] <= a + 0.12]
        after = [p for p in pauses if b - 0.12 <= p[0] and p[1] <= hi + 0.12]
        if before:
            ps, pe = max(before, key=lambda p: p[1])
            a = min(a, pe - 0.03)
            ca = max((ps + pe) / 2, pe - 0.25)
        else:
            ca = shared[i] if i in shared else (quietest(lo - 0.03, a + 0.03) if k else max(0.0, a - 0.12))
        if after:
            ps, pe = min(after, key=lambda p: p[0])
            b = max(b, ps)
            cb = min((ps + pe) / 2, ps + 0.25)
        else:
            cb = quietest(b - 0.03, hi + 0.03) if k + 1 < len(order) else min(dur, b + 0.15)
            if k + 1 < len(order):
                shared[order[k + 1]] = cb
        seg_t[i] = (max(a, ca + 0.01), min(b, cb - 0.01))
        cut[i] = (max(0.0, ca), min(dur, cb))
    for p, q in zip(order, order[1:]):
        if cut[p][1] > cut[q][0] + 1e-6:
            sys.exit(f'{p} and {q} overlap in take {tk} ({cut[p]} / {cut[q]})')

# ---- loudness: one gain per take ----
gain = {}
for tk, info in script['takes'].items():
    sel = '+'.join(f'between(t,{cut[i][0]:.3f},{cut[i][1]:.3f})' for i in ids if seg[i]['take'] == tk)
    probe = run('ffmpeg', '-hide_banner', '-i', str(root / info['file']), '-af', f"aselect='{sel}',ebur128=framelog=quiet", '-f', 'null', '-').stderr
    gain[tk] = round(TARGET_LUFS - float(re.findall(r'I:\s+(-?[\d.]+) LUFS', probe)[-1]), 2)

# ---- placement: script order, the take's own pause between take neighbours, TURN otherwise ----
vdir = root / 'assets/audio/voice'
vdir.mkdir(parents=True, exist_ok=True)
place, t, prev = {}, LEAD, None
pauses_used = {}
for i in ids:
    tk = seg[i]['take']
    if prev is None:
        gap = 0.0
    else:
        same = [j for j in ids if seg[j]['take'] == tk]
        k = same.index(i)
        neighbour = k > 0 and same[k - 1] == prev
        gap = seg_t[i][0] - seg_t[prev][1] if neighbour else TURN
    pauses_used[i] = round(gap, 3)
    start = t + gap + SEG_BEATS.get(i, 0.0)
    shift = start - seg_t[i][0]
    a, b = cut[i]
    place[i] = {'fileStart': round(a + shift, 3), 'speechStart': round(start, 3), 'speechEnd': round(seg_t[i][1] + shift, 3), 'shift': shift}
    d = b - a
    run('ffmpeg', '-loglevel', 'error', '-y', '-i', str(root / script['takes'][tk]['file']), '-af',
        f'atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,volume={gain[tk]}dB,alimiter=limit=0.84:level=false,afade=t=in:d=0.015,afade=t=out:st={d - 0.025:.3f}:d=0.025',
        '-ar', str(SR), '-ac', '1', str(vdir / f'{i}.wav'))
    t = place[i]['speechEnd']
    prev = i
TOTAL = round(t + HOLD, 3)
speech = round(sum(seg_t[i][1] - seg_t[i][0] for i in ids), 3)
if not 88 <= TOTAL <= 92:
    print(f'warning: measured reel {TOTAL:.2f} s is outside 88–92 s; fix the beats or the script, not the speed', file=sys.stderr)

segments = [{'id': i, 'take': seg[i]['take'], 'role': seg[i]['role'], 'sceneId': seg[i]['sceneId'], 'start': place[i]['speechStart'],
             'duration': round(place[i]['speechEnd'] - place[i]['speechStart'], 3), 'fileStart': place[i]['fileStart'],
             'file': f'audio/voice/{i}.wav', 'measured': True} for i in ids]
scenes, order = [], list(dict.fromkeys(seg[i]['sceneId'] for i in ids))
for k, n in enumerate(order):
    mine = [s for s in segments if s['sceneId'] == n]
    if k == 0:
        start = 0.0
    else:
        prv = [s for s in segments if s['sceneId'] == order[k - 1]][-1]
        start = round((prv['start'] + prv['duration'] + mine[0]['start']) / 2, 3)
    scenes.append({'sceneId': n, 'start': start, 'speechStart': mine[0]['start'], 'speechEnd': round(mine[-1]['start'] + mine[-1]['duration'], 3)})
for k, sc in enumerate(scenes):
    sc['end'] = scenes[k + 1]['start'] if k + 1 < len(scenes) else TOTAL
    sc['seconds'] = round(sc['end'] - sc['start'], 3)

timeline = {'fps': FPS, 'width': 1080, 'height': 1920, 'totalSeconds': TOTAL, 'durationInFrames': round(TOTAL * FPS), 'measured': True,
            'sources': {k: v['source'] for k, v in script['takes'].items()}, 'gainDb': gain, 'speechSeconds': speech,
            'pausesBefore': pauses_used, 'addedBeats': SEG_BEATS, 'segments': segments, 'scenes': scenes}
(root / 'timeline.json').write_text(json.dumps(timeline, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# ---- SRT side file (nothing burned into the picture): phrases at their measured words; long ones split ----
caps = []
for uid, u in enumerate(units):
    items = [x for x in sw if x['unit'] == uid and 'h' in x]
    if not items:
        continue
    sh = place[u['seg']]['shift']
    hw = heard[seg[u['seg']]['take']]
    words_t = [(x['w'], max(hw[x['h']]['s'] + sh, place[u['seg']]['speechStart']), hw[x['h']]['e'] + sh) for x in items]
    text = u['text']
    if len(text) > 38 and len(words_t) > 3:
        mid = len(text) / 2
        head = lambda j: ' '.join(w for w, _, _ in words_t[:j])
        ok = [j for j in range(1, len(words_t)) if head(j).count('«') == head(j).count('»')] or list(range(1, len(words_t)))
        best = min(ok, key=lambda j: abs(len(head(j)) - mid))
        parts = [words_t[:best], words_t[best:]]
    else:
        parts = [words_t]
    for part in parts:
        caps.append({'text': ' '.join(w for w, _, _ in part), 'seg': u['seg'], 'start': round(part[0][1], 3), 'end': round(part[-1][2], 3)})
caps.sort(key=lambda c: c['start'])   # the two takes' lines interleave on the timeline
merged = []
for c in caps:
    if merged and merged[-1]['seg'] == c['seg'] and not merged[-1]['text'].endswith(('.', '!', '؟', '!»', '».')) and (merged[-1]['end'] - merged[-1]['start'] < 1.0 or c['end'] - c['start'] < 0.8) and len(merged[-1]['text']) + len(c['text']) < 46:
        merged[-1]['text'] += ' ' + c['text']
        merged[-1]['end'] = c['end']
    else:
        merged.append(dict(c))
for c in merged:
    c['text'] = c['text'].rstrip('،:')
    if c['text'].endswith('.') and not c['text'].endswith('…'):
        c['text'] = c['text'][:-1]
for a, b in zip(merged, merged[1:]):
    a['end'] = min(a['end'], b['start'])
for k, c in enumerate(merged):
    nxt = merged[k + 1]['start'] - 0.05 if k + 1 < len(merged) else TOTAL
    c['end'] = round(max(c['end'], min(c['end'] + 0.6, nxt)), 3)


def srt_time(x):
    ms = round(x * 1000)
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


(root / 'output').mkdir(exist_ok=True)
(root / 'output/captions.ar.srt').write_text(''.join(f"{k + 1}\n{srt_time(c['start'])} --> {srt_time(c['end'])}\n{c['text']}\n\n" for k, c in enumerate(merged)), encoding='utf-8')

# ---- every script word at its spoken time on the timeline (picture beats land on words) ----
words = []
for x in sw:
    if 'h' not in x:
        continue
    hw, sh = heard[x['take']][x['h']], place[x['seg']]['shift']
    words.append({'seg': x['seg'], 'w': x['w'], 'start': round(max(hw['s'] + sh, place[x['seg']]['speechStart']), 3), 'end': round(min(hw['e'] + sh, place[x['seg']]['speechEnd'] + 0.05), 3)})
words.sort(key=lambda w: w['start'])
(root / 'src/video/words.json').write_text(json.dumps(words, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(root / 'audio/alignment.json').write_text(json.dumps([{'seg': x['seg'], 'script': x['w'], 'heard': heard[x['take']][x['h']]['w'] if 'h' in x else None,
                                                        'match': 'h' in x and norm(heard[x['take']][x['h']]['w']) == x['n']} for x in sw], ensure_ascii=False, indent=1) + '\n', encoding='utf-8')

# ---- mouth envelopes per on-screen speaker (W = worker, C = colleague); the narrator has no mouth ----
n = round(TOTAL * FPS)
env_out = {}
for role in ('W', 'C'):
    track = np.zeros(int(TOTAL * SR) + SR)
    for s in segments:
        if s['role'] != role:
            continue
        with wave.open(str(root / 'assets' / s['file'])) as w:
            x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
        a = int(s['fileStart'] * SR)
        track[a:a + len(x)] += x[:len(track) - a]
    hop = SR // FPS
    rms = np.array([np.sqrt(np.mean(track[k * hop:(k + 1) * hop] ** 2)) for k in range(n)])
    env = np.clip((20 * np.log10(rms + 1e-9) + 50) / 30, 0, 1)
    voiced = env[env > 0.05]
    env = np.round(env / max(np.percentile(voiced, 95) if len(voiced) else 1, 1e-6), 3).clip(0, 1)
    env_out[role] = env.tolist()
(root / 'src/video/envelope.json').write_text(json.dumps(env_out) + '\n', encoding='utf-8')

print(json.dumps({'speech': speech, 'total': TOTAL, 'frames': n, 'gainDb': gain, 'captions': len(merged),
                  'scenes': [[s['sceneId'], s['start'], s['seconds']] for s in scenes],
                  'unmatched': [x['w'] + '→' + (heard[x['take']][x['h']]['w'] if 'h' in x else '∅') for x in sw if not ('h' in x and norm(heard[x['take']][x['h']]['w']) == x['n'])]}, ensure_ascii=False))
