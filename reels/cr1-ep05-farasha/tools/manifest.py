"""The delivery manifest (CR1 §10, §11, §13): every delivered file with its size and SHA-256, the
version, and a fingerprint of the inputs it was made from, plus the resume state.

usage: python3 tools/manifest.py "last stop reason" "next step"   → manifest.json
"""
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

root = Path(__file__).resolve().parent.parent
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
brief = json.loads((root / 'episode-brief.json').read_text(encoding='utf-8'))
version = brief['version']


def fingerprint(paths):
    h = hashlib.sha256()
    for p in sorted(paths):
        h.update(str(p.relative_to(root.parent.parent)).encode())
        h.update(sha(p).encode())
    return h.hexdigest()


core = root.parent.parent / 'motion-core'
code = [*root.glob('src/**/*.ts'), *root.glob('src/**/*.tsx'), *(core / 'src/cartoon').glob('*.ts*'), *(core / 'src/characters').rglob('*.tsx'), core / 'art/characters/sultan.svg', root / 'remotion.config.ts', *root.glob('public/fonts/*.woff2'), *root.glob('public/sfx/*.wav')]
inputs = [root / 'script-short.md', root / 'src/data/short.json', root / 'public/audio/short-mix.wav', *code]
files = []
for p in sorted((root / 'export').iterdir()):
    if p.is_file():
        files.append({'file': f'export/{p.name}', 'bytes': p.stat().st_size, 'sha256': sha(p), 'version': version,
                      'inputsFingerprint': fingerprint(inputs), 'report': f'review/{p.stem}.json' if p.suffix == '.mp4' else None})
approved = [{'file': str(p.relative_to(root)), 'sha256': sha(p)} for p in
            [root / 'script-short.md', *sorted((root / 'audio/takes').glob('*.mp3')), root / 'public/audio/short-mix.wav']]
manifest = {
    'episode': brief['episode'], 'version': version, 'written': datetime.now(timezone.utc).isoformat(timespec='seconds'),
    'deliverables': files,
    'state': {'approvedInputs': approved, 'lastStop': sys.argv[1] if len(sys.argv) > 1 else '', 'next': sys.argv[2] if len(sys.argv) > 2 else ''},
}
(root / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(json.dumps([{k: f[k] for k in ('file', 'bytes')} for f in files], ensure_ascii=False))
