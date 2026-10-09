"""The cut list, the edited voice track, the reviewed captions and the timeline — from the source only.

usage: python3 tools/edl.py
- EDL: a cold open (the strongest complete exchange: the question and its answer), then the talk in its
  original order with that exchange taken out, so it is heard once. Every cut sits inside a measured pause
  (20 ms envelope + spectrogram, audio/cuts.md): no breath or word onset is touched, nothing is re-timed,
  no speed or pitch change.
- Voice: the source audio; neighbouring pieces are joined with a 100–120 ms equal-power crossfade of room tone,
  so the background does not drop out at a cut. Then a gentle chain (audio/chain.txt) and one gain to
  -14 LUFS through a peak limiter (lookahead delay compensated); the original file is never modified.
- Captions: transcript/reviewed.json (Whisper timing, wording checked against the clip's own burned-in
  subtitles), mapped onto the edited timeline. Cues shown as the scene's title are flagged `title`.
"""
import json, re, subprocess
from pathlib import Path

root = Path(__file__).resolve().parent.parent
FPS = 60
# source seconds; cuts in pauses: 21.25→22.40 (before «سُئل»), 27.55→28.62 (before «هو»), 15.98→18.48 (before «وهذا»)
EDL = [(22.25, 27.95), (0.63, 16.50), (18.10, 21.75), (28.30, 83.15)]
# equal-power crossfade at each join, room tone only: it ends before the next word (first: 0.73 < onset 0.76)
XF = [0.10, 0.12, 0.12]
TAIL = 2.5                                                         # end card after the last word (graphics only)
FADE_OUT = 0.15                                                    # the last room tone fades out, it does not stop
CHAIN = (root / 'audio/chain.txt').read_text().strip()

# segment k plays from t_k; the next starts XF earlier than k ends. The picture cuts in the middle of the crossfade.
out, t = [], 0.0
for k, (a, b) in enumerate(EDL):
    out.append({'src': [a, b], 'audio': [round(t, 3), round(t + b - a, 3)]})
    t += b - a - (XF[k] if k < len(EDL) - 1 else 0)
speech_end = round(t, 3)
for k, e in enumerate(out):
    e['out'] = [0.0 if k == 0 else round(e['audio'][0] + XF[k - 1] / 2, 3), round(e['audio'][1] - XF[k] / 2, 3) if k < len(out) - 1 else e['audio'][1]]
total = round(speech_end + TAIL, 3)

def src2out(s, seg):
    e = out[seg]
    return e['audio'][0] + s - e['src'][0]

# voice: edit + crossfades + chain + one gain + limiter
n = len(EDL)
# each piece is its own input (a single shared input deadlocks while acrossfade waits for the first piece to end)
g = ''.join(f"[{i}:a]atrim={a}:{b},asetpts=PTS-STARTPTS[p{i}];" for i, (a, b) in enumerate(EDL))
prev = 'p0'
for i in range(1, n):
    g += f"[{prev}][p{i}]acrossfade=d={XF[i - 1]}:c1=qsin:c2=qsin[x{i}];"
    prev = f'x{i}'
g += f"[{prev}]afade=t=in:d=0.015,afade=t=out:st={speech_end - FADE_OUT:.3f}:d={FADE_OUT},{CHAIN},apad=pad_dur={TAIL}[v]"
tmp = root / 'audio/voice-edit.wav'
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', *[x for _ in EDL for x in ('-i', str(root / 'audio/original-48k.wav'))], '-filter_complex', g, '-map', '[v]', '-ar', '48000', '-ac', '1', str(tmp)], check=True)
log = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(tmp), '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
gain = round(-14 - float(re.findall(r'I:\s+(-?[\d.]+) LUFS', log)[-1]), 2)
(root / 'public/audio').mkdir(parents=True, exist_ok=True)
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(tmp), '-af', f'volume={gain}dB,alimiter=limit=0.85:level=false:latency=1', '-ar', '48000', '-ac', '1', str(root / 'public/audio/voice.wav')], check=True)

# captions on the edited timeline
cues = json.loads((root / 'transcript/reviewed.json').read_text(encoding='utf-8'))
caps = []
for seg_i, (a, b) in enumerate(EDL):
    for c in cues:
        if c['src'][0] >= a - 0.05 and c['src'][1] <= b + 0.3:
            s, e = max(src2out(max(c['src'][0], a), seg_i), out[seg_i]['out'][0]), min(src2out(min(c['src'][1], b), seg_i), out[seg_i]['out'][1])
            caps.append({'start': round(s, 3), 'end': round(e, 3), 'text': c['text'], 'title': c.get('title', False)})
caps.sort(key=lambda c: c['start'])
for x, y in zip(caps, caps[1:]):
    x['end'] = min(x['end'], y['start'])
(root / 'src/captions.json').write_text(json.dumps(caps, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
ts = lambda x: f'{int(x // 3600):02d}:{int(x // 60 % 60):02d}:{int(x % 60):02d},{int(round(x * 1000)) % 1000:03d}'
(root / 'render').mkdir(exist_ok=True)
(root / 'render/captions.ar.srt').write_text(''.join(f"{i}\n{ts(c['start'])} --> {ts(c['end'])}\n{c['text']}\n\n" for i, c in enumerate(caps, 1)), encoding='utf-8')

scenes = json.loads((root / 'transcript/scenes.json').read_text(encoding='utf-8'))
tl = {'fps': FPS, 'width': 1080, 'height': 1920, 'totalSeconds': total, 'durationInFrames': round(total * FPS), 'edl': out, 'crossfade': XF, 'speechEnd': speech_end, 'voiceGainDb': gain,
      'sourceFps': 30, 'note': 'speaker frames are the source frames, each shown twice at 60 fps; no interpolation',
      'scenes': [{'sceneId': s['id'], 'kind': s['kind'], 'seg': s['seg'], 'srcStart': s['src'][0], 'start': max(round(src2out(s['src'][0], s['seg']), 3), out[s['seg']]['out'][0]), 'end': min(round(src2out(s['src'][1], s['seg']), 3), out[s['seg']]['out'][1]) if s['src'][1] is not None else total} for s in scenes]}
(root / 'timeline.json').write_text(json.dumps(tl, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(json.dumps({'total': total, 'gainDb': gain, 'captions': len(caps), 'scenes': [[s['sceneId'], s['kind'], s['start'], s['end']] for s in tl['scenes']]}, ensure_ascii=False))
