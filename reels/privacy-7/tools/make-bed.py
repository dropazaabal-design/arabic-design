"""Original quiet instrumental bed. No samples, voice, or external recordings."""
from pathlib import Path
import math, wave, array

rate=48000;duration=42
notes=[261.6256,311.1270,391.9954,349.2282,261.6256,311.1270,466.1638,391.9954]
starts=[.35+i*1.6 for i in range(26)]
out=array.array('h')
for i in range(rate*duration):
 t=i/rate;s=0.0
 for j,at in enumerate(starts):
  age=t-at
  if 0<=age<3.8:
   hz=notes[j%len(notes)];env=(1-math.exp(-age*65))*math.exp(-age*1.55)
   s+=.085*env*(math.sin(2*math.pi*hz*age)+.13*math.sin(4*math.pi*hz*age)+.035*math.sin(6*math.pi*hz*age))
 fade=min(1,t/.5,max(0,(duration-t)/1.7))
 sample=int(max(-1,min(1,s*fade))*32767);out.extend([sample,sample])
path=Path('public/music/quiet-bed.wav');path.parent.mkdir(parents=True,exist_ok=True)
with wave.open(str(path),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(rate);w.writeframes(out.tobytes())
print(f'Original instrumental bed: {duration}s; {path}')
