"""The episode's clock: line and word times, the comic beats between lines, and the total length.

usage: python3 tools/timeline.py            → provisional times (no recording yet: each line timed from this voice's
                                               measured rate in EP05, 11.8 characters a second, words by their length)
       python3 tools/timeline.py audio/lines → real times: one WAV per line (001.wav…) cut from the recordings,
                                               words from timing/words-raw.json (Scribe, mapped to the script)
Writes timing/lines.json and timing/words.json. The picture keys every action to these words (src/timing.ts), so
replacing the provisional clock with the real one re-times the whole episode.
"""
import json
import re
import sys
import wave
from pathlib import Path

root = Path(__file__).resolve().parent.parent
units = json.loads((root / 'narrative/units.json').read_text(encoding='utf-8'))
beats = json.loads((root / 'narrative/beats.json').read_text(encoding='utf-8'))
LINES = [dict(l, unit=u) for u, d in units.items() for l in d['lines']]
FPS, CPS = 60, 11.8
real = Path(sys.argv[1]) if len(sys.argv) > 1 else None
raw = json.loads((root / 'timing/words-raw.json').read_text(encoding='utf-8')) if real else None


def spoken(t):
    return re.sub(r'[«»]', '', t)


def wav_len(p):
    with wave.open(str(p)) as w:
        return w.getnframes() / w.getframerate()


t = beats['lead']
lines, words = [], []
for L in LINES:
    text = spoken(L['text'])
    toks = text.split()
    if real:
        dur = wav_len(real / f"{L['id']:03d}.wav")
        ws = [w for w in raw if w['line'] == L['id']]
        for w in ws:
            words.append({'line': L['id'], 'i': w['i'], 'word': w['word'], 'start': round(t + w['start'], 3), 'end': round(t + w['end'], 3)})
    else:
        pauses = text.count('…') * 0.35 + text.count('،') * 0.12 + text.count(':') * 0.15
        dur = round(len(text.replace('…', '')) / CPS + pauses, 3)
        weights = [len(re.sub(r'[^\w]', '', w)) + 1 + (0.35 * CPS if '…' in w else 0) for w in toks]
        tot, acc = sum(weights), 0.0
        for i, (w, k) in enumerate(zip(toks, weights)):
            a = t + dur * acc / tot
            acc += k - (0.35 * CPS if '…' in w else 0)
            words.append({'line': L['id'], 'i': i, 'word': w, 'start': round(a, 3), 'end': round(t + dur * acc / tot, 3)})
            acc += 0.35 * CPS if '…' in w else 0
    lines.append({'id': L['id'], 'unit': L['unit'], 'text': text, 'start': round(t, 3), 'end': round(t + dur, 3)})
    t += dur + beats['gap'] + beats['after'].get(str(L['id']), [0])[0]
total = round(t - beats['gap'], 3)
out = {'source': 'recording' if real else 'provisional (11.8 chars/s, EP05 rate of this voice)', 'total': total, 'frames': round(total * FPS), 'lines': lines}
(root / 'timing/lines.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(root / 'timing/words.json').write_text(json.dumps(words, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(f"{out['source']}: {len(lines)} lines, {len(words)} words, {total:.2f} s ({out['frames']} frames)")
