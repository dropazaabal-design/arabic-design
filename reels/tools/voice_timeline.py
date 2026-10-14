"""One narration take → a reel's voice timeline (generalises reels/idea-flight/tools/build_audio.py).

usage: python3 reels/tools/voice_timeline.py reels/<slug>
  reads  <reel>/voice.json:
    { "take": "audio/take-….mp3", "words": "audio/take.words.json",   ASR words [{w, start, end}] of that take
      "fps": 60, "lead": 0.35, "tail": 2.4,                          seconds before the first word / after the last
      "equiv": {"مية": "150"},                                        script word → how the ASR wrote it (numbers…)
      "lines": [ {"id": "s01", "text": "…", "beat": 0.0, "asrWords": 4}, … ] }
        beat      extra seconds of picture before this line (an acting beat); the voice is never stretched
        caption   the subtitle text when it differs from what is said (e.g. «150» for «مية وخمسين»)
        asrWords  only when the ASR split the line into a different number of words than the script
  writes assets/audio/voice/<id>.wav · timeline.json · src/video/words.json · audio/alignment.json ·
         output/captions.ar.srt
The take is loudness-normalised once (two-pass EBU R128 loudnorm, I −16 LUFS, TP −5 dBTP), each line is cut at the
quietest 10 ms inside the measured pause before the next line, and every line keeps the take's own pauses: the only
change of timing is the beats added between lines.
"""
import json
import re
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

SR = 48000
MAX_CUE = 40
norm = lambda s: re.sub(r'[ً-ْـ«»"،.:؟…!؛,?]', '', s).replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ى', 'ي').replace('ة', 'ه').replace('ئ', 'ء').replace('يء', 'يء')


def main(reel: Path):
    cfg = json.loads((reel / 'voice.json').read_text(encoding='utf-8'))
    take = reel / cfg['take']
    words = json.loads((reel / cfg['words']).read_text(encoding='utf-8'))
    fps, lines, equiv = cfg['fps'], cfg['lines'], cfg.get('equiv', {})

    # 1. loudness: two-pass loudnorm on the whole take
    ff = lambda *a: subprocess.run(['ffmpeg', '-hide_banner', '-nostats', *a], capture_output=True, text=True).stderr
    probe = ff('-i', str(take), '-af', 'loudnorm=I=-16:TP=-5:LRA=9:print_format=json', '-f', 'null', '-')
    m = json.loads(probe[probe.rindex('{'):probe.rindex('}') + 1])
    af = (f"loudnorm=I=-16:TP=-5:LRA=9:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample={SR}")
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(take), '-af', af, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout
    x = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768

    # 2. script lines → ASR words (in order), checked word by word
    k, groups, align = 0, [], []
    for ln in lines:
        toks = ln['text'].split()
        n = ln.get('asrWords', len(toks))
        g = words[k:k + n]
        if len(g) < n:
            sys.exit(f"{ln['id']}: the ASR ran out of words")
        heard = [norm(w['w']) for w in g]
        for t in toks:
            want = norm(equiv.get(t, t))
            align.append({'seg': ln['id'], 'script': t, 'heard': want if want in heard else None, 'match': want in heard})
        if norm(equiv.get(toks[0], toks[0])) != heard[0] or norm(equiv.get(toks[-1], toks[-1])) != heard[-1]:
            sys.exit(f"{ln['id']}: line edges do not match the ASR ({toks[0]}…{toks[-1]} vs {g[0]['w']}…{g[-1]['w']}); set asrWords")
        groups.append(g)
        k += n
    if k != len(words):
        sys.exit(f'{len(words) - k} ASR words left over after the last line')

    # 3. cut each line at the quietest 10 ms inside the pause before the next one
    env = np.sqrt(np.convolve(x ** 2, np.ones(480) / 480, mode='same'))
    cuts = [max(0.0, groups[0][0]['start'] - 0.12)]
    for a, b in zip(groups, groups[1:]):
        lo, hi = int(a[-1]['end'] * SR), int(b[0]['start'] * SR)
        cuts.append((lo + int(np.argmin(env[lo:hi]))) / SR if hi > lo + 480 else (a[-1]['end'] + b[0]['start']) / 2)
    cuts.append(min(len(x) / SR, groups[-1][-1]['end'] + 0.35))

    # 4. place: take time → reel time, shifted by the beats added so far
    out = reel / 'assets/audio/voice'
    out.mkdir(parents=True, exist_ok=True)
    shift, segs, rwords = cfg.get('lead', 0.35) - groups[0][0]['start'], [], []
    for i, (ln, g) in enumerate(zip(lines, groups)):
        shift += ln.get('beat', 0.0)
        a, b = cuts[i], cuts[i + 1]
        y = x[int(a * SR):int(b * SR)].copy()
        f = int(0.008 * SR)
        y[:f] *= np.linspace(0, 1, f); y[-f:] *= np.linspace(1, 0, f)
        with wave.open(str(out / f"{ln['id']}.wav"), 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
        segs.append({'id': ln['id'], 'text': ln['text'], 'start': round(g[0]['start'] + shift, 3), 'end': round(g[-1]['end'] + shift, 3),
                     'duration': round(g[-1]['end'] - g[0]['start'], 3), 'fileStart': round(a + shift, 3), 'file': f"audio/voice/{ln['id']}.wav", 'measured': True})
        rwords += [{'seg': ln['id'], 'w': w['w'], 'start': round(w['start'] + shift, 3), 'end': round(w['end'] + shift, 3)} for w in g]
    total = round(segs[-1]['end'] + cfg.get('tail', 2.4), 3)
    tl = {'fps': fps, 'width': 1080, 'height': 1920, 'totalSeconds': total, 'durationInFrames': round(total * fps), 'measured': True,
          'sources': {'take': take.name}, 'loudnorm': {'I': -16, 'TP': -5, 'inputI': float(m['input_i']), 'inputTP': float(m['input_tp'])},
          'beats': {ln['id']: ln['beat'] for ln in lines if ln.get('beat')}, 'segments': segs}
    (reel / 'timeline.json').write_text(json.dumps(tl, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    (reel / 'src/video').mkdir(parents=True, exist_ok=True)
    (reel / 'src/video/words.json').write_text(json.dumps(rwords, ensure_ascii=False, indent=0) + '\n', encoding='utf-8')
    (reel / 'audio/alignment.json').write_text(json.dumps(align, ensure_ascii=False, indent=0) + '\n', encoding='utf-8')

    # 5. captions: one cue per line, split at punctuation into ≤ MAX_CUE characters, timed on the line's words
    cues = []
    for s, g, ln in zip(segs, groups, lines):
        toks = ln.get('caption', ln['text']).replace('"', '').split()
        # phrases end at punctuation; phrases are merged while the cue stays ≤ MAX_CUE characters
        phrases, cur = [], []
        for t in toks:
            cur.append(t)
            if re.search(r'[…؟.:،]$', t):
                phrases.append(cur); cur = []
        if cur:
            phrases.append(cur)
        chunks = []
        for ph in phrases:
            if chunks and len(' '.join(chunks[-1] + ph)) <= MAX_CUE:
                chunks[-1] = chunks[-1] + ph
            else:
                chunks.append(ph)
        at = 0
        for c in chunks:
            i0, i1 = round(at / len(toks) * len(g)), max(round((at + len(c)) / len(toks) * len(g)) - 1, round(at / len(toks) * len(g)))
            cues.append([g[i0]['start'] - g[0]['start'] + s['start'], g[min(i1, len(g) - 1)]['end'] - g[0]['start'] + s['start'], ' '.join(c).rstrip('.')])
            at += len(c)
    for a, b in zip(cues, cues[1:]):
        a[1] = min(a[1] + 0.2, b[0] - 0.02)
    cues[-1][1] += 0.3
    ts = lambda t: f'{int(t // 3600):02}:{int(t % 3600 // 60):02}:{int(t % 60):02},{int(round(t % 1 * 1000)) % 1000:03}'
    (reel / 'output').mkdir(exist_ok=True)
    (reel / 'output/captions.ar.srt').write_text('\n'.join(f'{i + 1}\n{ts(a)} --> {ts(b)}\n{t}\n' for i, (a, b, t) in enumerate(cues)), encoding='utf-8')
    print(json.dumps({'total': total, 'frames': tl['durationInFrames'], 'lines': len(segs), 'cues': len(cues),
                      'unheard': [a['script'] for a in align if not a['match']]}, ensure_ascii=False))


if __name__ == '__main__':
    main(Path(sys.argv[1]).resolve())
