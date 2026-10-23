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

root = Path(os.environ.get('PROJECT_ROOT', Path(__file__).resolve().parent.parent)).resolve()  # another project can reuse the tool
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


def silent(x, floor=-50):
    """10 ms frames quieter than `floor` dBFS."""
    hop = SR // 100
    n = len(x) // hop
    return 20 * np.log10(np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-9) < floor


def pause(quiet, t0, t1):
    """The longest quiet run between t0 and t1 seconds, as (start, end); the quietest instant if there is none."""
    best, run = None, None
    for f in range(max(0, int(t0 * 100)), min(len(quiet), int(t1 * 100))):
        run = (run if run is not None else f) if quiet[f] else None
        if run is not None and (best is None or f + 1 - run > best[1] - best[0]):
            best = (run, f + 1)
    if best is None:
        return ((t0 + t1) / 2,) * 2
    return best[0] / 100, best[1] / 100


def cut():
    out_words = []
    for u, d in units.items():
        audio = decode(root / f'audio/takes/{u}.mp3')
        heard = [x for x in json.loads((root / f'audio/align/{u}.words.json').read_text(encoding='utf-8'))['words'] if x.get('type', 'word') == 'word' and not x['text'].startswith('[')]  # performance tags are aligned too; they are not words
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
        first = {i: min(times[k][0] for k, s in enumerate(script) if s[0] == i) for i in ids}
        last = {i: max(times[k][0] for k, s in enumerate(script) if s[0] == i) for i in ids}  # the last word's start
        # Scribe's word ends run on into the pause and its starts come late, so a cut at the midpoint of its gap lands
        # inside the next word. The cut goes in the pause actually measured in the audio instead.
        dur, quiet = len(audio) / SR, silent(audio)
        cuts = [(0.0, max(0.0, pause(quiet, 0.0, first[ids[0]] + 0.15)[1] - 0.06))]  # (end of the line before, start of the next)
        for p, q in zip(ids, ids[1:]):
            r0, r1 = pause(quiet, last[p] + 0.1, first[q] + 0.15)
            mid = (r0 + r1) / 2
            cuts.append((min(r0 + 0.2, mid), max(r1 - 0.06, mid)))
        cuts.append((min(dur, pause(quiet, last[ids[-1]] + 0.1, dur)[0] + 0.2), dur))
        for n, i in enumerate(ids):
            a0, a1 = cuts[n][1], cuts[n + 1][0]
            x = audio[int(a0 * SR):int(a1 * SR)].copy()
            edge = SR * 3 // 100  # a line must open and close on the pause, not on a piece of a word (the take's own ends excepted)
            assert (a0 == 0 or silent(x[:edge]).all()) and (a1 == dur or silent(x[-edge:]).all()), f'line {i}: the cut runs through speech'
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
            pad = np.zeros(SR // 2, np.float32)  # in the episode every line sits between pauses; a clip that ends on its last word makes Whisper drop it
            s = rec.create_stream()
            s.accept_waveform(SR, np.concatenate([pad, x, pad]))
            rec.decode_stream(s)
            heard = s.result.text.strip()
            ratio = difflib.SequenceMatcher(None, norm(' '.join(tokens(L['text']))).split(), norm(heard).split()).ratio()
            res.append({'id': L['id'], 'unit': u, 'text': L['text'], 'heard': heard, 'wordMatch': round(ratio, 2)})
    (root / 'timing/asr.json').write_text(json.dumps(res, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    r = [x['wordMatch'] for x in res]
    print(f'Whisper small: mean word match {np.mean(r):.2f}; lines below 0.6: {[x["id"] for x in res if x["wordMatch"] < 0.6]}')


if __name__ == '__main__':
    {'cut': cut, 'check': check}[sys.argv[1] if len(sys.argv) > 1 else 'cut']()
