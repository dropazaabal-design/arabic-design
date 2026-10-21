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

(root / 'src/a').mkdir(parents=True, exist_ok=True)
(root / 'src/b').mkdir(parents=True, exist_ok=True)
(root / 'src/a/beats.json').write_text(json.dumps(A, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(root / 'src/b/beats.json').write_text(json.dumps(B, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print('ok')
