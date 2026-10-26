"""Narration → public/audio/narration.wav + src/timing.json.

Each chunk in narrative/chunks.json has audio/raw/<id>.mp3. The chunks are laid end to end with a gap, and for
each chunk we anchor the punctuation marks of its text to the pauses actually heard, so a phrase in the text maps
to the second it is spoken (piecewise linear between anchors). The mouth envelope (0..1 per video frame) comes
from the same audio.

usage: python3 tools/timing.py
"""
import json
import os
import re
import subprocess
from pathlib import Path

import numpy as np

root = Path(__file__).resolve().parent.parent
FPS, SR = 60, 48000
LEAD, GAP, TAIL = 1.0, 0.7, 2.0          # seconds before the first chunk, between chunks, after the last
TAG = re.compile(r'\[[^\]]*\]\s*')
PUNCT = re.compile(r'[.،,!?؟…:]+')


def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(p), '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, '<i2').astype(np.float32) / 32768


def silences(x, min_len=0.16):
    """Pauses as (start, end) seconds: 10 ms frames below a threshold relative to the speech level."""
    hop = SR // 100
    e = np.sqrt(np.mean(x[: len(x) // hop * hop].reshape(-1, hop) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(e)
    thr = np.percentile(db, 90) - 32
    quiet = db < thr
    out, i = [], 0
    while i < len(quiet):
        if quiet[i]:
            j = i
            while j < len(quiet) and quiet[j]:
                j += 1
            if (j - i) / 100 >= min_len:
                out.append((i / 100, j / 100))
            i = j
        else:
            i += 1
    return out


def anchors(text, x):
    dur = len(x) / SR
    sil = silences(x)
    start = sil[0][1] if sil and sil[0][0] == 0 else 0.0
    end = sil[-1][0] if sil and sil[-1][1] >= dur - 0.02 else dur
    inner = [s for s in sil if s[0] > start + 0.05 and s[1] < end - 0.05]
    A = [(0, start)]
    marks = [m.end() for m in PUNCT.finditer(text) if m.end() < len(text)]
    for c in marks:
        c0, t0 = A[-1]
        # expected time from the speaking rate so far (or the whole chunk's rate at the start)
        rate = (t0 - start) / c0 if c0 > 40 else (end - start) / len(text)
        te = t0 + (c - c0) * rate
        cand = [s for s in inner if s[0] > t0 + 0.1 and abs((s[0] + s[1]) / 2 - te) < 1.3]
        if cand:
            s = min(cand, key=lambda s: abs((s[0] + s[1]) / 2 - te))
            A.append((c, round(s[0], 3)))
            A.append((c + 0.001, round(s[1], 3)))  # the next word starts after the pause
            inner = [q for q in inner if q[0] > s[1]]
    A.append((len(text), end))
    return A, round(start, 3), round(end, 3)


def envelope(x):
    hop = SR // FPS
    n = len(x) // hop
    e = np.sqrt(np.mean(x[: n * hop].reshape(n, hop) ** 2, axis=1))
    return np.clip(e / (np.percentile(e, 95) + 1e-9), 0, 1)


chunks = json.loads((root / 'narrative/chunks.json').read_text(encoding='utf-8'))
if os.environ.get('LIMIT'):  # partial runs while the voice is still being generated
    chunks = chunks[: int(os.environ['LIMIT'])]
out, audio, env, t = [], [np.zeros(int(LEAD * SR), np.float32)], [], LEAD
env.append(np.zeros(int(LEAD * FPS)))
for c in chunks:
    x = load(root / f"audio/raw/{c['id']}.mp3")
    text = TAG.sub('', c['text']).strip()
    wf = root / f"timing/{c['id']}.words.json"
    if wf.exists():   # word times from ElevenLabs (exact); pause matching is only the fallback
        A, cur = [(0, 0.0)], 0
        for w in json.loads(wf.read_text(encoding='utf-8'))['words']:
            if w['type'] != 'word' or w['text'].startswith('['):
                continue
            i = text.find(w['text'], cur)
            if i < 0 or i - cur > 40:
                continue
            A += [(i, w['start']), (i + len(w['text']), max(w['end'], w['start']))]
            cur = i + len(w['text'])
        A.append((len(text), len(x) / SR))
        A = [a for k, a in enumerate(A) if k == 0 or (a[0] >= A[k - 1][0] and a[1] >= A[k - 1][1])]
        s, e = A[1][1], A[-2][1]
    else:
        A, s, e = anchors(text, x)
    out.append({'id': c['id'], 'text': text, 'start': round(t, 3), 'dur': round(len(x) / SR, 3),
                'speech': [s, e], 'anchors': [[round(a, 3), b] for a, b in A]})
    audio.append(x)
    ev = envelope(x)
    env.append(np.pad(ev, (0, max(0, int(round((len(x) / SR) * FPS)) - len(ev)))))
    t += len(x) / SR
    gap = GAP if c is not chunks[-1] else TAIL
    audio.append(np.zeros(int(gap * SR), np.float32))
    env.append(np.zeros(int(round(gap * FPS))))
    t += gap

full = np.concatenate(audio)
# one gain to −16 LUFS-ish (RMS of the speech) with a hard ceiling; the mix tool can do better later
rms = np.sqrt(np.mean(full[np.abs(full) > 0.01] ** 2))
full = np.clip(full * (0.1 / rms), -0.89, 0.89)
pcm = (full * 32767).astype('<i2').tobytes()
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-',
                str(root / 'public/audio/narration.wav')], input=pcm, check=True)
envAll = np.concatenate(env)
frames = int(np.ceil(len(full) / SR * FPS))
(root / 'src/timing.json').write_text(json.dumps({
    'fps': FPS, 'frames': frames, 'chunks': out,
    'mouth': [round(float(v), 2) for v in envAll[:frames]],
}, ensure_ascii=False), encoding='utf-8')
print(f"{len(out)} chunks, {len(full) / SR:.1f} s, {frames} frames; anchors per chunk:",
      [len(c['anchors']) // 2 for c in out])
