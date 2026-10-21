"""Compare a text (stdin, or a file) with a built prompt: exits 1 unless identical.
usage: python3 tools/check_prompt.py prompt-full < sent.txt"""
import hashlib
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
name = sys.argv[1]
expected = (root / 'speech' / f'{name}.txt').read_text(encoding='utf-8')
got = Path(sys.argv[2]).read_text(encoding='utf-8') if len(sys.argv) > 2 else sys.stdin.read()
if got.endswith('\n') and not expected.endswith('\n'):
    got = got[:-1]  # a heredoc adds one trailing newline
h = lambda t: hashlib.sha256(t.encode('utf-8')).hexdigest()
print('expected', h(expected), len(expected), 'chars')
print('got     ', h(got), len(got), 'chars')
if got != expected:
    import difflib
    for line in difflib.unified_diff(expected.split('\n'), got.split('\n'), 'expected', 'got', lineterm='', n=0):
        print(line)
    sys.exit(1)
print('IDENTICAL')
