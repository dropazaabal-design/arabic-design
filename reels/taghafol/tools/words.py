# Word times from a narration file (faster-whisper medium, CPU, Arabic).
# usage: python tools/words.py TAKE.wav OUT.json   (needs: pip install faster-whisper)
# Whisper proves word intelligibility only, never natural delivery.
import json, sys
from faster_whisper import WhisperModel
m = WhisperModel('medium', device='cpu', compute_type='int8')
segs, _ = m.transcribe(sys.argv[1], language='ar', beam_size=5, word_timestamps=True, vad_filter=False)
out = []
for s in segs:
    print(f'[{s.start:6.2f}–{s.end:6.2f}] {s.text.strip()}', flush=True)
    out += [{'w': w.word.strip(), 's': round(w.start, 3), 'e': round(w.end, 3)} for w in s.words]
json.dump(out, open(sys.argv[2], 'w'), ensure_ascii=False, indent=0)
