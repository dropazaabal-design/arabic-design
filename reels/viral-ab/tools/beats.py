"""The fixed beat sheets both reels are built on (no narration: picture, music and effects share these times).

usage: python3 tools/beats.py   → src/a/beats.json, src/b/beats.json
The music tool (tools/music.py) reads the same files, so every hit lands on the frame it belongs to.
"""
import json
import random
from pathlib import Path

root = Path(__file__).resolve().parent.parent
rng = random.Random(7)
WORDS = ['فاشل', 'مستحيل', 'ما بتقدر', 'انسَ', 'حلم', 'ما بتوصل', 'خلّك واقعي']

# ——— A «ضحكوا عليه…» (15.5 s) ———
A = {'duration': 15.5, 'shots': [['crowd', 0.0], ['wide', 1.7], ['catch', 3.45], ['rise', 4.6], ['summit', 9.0], ['silent', 10.2], ['stairs', 11.2]]}
A['laughs'] = [0.12, 0.42, 0.74, 1.05, 1.36]
# the first volley, seen wide: from the crowd's hands across the gap; most fall short
A['volley'] = []
for k in range(7):
    t0 = 1.78 + k * 0.17 + rng.uniform(-0.02, 0.02)
    A['volley'].append({'t0': round(t0, 3), 'dur': round(rng.uniform(0.55, 0.65), 3), 'who': [5, 3, 1, 4, 0, 2, 5][k],
                        'to': [round(rng.uniform(560, 900)), rng.choice([1340, 1700, 2100])], 'word': WORDS[k % len(WORDS)], 'spin': round(rng.choice([-1, 1]) * rng.uniform(200, 420))})
A['catch'] = {'arrive': 3.72, 'word': 'فاشل', 'flip': 3.98, 'place': 4.38}
# the tower: 25 rows of 32 px on the pillar; rows build faster as he finds his rhythm
A['rise'] = {'from': 4.6, 'to': 8.9, 'rows': 25, 'labels': [[2, 'الشغل'], [7, 'التعلّم'], [12, 'الصبر'], [17, 'الاستمرار'], [22, 'النجاح']]}
A['riseThrows'] = [round(4.75 + 4.0 * (k / 15) ** 1.15, 3) for k in range(16)]
A['summit'] = {'grab': 9.28, 'flash': 9.32, 'text': 9.45}
A['silent'] = {'stop': 10.25, 'drop': 10.6}
# he walks to the edge, kneels, and lets a rope ladder down to the cliff they laughed from; the first of them climbs
A['stairs'] = {'walk': 11.2, 'kneel': 11.55, 'unroll': 11.65, 'land': 13.1, 'climb': 13.35, 'text1': 11.45, 'text2': 13.1, 'sign': 14.3}

# ——— B «النخلة» (18 s) ———
B = {'duration': 18.0, 'shots': [['dig', 0.0], ['plant', 2.6], ['years', 4.4], ['shade', 9.8], ['again', 12.6], ['ask', 15.0]]}
B['dig'] = {'strokes': [0.25, 0.8, 1.35], 'boyIn': 0.3, 'boyAt': 0.68, 'laugh': 0.72, 'ask': 0.95, 'askEnd': 2.45, 'smile': 1.9}  # the question lands inside the first second
B['plant'] = {'kneel': 2.6, 'set': 2.9, 'pat': 3.35, 'jug': 3.58, 'water': 3.7, 'waterEnd': 3.95, 'boyStep': 3.72, 'stand': 3.9, 'pet': 4.05}
# time-lapse: six days and nights; the palm grows, the boy grows up, and the old man is gone
B['years'] = {'from': 4.4, 'to': 9.6, 'days': 6, 'fade': 8.2}
B['shade'] = {'date1': 10.3, 'date2': 10.9, 'text': 10.4, 'look': 11.4}
# he takes the cane and an offshoot from the base of the palm, and plants it further on
B['again'] = {'stand': 12.6, 'cane': 12.85, 'shoot': 13.0, 'walk': 13.2, 'walkEnd': 13.85, 'kneel': 13.9, 'scoop': [14.0, 14.25], 'set': 14.5}
B['ask'] = {'girl': 15.05, 'girlAt': 15.55, 'askText': 15.2, 'askEnd': 16.1, 'stand': 15.72, 'pat': 16.0, 'text': 16.2, 'sign': 16.9}

# ——— C «الضربة 101» (16 s, loops) ———
# 100 strikes leave 100 chips on the wall and nothing happens; the 101st lands where the first did and the crack
# runs through every chip (a minimum spanning tree over them), then over the whole wall, which falls away.
GY, S = 1560, 1.15
rc = random.Random(21)
C = {'duration': 16.0, 'GY': GY, 'S': S, 'DX': -1500,
     'shots': [['wide', 0.0], ['montage', 3.4], ['close', 8.7], ['impact', 9.9], ['reveal', 10.6], ['journey', 13.4]]}
fast = [round(3.55 + 5.0 * ((k + 1) / 97) ** 0.62, 3) for k in range(97)]  # strikes 4–100, the gaps shrinking to 2 frames
C['hits'] = [0.3, 1.6, 2.9] + fast + [9.9]
first = (540, 1268)
chips = [first, (first[0] - 14, first[1] + 10), (first[0] + 12, first[1] - 9)]
while len(chips) < 100:
    q = (round(rc.uniform(170, 910)), round(rc.uniform(GY - 330 * S, GY - 172 * S)))
    if all((q[0] - c[0]) ** 2 + (q[1] - c[1]) ** 2 > 22 ** 2 for c in chips):
        chips.append(q)
C['chips'] = [list(c) for c in chips]
C['final'] = list(first)
# minimum spanning tree over the chips (Prim), each edge with its depth from the final strike for the reveal order
pts = chips
inside, edges, depth = {0}, [], {0: 0}
while len(inside) < len(pts):
    i, j = min(((i, j) for i in inside for j in range(len(pts)) if j not in inside), key=lambda e: (pts[e[0]][0] - pts[e[1]][0]) ** 2 + (pts[e[0]][1] - pts[e[1]][1]) ** 2)
    inside.add(j)
    depth[j] = depth[i] + 1
    edges.append([i, j, depth[j]])
C['mst'] = edges
# the wall's break lines: a jittered grid; its cells are the shards that fall
cols, rows = 11, 15
xs = [-400 + k * 1900 / (cols - 1) for k in range(cols)]
ys = [-1100 + k * (GY + 1100) / (rows - 1) for k in range(rows)]
C['grid'] = {'cols': cols, 'rows': rows, 'pts': [[round(x + (rc.uniform(-55, 55) if 0 < i < cols - 1 else 0)), round(y + (rc.uniform(-50, 50) if 0 < j < rows - 1 else 0))]
                                                 for j, y in enumerate(ys) for i, x in enumerate(xs)]}
C['passers'] = {'in': 4.4, 'stop': 5.2, 'out': 6.7}
C['text'] = {'once': 0.4, 'nothing': 1.3, 'nothingOut': 3.2, 'said': 4.9, 'saidOut': 6.8, 'big': 9.15, 'last': 11.0, 'before': 12.0, 'outro': 14.6, 'sign': 12.8}
C['close'] = {'lean': 8.75, 'look': 9.0, 'raise': 9.35}
C['impact'] = {'flash': 9.9, 'crack1': 10.05, 'crack2': 10.35, 'fall': 10.6}
C['journey'] = {'walk': 13.6, 'arrive': 15.15, 'raise': 15.2, 'up': 15.55}

(root / 'src/a').mkdir(parents=True, exist_ok=True)
(root / 'src/b').mkdir(parents=True, exist_ok=True)
(root / 'src/c').mkdir(parents=True, exist_ok=True)
(root / 'src/a/beats.json').write_text(json.dumps(A, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(root / 'src/b/beats.json').write_text(json.dumps(B, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(root / 'src/c/beats.json').write_text(json.dumps(C, ensure_ascii=False) + '\n', encoding='utf-8')
print('ok')
