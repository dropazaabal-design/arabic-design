# Word times from a narration file (faster-whisper, CPU, Arabic).
# usage: python tools/words.py TAKE.(mp3|wav) OUT.json [model]   (needs: pip install faster-whisper numpy)
# Audio is decoded by ffmpeg (16 kHz mono) so PyAV versions do not matter.
# Whisper proves word intelligibility only, never natural delivery.
import json, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', sys.argv[1], '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout
audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
m = WhisperModel(sys.argv[3] if len(sys.argv) > 3 else 'medium', device='cpu', compute_type='int8')
segs, _ = m.transcribe(audio, language='ar', beam_size=5, word_timestamps=True, vad_filter=False)
out = []
for s in segs:
    print(f'[{s.start:6.2f}–{s.end:6.2f}] {s.text.strip()}', flush=True)
    out += [{'w': w.word.strip(), 's': round(w.start, 3), 'e': round(w.end, 3), 'p': round(w.probability, 3)} for w in s.words]
json.dump(out, open(sys.argv[2], 'w'), ensure_ascii=False, indent=0)
