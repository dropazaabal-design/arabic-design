#!/usr/bin/env python3
"""Build a word-grounded SRT and a restrained mono foley stem for the visual preview."""
import json, math, random, struct, wave
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
words=json.loads((ROOT/'audio/words.json').read_text())
groups=[
 (0,4),(4,10),(10,18),(18,27),(27,31),(31,36),(36,38),
 (38,44),(44,56),(56,61),(61,66),(66,72),(72,77)
]
def tc(sec):
    ms=round(sec*1000)
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
entries=[]
for i,(a,b) in enumerate(groups,1):
    text=' '.join(w['text'] for w in words[a:b] if w['type']=='word')
    entries.append(f'{i}\n{tc(words[a]["start"])} --> {tc(words[b-1]["end"])}\n{text}\n')
(ROOT/'output/captions.ar.srt').write_text('\n'.join(entries),encoding='utf8')

sr=48000
dur=42.5
n=int(sr*dur)
samples=[0.0]*n
random.seed(6)
events=[
 (.15,'plant',.09),(2.2,'cup',.22),(3.7,'bag',.3),(5.55,'plant',.18),(9.2,'rattle',.13),
 (14.55,'power',.25),(16.35,'power',.16),(18.18,'breath',.12),
 (21.18,'cup',.10),(23.3,'drag',.15),(36.1,'cup',.10),(40.88,'cup',.14),
]
for t,kind,amp in events:
    start=int(t*sr)
    length={'cup':.18,'bag':.28,'plant':.4,'rattle':.3,'power':.36,'breath':.42,'drag':1.15}[kind]
    for j in range(min(int(length*sr),n-start)):
        x=j/sr
        envelope=math.exp(-x*({'drag':2.4,'breath':7,'plant':9}.get(kind,18)))
        if kind=='cup':
            v=math.sin(2*math.pi*(780-250*x)*x)*.8+random.uniform(-.3,.3)
        elif kind=='bag':
            v=math.sin(2*math.pi*95*x)*.7+random.uniform(-.4,.4)
        elif kind=='plant':
            v=random.uniform(-1,1)*math.sin(math.pi*x/length)
        elif kind=='rattle':
            v=math.sin(2*math.pi*36*x)*random.uniform(-1,1)
        elif kind=='power':
            v=math.sin(2*math.pi*(260-190*x)*x)+random.uniform(-.2,.2)
        elif kind=='breath':
            v=random.uniform(-1,1)*.5
        else:
            v=random.uniform(-1,1)*.28+math.sin(2*math.pi*78*x)*.2
        samples[start+j]+=amp*envelope*v
with wave.open(str(ROOT/'output/foley.wav'),'wb') as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr)
    chunk=8192
    for i in range(0,n,chunk):
        w.writeframes(b''.join(struct.pack('<h',int(max(-.95,min(.95,x))*32767)) for x in samples[i:i+chunk]))
print(f'{len(entries)} captions, {dur:.1f}s foley')
