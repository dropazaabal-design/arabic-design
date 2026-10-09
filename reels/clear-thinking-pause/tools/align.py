"""One ElevenLabs take → the reel's voice track, a MEASURED 30 fps timeline, word times, captions, SRT.

usage: python3 tools/align.py TAKE.mp3 WORDS.json

Adapted from reels/fikra-01-influence/tools/align.py (git history). Differences for the reel:
the take stays ONE file (no per-line files); it is never sped up, slowed or pitched. The only
edits are short silences inserted inside existing natural pauses (BEATS), each cut at the
middle of a pause measured with silencedetect, so no cut lands inside a word.

Lines are found by aligning the locked script (script.json) to Whisper's word timings; line
boundaries are then moved onto the measured pauses. Loudness: one gain for the whole voice,
then a true-peak limiter; the final MP4 is measured separately (tools/verify.py).

Writes public/voice/voice.wav, timeline.json, src/words.json, src/captions.json,
render/captions.ar.srt and audio/alignment.json.
"""
import json
import re
import subprocess
import sys
from difflib import SequenceMatcher
from pathlib import Path

root = Path(__file__).resolve().parent.parent
take, words_file = sys.argv[1], sys.argv[2]
FPS, W, H = 30, 1080, 1920
LEAD = 0.25          # the hook is on screen from frame 0; the voice starts a quarter second later
HOLD = 1.9           # reading pause after the last word, on the final card
TARGET_LUFS = -14.0
# Extra silence inserted inside an existing pause, before the given script word (segment id, word index).
BEATS = {('s05', 9): 0.6,   # before «ارجع»: room for the glass-of-water shot
         ('s08', 0): 0.4}   # before «اكتب لنفسك قاعدة»: a breath before the rule
HARAKAT = re.compile('[\u064b-\u0652\u0670\u0640]')


def norm(w):
    w = HARAKAT.sub('', w)
    w = re.sub('[إأآٱ]', 'ا', w).replace('ة', 'ه').replace('ى', 'ي')
    return re.sub(r'[^\w]', '', w)


def run(*a):
    return subprocess.run(a, capture_output=True, text=True)


script = json.loads((root / 'script.json').read_text(encoding='utf-8'))
segs = script['segments']
ids = [s['id'] for s in segs]
scene_of = {s['id']: s['sceneId'] for s in segs}
heard = json.loads(Path(words_file).read_text(encoding='utf-8'))

# script words, each tagged with its segment, its index in the segment and its caption chunk
sw = []
for s in segs:
    k = 0
    for ci, chunk in enumerate(s['captions']):
        for w in chunk.split():
            sw.append({'seg': s['id'], 'i': k, 'chunk': ci, 'w': w, 'n': norm(w)})
            k += 1
hn = [norm(h['w']) for h in heard]
for tag, i1, i2, j1, j2 in SequenceMatcher(None, [x['n'] for x in sw], hn, autojunk=False).get_opcodes():
    if tag == 'equal' or (tag == 'replace' and i2 - i1 == j2 - j1):
        for k in range(i2 - i1):
            sw[i1 + k]['h'] = j1 + k
    elif tag == 'replace':
        for k in range(i2 - i1):
            sw[i1 + k]['h'] = j1 + min(j2 - j1 - 1, round(k * (j2 - j1) / (i2 - i1)))
missing = [x['w'] for x in sw if 'h' not in x]
if missing:
    sys.exit(f'script words with no heard word: {missing}')

dur_take = float(run('ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', take).stdout)
log = run('ffmpeg', '-hide_banner', '-i', take, '-af', 'silencedetect=n=-45dB:d=0.12', '-f', 'null', '-').stderr
pauses = list(zip([float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)], [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]))


def pause_before(t, back=0.6, fwd=0.45):
    """The measured pause nearest to a word start (Whisper word starts can be early or late by ~0.2 s)."""
    near = [p for p in pauses if t - back <= (p[0] + p[1]) / 2 <= t + fwd]
    return min(near, key=lambda p: abs((p[0] + p[1]) / 2 - t)) if near else None


# word times in the take. Whisper's boundaries drift around silences, so each measured pause is
# given to the nearest word boundary (within 0.8 s, preferring one after punctuation): the word before ends where the pause
# starts and the word after starts where it ends.
wt = [{'s': heard[x['h']]['s'], 'e': heard[x['h']]['e']} for x in sw]
PUNCT = tuple('،.:؟…!؛»')
taken = set()
for ps, pe in pauses:
    mid = (ps + pe) / 2
    dist = lambda k: abs((wt[k]['e'] + wt[k + 1]['s']) / 2 - mid)
    # one pause per boundary, lying after word k starts and before word k+1 ends;
    # a boundary after punctuation is where the voice is most likely to pause
    cand = [k for k in range(len(wt) - 1) if k not in taken and wt[k]['s'] < ps and pe < wt[k + 1]['e'] + 0.3 and dist(k) <= 0.8]
    if cand:
        k = min(cand, key=lambda k: dist(k) - (0.45 if sw[k]['w'].endswith(PUNCT) else 0))
        wt[k]['e'], wt[k + 1]['s'] = ps, pe
        taken.add(k)
for a, b in zip(wt, wt[1:]):
    a['e'] = min(a['e'], b['s'])
for w in wt:
    w['e'] = max(w['e'], w['s'] + 0.04)
# segment edges snapped onto measured pauses
seg_t = {}
for sid in ids:
    idx = [k for k, x in enumerate(sw) if x['seg'] == sid]
    seg_t[sid] = [wt[idx[0]]['s'], wt[idx[-1]]['e']]
for a, b in zip(ids, ids[1:]):
    p = pause_before(seg_t[b][0])
    if p:
        seg_t[a][1], seg_t[b][0] = p[0], p[1]
first_onset = run('ffmpeg', '-hide_banner', '-i', take, '-af', 'silencedetect=n=-45dB:d=0.02', '-t', '1', '-f', 'null', '-').stderr
m = re.search(r'silence_start: 0(?:\.0+)?\s.*?silence_end: ([\d.]+)', first_onset, re.S)
seg_t[ids[0]][0] = float(m.group(1)) if m else 0.0
p_end = [p for p in pauses if p[0] >= seg_t[ids[-1]][1] - 0.3]
seg_t[ids[-1]][1] = p_end[0][0] if p_end else min(dur_take, seg_t[ids[-1]][1] + 0.1)

# insertion points: middles of measured pauses before the BEATS words
cuts = []
for (sid, wi), extra in BEATS.items():
    k = next(k for k, x in enumerate(sw) if x['seg'] == sid and x['i'] == wi)
    p = pause_before(wt[k]['s'])
    if not p:
        sys.exit(f'no measured pause before {sw[k]["w"]} ({sid}); a beat must sit in a real pause')
    cuts.append(((p[0] + p[1]) / 2, extra, f'{sid}:{sw[k]["w"]}', p))
cuts.sort()


def to_reel(t):
    """Take time → reel time: lead, minus the take's leading silence, plus every beat inserted before t."""
    return LEAD - seg_t[ids[0]][0] + t + sum(e for c, e, _, _ in cuts if c <= t)


# voice track: pieces of the take between cuts, with digital silence for the beats
start, end = seg_t[ids[0]][0], seg_t[ids[-1]][1] + 0.12
edges = [start] + [c for c, _, _, _ in cuts] + [end]
filt, labels = [], []
for k, (a, b) in enumerate(zip(edges, edges[1:])):
    filt.append(f'[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,aresample=48000[p{k}]')
    labels.append(f'[p{k}]')
    if k < len(cuts):
        filt.append(f'anullsrc=r=48000:cl=mono,atrim=0:{cuts[k][1]:.3f}[z{k}]')
        labels.append(f'[z{k}]')
filt.append(f'anullsrc=r=48000:cl=mono,atrim=0:{LEAD:.3f}[lead]')
filt.append('[lead]' + ''.join(labels) + f'concat=n={len(labels) + 1}:v=0:a=1[cat]')
raw = root / 'audio/voice-raw.wav'
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', take, '-filter_complex', ';'.join(filt), '-map', '[cat]', '-ac', '1', '-ar', '48000', str(raw)], check=True)
vdir = root / 'public/voice'
vdir.mkdir(parents=True, exist_ok=True)


def loud(path):
    out = run('ffmpeg', '-hide_banner', '-i', str(path), '-af', 'ebur128=peak=true:framelog=quiet', '-f', 'null', '-').stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', out)[-1]), float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', out)[-1])


# one gain for the whole voice, then a true-peak limiter at -2 dBTP (AAC adds a little overshoot);
# the gain is corrected once for what the limiter takes, then measured again
gain = round(TARGET_LUFS - loud(raw)[0], 2)
for _ in range(2):
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(raw), '-af', f'volume={gain}dB,alimiter=limit=0.794:level=false:attack=1:release=50,aresample=192000,alimiter=limit=0.794:level=false:attack=1:release=50,aresample=48000',
                    '-ar', '48000', '-ac', '1', str(vdir / 'voice.wav')], check=True)
    lufs, tp = loud(vdir / 'voice.wav')
    if abs(lufs - TARGET_LUFS) < 0.2:
        break
    gain = round(gain + TARGET_LUFS - lufs, 2)
voice_dur = float(run('ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(vdir / 'voice.wav')).stdout)

TOTAL = round(to_reel(seg_t[ids[-1]][1]) + HOLD, 3)
segments = [{'id': i, 'sceneId': scene_of[i], 'start': round(to_reel(seg_t[i][0]), 3), 'end': round(to_reel(seg_t[i][1]), 3)} for i in ids]
order = list(dict.fromkeys(scene_of[i] for i in ids))
scenes = []
for k, n in enumerate(order):
    mine = [s for s in segments if s['sceneId'] == n]
    if k == 0:
        st = 0.0
    else:
        prev = [s for s in segments if s['sceneId'] == order[k - 1]][-1]
        st = round((prev['end'] + mine[0]['start']) / 2, 3)
    scenes.append({'sceneId': n, 'start': st, 'speechStart': mine[0]['start'], 'speechEnd': mine[-1]['end']})
for k, sc in enumerate(scenes):
    sc['end'] = scenes[k + 1]['start'] if k + 1 < len(scenes) else TOTAL
    sc['seconds'] = round(sc['end'] - sc['start'], 3)

timeline = {'fps': FPS, 'width': W, 'height': H, 'totalSeconds': TOTAL, 'durationInFrames': round(TOTAL * FPS), 'measured': True,
            'source': Path(take).name, 'voice': 'voice/voice.wav', 'voiceSeconds': round(voice_dur, 3), 'voiceLUFS': lufs, 'voiceTruePeak': tp, 'lead': LEAD, 'hold': HOLD, 'gainDb': gain,
            'beats': [{'before': lbl, 'seconds': e, 'pause': [round(p[0], 3), round(p[1], 3)], 'cutAt': round(c, 3)} for c, e, lbl, p in cuts],
            'segments': segments, 'scenes': scenes}
(root / 'timeline.json').write_text(json.dumps(timeline, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

words = [{'seg': x['seg'], 'i': x['i'], 'w': x['w'], 'start': round(to_reel(wt[k]['s']), 3), 'end': round(to_reel(wt[k]['e']), 3)} for k, x in enumerate(sw)]
(root / 'src/words.json').write_text(json.dumps(words, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')

# captions: one chunk per entry; on screen from its first word to the next chunk (or its last word + 0.6 s)
caps = []
for s in segs:
    for ci, chunk in enumerate(s['captions']):
        ws = [w for w in words if w['seg'] == s['id'] and sw[words.index(w)]['chunk'] == ci]
        caps.append({'seg': s['id'], 'text': chunk, 'start': ws[0]['start'], 'end': ws[-1]['end'], 'chars': len(chunk)})
for a, b in zip(caps, caps[1:]):
    a['end'] = round(min(b['start'], a['end'] + 0.6), 3)
caps[-1]['end'] = round(min(TOTAL, caps[-1]['end'] + 0.6), 3)
for c in caps:
    c['cps'] = round(c['chars'] / max(0.1, c['end'] - c['start']), 1)
(root / 'src/captions.json').write_text(json.dumps(caps, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


def srt_time(x):
    ms = round(x * 1000)
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


(root / 'render').mkdir(exist_ok=True)
(root / 'render/captions.ar.srt').write_text(''.join(f"{k + 1}\n{srt_time(c['start'])} --> {srt_time(c['end'])}\n{c['text']}\n\n" for k, c in enumerate(caps)), encoding='utf-8')
(root / 'audio/alignment.json').write_text(json.dumps([{'seg': x['seg'], 'script': x['w'], 'heard': heard[x['h']]['w'], 'p': heard[x['h']].get('p'),
                                                        'match': hn[x['h']] == x['n']} for x in sw], ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(json.dumps({'total': TOTAL, 'frames': round(TOTAL * FPS), 'gainDb': gain, 'voiceSeconds': round(voice_dur, 3),
                  'beats': timeline['beats'], 'scenes': [[s['sceneId'], s['start'], s['seconds']] for s in scenes],
                  'maxCps': max(c['cps'] for c in caps if c['seg'] != 's01'),
                  'unmatched': [x['w'] + '→' + heard[x['h']]['w'] for x in sw if hn[x['h']] != x['n']]}, ensure_ascii=False, indent=1))
