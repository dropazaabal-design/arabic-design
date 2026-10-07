"""Independent check of the narration: transcribe each segment with Whisper
and compare with the script, word by word (letters normalised: hamza forms,
ة/ه, ى/ي, harakat). Whisper is not trained on Darija, so a miss is a flag to
investigate, not proof of a bad take; a hit on a key word is real evidence.

usage: python asr_check.py speak.json VOICE_DIR [key words …]
"""
import json
import re
import sys
from difflib import SequenceMatcher
from pathlib import Path

from faster_whisper import WhisperModel

speak_file, voice_dir, *keys = sys.argv[1:]
HARAKAT = re.compile('[ً-ْٰـ]')


def norm(t):
    t = HARAKAT.sub('', t)
    t = re.sub('[إأآٱ]', 'ا', t).replace('ة', 'ه').replace('ى', 'ي')
    t = re.sub(r'[^\w\s]', ' ', t)
    return t.split()


model = WhisperModel('medium', device='cpu', compute_type='int8')
report = []
for seg in json.loads(Path(speak_file).read_text(encoding='utf-8')):
    wav = Path(voice_dir) / f"{seg['id']}.wav"
    if not wav.exists():
        continue
    parts, _ = model.transcribe(str(wav), language='ar', beam_size=5, vad_filter=False)
    heard = ' '.join(p.text.strip() for p in parts)
    a, b = norm(seg['speak']), norm(heard)
    ratio = SequenceMatcher(None, a, b).ratio()
    found = {k: any(SequenceMatcher(None, ''.join(norm(k)), w).ratio() >= 0.8 for w in b) for k in keys if ''.join(norm(k)) in ''.join(a)}
    report.append({'id': seg['id'], 'wordMatch': round(ratio, 2), 'script': seg['speak'], 'heard': heard, 'keyWords': found})
    print(json.dumps(report[-1], ensure_ascii=False), flush=True)

print(json.dumps({'segments': len(report), 'meanWordMatch': round(sum(r['wordMatch'] for r in report) / max(1, len(report)), 2)}, ensure_ascii=False))
