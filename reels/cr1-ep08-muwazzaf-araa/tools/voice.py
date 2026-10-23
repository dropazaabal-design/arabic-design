"""From the four recorded units to one WAV per line, word times, and an independent listening check.

usage: python3 tools/voice.py cut     audio/takes/{A,B,C,D}.mp3 + audio/align/{A,B,C,D}.words.json (ElevenLabs Scribe)
                                       → audio/lines/NNN.wav, timing/words-raw.json
       python3 tools/voice.py check   → timing/asr.json (local Whisper small, sherpa-onnx; models in HUDOO_MODELS)

Scribe gives word times; its words are matched to the script's words (difflib on normalised Arabic), so a word it
mishears still gets its place. Each line is cut inside the silence before and after it, never through a word.
Scribe is the provider's own alignment, not proof the words were said right: `check` transcribes every line again
with a different model and scores it against the script. Neither replaces a human listen.
"""
import difflib
import json
import os
import re
import subprocess
import sys
import unicodedata
import wave
from pathlib import Path

import numpy as np

root = Path(__file__).resolve().parent.parent
SR = 48000
units = json.loads((root / 'narrative/units.json').read_text(encoding='utf-8'))
HARAKAT = re.compile('[ً-ْٰ]')


def norm(s):
    s = unicodedata.normalize('NFKC', HARAKAT.sub('', s))
    s = s.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ة', 'ه').replace('ى', 'ي')
    return re.sub(r'[^ء-ي0-9 ]', '', s)


def tokens(text):
    return [t for t in re.sub(r'\[[^\]]*\]', '', text).replace('«', '').replace('»', '').split()]


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, '<i2').astype(np.float32) / 32768


def write(path, x):
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1), w.setsampwidth(2), w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())


def cut():
    out_words = []
    for u, d in units.items():
        audio = decode(root / f'audio/takes/{u}.mp3')
        heard = [x for x in json.loads((root / f'audio/align/{u}.words.json').read_text(encoding='utf-8'))['words'] if x.get('type', 'word') == 'word']
        script = [(L['id'], i, t) for L in d['lines'] for i, t in enumerate(tokens(L['text']))]
        a, b = [norm(t) for *_, t in script], [norm(x['text']) for x in heard]
        times = [None] * len(script)
        for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
            tag, i1, i2, j1, j2 = blk
            if tag == 'equal' or (tag == 'replace' and i2 - i1 == j2 - j1):
                for k in range(i2 - i1):
                    times[i1 + k] = (heard[j1 + k]['start'], heard[j1 + k]['end'])
            elif tag == 'replace':  # n script words heard as m words: spread them over that span
                s0, s1 = heard[j1]['start'], heard[j2 - 1]['end']
                for k in range(i2 - i1):
                    times[i1 + k] = (s0 + (s1 - s0) * k / (i2 - i1), s0 + (s1 - s0) * (k + 1) / (i2 - i1))
        # words Scribe left out entirely: between their neighbours
        for k, t in enumerate(times):
            if t is None:
                prev = next((times[j][1] for j in range(k - 1, -1, -1) if times[j]), 0.0)
                nxt = next((times[j][0] for j in range(k + 1, len(times)) if times[j]), len(audio) / SR)
                times[k] = (prev, max(prev + 0.05, (prev + nxt) / 2))
        ids = [L['id'] for L in d['lines']]
        spans = {i: (min(times[k][0] for k, s in enumerate(script) if s[0] == i), max(times[k][1] for k, s in enumerate(script) if s[0] == i)) for i in ids}
        for n, i in enumerate(ids):
            a0 = 0.0 if n == 0 else (spans[ids[n - 1]][1] + spans[i][0]) / 2
            a1 = len(audio) / SR if n == len(ids) - 1 else (spans[i][1] + spans[ids[n + 1]][0]) / 2
            a0, a1 = max(0.0, max(a0, spans[i][0] - 0.25)), min(len(audio) / SR, min(a1, spans[i][1] + 0.35))
            x = audio[int(a0 * SR):int(a1 * SR)].copy()
            fade = int(0.012 * SR)
            x[:fade] *= np.linspace(0, 1, fade)
            x[-fade:] *= np.linspace(1, 0, fade)
            write(root / f'audio/lines/{i:03d}.wav', x)
            for k, (li, wi, t) in enumerate(script):
                if li == i:
                    out_words.append({'line': i, 'i': wi, 'word': t, 'start': round(times[k][0] - a0, 3), 'end': round(times[k][1] - a0, 3)})
        print(f'unit {u}: {len(heard)} words heard by Scribe for {len(script)} in the script, {len(ids)} lines cut')
    (root / 'timing/words-raw.json').write_text(json.dumps(out_words, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


def check():
    import sherpa_onnx
    d = Path(os.environ.get('HUDOO_MODELS', Path.home() / '.cache/hudoo-models')) / 'sherpa-onnx-whisper-small'
    rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=str(d / 'small-encoder.int8.onnx'), decoder=str(d / 'small-decoder.int8.onnx'),
                                                    tokens=str(d / 'small-tokens.txt'), language='ar', task='transcribe', num_threads=4)
    res = []
    for u, dd in units.items():
        for L in dd['lines']:
            with wave.open(str(root / f"audio/lines/{L['id']:03d}.wav")) as w:
                x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float32) / 32768
            s = rec.create_stream()
            s.accept_waveform(SR, x)
            rec.decode_stream(s)
            heard = s.result.text.strip()
            ratio = difflib.SequenceMatcher(None, norm(' '.join(tokens(L['text']))).split(), norm(heard).split()).ratio()
            res.append({'id': L['id'], 'unit': u, 'text': L['text'], 'heard': heard, 'wordMatch': round(ratio, 2)})
    (root / 'timing/asr.json').write_text(json.dumps(res, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    r = [x['wordMatch'] for x in res]
    print(f'Whisper small: mean word match {np.mean(r):.2f}; lines below 0.6: {[x["id"] for x in res if x["wordMatch"] < 0.6]}')


if __name__ == '__main__':
    {'cut': cut, 'check': check}[sys.argv[1] if len(sys.argv) > 1 else 'cut']()
