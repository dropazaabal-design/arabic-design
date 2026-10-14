"""Narration for «فكرة طايرة»: one ElevenLabs take, two lines, placed on the 60-fps timeline.

usage: python3 tools/build_audio.py
  in : audio/take-B-*.mp3 (the chosen take) + audio/take-B.words.json (independent ASR, ElevenLabs Scribe)
  out: assets/audio/voice/s01.wav, s02.wav · timeline.json · src/video/words.json · audio/alignment.json ·
       output/captions.ar.srt
The take is loudness-normalised once (EBU R128 two-pass loudnorm, I −16 LUFS, true peak −5 dBTP so the effects
still fit under −4) and cut at the pause between the lines (a 12 ms fade at each cut). Never sped up, slowed down
or pitched: the picture is timed to the voice (wordAt in src/video/time.ts), not the other way round.
"""
import json
import re
import subprocess
import wave
from pathlib import Path

import numpy as np

root = Path(__file__).resolve().parent.parent
TAKE = next((root / 'audio').glob('take-B-*.mp3'))
SR, FPS, TOTAL = 48000, 60, 13.6
LINES = {
    's01': 'ورقة فاضية… والفكرة ما تجي.',
    's02': 'الفكرة ما تجي وأنت تحدّق… تجي وأنت تتحرّك.',
}
# [take seconds from, to) per line, cut inside the measured pause between them (silencedetect −38 dB: 2.63–3.03 s)
CUT = {'s01': (0.0, 2.85), 's02': (2.85, None)}
# where each line's first word lands in the reel (seconds): the story beats are built around these
SPEECH_AT = {'s01': 0.5, 's02': 8.4}
CAPTIONS = [('s01', 0, 4, 'ورقة فاضية… والفكرة ما تجي'), ('s02', 0, 4, 'الفكرة ما تجي وأنت تحدّق…'), ('s02', 5, 7, 'تجي وأنت تتحرّك')]


def ff(*a, **k):
    return subprocess.run(['ffmpeg', '-hide_banner', '-nostats', *a], capture_output=True, text=True, **k)


# 1. two-pass loudnorm on the whole take
probe = ff('-i', str(TAKE), '-af', 'loudnorm=I=-16:TP=-5:LRA=7:print_format=json', '-f', 'null', '-').stderr
m = json.loads(probe[probe.rindex('{'):probe.rindex('}') + 1])
af = (f"loudnorm=I=-16:TP=-5:LRA=7:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
      f":measured_thresh={m['input_thresh']}:offset={m['target_offset']},aresample={SR}")
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(TAKE), '-af', af, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout
x = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768

# 2. cut, fade, write
words = json.loads((root / 'audio/take-B.words.json').read_text(encoding='utf-8'))
(root / 'assets/audio/voice').mkdir(parents=True, exist_ok=True)
segs, out_words = [], []
for sid, (a, b) in CUT.items():
    y = x[int(a * SR): None if b is None else int(b * SR)].copy()
    n = int(0.012 * SR)
    y[:n] *= np.linspace(0, 1, n)
    y[-n:] *= np.linspace(1, 0, n)
    with wave.open(str(root / f'assets/audio/voice/{sid}.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
    mine = [wd for wd in words if wd['start'] >= a and (b is None or wd['end'] <= b)]
    file_start = SPEECH_AT[sid] - (mine[0]['start'] - a)
    for wd in mine:
        out_words.append({'seg': sid, 'w': wd['w'], 'start': round(wd['start'] - a + file_start, 3), 'end': round(wd['end'] - a + file_start, 3)})
    segs.append({'id': sid, 'take': 'B', 'role': 'N', 'start': SPEECH_AT[sid], 'duration': round(mine[-1]['end'] - mine[0]['start'], 3),
                 'fileStart': round(file_start, 3), 'file': f'audio/voice/{sid}.wav', 'measured': True})

frames = round(TOTAL * FPS)
tl = {'fps': FPS, 'width': 1080, 'height': 1920, 'totalSeconds': TOTAL, 'durationInFrames': frames, 'measured': True,
      'sources': {'B': TAKE.name}, 'loudnorm': {'I': -16, 'TP': -5, 'measuredInputI': float(m['input_i']), 'measuredInputTP': float(m['input_tp'])},
      'segments': segs}
(root / 'timeline.json').write_text(json.dumps(tl, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(root / 'src/video/words.json').write_text(json.dumps(out_words, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')

# 3. script words vs heard words (diacritics and punctuation ignored)
norm = lambda s: re.sub(r'[ً-ْـ«»،.:؟…!؛,]', '', s)
heard = [norm(w['w']) for w in words]
al, k = [], 0
for sid, line in LINES.items():
    for sw in line.split():
        s = norm(sw)
        hit = s in heard[k:k + 3]
        if hit:
            k += heard[k:k + 3].index(s) + 1
        al.append({'seg': sid, 'script': sw, 'heard': s if hit else None, 'match': hit})
(root / 'audio/alignment.json').write_text(json.dumps(al, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')

# 4. captions on the measured words
ts = lambda t: f'{int(t // 3600):02}:{int(t % 3600 // 60):02}:{int(t % 60):02},{int(round(t % 1 * 1000)):03}'
cues = []
for sid, i0, i1, text in CAPTIONS:
    w = [o for o in out_words if o['seg'] == sid]
    cues.append((w[i0]['start'], w[i1]['end'] + 0.25, text))
srt = '\n'.join(f'{i + 1}\n{ts(a)} --> {ts(b)}\n{t}\n' for i, (a, b, t) in enumerate(cues))
(root / 'output').mkdir(exist_ok=True)
(root / 'output/captions.ar.srt').write_text(srt, encoding='utf-8')
print(json.dumps({'frames': frames, 'segments': segs, 'unheard': [a['script'] for a in al if not a['match']]}, ensure_ascii=False))
