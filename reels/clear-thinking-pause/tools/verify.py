"""Measure the exported reel itself: specs, frame cadence, duration against the timeline, loudness
(integrated LUFS and true peak), black and frozen frames, long silences, and whether each voice line
starts in the mix where timeline.json says.

usage: python3 tools/verify.py render/la-tursilha.mp4 [OUT.json]
Adapted from reels/fikra-01-influence/tools/verify.py (git history). Measurements only: they say
nothing about how the reel looks or sounds to a person.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
video = sys.argv[1]
out = Path(sys.argv[2]) if len(sys.argv) > 2 else root / 'review/technical.json'
tl = json.loads((root / 'timeline.json').read_text(encoding='utf-8'))
fps = tl['fps']


def run(*a):
    return subprocess.run(a, capture_output=True, text=True)


probe = json.loads(run('ffprobe', '-v', 'error', '-show_entries', 'stream=index,codec_type,codec_name,profile,pix_fmt,width,height,r_frame_rate,avg_frame_rate,nb_frames,duration,sample_rate,channels,bit_rate:format=duration,size,bit_rate',
                       '-of', 'json', video).stdout)
v = next(s for s in probe['streams'] if s['codec_type'] == 'video')
a = [s for s in probe['streams'] if s['codec_type'] == 'audio']
pts = [float(x.strip(',')) for x in run('ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'frame=pts_time', '-of', 'csv=p=0', video).stdout.split() if x.strip(',')]
deltas = [b - a_ for a_, b in zip(pts, pts[1:])]
irregular = sum(1 for d in deltas if abs(d - 1 / fps) > 0.0005)

log = run('ffmpeg', '-hide_banner', '-nostats', '-i', video, '-filter_complex',
          '[0:v]blackdetect=d=0.1:pix_th=0.1,freezedetect=n=0.001:d=3[v];[0:a]ebur128=peak=true,silencedetect=n=-45dB:d=0.8[a]',
          '-map', '[v]', '-map', '[a]', '-f', 'null', '-').stderr
num = lambda pat: [float(x) for x in re.findall(pat, log)]
summary = log[log.rfind('Summary:'):]
loud = {'I': float(re.search(r'I:\s+(-?[\d.]+) LUFS', summary).group(1)), 'LRA': float(re.search(r'LRA:\s+(-?[\d.]+) LU', summary).group(1)),
        'truePeak': float(re.search(r'True peak:\s+Peak:\s+(-?[\d.]+) dBFS', summary).group(1))}
blacks = list(zip(num(r'black_start:([\d.]+)'), num(r'black_end:([\d.]+)')))
freezes = list(zip(num(r'freeze_start: ([\d.]+)'), num(r'freeze_duration: ([\d.]+)')))
silences = list(zip(num(r'silence_start: ([\d.]+)'), num(r'silence_end: ([\d.]+)')))

# voice onsets: the end of a short silence near each line's planned start
fine = run('ffmpeg', '-hide_banner', '-nostats', '-i', video, '-map', '0:a', '-af', 'silencedetect=n=-45dB:d=0.12', '-f', 'null', '-').stderr
ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', fine)]
onsets = []
for s in tl['segments']:
    near = [e for e in ends if abs(e - s['start']) <= 0.4]
    got = min(near, key=lambda e: abs(e - s['start'])) if near else None
    onsets.append({'id': s['id'], 'planned': s['start'], 'measured': got, 'offset': None if got is None else round(got - s['start'], 3)})
measured = [o['offset'] for o in onsets if o['offset'] is not None]

res = {
    'file': video, 'bytes': int(probe['format']['size']),
    'video': {k: v.get(k) for k in ('codec_name', 'profile', 'pix_fmt', 'width', 'height', 'r_frame_rate', 'avg_frame_rate', 'nb_frames')},
    'audio': [{k: s.get(k) for k in ('codec_name', 'profile', 'sample_rate', 'channels', 'bit_rate')} for s in a],
    'duration': {'container': float(probe['format']['duration']), 'video': float(v['duration']), 'timeline': tl['totalSeconds'], 'framesExpected': tl['durationInFrames']},
    'cadence': {'frames': len(pts), 'irregularDeltas': irregular},
    'loudness': {'integratedLUFS': loud['I'], 'LRA': loud['LRA'], 'truePeakDBTP': loud['truePeak'], 'target': '≈ -14 LUFS, true peak ≤ -1 dBTP'},
    'black': blacks, 'frozenOver3s': freezes, 'silencesOver0.8s': silences,
    'voiceOnsets': {'lines': len(onsets), 'found': len(measured), 'maxAbsOffset': max(map(abs, measured)) if measured else None,
                    'notFound': [o['id'] for o in onsets if o['offset'] is None], 'detail': onsets},
    'note': 'measurements only; nothing here proves how the reel looks or sounds to a person',
}
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(res, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(json.dumps({k: res[k] for k in ('bytes', 'video', 'audio', 'duration', 'cadence', 'loudness')}, ensure_ascii=False))
print('black', blacks, '| frozen>3s', freezes, '| silences>0.8s', [(round(x, 2), round(y, 2)) for x, y in silences])
print('voice onsets found', len(measured), 'of', len(onsets), '| max |offset|', res['voiceOnsets']['maxAbsOffset'], '| not found', res['voiceOnsets']['notFound'])
