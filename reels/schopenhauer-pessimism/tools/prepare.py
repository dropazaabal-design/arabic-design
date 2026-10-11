import json,re,wave,math,subprocess
from pathlib import Path
import numpy as np
r=Path(__file__).resolve().parents[1]
a=json.loads((r/'audio/alignment.json').read_text())
# Extend only sentence gaps; preserve every speech sample, speed and pitch.
gaps=[(2.46,.6),(15.23,.4),(18.38,.7),(20.96,1.0),(24.97,.4),(32.35,.7),(39.85,.3),(43.31,.5),(53.59,.4),(56.9,.6)]
lead=.7;tail=1.0
with wave.open(str(r/'audio/take.wav')) as w: sr=w.getframerate(); data=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(float)/32768
parts=[np.zeros(round(lead*sr))];prev=0
for cut,hold in gaps:
 i=round(cut*sr); parts += [data[prev:i],np.zeros(round(hold*sr))];prev=i
parts += [data[prev:],np.zeros(round(tail*sr))]
voice=np.concatenate(parts)
frames=math.ceil(len(voice)/sr*30); dur=frames/30
voice=np.pad(voice,(0,round(dur*sr)-len(voice)))
def mapped(t):return t+lead+sum(h for c,h in gaps if t>=c)
words=[dict(w,start=round(mapped(w['start']),3),end=round(mapped(w['end']),3)) for w in a['words']]
(r/'audio/words.json').write_text(json.dumps(words,ensure_ascii=False,indent=2))
with wave.open(str(r/'audio/voice-edited.wav'),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((voice*32767).astype(np.int16).tobytes())
subprocess.run(['ffmpeg','-v','error','-y','-i',str(r/'audio/voice-edited.wav'),'-af','loudnorm=I=-17:TP=-3:LRA=7','-ar','48000',str(r/'public/voice.wav')],check=True)
# Short captions on measured words. Preserve logical Arabic order and punctuation.
caps=[];g=[]
for i,w in enumerate(words):
 g.append(w)
 if len(g)>=5 or re.search(r'[.!؟؛،]$',w['text']) or i==len(words)-1:
  text=' '.join(x['text'] for x in g);text=re.sub('[\u064b-\u065f]','',text)
  caps.append(dict(start=g[0]['start'],end=max(g[-1]['end']+.12,g[0]['start']+1),text=text));g=[]
for i,c in enumerate(caps[:-1]):c['end']=min(c['end'],caps[i+1]['start']-.02)
(r/'src/captions.json').write_text(json.dumps(caps,ensure_ascii=False,indent=2))
def stamp(t):
 ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
(r/'output/captions.ar.srt').write_text('\n\n'.join(f'{i+1}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}' for i,c in enumerate(caps))+'\n')
# Source-anchored scene cuts, editable in Studio.
bounds=[0,mapped(3.98),mapped(8.1),mapped(15.23),mapped(18.38),mapped(22.8),mapped(27.78),mapped(32.35),mapped(39.85),mapped(43.31),mapped(53.59),mapped(56.9),dur]
bounds=[round(x*30)/30 for x in bounds]
tl=dict(fps=30,duration=dur,frames=frames,lead=lead,gaps=gaps,bounds=bounds,voiceSourceDuration=len(data)/sr,voiceSpeed=1)
(r/'timeline.json').write_text(json.dumps(tl,indent=2))
print(json.dumps(tl));print('captions',len(caps),'max cps',max(len(c['text'])/(c['end']-c['start']) for c in caps))
