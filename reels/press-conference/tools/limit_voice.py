"""Gentle peak limiting of the cut voice lines, after reels/tools/voice_timeline.py (which normalises the take to
−16 LUFS with peaks ≤ −5 dBTP; this take's peaks are high for its loudness, so the lines come out near −17.7 LUFS).
A broadcast-style compressor (4:1 above −12 dBFS, +5 dB make-up) and a look-ahead limiter at −7 dBFS even out the
peaks (measured on all lines together: −16.8 LUFS, true peak −5.3 dBTP), so the mix can reach −16 LUFS with a true peak under
−4 dBTP after AAC. Timing, pitch and speed are untouched.  usage: python3 tools/limit_voice.py   (npm run voice)"""
import json
import subprocess
from pathlib import Path

reel = Path(__file__).resolve().parent.parent
for s in json.loads((reel / 'timeline.json').read_text())['segments']:
    f = reel / 'assets' / s['file']
    tmp = f.with_suffix('.lim.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(f), '-af', 'acompressor=threshold=0.25:ratio=4:attack=2:release=50:makeup=1.8,alimiter=limit=0.45:attack=3:release=30:level=disabled', '-c:a', 'pcm_s16le', str(tmp)], check=True)
    tmp.replace(f)
print('limited', len(json.loads((reel / 'timeline.json').read_text())['segments']), 'lines')
