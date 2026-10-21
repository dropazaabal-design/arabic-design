"""The locked script → lines (chapter, tts text, display text, note) and the narration, one take per line.

usage:
  python3 tools/script.py lines            # print counts, write narrative/lines.json
  python3 tools/script.py voice [speed]    # synthesise every line (local Arabic Piper voice) → audio/lines/NNN.wav
  python3 tools/script.py check            # local Whisper on every line → timing/asr.json (similarity per line)

The display text (subtitles, docs) is the voiced text with its short vowels removed, so the two can never drift.
"""
import json
import re
import sys
import unicodedata
import wave
from pathlib import Path

import numpy as np

root = Path(__file__).resolve().parent.parent
MODELS = Path('/tmp/claude-0/-home-user-arabic-design/75dcdd2b-cff6-54ab-b020-4469cf838c88/scratchpad/models')
HARAKAT = re.compile('[\u064C-\u0652\u0670]')  # every short vowel, sukun, shadda and dagger alef; only fathatan (ًا) stays, as print does


def display(tts: str) -> str:
    s = HARAKAT.sub('', tts)
    s = s.replace('اِ', 'ا').replace('هٰ', 'ه')
    return re.sub(r'\s+', ' ', s).strip()


def lines():
    out, chapter, title = [], 0, ''
    for raw in (root / 'narrative/script.txt').read_text(encoding='utf-8').splitlines():
        raw = raw.strip()
        if not raw:
            continue
        m = re.match(r'#\s*(\d+)\s*\|\s*(.+)', raw)
        if m:
            chapter, title = int(m[1]), m[2].strip()
            continue
        if raw.startswith('#'):
            continue
        tts, _, note = raw.partition('||')
        tts = tts.strip()
        d = display(tts)
        if d.startswith('كتاب وبس'):
            d = 'كتاب وبس'
        out.append({'id': len(out) + 1, 'chapter': chapter, 'chapterTitle': title, 'tts': tts, 'text': d, 'note': note.strip(), 'words': len(d.split())})
    for k, l in enumerate(out):  # a longer pause closes each chapter
        l['pauseAfter'] = 0.8 if k + 1 == len(out) or out[k + 1]['chapter'] != l['chapter'] else 0.3
    return out


def tts_engine():
    import sherpa_onnx
    d = MODELS / 'vits-piper-ar_JO-kareem-medium'
    cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(
        model=str(d / 'ar_JO-kareem-medium.onnx'), tokens=str(d / 'tokens.txt'), data_dir=str(d / 'espeak-ng-data'), noise_scale=0.6, noise_scale_w=0.7), num_threads=4))
    return sherpa_onnx.OfflineTts(cfg)


def write_wav(path, x, sr):
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())


def trim(x, sr, thr=0.01):
    """Cut the model's leading/trailing near-silence so pauses are ours, not the model's."""
    idx = np.where(np.abs(x) > thr)[0]
    if not len(idx):
        return x
    a, b = max(0, idx[0] - int(0.02 * sr)), min(len(x), idx[-1] + int(0.06 * sr))
    return x[a:b]


def voice(speed):
    L = lines()
    tts = tts_engine()
    out = root / 'audio/lines'
    out.mkdir(parents=True, exist_ok=True)
    total = 0.0
    for l in L:
        a = tts.generate(l['tts'], sid=0, speed=speed)
        x = trim(np.array(a.samples, dtype=np.float32), a.sample_rate)
        write_wav(out / f"{l['id']:03d}.wav", x, a.sample_rate)
        l['dur'] = round(len(x) / a.sample_rate, 3)
        total += l['dur'] + l['pauseAfter']
    (root / 'narrative/lines.json').write_text(json.dumps({'speed': speed, 'sampleRate': 22050, 'total': round(total, 2), 'lines': L}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f'{len(L)} lines, {sum(l["words"] for l in L)} words, speech+pauses {total:.1f} s at speed {speed}')


def check():
    import difflib
    import sherpa_onnx
    d = MODELS / 'sherpa-onnx-whisper-small'
    rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=str(d / 'small-encoder.int8.onnx'), decoder=str(d / 'small-decoder.int8.onnx'),
                                                    tokens=str(d / 'small-tokens.txt'), language='ar', task='transcribe', num_threads=4)
    norm = lambda s: re.sub(r'[^ء-ي ]', '', unicodedata.normalize('NFKC', HARAKAT.sub('', s).replace('ّ', '').replace('ً', ''))
                            .replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ة', 'ه').replace('ى', 'ي'))
    data = json.loads((root / 'narrative/lines.json').read_text(encoding='utf-8'))
    res = []
    for l in data['lines']:
        w = wave.open(str(root / f"audio/lines/{l['id']:03d}.wav"))
        x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float32) / 32768
        s = rec.create_stream()
        s.accept_waveform(w.getframerate(), x)
        rec.decode_stream(s)
        heard = s.result.text.strip()
        ratio = difflib.SequenceMatcher(None, norm(l['text']).split(), norm(heard).split()).ratio()
        res.append({'id': l['id'], 'text': l['text'], 'heard': heard, 'wordMatch': round(ratio, 2)})
    (root / 'timing/asr.json').write_text(json.dumps(res, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    r = [x['wordMatch'] for x in res]
    print(f'mean word match {np.mean(r):.2f}; below 0.6: {[x["id"] for x in res if x["wordMatch"] < 0.6]}')


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'lines'
    if cmd == 'lines':
        L = lines()
        print(len(L), 'lines,', sum(l['words'] for l in L), 'words,', len({l['chapter'] for l in L}), 'chapters')
    elif cmd == 'voice':
        voice(float(sys.argv[2]) if len(sys.argv) > 2 else 1.0)
    elif cmd == 'check':
        check()
