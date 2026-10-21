"""Measures the edited voice beyond loudness: peaks, limiter work, what the chain changed, the joins,
and that every piece still sits where the timeline says (no drift, no stretch).

usage: python tools/audiocheck.py   (needs numpy)   -> audio/audiocheck.json
Measured only; nobody listened to the file.
"""
import json, re, subprocess, tempfile, wave
from pathlib import Path
import numpy as np

root = Path(__file__).resolve().parent.parent
tl = json.loads((root / 'timeline.json').read_text())
SR = 48000

def read(p):
    with wave.open(str(p)) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
        return x.reshape(-1, w.getnchannels()).mean(axis=1) if w.getnchannels() > 1 else x

def ff(args, out):
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', *args, '-ar', str(SR), '-ac', '1', '-c:a', 'pcm_s16le', str(out)], check=True)

def ebur(p):
    log = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(p), '-af', 'ebur128=peak=true+sample', '-f', 'null', '-'], capture_output=True, text=True).stderr
    tail = log[log.rfind('Summary:'):]
    g = lambda k: float(re.search(k + r':\s+(-?[\d.]+|-inf)', tail).group(1))
    return {'I_LUFS': g('I'), 'LRA_LU': g('LRA'), 'truePeak_dBTP': g('Peak'), 'samplePeak_dBFS': float(re.findall(r'Peak:\s+(-?[\d.]+)', tail)[0])}

db = lambda v: float(20 * np.log10(max(v, 1e-12)))
frames = lambda x, n: x[: len(x) // n * n].reshape(-1, n)

voice = read(root / 'public/audio/voice.wav')
edit = read(root / 'audio/voice-edit.wav')                          # after the chain, before gain + limiter
res = {'file': 'public/audio/voice.wav', 'durationS': round(len(voice) / SR, 3), 'expectedS': tl['totalSeconds']}

# 1) loudness and peaks (true peak = 4x oversampled, ebur128)
res['loudness'] = ebur(root / 'public/audio/voice.wav')
res['loudness']['PLR_dB'] = round(res['loudness']['truePeak_dBTP'] - res['loudness']['I_LUFS'], 1)

# 2) limiter: compare 5 ms peaks before (edit x gain) and after; first find the limiter's delay
pre = edit * 10 ** (tl['voiceGainDb'] / 20)
seg = slice(int(10 * SR), int(20 * SR))
lags = range(-480, 481)
lag = max(lags, key=lambda L: float(np.dot(pre[seg], np.roll(voice, -L)[seg])))
post = np.roll(voice, -lag)
n5 = int(0.005 * SR)
pk_pre, pk_post = np.abs(frames(pre, n5)).max(1), np.abs(frames(post, n5)).max(1)
loud = pk_pre > 0.05
gr = np.where(loud, 20 * np.log10(np.maximum(pk_pre, 1e-9) / np.maximum(pk_post, 1e-9)), 0)
res['limiter'] = {
    'limit_dBFS': round(db(0.85), 2), 'delayMs': round(lag / SR * 1000, 2),
    'samplesOverLimitBefore': int((np.abs(pre) > 0.85).sum()),
    'maxGainReduction_dB': round(float(gr.max()), 2),
    'msWithGR': {f'>{t}dB': int((gr > t).sum() * 5) for t in (0.5, 1, 2, 3)},
    'speechMs': int(loud.sum() * 5),
}

# 3) what the chain did: same edit without the chain, same gain, compared in speech and in room tone
with tempfile.TemporaryDirectory() as d:
    raw_p = Path(d) / 'raw.wav'
    edl, xf = tl['edl'], tl['crossfade']
    g = ''.join(f"[{i}:a]atrim={e['src'][0]}:{e['src'][1]},asetpts=PTS-STARTPTS[p{i}];" for i, e in enumerate(edl))
    prev = 'p0'
    for i in range(1, len(edl)):
        g += f"[{prev}][p{i}]acrossfade=d={xf[i - 1]}:c1=qsin:c2=qsin[x{i}];"; prev = f'x{i}'
    g += f'[{prev}]anull[v]'
    ff([x for _ in edl for x in ('-i', str(root / 'audio/original-48k.wav'))] + ['-filter_complex', g, '-map', '[v]'], raw_p)
    raw = read(raw_p)
m = min(len(raw), len(edit))
raw, ed = raw[:m], edit[:m]
n20 = int(0.02 * SR)
rms_raw = np.sqrt((frames(raw, n20) ** 2).mean(1))
speech = 20 * np.log10(np.maximum(rms_raw, 1e-9)) > -26
tone = 20 * np.log10(np.maximum(rms_raw, 1e-9)) < -30
def band(x, lo, hi, mask):
    F = frames(x, 2048) * np.hanning(2048)
    S = np.abs(np.fft.rfft(F, axis=1)) ** 2
    f = np.fft.rfftfreq(2048, 1 / SR)
    fm = np.repeat(mask, n20)[: len(F) * 2048].reshape(len(F), 2048).mean(1) > 0.9
    return 10 * np.log10(S[fm][:, (f >= lo) & (f < hi)].sum(1).mean() + 1e-20)
bands = [(20, 75), (75, 300), (300, 3000), (3000, 6000), (6000, 12000)]
res['chain'] = {
    'chain': (root / 'audio/chain.txt').read_text().strip(),
    'speech_dB_change_by_band': {f'{lo}-{hi}Hz': round(band(ed, lo, hi, speech) - band(raw, lo, hi, speech), 1) for lo, hi in bands},
    'roomTone_dB_change_by_band': {f'{lo}-{hi}Hz': round(band(ed, lo, hi, tone) - band(raw, lo, hi, tone), 1) for lo, hi in bands},
    'roomTone_median_dBFS_20ms': {'before': round(float(np.median(20 * np.log10(np.sqrt((frames(raw, n20)[tone] ** 2).mean(1)) + 1e-12))), 1), 'after': round(float(np.median(20 * np.log10(np.sqrt((frames(ed, n20)[tone[: m // n20]] ** 2).mean(1)) + 1e-12))), 1)},
}

# 4) joins: high-frequency energy (first difference) in 2 ms frames around each crossfade, vs the surroundings
n2 = int(0.002 * SR)
hf = np.abs(np.diff(post, prepend=0))
joins = []
for e in tl['edl'][1:]:
    c = int(e['out'][0] * SR)
    win = hf[c - int(0.3 * SR): c + int(0.3 * SR)]
    fr = frames(win, n2).max(1)
    mid = len(fr) // 2
    near = fr[mid - 15: mid + 15].max()
    joins.append({'atS': round(c / SR, 3), 'hfPeakNearJoin_vs_median': round(float(near / np.median(fr)), 2), 'hfPeakNearJoin_vs_windowMax': round(float(near / fr.max()), 2),
                  'rms_dBFS_120msBefore': round(db(np.sqrt((post[c - int(0.18 * SR): c - int(0.06 * SR)] ** 2).mean())), 1),
                  'rms_dBFS_120msAfter': round(db(np.sqrt((post[c + int(0.06 * SR): c + int(0.18 * SR)] ** 2).mean())), 1)})
res['joins'] = joins

# 5) every piece where the timeline puts it: correlate 1.5 s of each piece against the source (no drift, no stretch)
src = read(root / 'audio/original-48k.wav')
sync = []
for e in tl['edl']:
    for frac in (0.25, 0.75):
        s0 = e['src'][0] + frac * (e['src'][1] - e['src'][0])
        o0 = e['audio'][0] + (s0 - e['src'][0])
        a = src[int(s0 * SR): int((s0 + 1.5) * SR)]
        best = max(range(-960, 961, 4), key=lambda L: float(np.dot(a, raw[int(o0 * SR) + L: int(o0 * SR) + L + len(a)])))
        sync.append({'src': round(s0, 2), 'out': round(o0, 2), 'offsetMs': round(best / SR * 1000, 1)})
res['pieceOffsets'] = sync
(root / 'audio/audiocheck.json').write_text(json.dumps(res, ensure_ascii=False, indent=1) + '\n')
print(json.dumps(res, ensure_ascii=False, indent=1))
