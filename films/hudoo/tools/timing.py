"""Narration timeline, word timings, subtitles and the voice track.

usage: python3 tools/timing.py   → audio/narration.wav (48 kHz), timing/lines.json, timing/words.json, export/hudoo.ar.srt

Lines are placed back to back with the script's pauses (0.3 s, 0.8 s at a chapter's end); nothing else is added.
Word timings: each line is one take, so its start and end are exact. Inside a line, the pauses the voice actually made
(gaps ≥ 70 ms in the waveform) are matched to the line's punctuation; words between two pauses share that span in
proportion to their voiced (diacritised) length. Where pauses and punctuation don't match, the whole line is shared
that way. These are estimates within ±0.15 s, good for cueing actions, not for lip-sync.
"""
import json
import os
import re
import subprocess
import wave
from pathlib import Path

import numpy as np

# PROJECT_ROOT lets another project (an ad, a reel) reuse this tool on its own narrative/ and audio/
root = Path(os.environ.get('PROJECT_ROOT', Path(__file__).resolve().parent.parent)).resolve()
FPS = 60
L = json.loads((root / 'narrative/lines.json').read_text(encoding='utf-8'))
SR = L['sampleRate']


def read(path):
    w = wave.open(str(path))
    return np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float32) / 32768


def pauses(x, hop=0.01, thr=0.012, min_gap=0.07):
    n = int(hop * SR)
    env = np.array([np.sqrt((x[i:i + n] ** 2).mean()) for i in range(0, len(x) - n, n)])
    quiet = env < thr
    out, k = [], 0
    while k < len(quiet):
        if quiet[k]:
            j = k
            while j < len(quiet) and quiet[j]:
                j += 1
            if (j - k) * hop >= min_gap and k > 0 and j < len(quiet):
                out.append(((k + j) / 2) * hop)
            k = j
        else:
            k += 1
    return out


def phrases(tts):
    """Split the voiced line at punctuation the voice pauses on."""
    parts = [p.strip() for p in re.split(r'[،,…:؟?!.]+', tts) if p.strip()]
    return parts


strip = re.compile('[ً-ْٰ]')
words, lines_out, t = [], [], 0.0
for l in L['lines']:
    x = read(root / f"audio/lines/{l['id']:03d}.wav")
    dur = len(x) / SR
    ph = phrases(l['tts'])
    gaps = pauses(x)
    disp = l['text'].split()
    tts_words = l['tts'].split()
    # phrase spans: use the voice's own pauses when their count matches the punctuation
    if len(ph) > 1 and len(gaps) >= len(ph) - 1:
        # keep the strongest len(ph)-1 gaps, in time order: the longest silences are the punctuation pauses
        cuts = sorted(gaps[:])
        if len(cuts) > len(ph) - 1:
            # prefer gaps nearest to proportional positions
            prop = np.cumsum([len(p) for p in ph])[:-1] / sum(len(p) for p in ph) * dur
            cuts = sorted(min(cuts, key=lambda c: abs(c - p)) for p in prop)
        bounds = [0.0] + cuts + [dur]
    else:
        ph, bounds = [' '.join(tts_words)], [0.0, dur]
    wi = 0
    for pi, p in enumerate(ph):
        pw = p.split()
        lens = [max(1, len(w)) for w in pw]
        a, b = bounds[pi], bounds[pi + 1]
        acc = a
        for k, w in enumerate(pw):
            span = (b - a) * lens[k] / sum(lens)
            if wi < len(disp):
                words.append({'line': l['id'], 'i': wi, 'word': disp[wi], 'start': round(t + acc, 3), 'end': round(t + acc + span, 3)})
            wi += 1
            acc += span
    lines_out.append({'id': l['id'], 'chapter': l['chapter'], 'chapterTitle': l['chapterTitle'], 'text': l['text'], 'start': round(t, 3), 'end': round(t + dur, 3),
                      'startFrame': round(t * FPS), 'endFrame': round((t + dur) * FPS), 'pauseAfter': l['pauseAfter'], 'words': len(disp)})
    t += dur + l['pauseAfter']

total = round(t, 3)
(root / 'timing').mkdir(exist_ok=True)
(root / 'timing/lines.json').write_text(json.dumps({'fps': FPS, 'total': total, 'frames': round(total * FPS), 'lines': lines_out}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(root / 'timing/words.json').write_text(json.dumps(words, ensure_ascii=False) + '\n', encoding='utf-8')

# the voice track: lines and pauses exactly as timed, resampled to 48 kHz
buf = np.zeros(int(total * SR) + SR)
for l in lines_out:
    x = read(root / f"audio/lines/{l['id']:03d}.wav")
    s = int(round(l['start'] * SR))
    buf[s:s + len(x)] += x
buf = buf[:int(total * SR)]
raw = root / 'audio/narration-22k.wav'
with wave.open(str(raw), 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(buf, -1, 1) * 32767).astype('<i2').tobytes())
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-af', 'aresample=48000:resampler=soxr', '-ar', '48000', str(root / 'audio/narration.wav')], check=True)
raw.unlink()


# subtitles: one cue per line, split at a comma when a line is long
def ts(x):
    ms = int(round(x * 1000))
    return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


cues = []
for l in lines_out:
    lw = [w for w in words if w['line'] == l['id']]
    text = l['text']
    if len(text) > 70 and '،' in text:
        k = text.index('،', len(text) // 3)
        first = text[:k + 1].split()
        n = len(first)
        split_t = lw[n]['start'] if n < len(lw) else l['end']
        cues += [(l['start'], split_t, text[:k + 1].strip()), (split_t, l['end'], text[k + 1:].strip())]
    else:
        cues.append((l['start'], l['end'], text))
(root / 'export').mkdir(exist_ok=True)
(root / f"export/{os.environ.get('SRT_NAME', 'hudoo.ar.srt')}").write_text(''.join(f'{i + 1}\n{ts(a)} --> {ts(b)}\n{c}\n\n' for i, (a, b, c) in enumerate(cues)), encoding='utf-8')
print(f'{len(lines_out)} lines, {len(words)} words, {len(cues)} subtitle cues, total {total:.2f} s ({int(total // 60)}:{total % 60:05.2f})')
