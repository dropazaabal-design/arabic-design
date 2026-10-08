"""Cut a finished narration (one file) into the reel's lines.

usage: python3 tools/split-voice.py CUTS.json OUT_DIR
CUTS.json: {"source": "file next to CUTS.json", "cuts": {"s1": [start, end], …}}
One gain for all lines (the kept speech is measured together and brought to
-16 LUFS, peaks limited to -1.5 dB), so the recording keeps its own dynamics;
15 ms fades at every cut; 48 kHz mono.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

cuts_file, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
spec = json.loads(cuts_file.read_text(encoding='utf-8'))
src = cuts_file.parent / spec['source']
out_dir.mkdir(parents=True, exist_ok=True)
sel = '+'.join(f'between(t,{a},{b})' for a, b in spec['cuts'].values())
probe = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(src), '-af', f"aselect='{sel}',ebur128=framelog=quiet", '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
lufs = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', probe)[-1])
gain = round(-16 - lufs, 2)
for i, (a, b) in spec['cuts'].items():
    d = b - a
    af = f'atrim=start={a}:end={b},asetpts=PTS-STARTPTS,volume={gain}dB,alimiter=limit=0.84:level=false,afade=t=in:d=0.015,afade=t=out:st={d - 0.015:.3f}:d=0.015'
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(src), '-af', af, '-ar', '48000', '-ac', '1', str(out_dir / f'{i}.wav')], check=True)
    print(f'{i}: {d:.2f}s', flush=True)
print(f'kept speech {lufs} LUFS -> gain {gain} dB')
