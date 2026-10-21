import wave,json,subprocess
from pathlib import Path
import numpy as np
r=Path(__file__).resolve().parents[1];tl=json.loads((r/'timeline.json').read_text());sr=48000;n=round(tl['duration']*sr);rng=np.random.default_rng(57);mix=np.zeros(n)
events=[]
def put(at,d,kind,amp=.1,freq=400):
 t=np.arange(round(d*sr))/sr
 if kind=='click':v=(rng.standard_normal(len(t))*.4+np.sin(2*np.pi*freq*t))*np.exp(-t*60)
 elif kind=='thud':v=(np.sin(2*np.pi*(75*t+50*t*t))+.4*rng.standard_normal(len(t)))*np.exp(-t*12)
 elif kind=='rub':v=rng.standard_normal(len(t))*.28*(np.sin(2*np.pi*34*t)*.5+.5)*np.sin(np.pi*t/d)**2
 elif kind=='motor':v=(np.sin(2*np.pi*freq*t)+np.sin(2*np.pi*freq*1.013*t)*.3)*np.sin(np.pi*t/d)**2
 elif kind=='squeak':v=np.sin(2*np.pi*(freq*t+freq*1.2*t*t))*np.sin(np.pi*t/d)**2
 elif kind=='piano':v=sum(np.sin(2*np.pi*freq*i*t)*(.7**(i-1)) for i in range(1,5))*np.exp(-t*2.1)*np.minimum(t*160,1)*.5
 j=round(at*sr);m=min(len(v),n-j)
 if m>0:mix[j:j+m]+=amp*v[:m]
 events.append(dict(at=at,duration=d,kind=kind,amplitude=amp))
# very quiet workshop room tone, deliberately below narration
alltime=np.arange(n)/sr;mix+=.0025*np.sin(2*np.pi*54*alltime)+.0008*rng.standard_normal(n)
put(0,2.5,'rub',.13);put(.1,2.3,'motor',.038,130);put(2.55,.2,'thud',.15)
put(4.1,.25,'click',.11,1220);put(6.05,.18,'click',.09,500);put(6.0,2.7,'motor',.026,160)
put(9.65,5.8,'motor',.027,124);put(12.4,.23,'squeak',.065,900);put(14.8,.22,'click',.11,480)
put(16.9,1.45,'motor',.03,137);put(18.45,.45,'rub',.08);put(19.08,.2,'thud',.12);put(19.25,1.2,'piano',.035,587.33)
for at in [23.6,24.0,24.4,24.8,25.2]:put(at,.13,'click',.033,700)
put(29.85,.19,'click',.12,430);put(31.7,1.5,'motor',.04,139)
put(33.5,.5,'thud',.17);put(35.2,.6,'thud',.22);put(35.4,.45,'squeak',.045,220)
for at in np.arange(37.2,44.2,1.12):put(float(at),.15,'click',.035,290)
put(45.75,.2,'click',.07,1300);put(46.35,.2,'click',.07,900);put(47.5,.8,'motor',.027,380)
for at,freq in [(49.15,261.63),(51.2,329.63),(53.5,392),(56.4,523.25)]:put(at,1.8,'piano',.03,freq)
put(52,3.7,'rub',.027);put(59.8,2.7,'rub',.115);put(61.0,.3,'squeak',.09,460)
put(63.35,1.15,'motor',.06,165);put(64.28,.2,'thud',.105);put(65.95,.17,'squeak',.055,740)
with wave.open(str(r/'public/foley.wav'),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((np.clip(mix,-1,1)*32767).astype(np.int16).tobytes())
(r/'audio/foley-events.json').write_text(json.dumps(events,indent=2))
subprocess.run(['ffmpeg','-v','error','-y','-i',str(r/'public/voice.wav'),'-i',str(r/'public/foley.wav'),'-filter_complex','[0:a][1:a]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-2.5:LRA=7','-ar','48000','-ac','2',str(r/'public/mix.wav')],check=True)
print('mixed',tl['duration'],'seconds;',len(events),'original synthesized effects')
