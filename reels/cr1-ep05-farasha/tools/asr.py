"""Independent transcription of every take with Whisper large-v3-turbo (sherpa-onnx, local), and a
word-level comparison with the locked script.

This is the check the alignment cannot give: ElevenLabs' alignment times the text it was given,
whatever was said; Whisper hears the audio without the text. A mismatch is a lead for a listen,
not a verdict: Whisper also errs, mostly on colloquial spelling (it may write «ما نفتح» for
«ما انفتح»), so words are compared after normalising spelling variants.

usage: python3 -I tools/asr.py MODEL_DIR [UNIT ...]   → review/asr-<model>.json
"""
import difflib
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import sherpa_onnx

root = Path(__file__).resolve().parent.parent
UNITS = {'U1': ('script-short.md', [f'R{i}' for i in range(1, 11)])}
HARAKAT = re.compile('[ً-ْٰـ]')


def norm(w):
    w = HARAKAT.sub('', w)
    w = re.sub('[إأآٱ]', 'ا', w).replace('ى', 'ي').replace('ة', 'ه').replace('ؤ', 'و').replace('ئ', 'ي')
    return re.sub(r'[^\w]', '', w)


def script_words(path, ids):
    t = (root / path).read_text(encoding='utf-8')
    secs = {s.split('\n')[0].split()[0]: s.split('\n')[1:] for s in re.split(r'^## ', t, flags=re.M)[1:]}
    return [w for i in ids for line in secs[i] for w in line.split()]


def transcribe(rec, path):
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout
    a = np.frombuffer(pcm, dtype=np.float32)
    # windows of at most 15 s, cut at the quietest point near each boundary so no word is split, each
    # followed by 1 s of silence: without that tail the sherpa-onnx Whisper decoder drops the last words
    out, i, step = [], 0, 16000 * 15
    while i < len(a):
        j = min(len(a), i + step)
        if j < len(a):
            lo = j - 16000 * 4
            win = np.convolve(np.abs(a[lo:j]), np.ones(800) / 800, mode='same')
            j = lo + int(np.argmin(win))
        s = rec.create_stream()
        s.accept_waveform(16000, np.concatenate([a[i:j], np.zeros(16000, dtype=np.float32)]))
        rec.decode_stream(s)
        out.append(s.result.text.strip())
        i = j
    return ' '.join(out)


def compare(script, heard):
    a, b = [norm(w) for w in script], [norm(w) for w in heard.split()]
    a, b = [w for w in a if w], [w for w in b if w]
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    diffs = [{'op': op, 'script': ' '.join(a[i1:i2]), 'heard': ' '.join(b[j1:j2])} for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal']
    errors = sum(max(i2 - i1, j2 - j1) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal')
    return round(errors / max(1, len(a)), 4), diffs


if __name__ == '__main__':
    model = sys.argv[1]
    want = sys.argv[2:] or list(UNITS)
    name = Path(model).name.replace('sherpa-onnx-whisper-', '')
    rec = sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=f'{model}/{name}-encoder.int8.onnx', decoder=f'{model}/{name}-decoder.int8.onnx', tokens=f'{model}/{name}-tokens.txt',
        language='ar', task='transcribe', num_threads=4)
    out_path = root / f"review/asr-{name}.json"
    report = json.loads(out_path.read_text(encoding='utf-8')) if out_path.exists() else {}
    report['note'] = f'Whisper {name} (int8, sherpa-onnx), local; word error rate after normalising hamza, taa marbuta and alef maqsura. A lead for listening, not a verdict.'
    for unit in want:
        path, ids = UNITS[unit]
        words = script_words(path, ids)
        for take in sorted((root / 'audio/takes').glob(f'{unit}-*.mp3')):
            heard = transcribe(rec, take)
            wer, diffs = compare(words, heard)
            report.setdefault('takes', {})[take.stem] = {'unit': unit, 'wer': wer, 'diffs': diffs, 'heard': heard}
            print(f'{take.stem}: wer {wer:.3f}  ' + ' | '.join(f"{d['script']}→{d['heard']}" for d in diffs[:6]), flush=True)
        out_path.write_text(json.dumps(report, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
