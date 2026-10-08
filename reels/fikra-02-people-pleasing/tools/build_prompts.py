"""Build the exact ElevenLabs prompts from script.json (never typed by hand).

speech/full.txt          the spoken text: one line per segment, nothing else
speech/prompt-full.txt   what is sent for the full take: DIRECTION + full.txt
speech/prompt-sample.txt what is sent for the opening sample: DIRECTION + s01..s04
Each gets a .sha256 next to it. tools/check_prompt.py compares any text against them.
"""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
# eleven_v4 exposes no stability/style/speed settings through the connector; delivery is directed
# with one audio tag at the start, which holds for the whole text (model guide, "Audio tags").
DIRECTION = '[warmly] [calmly] '
segs = json.loads((root / 'script.json').read_text(encoding='utf-8'))['segments']
lines = [s['text'] for s in segs]
out = {
    'full.txt': '\n'.join(lines),
    'prompt-full.txt': DIRECTION + '\n'.join(lines),
    'prompt-sample.txt': DIRECTION + '\n'.join(s['text'] for s in segs if s['id'] in ('s01', 's02', 's03', 's04')),
}
for name, text in out.items():
    (root / 'speech' / name).write_text(text, encoding='utf-8')
    h = hashlib.sha256(text.encode('utf-8')).hexdigest()
    (root / 'speech' / (name.replace('.txt', '.sha256'))).write_text(f'{h}  speech/{name}\n')
    print(f'{name}: {len(text)} chars, sha256 {h}')
