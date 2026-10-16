"""Measure every ElevenLabs take of every narration unit and rank them, so a take is chosen by
numbers that stand in for listening: no clipping or level jumps, pauses where the script has
punctuation, a speaking rate and pitch that match the other units (so the joins do not jump),
and a livelier pitch line. A proxy only: a person still has to listen to the chosen takes.

usage: python3 tools/takes.py            → review/takes.json (+ a table on stdout)
"""
import json
import re
import subprocess
from pathlib import Path

import numpy as np

root = Path(__file__).resolve().parent.parent
UNITS = {'L1': ['L1'], 'L2': ['L2'], 'L3': ['L3'], 'L4': ['L4'], 'L5': ['L5'], 'L6': ['L6'], 'L7': ['L7'], 'L8': ['L8'],
         'S1': ['R1', 'R2', 'R3'], 'S2': ['R4', 'R5', 'R6']}
SR = 16000


def segments():
    out = {}
    for f in ('script-long.md', 'script-short.md'):
        t = (root / f).read_text(encoding='utf-8')
        for s in re.split(r'^## ', t, flags=re.M)[1:]:
            lines = s.strip().split('\n')
            out[lines[0].split()[0]] = lines[1:]
    return out


def pcm(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768


def f0_track(x):
    """Autocorrelation pitch per 40 ms frame (voiced frames only), in Hz."""
    n, hop = 640, 320
    out = []
    for i in range(0, len(x) - n, hop):
        fr = x[i:i + n] - x[i:i + n].mean()
        if np.sqrt((fr ** 2).mean()) < 0.02:
            continue
        ac = np.correlate(fr, fr, 'full')[n - 1:]
        lo, hi = SR // 300, SR // 70
        k = lo + int(np.argmax(ac[lo:hi]))
        if ac[k] > 0.45 * ac[0]:
            out.append(SR / k)
    return np.array(out)


def measure(path, words, marks):
    x = pcm(path)
    dur = len(x) / SR
    log = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(path), '-af', 'silencedetect=n=-40dB:d=0.16,ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    st = [float(v) for v in re.findall(r'silence_start: ([\d.]+)', log)]
    en = [float(v) for v in re.findall(r'silence_end: ([\d.]+)', log)]
    sil = list(zip(st, en))
    lead = sil[0][1] if sil and sil[0][0] < 0.05 else 0.0
    tail = dur - sil[-1][0] if sil and sil[-1][1] >= dur - 0.05 else 0.0
    inner = [(a, b) for a, b in sil if a > lead + 0.01 and b < dur - tail - 0.01]
    speech = dur - lead - tail - sum(b - a for a, b in inner)
    summ = log[log.rfind('Summary:'):]
    lufs = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1))
    tp = float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', summ).group(1))
    # level jumps: 10 ms RMS steps above 12 dB between two loud frames (clicks, splices, glitches)
    r = np.sqrt(np.convolve(x ** 2, np.ones(160) / 160, 'valid')[::160] + 1e-10)
    db = 20 * np.log10(r)
    jumps = int(np.sum((np.diff(db) > 12) & (db[:-1] > -32) & (db[1:] > -32)))
    f0 = f0_track(x)
    semis = 12 * np.log2(f0 / np.median(f0)) if len(f0) else np.array([0.0])
    return {'dur': round(dur, 2), 'lead': round(lead, 2), 'tail': round(tail, 2), 'pauses': len(inner),
            'longest': round(max([b - a for a, b in inner] or [0]), 2), 'expected': marks,
            'rate': round(words / speech, 2), 'lufs': lufs, 'tp': tp, 'clip': int(np.sum(np.abs(x) > 0.99)), 'jumps': jumps,
            'f0': round(float(np.median(f0)) if len(f0) else 0, 1), 'f0sd': round(float(np.std(semis)), 2)}


segs = segments()
rows = {}
for unit, ids in UNITS.items():
    lines = [l for i in ids for l in segs[i]]
    words = sum(len(l.split()) for l in lines)
    marks = sum(len(re.findall(r'[،.:؟…]', l)) for l in lines) - 1
    rows[unit] = {p.stem.split('-', 1)[1]: measure(p, words, marks) for p in sorted((root / 'audio/takes').glob(f'{unit}-*.mp3'))}

allm = [m for u in rows.values() for m in u.values()]
med = {k: float(np.median([m[k] for m in allm])) for k in ('rate', 'f0', 'lufs')}
picked = {}
for unit, takes in rows.items():
    fewest = min(m['jumps'] for m in takes.values())  # plosives also jump; only the excess over the unit's cleanest take counts
    for gid, m in takes.items():
        bad = m['clip'] > 0 or m['longest'] > 1.3
        m['score'] = round(
            -3.0 * abs(m['rate'] - med['rate'])            # same speaking rate as the rest
            - 0.08 * abs(m['f0'] - med['f0'])              # same voice height across joins
            - 0.25 * abs(m['lufs'] - med['lufs'])          # same level
            - 0.35 * abs(m['pauses'] - m['expected'])      # pauses where the punctuation is
            + 1.5 * m['f0sd']                              # a livelier line
            - 0.4 * (m['jumps'] - fewest)                  # possible clicks or splices
            - (10 if bad else 0), 3)
    picked[unit] = max(takes, key=lambda g: takes[g]['score'])

out = {'note': 'acoustic proxy for listening; a person must still listen to the chosen takes', 'median': med, 'picked': picked, 'takes': rows}
(root / 'review').mkdir(exist_ok=True)
(root / 'review/takes.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print('median', med)
for unit, takes in rows.items():
    for gid, m in sorted(takes.items(), key=lambda kv: -kv[1]['score']):
        star = '*' if gid == picked[unit] else ' '
        print(f"{star}{unit} {gid} dur={m['dur']:5.1f} rate={m['rate']:.2f} pauses={m['pauses']}/{m['expected']} long={m['longest']:.2f} "
              f"lufs={m['lufs']:.1f} tp={m['tp']:.1f} clip={m['clip']} jumps={m['jumps']} f0={m['f0']:.0f} sd={m['f0sd']:.2f} score={m['score']}")
