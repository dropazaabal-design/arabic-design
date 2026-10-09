"""Measure the rendered reel against the timeline: specs, cadence, loudness and true peak, black/frozen
frames, silences; audio sync (the edited voice found in the final mix by cross-correlation, per EDL piece);
picture sync (the speaker's frames in the reel matched against the source frames at the mapped times);
and how loud the effects are next to the voice.

usage: python3 tools/verify.py render/taghafol.mp4 [OUT.json]     (numpy needed for the sync parts)
Measurements only: no listening, no watching. Writes review/technical.json by default.
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


def run(*a):
    return subprocess.run(a, capture_output=True, text=True)


probe = json.loads(run('ffprobe', '-v', 'error', '-show_entries', 'stream=index,codec_type,codec_name,profile,pix_fmt,width,height,r_frame_rate,avg_frame_rate,nb_frames,duration,sample_rate,channels,bit_rate:format=duration,size,bit_rate',
                       '-of', 'json', video).stdout)
v = next(s for s in probe['streams'] if s['codec_type'] == 'video')
a = [s for s in probe['streams'] if s['codec_type'] == 'audio']
pts = [float(x.strip(',')) for x in run('ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'frame=pts_time', '-of', 'csv=p=0', video).stdout.split() if x.strip(',')]
deltas = [b - a_ for a_, b in zip(pts, pts[1:])]
irregular = sum(1 for d in deltas if abs(d - 1 / 60) > 0.0005)

log = run('ffmpeg', '-hide_banner', '-nostats', '-i', video, '-filter_complex',
          '[0:v]blackdetect=d=0.1:pix_th=0.1,freezedetect=n=0.001:d=3[v];[0:a]ebur128=peak=true,silencedetect=n=-45dB:d=0.8[a]',
          '-map', '[v]', '-map', '[a]', '-f', 'null', '-').stderr
num = lambda pat: [float(x) for x in re.findall(pat, log)]
loud = {k: float(re.findall(rf'^\s+{k}:\s+(-?[\d.]+)', log, re.M)[-1]) for k in ('I', 'LRA', 'Peak')}
blacks = list(zip(num(r'black_start:([\d.]+)'), num(r'black_end:([\d.]+)')))
freezes = list(zip(num(r'freeze_start: ([\d.]+)'), num(r'freeze_duration: ([\d.]+)')))
silences = list(zip(num(r'silence_start: ([\d.]+)'), num(r'silence_end: ([\d.]+)')))

import tempfile, wave
import numpy as np

def pcm(path, args=()):
    with tempfile.TemporaryDirectory() as d:
        o = Path(d) / 'a.wav'
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(path), *args, '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', str(o)], check=True)
        with wave.open(str(o)) as w:
            return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768

SR = 48000
mixd, voice = pcm(video), pcm(root / 'public/audio/voice.wav')
audio_sync = []
for e in tl['edl']:
    for frac in (0.3, 0.7):
        t0 = e['audio'][0] + frac * (e['audio'][1] - e['audio'][0])
        a = voice[int(t0 * SR): int((t0 + 1.5) * SR)]
        lags = range(-2400, 2401, 8)
        sc = [float(np.dot(a, mixd[int(t0 * SR) + L: int(t0 * SR) + L + len(a)])) for L in lags]
        k = int(np.argmax(sc)); L0 = list(lags)[k]
        fine_l = range(L0 - 8, L0 + 9)
        best = max(fine_l, key=lambda L: float(np.dot(a, mixd[int(t0 * SR) + L: int(t0 * SR) + L + len(a)])))
        audio_sync.append({'at': round(t0, 2), 'offsetMs': round(best / SR * 1000, 2)})

# picture sync: grey 64x88 thumbnails of the speaker frame in the reel vs source frames around the mapped time
def thumb(path, t, crop):
    r = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', f'{t:.4f}', '-i', str(path), '-frames:v', '1', '-vf', f'{crop},scale=64:88,format=gray', '-f', 'rawvideo', '-'], capture_output=True)
    return np.frombuffer(r.stdout, dtype=np.uint8).astype(np.float64)
SRC = root / 'public/source.mp4'
REEL_CROP = 'crop=700:860:190:445'                     # inside FRAME (185,440,710,870), clear of the rounded edge
SRC_CROP = 'crop=708:870:5:25'                          # the same region in source pixels (scale 710/718)
picture_sync = []
for sc_ in [x for x in tl['scenes'] if x['kind'] == 'speaker']:
    piece = tl['edl'][sc_['seg']]
    t = round((sc_['start'] + sc_['end']) / 2 * 60) / 60 + 0.5 / 60
    src_t = piece['src'][0] + t - piece['audio'][0]
    out_img = thumb(video, t, REEL_CROP)
    cands = {k: thumb(SRC, src_t + k / 30, SRC_CROP) for k in range(-3, 4)}
    err = {k: float(np.mean((out_img - c) ** 2)) for k, c in cands.items() if len(c) == len(out_img)}
    best = min(err, key=err.get)
    picture_sync.append({'scene': sc_['sceneId'], 'reelS': round(t, 3), 'srcS': round(src_t, 3), 'bestSourceFrameOffset': best, 'mse': {str(k): round(v, 1) for k, v in sorted(err.items())}})

# effects next to the voice: each effect file's sample peak at its volume, vs the voice's true peak
import re as _re
cues = _re.findall(r"\['(\w+)', [^\]]+?, ([\d.]+)\]", (root / 'src/sfx.tsx').read_text())
def peak_db(path):
    lg = run('ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-af', 'volumedetect', '-f', 'null', '-').stderr
    return float(re.findall(r'max_volume: (-?[\d.]+) dB', lg)[-1])
fx = sorted({(f_, float(v_)) for f_, v_ in cues})
sfx = [{'file': f_, 'volume': v_, 'peakDbfsAtVolume': round(peak_db(root / f'public/sfx/{f_}.wav') + 20 * np.log10(v_), 1)} for f_, v_ in fx]

res = {
    'file': video, 'bytes': int(probe['format']['size']),
    'video': {k: v.get(k) for k in ('codec_name', 'profile', 'pix_fmt', 'width', 'height', 'r_frame_rate', 'avg_frame_rate', 'nb_frames')},
    'audio': [{k: s.get(k) for k in ('codec_name', 'profile', 'sample_rate', 'channels', 'bit_rate')} for s in a],
    'duration': {'container': float(probe['format']['duration']), 'video': float(v['duration']), 'timeline': tl['totalSeconds'], 'framesExpected': tl['durationInFrames']},
    'cadence': {'frames': len(pts), 'irregularDeltas': irregular},
    'loudness': {'integratedLUFS': loud['I'], 'LRA': loud['LRA'], 'truePeakDBFS': loud['Peak']},
    'black': blacks, 'frozenOver3s': freezes, 'silencesOver0.8s': silences,
    'audioSync': {'method': 'edited voice (public/audio/voice.wav) cross-correlated with the final mix, 1.5 s windows, 2 per EDL piece', 'maxAbsOffsetMs': max(abs(x['offsetMs']) for x in audio_sync), 'detail': audio_sync},
    'pictureSync': {'method': 'speaker frame in the reel vs source frames -3…+3 (30 fps) around the mapped time; 0 = the expected frame', 'detail': picture_sync},
    'sfx': {'voiceTruePeakDbfs': loud['Peak'], 'effects': sfx},
    'note': 'measurements only; nothing here proves how the episode looks or sounds to a person',
}
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(res, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(json.dumps({k: res[k] for k in ('video', 'audio', 'duration', 'cadence', 'loudness')}, ensure_ascii=False))
print('black', blacks, '| frozen>3s', freezes, '| silences>0.8s', [(round(x, 2), round(y, 2)) for x, y in silences])
print('audio sync max |offset| ms', res['audioSync']['maxAbsOffsetMs'], '| picture sync best offsets', [(x['scene'], x['bestSourceFrameOffset']) for x in picture_sync])
print('sfx peaks at volume (dBFS)', [(x['file'], x['peakDbfsAtVolume']) for x in sfx])
