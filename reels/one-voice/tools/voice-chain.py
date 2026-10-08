"""Nadeem's narration, finished for this reel.

1. each raw line → the identity's own post (tools/normalize-voice.sh: tempo 1.1,
   pauses inside a line capped at 0.4 s, -16 LUFS);
2. the lines joined into one voice.wav (48 kHz mono) with 1 s of silence between;
3. the account owner's chain, verbatim, on the whole narration at once (so its
   loudnorm sees continuous speech, not 3-second islands) → basira_youth_edu.wav;
   the only addition is `-ar 48000` on the output, because loudnorm otherwise
   writes 192 kHz;
4. cut back into lines at the same places (the chain's asetrate/atempo shorten
   time by 1 / (1.035 × 0.985); filters do not shift it), 30 ms outside the
   speech, with a 15 ms fade at each cut so no edge clicks.

usage: python3 tools/voice-chain.py RAW_DIR OUT_DIR FULL_DIR s1 s2 …
(OUT_DIR gets one file per line; FULL_DIR gets voice.wav and basira_youth_edu.wav)
"""
import subprocess
import sys
from pathlib import Path

CHAIN = ("highpass=f=75,lowpass=f=14500,asetrate=48000*1.035,aresample=48000,atempo=0.985,"
         "equalizer=f=140:t=q:w=1:g=-1.5,equalizer=f=950:t=q:w=1:g=0.8,equalizer=f=3200:t=q:w=1.1:g=1.8,"
         "equalizer=f=6500:t=q:w=1:g=0.7,acompressor=threshold=-20dB:ratio=2.2:attack=12:release=110:makeup=1.5,"
         "loudnorm=I=-16:TP=-1.5:LRA=8")
RATIO = 1 / (1.035 * 0.985)
GAP = 1.0
HERE = Path(__file__).resolve().parent

raw_dir, out_dir, full_dir, *ids = sys.argv[1:]
out = Path(out_dir)
full = Path(full_dir)
full.mkdir(parents=True, exist_ok=True)
work = full / '_chain'
work.mkdir(parents=True, exist_ok=True)


def run(*a):
    subprocess.run(a, check=True, capture_output=True)


def dur(p):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(p)],
                                check=True, capture_output=True, text=True).stdout)


run('ffmpeg', '-y', '-f', 'lavfi', '-i', f'anullsrc=r=48000:cl=mono', '-t', str(GAP), str(work / 'gap.wav'))
parts, spans, t = [], [], GAP
parts.append(work / 'gap.wav')
for i in ids:
    post = work / f'{i}.wav'
    subprocess.run(['bash', str(HERE / 'normalize-voice.sh'), str(Path(raw_dir) / f'{i}.wav'), str(post), '1.1', '0.4'], check=True, capture_output=True)
    d = dur(post)
    spans.append((i, t, t + d))
    parts += [post, work / 'gap.wav']
    t += d + GAP
(work / 'list.txt').write_text(''.join(f"file '{p.resolve()}'\n" for p in parts))
run('ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', str(work / 'list.txt'), '-ar', '48000', '-ac', '1', str(full / 'voice.wav'))
run('ffmpeg', '-y', '-i', str(full / 'voice.wav'), '-af', CHAIN, '-ar', '48000', str(full / 'basira_youth_edu.wav'))
for i, a, b in spans:
    a2, b2 = max(0, a * RATIO - 0.03), b * RATIO + 0.03
    fade = f'afade=t=in:d=0.015,afade=t=out:st={b2 - a2 - 0.015:.4f}:d=0.015'
    run('ffmpeg', '-y', '-i', str(full / 'basira_youth_edu.wav'), '-af', f'atrim=start={a2:.4f}:end={b2:.4f},asetpts=PTS-STARTPTS,{fade}', '-ar', '48000', '-ac', '1', str(out / f'{i}.wav'))
    print(f'{i}: {b2 - a2:.2f}s', flush=True)
