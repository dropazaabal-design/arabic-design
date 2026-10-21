"""Chosen takes → each program's voice track, word timeline, captions, SRT and final mix.

usage: python3 tools/build_audio.py
reads  script-long.md, script-short.md, review/takes.json (picks), audio/takes/*.mp3,
       audio/align/*.words.json (ElevenLabs alignment of each chosen take), sfx.json
writes public/audio/{long,short}-mix.wav, src/data/{long,short}.json, export/*.ar.srt, timeline.json

Takes are never sped up, slowed or pitched. Each unit is cut inside its own leading and
trailing silence and the units are joined with plain silence. The alignment is ElevenLabs'
own word timing for the text it was given, so it times the words; it does not prove they
were spoken right (that needs a listen).
Loudness (CR1 §9): one gain for the whole mix to −16 LUFS integrated, then a true-peak
limiter, measured again; the exported MP4 is measured separately by tools/verify.py.
"""
import hashlib
import json
import re
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parent.parent
FPS = 60
TARGET_LUFS, TP_LIMIT = -16.0, -4.5  # limiter sits below the −4 dBTP ceiling: AAC adds overshoot
PROGRAMS = {
    'long': {'script': 'script-long.md', 'units': {'L1': ['L1'], 'L2': ['L2'], **{f'L{k}': [f'L{k}'] for k in range(3, 12)}},
             'lead': 1.2, 'hold': 4.0,
             # silence between units, seconds: room for the scene change each join carries
             'gaps': {'L1': 0.5, 'L2': 1.1, 'L3': 1.2, 'L4': 1.0, 'L5': 1.1, 'L6': 1.2, 'L7': 1.0, 'L8': 1.2, 'L9': 1.0, 'L10': 1.1}},
    'short': {'script': 'script-short.md', 'units': {'S1': ['R1', 'R2', 'R3'], 'S2': ['R4', 'R5', 'R6']},
              'lead': 0.35, 'hold': 2.6, 'gaps': {'S1': 0.7}},
}
PARTIAL = {'L1'}
HARAKAT = re.compile('[\u064b-\u0652\u0670\u0640]')
norm = lambda w: re.sub(r'[^\w]', '', HARAKAT.sub('', w))


def run(*a):
    return subprocess.run(a, capture_output=True, text=True)


def segments(name):
    t = (root / name).read_text(encoding='utf-8')
    out = {}
    for s in re.split(r'^## ', t, flags=re.M)[1:]:
        lines = s.strip().split('\n')
        out[lines[0].split()[0]] = lines[1:]
    return out


def loud(path):
    o = run('ffmpeg', '-hide_banner', '-i', str(path), '-af', 'ebur128=peak=true:framelog=quiet', '-f', 'null', '-').stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', o)[-1]), float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', o)[-1])


def srt_time(x):
    ms = round(x * 1000)
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


picks = json.loads((root / 'review/takes.json').read_text(encoding='utf-8'))['picked']
VERSION = json.loads((root / 'episode-brief.json').read_text(encoding='utf-8'))['version']
sfx_cues = json.loads((root / 'sfx.json').read_text(encoding='utf-8')) if (root / 'sfx.json').exists() else {}
(root / 'public/audio').mkdir(parents=True, exist_ok=True)
(root / 'src/data').mkdir(parents=True, exist_ok=True)
(root / 'export').mkdir(exist_ok=True)
report = {}

for prog, cfg in PROGRAMS.items():
    segs = segments(cfg['script'])
    t = cfg['lead']
    pieces, words, segments_out, captions, units_out = [], [], [], [], []
    for unit, ids in cfg['units'].items():
        take = root / f'audio/takes/{unit}-{picks[unit]}.mp3'
        heard = json.loads((root / f'audio/align/{unit}.words.json').read_text(encoding='utf-8'))['words']
        heard = [h for h in heard if h['type'] == 'word']
        script = [(sid, ci, i, w) for sid in ids for ci, line in enumerate(segs[sid]) for i, w in
                  enumerate(line.split(), start=sum(len(l.split()) for l in segs[sid][:ci]))]
        # a take may carry more than its unit (L1's takes also hold segment L2, whose ending was
        # cut and was regenerated alone): keep the unit's words and cut in the pause after them
        nxt = heard[len(script)] if unit in PARTIAL and len(heard) > len(script) else None
        if nxt:
            heard = heard[:len(script)]
        if len(script) != len(heard) or any(norm(w) != norm(h['text']) for (_, _, _, w), h in zip(script, heard)):
            raise SystemExit(f'{unit}: alignment words do not match the locked script')
        dur = float(run('ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(take)).stdout)
        a = max(0.0, heard[0]['start'] - 0.06)
        # The alignment puts a unit's first word at 0.00 and is coarse after pauses; the voice
        # actually starts a few hundredths later. Every word that follows a pause is moved to the
        # acoustic onset measured in the take, so motion keyed to it lands on the sound.
        # −40 dB rather than −45 so a quiet breath before a word is not taken for the word
        sil = run('ffmpeg', '-hide_banner', '-i', str(take), '-af', 'silencedetect=n=-40dB:d=0.1', '-f', 'null', '-').stderr
        onsets = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', sil)]
        head = run('ffmpeg', '-hide_banner', '-i', str(take), '-t', '1', '-af', 'silencedetect=n=-40dB:d=0.01', '-f', 'null', '-').stderr
        first = re.search(r'silence_start: -?0(?:\.0+)?\s.*?silence_end: ([\d.]+)', head, re.S)
        onsets = [float(first.group(1)) if first else 0.0] + onsets  # the take's own leading silence is short
        heard = [dict(h) for h in heard]
        for k, h in enumerate(heard):
            if k == 0 or h['start'] - heard[k - 1]['end'] >= 0.06:
                # inside this word, never the one before; a unit's first word takes the end of the take's own
                # leading silence even when the alignment gives it a very short span (L4 «هنا» ends at 0.08)
                near = [o for o in onsets if abs(o - h['start']) <= 0.3 and (k == 0 or (o < h['end'] - 0.05 and o > heard[k - 1]['start'] + 0.1))]
                if near:
                    h['start'] = min(near, key=lambda o: abs(o - h['start']))
                    h['end'] = max(h['end'], h['start'] + 0.05)
                    if k and heard[k - 1]['end'] > h['start']:
                        heard[k - 1]['end'] = h['start']
        b = min(dur, heard[-1]['end'] + 0.3)
        if nxt:  # the silence between the unit's last word and the next one, cut 0.25 s into it
            gap = [(float(s), float(e)) for s, e in re.findall(r'silence_start: ([\d.]+).*?silence_end: ([\d.]+)', sil, re.S)
                   if heard[-1]['start'] < float(s) < nxt['start'] + 0.2]
            if not gap:
                raise SystemExit(f'{unit}: no pause before the words it leaves out')
            b = gap[0][0] + min(0.25, (gap[0][1] - gap[0][0]) / 2)
        pieces.append((take, a, b, t))
        off = t - a
        for (sid, ci, i, w), h in zip(script, heard):
            words.append({'seg': sid, 'i': i, 'chunk': ci, 'w': w, 'start': round(h['start'] + off, 3), 'end': round(h['end'] + off, 3)})
        units_out.append({'unit': unit, 'take': picks[unit], 'file': take.name, 'sha256': hashlib.sha256(take.read_bytes()).hexdigest(),
                          'cut': [round(a, 3), round(b, 3)], 'at': round(t, 3)})
        t += b - a
        t += cfg['gaps'].get(unit, 0)
    total = round(words[-1]['end'] + cfg['hold'], 3)
    for sid in dict.fromkeys(w['seg'] for w in words):
        ws = [w for w in words if w['seg'] == sid]
        segments_out.append({'id': sid, 'start': ws[0]['start'], 'end': ws[-1]['end']})
        for ci in dict.fromkeys(w['chunk'] for w in ws):
            cw = [w for w in ws if w['chunk'] == ci]
            captions.append({'seg': sid, 'text': segs[sid][ci], 'start': cw[0]['start'], 'end': cw[-1]['end']})
    for x, y in zip(captions, captions[1:]):
        x['end'] = round(min(y['start'] - 0.05, x['end'] + 0.7), 3)
    captions[-1]['end'] = round(min(total, captions[-1]['end'] + 1.2), 3)
    for c in captions:
        c['cps'] = round(len(c['text']) / max(0.1, c['end'] - c['start']), 1)

    # voice: pieces placed on a silent bed at their offsets
    ins, filt = [], []
    for k, (take, a, b, at) in enumerate(pieces):
        ins += ['-i', str(take)]
        filt.append(f'[{k}:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,aresample=48000,adelay={round(at * 1000)}:all=1[v{k}]')
    # sound effects, anchored to words (sfx.json), mixed under the voice
    cues = []
    for cue in sfx_cues.get(prog, []):
        w = next(w for w in words if w['seg'] == cue['seg'] and w['i'] == cue['i'])
        cues.append({**cue, 'time': round(w['start'] + cue.get('offset', 0), 3), 'word': w['w']})
    n = len(pieces)
    for k, cue in enumerate(cues):
        ins += ['-i', str(root / f"public/sfx/{cue['sfx']}.wav")]
        filt.append(f"[{n + k}:a]aresample=48000,volume={cue.get('gain', -16)}dB,adelay={round(cue['time'] * 1000)}:all=1[s{k}]")
    labels = ''.join(f'[v{k}]' for k in range(n)) + ''.join(f'[s{k}]' for k in range(len(cues)))
    filt.append(f'{labels}amix=inputs={n + len(cues)}:normalize=0:duration=longest,apad=whole_dur={total},atrim=0:{total},aformat=sample_rates=48000:channel_layouts=stereo[m]')
    raw = root / f'audio/{prog}-raw.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', ';'.join(filt), '-map', '[m]', str(raw)], check=True)
    out = root / f'public/audio/{prog}-mix.wav'
    lim = 10 ** (TP_LIMIT / 20)
    gain = round(TARGET_LUFS - loud(raw)[0], 2)
    for _ in range(3):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-af',
                        f'volume={gain}dB,aresample=192000,alimiter=limit={lim:.4f}:level=false:attack=1:release=60,aresample=48000',
                        '-ar', '48000', '-ac', '2', str(out)], check=True)
        lufs, tp = loud(out)
        if abs(lufs - TARGET_LUFS) < 0.2:
            break
        gain = round(gain + TARGET_LUFS - lufs, 2)
    data = {'fps': FPS, 'totalSeconds': total, 'durationInFrames': round(total * FPS), 'audio': f'audio/{prog}-mix.wav',
            'segments': segments_out, 'words': [{k: v for k, v in w.items() if k != 'chunk'} for w in words], 'captions': captions}
    (root / f'src/data/{prog}.json').write_text(json.dumps(data, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    srt_name = {'long': '16x9', 'short': 'reel'}[prog]
    (root / f'export/cr1-ep02_rajul-sayyara_{srt_name}_v{VERSION}.ar.srt').write_text(''.join(f"{k + 1}\n{srt_time(c['start'])} --> {srt_time(c['end'])}\n{c['text']}\n\n" for k, c in enumerate(captions)), encoding='utf-8')
    report[prog] = {'totalSeconds': total, 'frames': round(total * FPS), 'mixLUFS': lufs, 'mixTruePeak': tp, 'gainDb': gain,
                    'maxCps': max(c['cps'] for c in captions), 'units': units_out, 'sfx': cues}
    print(prog, json.dumps({k: report[prog][k] for k in ('totalSeconds', 'frames', 'mixLUFS', 'mixTruePeak', 'maxCps')}))

(root / 'timeline.json').write_text(json.dumps(report, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
