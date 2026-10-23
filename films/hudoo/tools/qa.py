"""Checks on the exported film, written to qa/checks.json (and frames to qa/frames/):
format (ffprobe), a full decode, black frames, silences, frozen stretches (> 3 s), loudness and true peak (EBU R128),
the end of the picture against the end of the speech, and stills at every chapter boundary for the Arabic check.
usage: python3 tools/qa.py export/hudoo.mp4
Another project: PROJECT_ROOT=<dir> QA_NAME=<name> → <dir>/qa/<name>.json and <dir>/qa/frames-<name>/.
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

root = Path(os.environ.get('PROJECT_ROOT', Path(__file__).resolve().parent.parent)).resolve()
src = Path(sys.argv[1]).resolve()
name = os.environ.get('QA_NAME', 'checks')
qa = root / 'qa'
frames = qa / ('frames' if name == 'checks' else f'frames-{name}')
frames.mkdir(parents=True, exist_ok=True)
LINES = json.loads((root / 'timing/lines.json').read_text(encoding='utf-8'))


def run(*a):
    return subprocess.run(a, capture_output=True, text=True)


def ff(*filters, audio=False):
    """Run one ffmpeg analysis pass and return its log."""
    a = ['ffmpeg', '-hide_banner', '-nostats', '-i', str(src)]
    a += (['-af', filters[0], '-vn'] if audio else ['-vf', filters[0], '-an'])
    return run(*a, '-f', 'null', '-').stderr


probe = json.loads(run('ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', str(src)).stdout)
v = next(s for s in probe['streams'] if s['codec_type'] == 'video')
a = next((s for s in probe['streams'] if s['codec_type'] == 'audio'), None)
fmt = {
    'file': str(src), 'bytes': int(probe['format']['size']), 'duration': float(probe['format']['duration']),
    'video': {'codec': v['codec_name'], 'profile': v.get('profile'), 'width': v['width'], 'height': v['height'], 'fps': v['avg_frame_rate'],
              'pix_fmt': v['pix_fmt'], 'color_primaries': v.get('color_primaries'), 'color_transfer': v.get('color_transfer'),
              'frames': int(v.get('nb_frames', 0)), 'bit_rate': int(v.get('bit_rate', 0))},
    'audio': a and {'codec': a['codec_name'], 'sample_rate': int(a['sample_rate']), 'channels': a['channels'], 'bit_rate': int(a.get('bit_rate', 0))},
}
decode = run('ffmpeg', '-v', 'error', '-i', str(src), '-f', 'null', '-').stderr.strip()
black = re.findall(r'black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)', ff('blackdetect=d=0.1:pic_th=0.98'))
freeze_log = ff('freezedetect=n=0.001:d=3')
freezes = list(zip(re.findall(r'freeze_start: ([\d.]+)', freeze_log), re.findall(r'freeze_duration: ([\d.]+)', freeze_log)))
sil_log = ff('silencedetect=n=-45dB:d=1.5', audio=True)
silences = list(zip(re.findall(r'silence_start: ([\d.]+)', sil_log), re.findall(r'silence_duration: ([\d.]+)', sil_log)))
r128 = ff('ebur128=peak=true', audio=True)
summary = r128[r128.rfind('Summary:'):]
loud = {
    'integrated_lufs': float(re.search(r'I:\s+(-?[\d.]+) LUFS', summary).group(1)),
    'lra_lu': float(re.search(r'LRA:\s+(-?[\d.]+) LU', summary).group(1)),
    'true_peak_dbtp': float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', summary).group(1)),
}
speech_end = max(l['end'] for l in LINES['lines'])
ends = {'speech_end': speech_end, 'picture_end': fmt['duration'], 'tail_after_speech': round(fmt['duration'] - speech_end, 3)}

# a still in the middle of the first line of every chapter, for the Arabic and boundary check
stills = []
for ch in sorted({l['chapter'] for l in LINES['lines']}):
    first = next(l for l in LINES['lines'] if l['chapter'] == ch)
    for tag, t in (('start', first['start'] + 0.6), ('before', first['start'] - 0.5)):
        if t < 0:
            continue
        out = frames / f'ch{ch:02d}-{tag}.png'
        run('ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', str(src), '-frames:v', '1', str(out))
        stills.append(str(out.relative_to(root)))

res = {
    'format': fmt, 'decode_errors': decode or None,
    'black': [{'start': float(s), 'end': float(e), 'dur': float(d)} for s, e, d in black],
    'freezes_over_3s': [{'start': float(s), 'dur': float(d)} for s, d in freezes],
    'silences_over_1_5s': [{'start': float(s), 'dur': float(d)} for s, d in silences],
    'loudness': loud, 'ends': ends, 'stills': stills,
}
(qa / f'{name}.json').write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding='utf-8')
print(json.dumps({k: res[k] for k in ('format', 'decode_errors', 'loudness', 'ends')}, indent=1))
print('black', len(res['black']), 'freezes>3s', len(res['freezes_over_3s']), 'silences>1.5s', len(res['silences_over_1_5s']))
