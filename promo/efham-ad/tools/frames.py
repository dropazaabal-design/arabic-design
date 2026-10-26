"""Scene boundaries (as src/timing.ts computes them) and review frames: start, middle and end of every scene."""
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
lines = json.loads((root / 'timing/lines.json').read_text(encoding='utf-8'))
L = {l['id']: l for l in lines['lines']}
W = {(x['line'], x['i']): x for x in json.loads((root / 'timing/words.json').read_text(encoding='utf-8'))}
fr = lambda s: round(s * 60)
L0 = lambda i: fr(L[i]['start'])
w = lambda l, i: fr(W[(l, i)]['start'])
S = dict(s1=0, s2=L0(2) - 6, s3=L0(3) - 8, s4=w(4, 6) - 10, s5=w(6, 3) - 6, s6=L0(8) - 6, s7=L0(9) - 10, end=lines['frames'])

if __name__ == '__main__':
    ks = list(S.values())
    print(S)
    print(' '.join(str(x) for a, b in zip(ks, ks[1:]) for x in (a + 20, (a + b) // 2, b - 8)))
