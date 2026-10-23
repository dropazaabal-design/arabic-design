"""Build the exact ElevenLabs prompt from script.json (never typed by hand).

speech/full.txt          the spoken text: one line per segment, nothing else (= narration.txt)
speech/prompt-full.txt   what is sent: each line with its audio tag (if any) in front
Each gets a .sha256 next to it. tools/check_prompt.py compares any text against them.
"""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
segs = json.loads((root / 'script.json').read_text(encoding='utf-8'))['segments']
out = {
    'full.txt': '\n'.join(s['text'] for s in segs),
    'prompt-full.txt': '\n'.join((s['tag'] + ' ' if s.get('tag') else '') + s['text'] for s in segs),
}
for name, text in out.items():
    (root / 'speech' / name).write_text(text, encoding='utf-8')
    h = hashlib.sha256(text.encode('utf-8')).hexdigest()
    (root / 'speech' / (name.replace('.txt', '.sha256'))).write_text(f'{h}  speech/{name}\n')
    print(f'{name}: {len(text)} chars, sha256 {h}')
