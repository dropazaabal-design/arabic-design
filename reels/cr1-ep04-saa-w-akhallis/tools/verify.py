"""Measure one exported file against CR1 §9 and §13: container and codec, 60 fps constant, BT.709
tags, AAC-LC 48 kHz, fast start, a full decode without errors, duration against the timeline,
loudness and true peak, black frames, holds over 3 s, silences over 0.8 s, and whether each voice
line, and each word after a pause, starts where the timeline says.

usage: python3 tools/verify.py FILE.mp4 long|short WIDTHxHEIGHT [OUT.json]
Measurements only: they say nothing about how the film looks or sounds to a person.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
video, prog, size = sys.argv[1], sys.argv[2], sys.argv[3]
out = Path(sys.argv[4]) if len(sys.argv) > 4 else root / f'review/{Path(video).stem}.json'
data = json.loads((root / f'src/data/{prog}.json').read_text(encoding='utf-8'))
W, H = map(int, size.split('x'))
FPS = 60


def run(*a):
    return subprocess.run(a, capture_output=True, text=True)


probe = json.loads(run('ffprobe', '-v', 'error', '-show_entries',
                       'stream=codec_type,codec_name,profile,pix_fmt,width,height,r_frame_rate,avg_frame_rate,nb_frames,duration,sample_rate,channels,bit_rate,color_space,color_transfer,color_primaries,field_order:format=duration,size,bit_rate',
                       '-of', 'json', video).stdout)
v = next(s for s in probe['streams'] if s['codec_type'] == 'video')
a = next(s for s in probe['streams'] if s['codec_type'] == 'audio')
head = open(video, 'rb').read(1 << 20)
faststart = 0 <= head.find(b'moov') < head.find(b'mdat') if b'mdat' in head else head.find(b'moov') >= 0
decode = run('ffmpeg', '-v', 'error', '-i', video, '-f', 'null', '-').stderr.strip().splitlines()
pts = [float(x.strip(',')) for x in run('ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'frame=pts_time', '-of', 'csv=p=0', video).stdout.split() if x.strip(',')]
irregular = sum(1 for p, q in zip(pts, pts[1:]) if abs(q - p - 1 / FPS) > 0.0005)

log = run('ffmpeg', '-hide_banner', '-nostats', '-i', video, '-filter_complex',
          '[0:v]blackdetect=d=0.1:pix_th=0.08,freezedetect=n=0.0005:d=3[v];[0:a]ebur128=peak=true,silencedetect=n=-45dB:d=0.8[a]',
          '-map', '[v]', '-map', '[a]', '-f', 'null', '-').stderr
num = lambda pat: [float(x) for x in re.findall(pat, log)]
summ = log[log.rfind('Summary:'):]
lufs = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1))
tp = float(re.search(r'True peak:\s+Peak:\s+(-?[\d.]+) dBFS', summ).group(1))
freezes = [(round(s, 2), round(d, 2)) for s, d in zip(num(r'freeze_start: ([\d.]+)'), num(r'freeze_duration: ([\d.]+)'))]
silences = [(round(s, 2), round(e, 2)) for s, e in zip(num(r'silence_start: ([\d.]+)'), num(r'silence_end: ([\d.]+)'))]
blacks = list(zip(num(r'black_start:([\d.]+)'), num(r'black_end:([\d.]+)')))

fine = run('ffmpeg', '-hide_banner', '-nostats', '-i', video, '-map', '0:a', '-af', 'silencedetect=n=-45dB:d=0.12', '-f', 'null', '-').stderr
ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', fine)]
# a sound effect that starts just before a line fills the silence the onset is measured from; such a
# line is reported as masked, not as late, and the other lines still have to land on time
cues = json.loads((root / 'timeline.json').read_text(encoding='utf-8'))[prog]['sfx']
FRAME, TARGET = 1 / FPS + 0.002, 0.014  # one frame at 60 fps (+2 ms measurement slack), and the requested 14 ms


import wave
SFX_LEN = {}
def sfx_len(name):
    if name not in SFX_LEN:
        with wave.open(str(root / f'public/sfx/{name}.wav')) as w:
            SFX_LEN[name] = w.getnframes() / w.getframerate()
    return SFX_LEN[name]


def onset(t, window, accept=lambda e: True):
    """Status of one planned onset: measured (with offset), masked (a sound effect is still sounding at the
    onset, so the silence edge belongs to the effect: not measurable this way), or notFound (no silence edge
    near it)."""
    mask = next((c['sfx'] for c in cues if c['time'] - 0.05 <= t <= c['time'] + sfx_len(c['sfx']) + 0.05), None)
    if mask:
        return {'status': 'masked', 'maskedBy': mask}
    near = [e for e in ends if abs(e - t) <= window and accept(e)]
    if not near:
        return {'status': 'notFound'}
    got = min(near, key=lambda e: abs(e - t))
    return {'status': 'measured', 'measured': got, 'offset': round(got - t, 3)}


lines = [{'id': x['id'], 'planned': x['start'], **onset(x['start'], 0.4)} for x in data['segments']]
# every word that follows a pause inside its line
words = []
for k, w in enumerate(data['words'][1:], 1):
    prev = data['words'][k - 1]
    if w['seg'] != prev['seg'] or w['start'] - prev['end'] < 0.06:
        continue
    row = {'seg': w['seg'], 'i': w['i'], 'w': w['w'], 'planned': w['start'], 'pause': round(w['start'] - prev['end'], 3)}
    # the detector needs 0.12 s of silence: a shorter pause has no edge to measure
    words.append({**row, 'status': 'shortPause'} if row['pause'] < 0.12 else
                 {**row, **onset(w['start'], 0.3, lambda e, prev=prev, w=w: prev['start'] + 0.1 < e < w['end'] - 0.05)})


def summary(rows):
    m = [abs(r['offset']) for r in rows if r['status'] == 'measured']
    return {'total': len(rows), 'measured': len(m), 'masked': sum(r['status'] == 'masked' for r in rows),
            'notFound': sum(r['status'] == 'notFound' for r in rows), 'shortPause': sum(r['status'] == 'shortPause' for r in rows), 'maxAbsOffsetMs': round(max(m) * 1000, 1) if m else None,
            'withinOneFrame': sum(x <= FRAME for x in m), 'within14ms': sum(x <= TARGET for x in m)}


L, Wd = summary(lines), summary(words)
checks = {
    'h264 + yuv420p progressive': v['codec_name'] == 'h264' and v['pix_fmt'] == 'yuv420p' and v.get('field_order', 'progressive') in ('progressive', 'unknown'),
    f'{W}x{H}': (v['width'], v['height']) == (W, H),
    '60 fps constant': v['r_frame_rate'] == '60/1' and v['avg_frame_rate'] == '60/1' and irregular == 0,
    'BT.709 tags': v.get('color_space') == 'bt709' and v.get('color_primaries') == 'bt709' and v.get('color_transfer') == 'bt709',
    'AAC-LC 48 kHz': a['codec_name'] == 'aac' and a.get('profile') == 'LC' and a['sample_rate'] == '48000',
    'fast start (moov first)': faststart,
    'full decode, no errors': not decode,
    'frames = timeline': abs(len(pts) - data['durationInFrames']) <= 1,
    'loudness −16 ±1 LUFS': abs(lufs + 16) <= 1,
    'true peak ≤ −4 dBTP': tp <= -4.0,
    'no black frames': not blacks,
    # timing: only measured onsets are judged; masked and not-found ones are counted and listed, never passed
    'measured line starts within one frame (16.7 ms)': L['measured'] > 0 and L['withinOneFrame'] == L['measured'],
    'measured line starts within the 14 ms target': L['measured'] > 0 and L['within14ms'] == L['measured'],
    'measured words after a pause within one frame': Wd['withinOneFrame'] == Wd['measured'],
    'measured words after a pause within the 14 ms target': Wd['within14ms'] == Wd['measured'],
}
res = {
    'file': Path(video).name, 'bytes': int(probe['format']['size']), 'videoBitrate': int(v.get('bit_rate') or 0),
    'video': {k: v.get(k) for k in ('codec_name', 'profile', 'pix_fmt', 'width', 'height', 'r_frame_rate', 'avg_frame_rate', 'nb_frames', 'color_space', 'color_primaries', 'color_transfer')},
    'audio': {k: a.get(k) for k in ('codec_name', 'profile', 'sample_rate', 'channels', 'bit_rate')},
    'duration': {'container': float(probe['format']['duration']), 'timeline': data['totalSeconds'], 'frames': len(pts), 'framesExpected': data['durationInFrames'], 'irregularDeltas': irregular},
    'loudness': {'integratedLUFS': lufs, 'truePeakDBTP': tp},
    'decodeErrors': decode[:20], 'black': blacks,
    'holdsOver3s': freezes, 'silencesOver0.8s': silences,
    'voiceOnsets': {'method': 'silence edge (−45 dB, ≥ 0.12 s) nearest each planned onset. masked = a sound effect is still sounding at the onset (the edge would be the effect); shortPause = the pause before the word is under the detector minimum; notFound = no edge within the window. Only measured onsets are judged.',
                    'lines': {**L, 'detail': lines}, 'wordsAfterPause': {**Wd, 'detail': words}},
    'checks': checks, 'pass': all(checks.values()),
    'flags': 'holds over 3 s and silences over 0.8 s open a review mark (CR1 §9); each is listed for a person to judge',
    'note': 'measurements only; nothing here proves how the film looks or sounds to a person',
}
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(res, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(json.dumps({'file': res['file'], 'pass': res['pass'], 'failed': [k for k, ok in checks.items() if not ok], 'lufs': lufs, 'tp': tp,
                  'holds': freezes, 'silences': silences, 'lines': L, 'words': Wd}, ensure_ascii=False))
